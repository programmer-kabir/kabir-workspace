<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(!isset($data->task_id) || !isset($data->user_id)) {
    echo json_encode(["status" => "error", "message" => "Task ID and User ID are required."]);
    exit;
}

try {
    // 1. Get employee ID and user name
    $emp_query = "SELECT e.id as employee_id, u.name as employee_name 
                  FROM employees e 
                  INNER JOIN users u ON e.user_id = u.id 
                  WHERE e.user_id = :user_id LIMIT 1";
    $emp_stmt = $db->prepare($emp_query);
    $emp_stmt->execute([':user_id' => $data->user_id]);
    $employee = $emp_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$employee) {
        echo json_encode(["status" => "error", "message" => "Employee profile not found."]);
        exit;
    }

    $employee_id = $employee['employee_id'];
    $employee_name = $employee['employee_name'];

    // 2. Check if the task is currently Unassigned
    $task_query = "SELECT id, title, status FROM tasks WHERE id = :task_id AND status = 'Unassigned'";
    $task_stmt = $db->prepare($task_query);
    $task_stmt->execute([':task_id' => $data->task_id]);
    $task = $task_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$task) {
        echo json_encode(["status" => "error", "message" => "Task is no longer available or not in the unassigned pool."]);
        exit;
    }

    // 3. Update the task
    $update_query = "UPDATE tasks SET assigned_to = :assigned_to, status = 'To-Do', assign_date = CURDATE(), updated_at = NOW() WHERE id = :task_id";
    $update_stmt = $db->prepare($update_query);
    $update_stmt->execute([
        ':assigned_to' => $employee_id,
        ':task_id' => $data->task_id
    ]);

    // 4. Log History
    require_once 'task_history_helper.php';
    $logger = new TaskHistoryLogger($db);
    $logger->logHistory($data->task_id, "Task Claimed by Staff", $employee_name);

    // 5. Send notification to Admin
    require_once '../notifications/notification_helper.php';
    NotificationHelper::sendToRole(
        $db,
        'admin',
        $data->user_id,
        'Task Claimed by Staff',
        "{$employee_name} has claimed the task: {$task['title']}",
        'task_update',
        'admin',
        '/task-oversight',
        'normal',
        [
            'task_id' => $data->task_id,
            'task_title' => $task['title'],
            'claimed_by' => $employee_name,
            'status' => 'To-Do'
        ]
    );

    echo json_encode([
        "status" => "success",
        "message" => "Task claimed successfully! It has been moved to your To-Do list."
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
