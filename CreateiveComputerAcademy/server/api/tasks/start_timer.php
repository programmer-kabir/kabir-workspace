<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(!isset($data->task_id)) {
    echo json_encode(["status" => "error", "message" => "Task ID is required."]);
    exit;
}

try {
    // Check current status
    $stmt = $db->prepare("SELECT timer_status, status FROM tasks WHERE id = :task_id");
    $stmt->execute([':task_id' => $data->task_id]);
    $task = $stmt->fetch(PDO::FETCH_ASSOC);

    if(!$task) {
        echo json_encode(["status" => "error", "message" => "Task not found."]);
        exit;
    }
    
    if ($task['status'] !== 'In Progress') {
        echo json_encode(["status" => "error", "message" => "Task must be 'In Progress' to start the timer."]);
        exit;
    }

    if ($task['timer_status'] === 'Running') {
        echo json_encode(["status" => "error", "message" => "Timer is already running."]);
        exit;
    }

    $query = "UPDATE tasks SET timer_status = 'Running', session_start_time = NOW() WHERE id = :task_id";
    $update_stmt = $db->prepare($query);
    $update_stmt->execute([':task_id' => $data->task_id]);

    echo json_encode(["status" => "success", "message" => "Timer started.", "session_start_time" => date('Y-m-d H:i:s')]);
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
