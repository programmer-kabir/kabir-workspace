<?php
require_once '../../config/database.php';
require_once '../../config/cors.php';
$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

$data = json_decode(file_get_contents("php://input"));

if(!isset($data->reviewer_user_id)) {
    echo json_encode(["status" => "error", "message" => "Missing required parameter reviewer_user_id."]);
    exit;
}

$reviewer_user_id = intval($data->reviewer_user_id);
$start_date = isset($data->start_date) ? $data->start_date . " 00:00:00" : date('Y-m-01 00:00:00');
$end_date = isset($data->end_date) ? $data->end_date . " 23:59:59" : date('Y-m-t 23:59:59');
$start_date_d = substr($start_date, 0, 10);
$end_date_d = substr($end_date, 0, 10);

try {
    // 1. Get all employees under this reviewer (reporting_manager_id = reviewer_user_id)
    $team_query = "
        SELECT e.id AS employee_id, e.user_id, u.name, u.profile_picture, e.designation
        FROM employees e
        JOIN users u ON e.user_id = u.id
        WHERE e.reporting_manager_id = :reviewer_user_id AND u.status = 'active'
    ";
    $team_stmt = $db->prepare($team_query);
    $team_stmt->execute([':reviewer_user_id' => $reviewer_user_id]);
    $team_employees = $team_stmt->fetchAll(PDO::FETCH_ASSOC);

    $employee_ids = [];
    $employee_user_ids = [];
    foreach ($team_employees as $emp) {
        $employee_ids[] = (int)$emp['employee_id'];
        $employee_user_ids[] = (int)$emp['user_id'];
    }

    $summary = [
        'total_received' => 0,
        'total_reviewed' => 0,
        'currently_pending' => 0,
        'total_approved' => 0,
        'total_rejected' => 0,
        'sla_met' => 0,
        'sla_breached' => 0,
        'avg_review_hours' => '0h 0m'
    ];

    $peak_hours = array_fill(0, 24, 0);
    $friction_map = [];
    $iteration_loops = [];
    $review_history = [];
    $speed_trend = [];
    $workload_trend = [];

    function getWorkingSeconds($start_str, $end_str) {
        $start = strtotime($start_str);
        $end = strtotime($end_str);
        if (!$start || !$end || $start >= $end) return 0;
        
        $total_seconds = 0;
        $current = $start;
        
        while ($current < $end) {
            $end_of_day = strtotime('tomorrow', $current) - 1;
            $step_end = min($end_of_day, $end);
            
            // 5 is Friday in date('w')
            if (date('w', $current) != 5) {
                $total_seconds += ($step_end - $current) + 1;
            }
            $current = $step_end + 1;
        }
        return $total_seconds;
    }

    if (!empty($employee_ids)) {
        $emp_in = implode(',', $employee_ids);

        // Task Stats for assigned team (only tasks that have reached review state)
        $query_summary = "
            SELECT 
                SUM(status = 'In Review') as pending_count,
                SUM(status = 'Completed') as approved_count,
                SUM(status = 'Rejected') as rejected_count
            FROM tasks
            WHERE assigned_to IN ($emp_in)
        ";
        $stmt_sum = $db->query($query_summary);
        $task_stats = $stmt_sum->fetch(PDO::FETCH_ASSOC);

        $summary['currently_pending'] = (int)($task_stats['pending_count'] ?? 0);
        $summary['total_approved']    = (int)($task_stats['approved_count'] ?? 0);
        $summary['total_rejected']    = (int)($task_stats['rejected_count'] ?? 0);
        $summary['total_reviewed']    = $summary['total_approved'] + $summary['total_rejected'];
        // Total Received for reviewer = already reviewed (Approved + Rejected) + currently in review queue
        $summary['total_received']    = $summary['total_reviewed'] + $summary['currently_pending'];

        // 2. Review history / logs for this team's tasks
        $query_logs = "
            SELECT 
                tl.id, tl.task_id, tl.status_to, tl.created_at, tl.changed_by,
                t.assigned_to, 
                COALESCE(u.name, 'Staff Member') as staff_name, 
                COALESCE(t.title, CONCAT('Task #', tl.task_id)) as title, 
                t.priority,
                COALESCE(
                    (SELECT created_at FROM task_logs tl2 
                     WHERE tl2.task_id = tl.task_id AND tl2.status_to = 'In Review' AND tl2.id < tl.id 
                     ORDER BY tl2.id DESC LIMIT 1),
                    t.created_at
                ) as submitted_at
            FROM task_logs tl
            JOIN tasks t ON tl.task_id = t.id
            JOIN employees e ON t.assigned_to = e.id
            JOIN users u ON e.user_id = u.id
            WHERE e.reporting_manager_id = :reviewer_user_id
              AND tl.status_to IN ('Completed', 'Rejected')
            ORDER BY tl.created_at DESC
        ";
        $stmt_logs = $db->prepare($query_logs);
        $stmt_logs->execute([':reviewer_user_id' => $reviewer_user_id]);
        
        $total_review_time_seconds = 0;
        $total_reviews_for_avg = 0;
        $speed_trend_temp = [];

        while ($row = $stmt_logs->fetch(PDO::FETCH_ASSOC)) {
            if ($row['status_to'] === 'Rejected') {
                $staff = $row['staff_name'];
                if (!isset($friction_map[$staff])) $friction_map[$staff] = 0;
                $friction_map[$staff]++;
                
                $tid = $row['task_id'];
                if (!isset($iteration_loops[$tid])) $iteration_loops[$tid] = 0;
                $iteration_loops[$tid]++;
            }
            
            $hour = (int)date('H', strtotime($row['created_at']));
            $peak_hours[$hour]++;
            
            $review_time = '-';
            if ($row['submitted_at']) {
                $diff = getWorkingSeconds($row['submitted_at'], $row['created_at']);
                if ($diff > 0) {
                    $total_review_time_seconds += $diff;
                    $total_reviews_for_avg++;
                    
                    $h = floor($diff / 3600);
                    $m = floor(($diff % 3600) / 60);
                    $review_time = "{$h}h {$m}m";
                    
                    if ($diff > 86400) { // 24 hours
                        $summary['sla_breached']++;
                    } else {
                        $summary['sla_met']++;
                    }
                    
                    $date_key = date('M d', strtotime($row['created_at']));
                    if (!isset($speed_trend_temp[$date_key])) $speed_trend_temp[$date_key] = ['total' => 0, 'count' => 0];
                    $speed_trend_temp[$date_key]['total'] += $diff;
                    $speed_trend_temp[$date_key]['count']++;
                }
            }
            
            $review_history[] = [
                'task_id' => $row['task_id'],
                'title' => $row['title'],
                'staff_name' => $row['staff_name'],
                'priority' => $row['priority'],
                'status' => $row['status_to'],
                'submitted_at' => $row['submitted_at'],
                'reviewed_at' => $row['created_at'],
                'review_time' => $review_time
            ];
        }

        if ($total_reviews_for_avg > 0) {
            $avg_sec = $total_review_time_seconds / $total_reviews_for_avg;
            $h = floor($avg_sec / 3600);
            $m = floor(($avg_sec % 3600) / 60);
            $summary['avg_review_hours'] = "{$h}h {$m}m";
        }

        foreach ($speed_trend_temp as $date => $sdata) {
            $speed_trend[] = [
                'date' => $date,
                'avg_hours' => round($sdata['total'] / $sdata['count'] / 3600, 1)
            ];
        }

        // If review_history is empty, also include active/completed tasks directly from tasks table
        if (empty($review_history)) {
            $q_tasks = $db->query("
                SELECT 
                    t.id AS task_id, t.title, t.priority, t.status, t.created_at AS submitted_at, t.updated_at AS reviewed_at,
                    u.name AS staff_name
                FROM tasks t
                JOIN employees e ON t.assigned_to = e.id
                JOIN users u ON e.user_id = u.id
                WHERE t.assigned_to IN ($emp_in)
                ORDER BY t.updated_at DESC
            ");
            while ($trow = $q_tasks->fetch(PDO::FETCH_ASSOC)) {
                $review_history[] = [
                    'task_id' => $trow['task_id'],
                    'title' => $trow['title'],
                    'staff_name' => $trow['staff_name'],
                    'priority' => $trow['priority'],
                    'status' => $trow['status'],
                    'submitted_at' => $trow['submitted_at'],
                    'reviewed_at' => $trow['reviewed_at'],
                    'review_time' => '-'
                ];
            }
        }

        // Workload Trend
        $query_workload = "
            SELECT 
                DATE(tl.created_at) as log_date,
                SUM(IF(tl.status_to = 'In Review', 1, 0)) as received_count,
                SUM(IF(tl.status_to IN ('Completed', 'Rejected'), 1, 0)) as reviewed_count
            FROM task_logs tl
            JOIN tasks t ON tl.task_id = t.id
            JOIN employees e ON t.assigned_to = e.id
            WHERE e.reporting_manager_id = :reviewer_user_id
              AND tl.status_to IN ('In Review', 'Completed', 'Rejected')
            GROUP BY DATE(tl.created_at)
            ORDER BY log_date ASC
        ";
        $stmt_wl = $db->prepare($query_workload);
        $stmt_wl->execute([':reviewer_user_id' => $reviewer_user_id]);
        while ($wl = $stmt_wl->fetch(PDO::FETCH_ASSOC)) {
            $workload_trend[] = [
                'date' => date('M d', strtotime($wl['log_date'])),
                'received' => (int)$wl['received_count'],
                'reviewed' => (int)$wl['reviewed_count']
            ];
        }
    }

    // Format peak hours for chart
    $chart_data = [];
    for($i=0; $i<24; $i++) {
        $chart_data[] = [
            'hour' => sprintf("%02d:00", $i),
            'count' => $peak_hours[$i]
        ];
    }
    
    // Sort friction to get top 3
    arsort($friction_map);
    $top_friction = array_slice($friction_map, 0, 3, true);
    
    // Average iterations
    $avg_iterations = 0;
    if(count($iteration_loops) > 0) {
        $avg_iterations = round(array_sum($iteration_loops) / count($iteration_loops), 1);
    }

    // 4. Marketplace Submissions
    $marketplace_submissions = [];
    $marketplace_summary = [
        'total_uploads' => 0,
        'live' => 0,
        'under_review' => 0,
        'rejected' => 0,
        'pending' => 0,
        'platforms' => []
    ];

    $market_error = null;
    try {
        $query_market = "
            SELECT 
                tms.id,
                tms.task_id,
                tms.user_id,
                tms.added_by,
                tms.added_by_role,
                tms.marketplace,
                tms.custom_market,
                tms.status,
                tms.approval_url,
                tms.reject_reason,
                tms.submitted_date,
                tms.created_at,
                tms.updated_at,
                COALESCE(t.title, CONCAT('Task #', tms.task_id)) AS task_title,
                t.submission_link,
                t.task_category,
                COALESCE(u_user.name, u_added.name, 'Designer') AS staff_name,
                COALESCE(u_user.profile_picture, u_added.profile_picture) AS staff_avatar,
                COALESCE(u_added.name, 'Reviewer') AS added_by_name,
                u_added.profile_picture AS added_by_avatar
            FROM task_marketplace_submissions tms
            LEFT JOIN tasks t ON tms.task_id = t.id
            LEFT JOIN users u_user ON tms.user_id = u_user.id
            LEFT JOIN users u_added ON tms.added_by = u_added.id
            ORDER BY tms.created_at DESC
        ";

        $stmt_market = $db->query($query_market);
        $raw_market = [];
        while ($mrow = $stmt_market->fetch(PDO::FETCH_ASSOC)) {
            $added_by_int = intval($mrow['added_by']);
            $user_id_int = intval($mrow['user_id']);
            
            $is_reviewer_sub = ($added_by_int === $reviewer_user_id) || ($user_id_int === $reviewer_user_id);
            if (!$is_reviewer_sub && !empty($employee_user_ids)) {
                $is_reviewer_sub = in_array($user_id_int, $employee_user_ids) || in_array($added_by_int, $employee_user_ids);
            }

            if ($is_reviewer_sub) {
                $raw_market[] = $mrow;
            }
        }

        $sub_ids = array_map(function($m) { return (int)$m['id']; }, $raw_market);
        $m_logs = [];
        $log_err_msg = null;
        if (!empty($sub_ids)) {
            try {
                $ids_str = implode(',', $sub_ids);
                $log_query = "
                    SELECT tml.*, u.name AS changed_by_name, u.profile_picture AS changed_by_avatar
                    FROM task_marketplace_submission_logs tml
                    LEFT JOIN users u ON tml.changed_by = u.id
                    WHERE tml.submission_id IN ($ids_str)
                    ORDER BY tml.created_at ASC
                ";
                $log_stmt = $db->query($log_query);
                while ($l = $log_stmt->fetch(PDO::FETCH_ASSOC)) {
                    $s_key = (int)$l['submission_id'];
                    $m_logs[$s_key][] = $l;
                }
            } catch (Throwable $e) {
                $log_err_msg = $e->getMessage();
            }
        }

        foreach ($raw_market as $item) {
            $sid = (int)$item['id'];
            $item['logs'] = isset($m_logs[$sid]) ? $m_logs[$sid] : [];

            $status_lower = strtolower($item['status'] ?: '');
            $market_name = ($item['marketplace'] === 'Custom' && !empty($item['custom_market'])) 
                ? $item['custom_market'] 
                : $item['marketplace'];

            $marketplace_summary['total_uploads']++;
            
            if (in_array($status_lower, ['live', 'approved'])) {
                $marketplace_summary['live']++;
            } else if (in_array($status_lower, ['under review', 'submitted', 'uploaded', 'pending', 'in review'])) {
                $marketplace_summary['under_review']++;
            } else if (in_array($status_lower, ['rejected'])) {
                $marketplace_summary['rejected']++;
            } else {
                $marketplace_summary['under_review']++;
            }

            if (!empty($market_name)) {
                if (!isset($marketplace_summary['platforms'][$market_name])) {
                    $marketplace_summary['platforms'][$market_name] = 0;
                }
                $marketplace_summary['platforms'][$market_name]++;
            }

            $marketplace_submissions[] = $item;
        }

    } catch (Throwable $ex) {
        $market_error = $ex->getMessage();
    }

    echo json_encode([
        "status" => "success",
        "team_count" => count($employee_ids),
        "summary" => $summary,
        "insights" => [
            "top_friction" => $top_friction,
            "avg_iterations" => $avg_iterations,
            "peak_hours" => $chart_data,
            "speed_trend" => $speed_trend,
            "workload_trend" => $workload_trend
        ],
        "marketplace_summary" => $marketplace_summary,
        "marketplaces" => $marketplace_submissions,
        "history" => $review_history
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
