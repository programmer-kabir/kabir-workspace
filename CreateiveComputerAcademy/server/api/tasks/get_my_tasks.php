<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(isset($data->user_id)) {
    $user_id = $data->user_id;

    // Step 1: Find the employee_id and department_id for this user
    $emp_query = "SELECT id, department_id FROM employees WHERE user_id = :user_id LIMIT 1";
    $emp_stmt = $db->prepare($emp_query);
    $emp_stmt->bindParam(':user_id', $user_id);
    $emp_stmt->execute();

    if($emp_stmt->rowCount() > 0) {
        $emp_row = $emp_stmt->fetch(PDO::FETCH_ASSOC);
        $employee_id = $emp_row['id'];
        $dept_id = !empty($emp_row['department_id']) ? $emp_row['department_id'] : 0;

        // Step 2: Fetch tasks assigned to this employee (only up to today) OR tasks in the Unassigned pool
        $task_query = "SELECT t.*, 
                              (SELECT created_at FROM task_logs WHERE task_id = t.id AND status_to = 'In Progress' ORDER BY id DESC LIMIT 1) AS in_progress_at,
                              NOW() AS server_now,
                              COALESCE(tc_child.name, tc_sub.name, tc_main.name, '') AS category_name,
                              tc_main.name AS main_category_name,
                              tc_sub.name AS sub_category_name,
                              tc_child.name AS child_category_name,
                              tc_child.credit AS child_credit,
                              tc_sub.credit AS sub_credit,
                              tc_main.credit AS main_credit,
                              tfd.final_file_url,
                              tfd.final_image_url,
                              tfd.fix_notes,
                              tfd.is_stock_ready,
                              tfd.source_type AS delivery_source_type,
                              u_rev.name AS reviewer_name,
                              u_rev.profile_picture AS reviewer_avatar
                       FROM tasks t
                       LEFT JOIN task_final_deliveries tfd ON t.id = tfd.task_id
                       LEFT JOIN users u_rev ON tfd.reviewer_id = u_rev.id
                       LEFT JOIN task_categories tc_main ON t.category_id = tc_main.id
                       LEFT JOIN task_categories tc_sub ON t.subcategory_id = tc_sub.id
                       LEFT JOIN task_categories tc_child ON t.child_category_id = tc_child.id
                       WHERE (t.assigned_to = :employee_id AND DATE(COALESCE(t.assign_date, t.created_at)) <= CURDATE())
                          OR (t.status = 'Unassigned' OR t.assigned_to IS NULL)
                       ORDER BY COALESCE(t.assign_date, t.created_at) DESC";
        $task_stmt = $db->prepare($task_query);
        $task_stmt->bindParam(':employee_id', $employee_id);
        $task_stmt->execute();

        $tasks = [];
        $current_time = time();
        $today_date = date('Y-m-d');
        
        while($row = $task_stmt->fetch(PDO::FETCH_ASSOC)) {
            // Calculate effective reward credit
            if (isset($row['custom_credit']) && $row['custom_credit'] !== null && intval($row['custom_credit']) > 0) {
                $row['reward_credit'] = intval($row['custom_credit']);
                $row['is_custom_credit'] = true;
            } elseif (!empty($row['child_credit']) && intval($row['child_credit']) > 0) {
                $row['reward_credit'] = intval($row['child_credit']);
                $row['is_custom_credit'] = false;
            } elseif (!empty($row['sub_credit']) && intval($row['sub_credit']) > 0) {
                $row['reward_credit'] = intval($row['sub_credit']);
                $row['is_custom_credit'] = false;
            } elseif (!empty($row['main_credit']) && intval($row['main_credit']) > 0) {
                $row['reward_credit'] = intval($row['main_credit']);
                $row['is_custom_credit'] = false;
            } else {
                $row['reward_credit'] = 5;
                $row['is_custom_credit'] = false;
            }

            $row['is_delayed'] = false;
            $row['deadline_status'] = null; // 'overdue', 'due_today', 'upcoming', null

            if ($row['status'] === 'To-Do' || $row['status'] === 'In Progress') {
                if (!empty($row['deadline'])) {
                    // Deadline exists
                    $deadline_datetime_str = $row['deadline'] . ' ' . (!empty($row['deadline_time']) ? $row['deadline_time'] : '23:59:59');
                    $deadline_time_stamp = strtotime($deadline_datetime_str);
                    
                    if ($current_time > $deadline_time_stamp) {
                        $row['deadline_status'] = 'overdue';
                        $row['is_delayed'] = true;
                    } else if ($row['deadline'] === $today_date) {
                        $row['deadline_status'] = 'due_today';
                    } else {
                        $row['deadline_status'] = 'upcoming';
                    }
                } else {
                    // Fallback to old logic (24 hours after assign_date) if no deadline
                    $target_time = strtotime($row['assign_date'] ?? $row['created_at']);
                    if (($current_time - $target_time) > 86400) { // 24 hours in seconds
                        $row['is_delayed'] = true;
                    }
                }
            }

            // If total_time_spent is 0 and task has been In Review / Completed / Rejected, compute time from task_logs or timestamps
            if (intval($row['total_time_spent']) <= 0 && in_array($row['status'], ['In Review', 'Completed', 'Rejected'])) {
                $calc_log_stmt = $db->prepare("SELECT status_to, created_at FROM task_logs WHERE task_id = :task_id ORDER BY id ASC");
                $calc_log_stmt->execute([':task_id' => $row['id']]);
                $t_logs = $calc_log_stmt->fetchAll(PDO::FETCH_ASSOC);

                $in_prog_time = null;
                $computed_time = 0;
                foreach ($t_logs as $tl) {
                    if ($tl['status_to'] === 'In Progress') {
                        $in_prog_time = strtotime($tl['created_at']);
                    } elseif ($in_prog_time && in_array($tl['status_to'], ['In Review', 'Completed', 'Rejected'])) {
                        $computed_time += max(0, strtotime($tl['created_at']) - $in_prog_time);
                        $in_prog_time = null;
                    }
                }

                if ($computed_time <= 0 && !empty($row['submitted_at'])) {
                    $start_ref = strtotime(!empty($row['assign_date']) ? $row['assign_date'] . ' 09:00:00' : $row['created_at']);
                    $end_ref = strtotime($row['submitted_at']);
                    if ($end_ref > $start_ref) {
                        $diff = $end_ref - $start_ref;
                        if ($diff > 0 && $diff < 86400 * 30) {
                            $computed_time = $diff;
                        }
                    }
                }

                if ($computed_time > 0) {
                    $row['total_time_spent'] = $computed_time;
                    try {
                        $up_time = $db->prepare("UPDATE tasks SET total_time_spent = :time WHERE id = :task_id AND total_time_spent = 0");
                        $up_time->execute([':time' => $computed_time, ':task_id' => $row['id']]);
                    } catch (Exception $e) {}
                }
            }

            // Fetch History
            $history_query = "SELECT * FROM task_history WHERE task_id = :task_id ORDER BY created_at ASC";
            $history_stmt = $db->prepare($history_query);
            $history_stmt->execute([':task_id' => $row['id']]);
            $row['history'] = $history_stmt->fetchAll(PDO::FETCH_ASSOC);

            // Decode Checklists
            if (!empty($row['checklists']) && is_string($row['checklists'])) {
                $row['checklists'] = json_decode($row['checklists'], true);
            } else {
                $row['checklists'] = [];
            }

            // Fetch Submissions
            $sub_query = "SELECT * FROM task_submissions WHERE task_id = :task_id ORDER BY id ASC";
            $sub_stmt = $db->prepare($sub_query);
            $sub_stmt->execute([':task_id' => $row['id']]);
            $row['submissions'] = $sub_stmt->fetchAll(PDO::FETCH_ASSOC);

            // Fetch Reviewer Final Stock Delivery
            try {
                $del_query = "SELECT tfd.*, u.name as reviewer_name, u.profile_picture as reviewer_avatar 
                              FROM task_final_deliveries tfd 
                              LEFT JOIN users u ON tfd.reviewer_id = u.id 
                              WHERE tfd.task_id = :task_id LIMIT 1";
                $del_stmt = $db->prepare($del_query);
                $del_stmt->execute([':task_id' => $row['id']]);
                $row['final_delivery'] = $del_stmt->fetch(PDO::FETCH_ASSOC) ?: null;
            } catch (Exception $ex) {
                $row['final_delivery'] = null;
            }

            // Decode blueprint_data
            if (!empty($row['blueprint_data'])) {
                $row['blueprint_data'] = is_string($row['blueprint_data']) ? json_decode($row['blueprint_data'], true) : $row['blueprint_data'];
            } else {
                $row['blueprint_data'] = null;
            }

            // Fetch blueprint variants if any
            try {
                $bv_stmt = $db->prepare("SELECT id, variant_name, ai_model_used, is_active, blueprint_json, created_at FROM task_blueprint_variants WHERE task_id = :task_id ORDER BY is_active DESC, id ASC");
                $bv_stmt->execute([':task_id' => $row['id']]);
                $b_variants = $bv_stmt->fetchAll(PDO::FETCH_ASSOC);
                $row['blueprint_variants'] = array_map(function($bv) {
                    $bv['blueprint_data'] = !empty($bv['blueprint_json']) ? json_decode($bv['blueprint_json'], true) : null;
                    $bv['is_active'] = (int)$bv['is_active'] === 1;
                    return $bv;
                }, $b_variants);
            } catch (Exception $ex) {
                $row['blueprint_variants'] = [];
            }

            // Fetch task review/rating if available
            try {
                $tr_stmt = $db->prepare("SELECT tr.rating, tr.feedback_notes, tr.tags, tr.created_at as reviewed_at, u.name as reviewer_name 
                    FROM task_reviews tr 
                    LEFT JOIN users u ON tr.reviewer_id = u.id 
                    WHERE tr.task_id = :task_id LIMIT 1");
                $tr_stmt->execute([':task_id' => $row['id']]);
                if ($rev = $tr_stmt->fetch(PDO::FETCH_ASSOC)) {
                    $rev['tags'] = !empty($rev['tags']) && is_string($rev['tags']) ? json_decode($rev['tags'], true) : [];
                    $row['review'] = $rev;
                } else {
                    $row['review'] = null;
                }
            } catch (Exception $ex) {
                $row['review'] = null;
            }

            if (empty($row['category'])) {
                $row['category'] = $row['category_name'] ?? '';
            }

            $tasks[] = $row;
        }

        echo json_encode([
            "status" => "success",
            "tasks" => $tasks
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Employee profile not found for this user."]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "User ID is required."]);
}
?>
