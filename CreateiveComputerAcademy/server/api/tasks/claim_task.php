<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
if (file_exists('../../config/PusherHelper.php')) {
    require_once '../../config/PusherHelper.php';
}

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(!isset($data->task_id) || !isset($data->user_id)) {
    echo json_encode(["status" => "error", "message" => "Task ID and User ID are required."]);
    exit;
}

$task_id = intval($data->task_id);
$user_id = intval($data->user_id);

if ($task_id <= 0 || $user_id <= 0) {
    echo json_encode(["status" => "error", "message" => "Valid Task ID and User ID are required."]);
    exit;
}

try {
    // 1. Get employee ID and user name
    $emp_query = "SELECT e.id as employee_id, u.name as employee_name 
                  FROM employees e 
                  INNER JOIN users u ON e.user_id = u.id 
                  WHERE e.user_id = :user_id LIMIT 1";
    $emp_stmt = $db->prepare($emp_query);
    $emp_stmt->execute([':user_id' => $user_id]);
    $employee = $emp_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$employee) {
        echo json_encode(["status" => "error", "message" => "Employee profile not found."]);
        exit;
    }

    $employee_id = intval($employee['employee_id']);
    $employee_name = $employee['employee_name'];

    // ── Begin Transaction with Row Locking ──────────────────────────────
    $db->beginTransaction();

    // 2. Lock & Check if the task is currently Unassigned
    $task_query = "SELECT id, title, status, assigned_to 
                   FROM tasks 
                   WHERE id = :task_id 
                   FOR UPDATE";
    $task_stmt = $db->prepare($task_query);
    $task_stmt->execute([':task_id' => $task_id]);
    $task = $task_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$task) {
        $db->rollBack();
        echo json_encode(["status" => "error", "message" => "Task not found."]);
        exit;
    }

    if ($task['status'] !== 'Unassigned' || (!empty($task['assigned_to']) && intval($task['assigned_to']) > 0)) {
        $db->rollBack();
        echo json_encode([
            "status" => "error", 
            "message" => "This task is no longer available in the unassigned pool. Another team member may have just claimed it."
        ]);
        exit;
    }

    // 3. Atomic Conditional Update
    $update_query = "UPDATE tasks 
                     SET assigned_to = :assigned_to, 
                         status = 'To-Do', 
                         assign_date = CURDATE(), 
                         updated_at = NOW() 
                     WHERE id = :task_id 
                       AND status = 'Unassigned' 
                       AND (assigned_to IS NULL OR assigned_to = 0)";
    $update_stmt = $db->prepare($update_query);
    $update_stmt->execute([
        ':assigned_to' => $employee_id,
        ':task_id' => $task_id
    ]);

    if ($update_stmt->rowCount() === 0) {
        $db->rollBack();
        echo json_encode([
            "status" => "error", 
            "message" => "This task was just claimed by another team member. Please refresh and pick another task."
        ]);
        exit;
    }

    // 4. Log History
    try {
        if (file_exists('task_history_helper.php')) {
            require_once 'task_history_helper.php';
            $logger = new TaskHistoryLogger($db);
            $logger->logHistory($task_id, "Task Claimed by Staff", $employee_name);
        }

        // Also record to task_logs table if present
        $log_stmt = $db->prepare("INSERT INTO task_logs (task_id, status_from, status_to, changed_by) VALUES (:task_id, 'Unassigned', 'To-Do', :changed_by)");
        $log_stmt->execute([
            ':task_id' => $task_id,
            ':changed_by' => $user_id
        ]);
    } catch (Throwable $th) {}

    // 5. Send notification to Admin
    try {
        if (file_exists('../notifications/notification_helper.php')) {
            require_once '../notifications/notification_helper.php';
            NotificationHelper::sendToRole(
                $db,
                'admin',
                $user_id,
                'Task Claimed by Staff',
                "{$employee_name} has claimed the task: {$task['title']}",
                'task_update',
                'admin',
                '/task-oversight',
                'normal',
                [
                    'task_id' => $task_id,
                    'task_title' => $task['title'],
                    'claimed_by' => $employee_name,
                    'status' => 'To-Do'
                ]
            );
        }
    } catch (Throwable $ne) {}

    // Commit Transaction
    $db->commit();

    // 6. Broadcast Real-time Pusher Event so all other staff boards update instantly
    try {
        if (class_exists('PusherHelper')) {
            $pusherPayload = [
                'task_id' => $task_id,
                'claimed_by_id' => $employee_id,
                'claimed_by_name' => $employee_name,
                'status' => 'To-Do'
            ];
            PusherHelper::trigger('tasks-channel', 'task-claimed', $pusherPayload);
            PusherHelper::trigger('tasks-channel', 'task-updated', $pusherPayload);
        }
    } catch (Throwable $pe) {}

    echo json_encode([
        "status" => "success",
        "message" => "Task claimed successfully! It has been moved to your To-Do list."
    ]);

} catch (Throwable $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
