<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(isset($data->task_id) && isset($data->user_id) && isset($data->status)) {
    $task_id = $data->task_id;
    $user_id = $data->user_id;
    $status = $data->status;

    // Strict Security Rule: Staff can only change status to 'In Progress', 'To-Do', or 'In Review'
    if($status !== 'In Progress' && $status !== 'To-Do' && $status !== 'In Review') {
        echo json_encode(["status" => "error", "message" => "Invalid status change."]);
        exit;
    }

    $submission_link = isset($data->submission_link) ? $data->submission_link : null;

    // First verify the task belongs to the logged in user
    $emp_query = "SELECT id FROM employees WHERE user_id = :user_id LIMIT 1";
    $emp_stmt = $db->prepare($emp_query);
    $emp_stmt->bindParam(':user_id', $user_id);
    $emp_stmt->execute();

    if($emp_stmt->rowCount() > 0) {
        $emp_row = $emp_stmt->fetch(PDO::FETCH_ASSOC);
        $employee_id = $emp_row['id'];

        // Verify task is assigned to this employee and get current status
        $check_task = "SELECT id, status FROM tasks WHERE id = :task_id AND assigned_to = :employee_id";
        $check_stmt = $db->prepare($check_task);
        $check_stmt->bindParam(':task_id', $task_id);
        $check_stmt->bindParam(':employee_id', $employee_id);
        $check_stmt->execute();

        if($check_stmt->rowCount() > 0) {
            $task_row = $check_stmt->fetch(PDO::FETCH_ASSOC);
            $old_status = $task_row['status'];

            // Task is valid and belongs to user, perform the update
            
            // First fetch the task to check its timer status and get staff name & reporting manager
            $fetch_query = "SELECT t.*, u.name as staff_name, e.reporting_manager_id FROM tasks t JOIN employees e ON t.assigned_to = e.id JOIN users u ON e.user_id = u.id WHERE t.id = :task_id";
            $fetch_stmt = $db->prepare($fetch_query);
            $fetch_stmt->execute([':task_id' => $task_id]);
            $task = $fetch_stmt->fetch(PDO::FETCH_ASSOC);

            if(!$task) {
                echo json_encode(["status" => "error", "message" => "Task not found."]);
                exit;
            }

            $performed_by = $task['staff_name'];
            
            // Limit Rule: Only 1 task can be 'In Progress' at a time for a staff member
            if ($status === 'In Progress' && $old_status !== 'In Progress') {
                $in_prog_check = "SELECT id, title FROM tasks WHERE assigned_to = :employee_id AND status = 'In Progress' AND id != :task_id LIMIT 1";
                $in_prog_stmt = $db->prepare($in_prog_check);
                $in_prog_stmt->execute([':employee_id' => $employee_id, ':task_id' => $task_id]);
                if ($in_prog_stmt->rowCount() > 0) {
                    $active_task = $in_prog_stmt->fetch(PDO::FETCH_ASSOC);
                    echo json_encode([
                        "status" => "error",
                        "message" => "You already have a task in progress (\"" . $active_task['title'] . "\"). Please finish and submit it for review before starting another task."
                    ]);
                    exit;
                }
            }

            // Strict Security Rule: Minimum 20 minutes in 'In Progress' before submitting for review
            if ($status === 'In Review') {
                $find_log = $db->prepare("SELECT created_at FROM task_logs WHERE task_id = :task_id AND status_to = 'In Progress' ORDER BY id DESC LIMIT 1");
                $find_log->execute([':task_id' => $task_id]);
                $in_prog_log = $find_log->fetch(PDO::FETCH_ASSOC);

                $in_prog_time = null;
                if ($in_prog_log && !empty($in_prog_log['created_at'])) {
                    $in_prog_time = strtotime($in_prog_log['created_at']);
                } elseif (!empty($task['session_start_time'])) {
                    $in_prog_time = strtotime($task['session_start_time']);
                }

                if ($in_prog_time) {
                    $elapsed_secs = time() - $in_prog_time;
                    $min_required_secs = 60;
                    if ($elapsed_secs < $min_required_secs) {
                        $remaining_secs = $min_required_secs - $elapsed_secs;
                        $rem_mins = ceil($remaining_secs / 60);
                        echo json_encode([
                            "status" => "error",
                            "message" => "To maintain work quality and integrity, you must spend at least 20 minutes on the task before submitting for review. Approximately {$rem_mins} minute(s) remaining.",
                            "remaining_seconds" => $remaining_secs
                        ]);
                        exit;
                    }
                }
            }

            // Determine timer update part
            $timerUpdate = "";
            if ($status === 'In Progress') {
                // When moving to In Progress, automatically start the timer if not already running
                if ($task['timer_status'] !== 'Running') {
                    $timerUpdate = ", timer_status = 'Running', session_start_time = NOW()";
                }
            } elseif ($task['status'] === 'In Progress' && $status !== 'In Progress') {
                // When moving away from In Progress
                if ($task['timer_status'] === 'Running' && !empty($task['session_start_time'])) {
                    $timerUpdate = ", timer_status = 'Stopped', total_time_spent = total_time_spent + TIMESTAMPDIFF(SECOND, session_start_time, NOW()), session_start_time = NULL";
                } elseif ($status === 'In Review' && intval($task['total_time_spent']) <= 0) {
                    // Fallback: Check task_logs to compute time spent in In Progress
                    $find_log = $db->prepare("SELECT created_at FROM task_logs WHERE task_id = :task_id AND status_to = 'In Progress' ORDER BY id DESC LIMIT 1");
                    $find_log->execute([':task_id' => $task_id]);
                    $in_prog_log = $find_log->fetch(PDO::FETCH_ASSOC);
                    if ($in_prog_log) {
                        $diff_secs = max(0, time() - strtotime($in_prog_log['created_at']));
                        $timerUpdate = ", timer_status = 'Stopped', total_time_spent = total_time_spent + $diff_secs, session_start_time = NULL";
                    } else {
                        $timerUpdate = ", timer_status = 'Stopped', session_start_time = NULL";
                    }
                } else {
                    $timerUpdate = ", timer_status = 'Stopped', session_start_time = NULL";
                }
            }

            $submittedAtUpdate = ($status === 'In Review') ? ", submitted_at = NOW()" : "";

            if ($status === 'In Review' && $submission_link !== null) {
                $update_query = "UPDATE tasks SET status = :status, submission_link = :link, updated_at = NOW() $timerUpdate $submittedAtUpdate WHERE id = :task_id";
                $update_stmt = $db->prepare($update_query);
                $update_stmt->bindParam(':status', $status);
                $update_stmt->bindParam(':link', $submission_link);
                $update_stmt->bindParam(':task_id', $task_id);
            } else {
                $update_query = "UPDATE tasks SET status = :status, updated_at = NOW() $timerUpdate $submittedAtUpdate WHERE id = :task_id";
                $update_stmt = $db->prepare($update_query);
                $update_stmt->bindParam(':status', $status);
                $update_stmt->bindParam(':task_id', $task_id);
            }

            if($update_stmt->execute()) {
                // Insert submission files into task_submissions table if provided
                if ($status === 'In Review' && isset($data->submission_files) && is_array($data->submission_files)) {
                    $ins_sub = $db->prepare("INSERT INTO task_submissions (task_id, user_id, file_type, file_name, file_url, file_key, file_size, file_ext, mime_type) VALUES (:task_id, :user_id, :file_type, :file_name, :file_url, :file_key, :file_size, :file_ext, :mime_type)");
                    foreach ($data->submission_files as $f) {
                        $ins_sub->execute([
                            ':task_id'   => $task_id,
                            ':user_id'   => $user_id,
                            ':file_type' => isset($f->file_type) ? $f->file_type : 'source',
                            ':file_name' => isset($f->name) ? $f->name : 'file',
                            ':file_url'  => isset($f->url) ? $f->url : '',
                            ':file_key'  => isset($f->key) ? $f->key : '',
                            ':file_size' => isset($f->size) ? intval($f->size) : 0,
                            ':file_ext'  => isset($f->ext) ? $f->ext : '',
                            ':mime_type' => isset($f->mime) ? $f->mime : 'application/octet-stream'
                        ]);
                    }
                }

                // INSERT LOG
                if ($old_status !== $status) {
                    // Log to task_logs table for Admin Panel
                    $log_query = "INSERT INTO task_logs (task_id, status_from, status_to, changed_by) VALUES (:task_id, :status_from, :status_to, :changed_by)";
                    $log_stmt = $db->prepare($log_query);
                    $log_stmt->execute([
                        ':task_id'     => $task_id,
                        ':status_from' => $old_status,
                        ':status_to'   => $status,
                        ':changed_by'  => $user_id,
                    ]);

                    require_once 'task_history_helper.php';
                    $logger = new TaskHistoryLogger($db);
                    $logger->logHistory($task_id, "Status changed to: " . $status, $performed_by);

                    if ($status === 'In Review') {
                        require_once '../notifications/notification_helper.php';
                        // 1. Notify the specific Reviewer (Reporting Manager)
                        if (!empty($task['reporting_manager_id'])) {
                            NotificationHelper::sendToUser(
                                $db,
                                $task['reporting_manager_id'],
                                $user_id,
                                "Review Requested: " . $task['title'],
                                "{$performed_by} submitted task '{$task['title']}' for review.",
                                "task_submitted",
                                "reviewer",
                                "/pending",
                                "high",
                                ["task_id" => $task_id, "staff_name" => $performed_by]
                            );
                        }
                        // 2. Notify Admin Console (Sent ONCE to all admins)
                        NotificationHelper::sendToRole(
                            $db,
                            'admin',
                            $user_id,
                            "Task Submitted for Review: " . $task['title'],
                            "{$performed_by} submitted task '{$task['title']}' for review.",
                            "task_submitted",
                            "admin",
                            "/tasks",
                            "high",
                            ["task_id" => $task_id, "staff_name" => $performed_by]
                        );
                    }
                }

                echo json_encode(["status" => "success", "message" => "Task status updated successfully."]);
            } else {
                echo json_encode(["status" => "error", "message" => "Failed to update task."]);
            }
        } else {
            echo json_encode(["status" => "error", "message" => "Task not found or not assigned to you."]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Employee profile not found."]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Missing required fields."]);
}
?>
