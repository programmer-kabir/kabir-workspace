<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(!isset($data->task_id)) {
    echo json_encode(["status" => "error", "message" => "Task ID is required."]);
    exit;
}

try {
    $query = "DELETE FROM tasks WHERE id = :task_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':task_id', $data->task_id);

    if($stmt->execute()) {
        // Additionally, clean up related data to prevent orphaned rows
        $db->prepare("DELETE FROM task_comments WHERE task_id = :task_id")->execute([':task_id' => $data->task_id]);
        $db->prepare("DELETE FROM task_logs WHERE task_id = :task_id")->execute([':task_id' => $data->task_id]);

        echo json_encode(["status" => "success", "message" => "Task deleted successfully."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to delete task."]);
    }
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
