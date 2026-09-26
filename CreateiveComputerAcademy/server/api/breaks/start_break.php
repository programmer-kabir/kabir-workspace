<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->user_id) || !isset($data->break_type)) {
    echo json_encode(["status" => "error", "message" => "user_id and break_type are required."]);
    exit;
}

$user_id = $data->user_id;
$break_type = $data->break_type;
$date = date('Y-m-d');
$start_time = date('Y-m-d H:i:s');

try {
    // Check if there is already an active break
    $check_query = "SELECT id FROM employee_breaks WHERE user_id = :user_id AND status = 'Active'";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->execute([':user_id' => $user_id]);
    
    if ($check_stmt->rowCount() > 0) {
        echo json_encode(["status" => "error", "message" => "An active break already exists. Please end it first."]);
        exit;
    }

    $query = "INSERT INTO employee_breaks (user_id, date, break_type, start_time, status) VALUES (:user_id, :date, :break_type, :start_time, 'Active')";
    $stmt = $db->prepare($query);
    
    if ($stmt->execute([
        ':user_id' => $user_id,
        ':date' => $date,
        ':break_type' => $break_type,
        ':start_time' => $start_time
    ])) {
        echo json_encode([
            "status" => "success", 
            "message" => "Break started successfully.",
            "data" => [
                "id" => $db->lastInsertId(),
                "start_time" => $start_time,
                "break_type" => $break_type
            ]
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to start break."]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
