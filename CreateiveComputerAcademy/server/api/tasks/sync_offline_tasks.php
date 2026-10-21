<?php
// server/api/tasks/sync_offline_tasks.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/PusherHelper.php';

date_default_timezone_set('Asia/Dhaka');

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!isset($data['user_id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "user_id is required."]);
    exit();
}

$userId = (int)$data['user_id'];
$actions = isset($data['actions']) && is_array($data['actions']) ? $data['actions'] : [];

if (empty($actions)) {
    echo json_encode(["status" => "success", "message" => "No offline task actions to sync.", "synced_count" => 0]);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();
    if (!$db) {
        throw new Exception("Database connection unavailable.");
    }

    // Get employee id and staff name
    $empStmt = $db->prepare("SELECT e.id as employee_id, u.name as staff_name FROM employees e JOIN users u ON e.user_id = u.id WHERE e.user_id = :uid LIMIT 1");
    $empStmt->execute([':uid' => $userId]);
    $emp = $empStmt->fetch(PDO::FETCH_ASSOC);

    if (!$emp) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Employee profile not found for user."]);
        exit();
    }

    $employeeId = (int)$emp['employee_id'];
    $staffName = $emp['staff_name'];

    $synced = [];
    $errors = [];

    foreach ($actions as $act) {
        $actionId   = $act['id'] ?? null;
        $actionType = $act['type'] ?? '';
        $taskId     = isset($act['task_id']) ? (int)$act['task_id'] : 0;
        $actionTime = !empty($act['timestamp']) ? date('Y-m-d H:i:s', strtotime($act['timestamp'])) : date('Y-m-d H:i:s');

        if (!$taskId) {
            $errors[] = ["action_id" => $actionId, "error" => "Missing task_id"];
            continue;
        }

        // Fetch task
        $taskStmt = $db->prepare("SELECT id, status, timer_status, session_start_time, total_time_spent, title FROM tasks WHERE id = :tid AND assigned_to = :eid LIMIT 1");
        $taskStmt->execute([':tid' => $taskId, ':eid' => $employeeId]);
        $task = $taskStmt->fetch(PDO::FETCH_ASSOC);

        if (!$task) {
            $errors[] = ["action_id" => $actionId, "error" => "Task not found or not assigned to user"];
            continue;
        }

        $oldStatus = $task['status'];

        if ($actionType === 'start_task') {
            // If already in progress or completed, skip duplicate
            if ($oldStatus !== 'In Progress' && $oldStatus !== 'Completed') {
                $upd = $db->prepare("UPDATE tasks SET status = 'In Progress', timer_status = 'Running', session_start_time = :stime, updated_at = NOW() WHERE id = :tid");
                $upd->execute([':stime' => $actionTime, ':tid' => $taskId]);

                // Log transition
                $log = $db->prepare("INSERT INTO task_logs (task_id, status_from, status_to, changed_by, created_at) VALUES (:tid, :from, 'In Progress', :by, :at)");
                $log->execute([
                    ':tid'  => $taskId,
                    ':from' => $oldStatus,
                    ':by'   => $staffName,
                    ':at'   => $actionTime
                ]);
            }

            $synced[] = ["action_id" => $actionId, "task_id" => $taskId, "type" => $actionType, "status" => "synced"];

        } elseif ($actionType === 'pause_timer') {
            if ($task['timer_status'] === 'Running' && !empty($task['session_start_time'])) {
                $startTs = strtotime($task['session_start_time']);
                $endTs   = strtotime($actionTime);
                $elapsed = max(0, $endTs - $startTs);

                $upd = $db->prepare("UPDATE tasks SET timer_status = 'Paused', total_time_spent = total_time_spent + :elapsed, session_start_time = NULL, updated_at = NOW() WHERE id = :tid");
                $upd->execute([':elapsed' => $elapsed, ':tid' => $taskId]);
            }
            $synced[] = ["action_id" => $actionId, "task_id" => $taskId, "type" => $actionType, "status" => "synced"];

        } elseif ($actionType === 'submit_work' || $actionType === 'update_status') {
            $newStatus = !empty($act['status']) ? trim($act['status']) : 'In Review';
            $submissionLink = $act['submission_link'] ?? null;

            // Compute elapsed time if was running
            $addedSecs = 0;
            if ($task['timer_status'] === 'Running' && !empty($task['session_start_time'])) {
                $startTs = strtotime($task['session_start_time']);
                $endTs   = strtotime($actionTime);
                $addedSecs = max(0, $endTs - $startTs);
            }

            $submittedAtSql = ($newStatus === 'In Review') ? ", submitted_at = :sub_time" : "";
            $sql = "UPDATE tasks SET status = :status, timer_status = 'Stopped', total_time_spent = total_time_spent + :added, session_start_time = NULL, updated_at = NOW() $submittedAtSql";
            
            $params = [
                ':status' => $newStatus,
                ':added'  => $addedSecs,
                ':tid'    => $taskId
            ];

            if ($newStatus === 'In Review') {
                $params[':sub_time'] = $actionTime;
            }

            if (!empty($submissionLink)) {
                $sql .= ", submission_link = :link";
                $params[':link'] = $submissionLink;
            }

            $sql .= " WHERE id = :tid";
            $upd = $db->prepare($sql);
            $upd->execute($params);

            // Log status change
            if ($oldStatus !== $newStatus) {
                $log = $db->prepare("INSERT INTO task_logs (task_id, status_from, status_to, changed_by, created_at) VALUES (:tid, :from, :to, :by, :at)");
                $log->execute([
                    ':tid'  => $taskId,
                    ':from' => $oldStatus,
                    ':to'   => $newStatus,
                    ':by'   => $staffName,
                    ':at'   => $actionTime
                ]);
            }

            $synced[] = ["action_id" => $actionId, "task_id" => $taskId, "type" => $actionType, "status" => "synced"];

        } elseif ($actionType === 'update_checklist') {
            $checklists = isset($act['checklists']) ? $act['checklists'] : null;
            if ($checklists !== null) {
                $checklistJson = is_string($checklists) ? $checklists : json_encode($checklists);
                $upd = $db->prepare("UPDATE tasks SET checklists = :cl, updated_at = NOW() WHERE id = :tid");
                $upd->execute([':cl' => $checklistJson, ':tid' => $taskId]);
            }
            $synced[] = ["action_id" => $actionId, "task_id" => $taskId, "type" => $actionType, "status" => "synced"];
        }
    }

    // Broadcast Pusher notification if any tasks were updated
    if (!empty($synced)) {
        try {
            $pusher = new PusherHelper();
            $pusher->trigger('task-updates', 'tasks-offline-synced', [
                'user_id'      => $userId,
                'synced_count' => count($synced)
            ]);
        } catch (Throwable $pe) {}
    }

    echo json_encode([
        "status"       => "success",
        "message"      => "Offline task actions synced successfully.",
        "synced_count" => count($synced),
        "synced"       => $synced,
        "errors"       => $errors
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
