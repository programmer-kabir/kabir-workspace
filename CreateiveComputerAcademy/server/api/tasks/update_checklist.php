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

if(!isset($data->task_id) || !isset($data->checklists)) {
    echo json_encode(["status" => "error", "message" => "Task ID and Checklists are required."]);
    exit;
}

try {
    $checklists_val = is_string($data->checklists) ? $data->checklists : json_encode($data->checklists);
    
    $query = "UPDATE tasks SET checklists = :checklists WHERE id = :task_id";
    $update_stmt = $db->prepare($query);
    
    if ($update_stmt->execute([':checklists' => $checklists_val, ':task_id' => $data->task_id])) {
        // Also log history
        require_once 'task_history_helper.php';
        $logger = new TaskHistoryLogger($db);
        // Best effort to get the name of whoever updated it
        $performed_by = isset($data->performed_by_name) ? $data->performed_by_name : "User";
        $logger->logHistory($data->task_id, "Updated Checklist", $performed_by);
        
        echo json_encode(["status" => "success", "message" => "Checklist updated."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to update checklist."]);
    }

} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
