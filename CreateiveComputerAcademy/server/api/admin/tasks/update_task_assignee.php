
<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->task_id) || !isset($data->assigned_to)) {
    echo json_encode(["status" => "error", "message" => "Task ID and Assignee are required."]);
    exit;
}

try {
    // Get current task details before update
    $stmt_task = $db->prepare("
        SELECT t.title, COALESCE(tc.name, 'General') as category, t.status 
        FROM tasks t 
        LEFT JOIN task_categories tc ON t.category_id = tc.id 
        WHERE t.id = :id
    ");
    $stmt_task->execute([':id' => $data->task_id]);
    $task_details = $stmt_task->fetch(PDO::FETCH_ASSOC);

    // assigned_to is the user_id, we need to map it to employee_id
    $employee_id = null;
    $new_status = 'Unassigned';

    if ($data->assigned_to !== 'unassigned' && $data->assigned_to !== null && $data->assigned_to !== '') {
        $stmt_emp = $db->prepare("SELECT id FROM employees WHERE user_id = :user_id LIMIT 1");
        $stmt_emp->execute([':user_id' => $data->assigned_to]);
        $employee_id = $stmt_emp->fetchColumn();

        if (!$employee_id) {
            echo json_encode(["status" => "error", "message" => "Staff member not found."]);
            exit;
        }

        // Only change status to To-Do if it's currently Unassigned. 
        // Otherwise keep existing status (e.g. In Progress)
        $new_status = ($task_details && $task_details['status'] === 'Unassigned') ? 'To-Do' : ($task_details ? $task_details['status'] : 'To-Do');
    }

    $query = "UPDATE tasks SET assigned_to = :assigned_to, status = :status, updated_at = NOW() WHERE id = :task_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':assigned_to', $employee_id);
    $stmt->bindParam(':status', $new_status);
    $stmt->bindParam(':task_id', $data->task_id);
    if ($stmt->execute()) {
        require_once '../../tasks/task_history_helper.php';
        $logger = new TaskHistoryLogger($db);
        $logger->logHistory($data->task_id, $employee_id ? "Task Reassigned" : "Task Moved to Unassigned Pool", 'Admin');

        if ($employee_id) {
            require_once '../../notifications/notification_helper.php';
            NotificationHelper::sendToUser(
                $db,
                $data->assigned_to,
                null, // sender_id
                "Task Assigned: " . ($task_details['title'] ?? 'Task'),
                "You have been assigned to this task. Please check your tasks dashboard.",
                "task_assigned",
                "staff",
                "/tasks",
                "normal",
                ["task_id" => $data->task_id]
            );

            // Send email notification
            require_once '../../emails/EmailHelper.php';
            $stmt_user = $db->prepare("SELECT name, email FROM users WHERE id = :id LIMIT 1");
            $stmt_user->execute([':id' => $data->assigned_to]);
            $user_data = $stmt_user->fetch(PDO::FETCH_ASSOC);

            if ($user_data && !empty($user_data['email'])) {
                $stmt_tpl = $db->prepare("SELECT subject, body FROM email_templates WHERE event_name = 'task_assigned'");
                $stmt_tpl->execute();
                if ($tpl = $stmt_tpl->fetch(PDO::FETCH_ASSOC)) {
                    $subject = str_replace('{{task_title}}', $task_details['title'] ?? 'Task', $tpl['subject']);
                    $body = $tpl['body'];
                    $body = str_replace('{{staff_name}}', $user_data['name'], $body);
                    $body = str_replace('{{task_title}}', $task_details['title'] ?? 'Task', $body);
                    $body = str_replace('{{task_category}}', $task_details['category'] ?? 'N/A', $body);
                    
                    $actionUrl = 'https://staff.creativecomputeracademy.com/tasks?taskId=' . $data->task_id;
                    $htmlBody = EmailHelper::getHtmlTemplate($subject, $body, $actionUrl, 'View Task');
                    
                    EmailHelper::sendEmail($user_data['email'], $user_data['name'], $subject, $htmlBody);
                }
            }
        }

        echo json_encode(["status" => "success", "message" => "Task assignment updated successfully."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to update task assignment."]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>