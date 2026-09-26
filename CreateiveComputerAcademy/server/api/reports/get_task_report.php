<?php
require_once '../../config/database.php';
require_once '../../config/cors.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

$data = json_decode(file_get_contents("php://input"));

if(!isset($data->user_id) || !isset($data->start_date) || !isset($data->end_date)) {
    echo json_encode(["status" => "error", "message" => "Missing required parameters."]);
    exit;
}

$user_id = $data->user_id;
$start_date = $data->start_date . " 00:00:00";
$end_date = $data->end_date . " 23:59:59";

// Get employee_id
$emp_query = "SELECT id FROM employees WHERE user_id = :user_id LIMIT 1";
$emp_stmt = $db->prepare($emp_query);
$emp_stmt->bindParam(':user_id', $user_id);
$emp_stmt->execute();
if($emp_stmt->rowCount() == 0) {
    echo json_encode(["status" => "error", "message" => "Employee not found."]);
    exit;
}
$employee_id = $emp_stmt->fetch(PDO::FETCH_ASSOC)['id'];

// Get tasks created in this period
$task_query = "SELECT * FROM tasks WHERE assigned_to = :emp_id AND created_at BETWEEN :start_date AND :end_date ORDER BY created_at DESC";
$task_stmt = $db->prepare($task_query);
$task_stmt->bindParam(':emp_id', $employee_id);
$task_stmt->bindParam(':start_date', $start_date);
$task_stmt->bindParam(':end_date', $end_date);
$task_stmt->execute();

$tasks = [];
$task_ids = [];
$summary = [
    'total_assigned' => 0,
    'total_completed' => 0,
    'delayed_completions' => 0,
    'total_rejected' => 0,
    'total_resubmitted' => 0
];

while($row = $task_stmt->fetch(PDO::FETCH_ASSOC)) {
    $tasks[] = $row;
    $task_ids[] = $row['id'];
    $summary['total_assigned']++;
    if($row['status'] === 'Completed') {
        $summary['total_completed']++;
    }
}

if(count($task_ids) > 0) {
    $in_clause = implode(',', $task_ids);

    // 1. Fetch Task Logs with User Names
    $log_query = "
        SELECT tl.*, u.name as changed_by_name 
        FROM task_logs tl 
        LEFT JOIN users u ON tl.changed_by = u.id 
        WHERE tl.task_id IN ($in_clause) 
        ORDER BY tl.created_at ASC
    ";
    $log_stmt = $db->prepare($log_query);
    $log_stmt->execute();
    $all_logs = $log_stmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. Fetch Task Submissions (Uploaded Files)
    $sub_map = [];
    try {
        $sub_stmt = $db->prepare("SELECT * FROM task_submissions WHERE task_id IN ($in_clause) ORDER BY id ASC");
        $sub_stmt->execute();
        while($sub = $sub_stmt->fetch(PDO::FETCH_ASSOC)) {
            $sub_map[$sub['task_id']][] = $sub;
        }
    } catch (Exception $ex) {}

    // 3. Fetch Final Deliveries from Reviewer
    $del_map = [];
    try {
        $del_stmt = $db->prepare("
            SELECT tfd.*, u.name as reviewer_name, u.profile_picture as reviewer_avatar 
            FROM task_final_deliveries tfd 
            LEFT JOIN users u ON tfd.reviewer_id = u.id 
            WHERE tfd.task_id IN ($in_clause)
        ");
        $del_stmt->execute();
        while($del = $del_stmt->fetch(PDO::FETCH_ASSOC)) {
            $del_map[$del['task_id']] = $del;
        }
    } catch (Exception $ex) {}

    // 4. Fetch Reviews
    $rev_map = [];
    try {
        $rev_query = "
            SELECT tr.*, u.name as reviewer_name 
            FROM task_reviews tr 
            LEFT JOIN users u ON tr.reviewer_id = u.id 
            WHERE tr.task_id IN ($in_clause)
        ";
        $rev_stmt = $db->prepare($rev_query);
        $rev_stmt->execute();
        while($rev = $rev_stmt->fetch(PDO::FETCH_ASSOC)) {
            if(!empty($rev['tags']) && is_string($rev['tags'])) {
                $rev['tags'] = json_decode($rev['tags'], true);
            }
            $rev_map[$rev['task_id']] = $rev;
        }
    } catch (Exception $ex) {}

    // 5. Fetch Marketplace Submissions
    $market_map = [];
    $market_sub_ids = [];
    try {
        $market_stmt = $db->prepare("
            SELECT tms.*, u.name as added_by_name, u.profile_picture as added_by_avatar 
            FROM task_marketplace_submissions tms 
            LEFT JOIN users u ON tms.added_by = u.id 
            WHERE tms.task_id IN ($in_clause) 
            ORDER BY tms.created_at ASC
        ");
        $market_stmt->execute();
        while($m = $market_stmt->fetch(PDO::FETCH_ASSOC)) {
            $market_map[$m['task_id']][] = $m;
            $market_sub_ids[] = (int)$m['id'];
        }
    } catch (Exception $ex) {}

    // 6. Fetch Marketplace Submission Audit Logs
    $market_logs_map = [];
    if(count($market_sub_ids) > 0) {
        $m_ids = implode(',', $market_sub_ids);
        try {
            $m_log_stmt = $db->prepare("
                SELECT l.*, u.name as changed_by_name 
                FROM task_marketplace_submission_logs l 
                LEFT JOIN users u ON l.changed_by = u.id 
                WHERE l.submission_id IN ($m_ids) 
                ORDER BY l.created_at ASC
            ");
            $m_log_stmt->execute();
            while($ml = $m_log_stmt->fetch(PDO::FETCH_ASSOC)) {
                $market_logs_map[$ml['submission_id']][] = $ml;
            }
        } catch (Exception $ex) {}
    }

    // Attach logs to each marketplace submission
    foreach($market_map as $t_id => &$m_list) {
        foreach($m_list as &$ms) {
            $ms['logs'] = $market_logs_map[$ms['id']] ?? [];
        }
        unset($ms);
    }
    unset($m_list);

    // Process logs by task
    $logs_by_task = [];
    $task_starts = [];
    $task_resubmits = [];
    $task_reviews_time = [];
    $task_completions = [];
    $rejection_history = [];

    foreach($all_logs as $log) {
        $tid = $log['task_id'];
        $logs_by_task[$tid][] = $log;

        // Rejections
        if($log['status_to'] === 'Rejected') {
            $summary['total_rejected']++;
            $rejection_history[$tid][] = [
                'rejected_at' => $log['created_at'],
                'comment' => $log['comment'] ?? '',
                'changed_by' => $log['changed_by_name'] ?? 'Reviewer'
            ];
        }

        // Resubmissions
        if($log['status_from'] === 'Rejected' && $log['status_to'] === 'In Progress') {
            $summary['total_resubmitted']++;
            if(!isset($task_resubmits[$tid])) $task_resubmits[$tid] = 0;
            $task_resubmits[$tid]++;
        }

        // First Start / In Progress time
        if($log['status_to'] === 'In Progress' && !isset($task_starts[$tid])) {
            $task_starts[$tid] = $log['created_at'];
        }

        // In Review / Submitted time (latest or first)
        if($log['status_to'] === 'In Review') {
            $task_reviews_time[$tid] = $log['created_at'];
        }

        // Completion time from logs
        if($log['status_to'] === 'Completed') {
            $task_completions[$tid] = $log['created_at'];
        }
    }

    // Attach enriched metrics and files to each task
    $rating_sum = 0;
    $rating_count = 0;

    foreach($tasks as &$task) {
        $tid = $task['id'];
        $task['was_delayed'] = false;
        $task['was_resubmitted'] = false;
        $task['resubmit_count'] = $task_resubmits[$tid] ?? 0;
        if($task['resubmit_count'] > 0) {
            $task['was_resubmitted'] = true;
        }

        // Lifecycle Timestamps: Default shift start to 09:00:00 AM when only date is provided
        if (!empty($task['assign_date'])) {
            $task['assigned_at'] = (strlen(trim($task['assign_date'])) === 10) ? (trim($task['assign_date']) . ' 09:00:00') : $task['assign_date'];
        } else {
            $task['assigned_at'] = $task['created_at'];
        }
        $task['in_progress_at'] = $task['in_progress_at'] ?? ($task_starts[$tid] ?? null);
        $task['submitted_at'] = $task['submitted_at'] ?? ($task_reviews_time[$tid] ?? null);
        
        // Accurate Completion Time
        if($task['status'] === 'Completed' && empty($task['completed_at'])) {
            $task['completed_at'] = $task_completions[$tid] ?? ($task['updated_at'] ?? $task['created_at']);
        }

        $task['logs'] = $logs_by_task[$tid] ?? [];
        $task['rejections'] = $rejection_history[$tid] ?? [];

        // Submissions, Deliverables, and Marketplace
        $task['submissions'] = $sub_map[$tid] ?? [];
        $task['final_delivery'] = $del_map[$tid] ?? null;
        $task['marketplaces'] = $market_map[$tid] ?? [];

        // Duration Calculations (in seconds)
        $t_start = $task['in_progress_at'] ? strtotime($task['in_progress_at']) : null;
        $t_submit = $task['submitted_at'] ? strtotime($task['submitted_at']) : null;
        $t_complete = $task['completed_at'] ? strtotime($task['completed_at']) : null;
        $t_assign = strtotime($task['assigned_at']);

        // Work Duration: Start -> Submit
        $task['work_duration_seconds'] = ($t_start && $t_submit && $t_submit >= $t_start) ? ($t_submit - $t_start) : null;
        // Review Duration: Submit -> Complete
        $task['review_duration_seconds'] = ($t_submit && $t_complete && $t_complete >= $t_submit) ? ($t_complete - $t_submit) : null;
        // Total Duration: Assign -> Complete
        $task['total_duration_seconds'] = ($t_assign && $t_complete && $t_complete >= $t_assign) ? ($t_complete - $t_assign) : null;

        // Reviewer Feedback
        if(isset($rev_map[$tid])) {
            $rev = $rev_map[$tid];
            $task['rating'] = $rev['rating'] ?? null;
            $task['feedback_notes'] = $rev['feedback_notes'] ?? null;
            $task['tags'] = $rev['tags'] ?? [];
            $task['reviewer_name'] = $rev['reviewer_name'] ?? null;
            $task['reviewed_at'] = $rev['created_at'] ?? null;

            if(isset($rev['rating']) && intval($rev['rating']) > 0) {
                $rating_sum += intval($rev['rating']);
                $rating_count++;
            }
        } else {
            $task['rating'] = null;
            $task['feedback_notes'] = null;
            $task['tags'] = [];
            $task['reviewer_name'] = null;
            $task['reviewed_at'] = null;
        }

        // Check for delayed completion
        if($task['status'] === 'Completed') {
            $created_time = strtotime($task['created_at']);
            if(isset($task_starts[$tid])) {
                $start_time = strtotime($task_starts[$tid]);
                if(($start_time - $created_time) > 86400) {
                    $summary['delayed_completions']++;
                    $task['was_delayed'] = true;
                }
            }
        }

        // Decode JSON fields if encoded as string
        if (!empty($task['checklists']) && is_string($task['checklists'])) {
            $task['checklists'] = json_decode($task['checklists'], true) ?? [];
        }
        if (!empty($task['blueprint_data']) && is_string($task['blueprint_data'])) {
            $task['blueprint_data'] = json_decode($task['blueprint_data'], true) ?? $task['blueprint_data'];
        }
        if (!empty($task['blueprint_variants']) && is_string($task['blueprint_variants'])) {
            $task['blueprint_variants'] = json_decode($task['blueprint_variants'], true) ?? [];
        }
    }
    unset($task);

    $summary['rating_count'] = $rating_count;
    $summary['avg_rating'] = $rating_count > 0 ? round($rating_sum / $rating_count, 1) : 5.0;
} else {
    $summary['rating_count'] = 0;
    $summary['avg_rating'] = 5.0;
}

echo json_encode([
    "status" => "success",
    "summary" => $summary,
    "tasks" => $tasks
]);
?>
