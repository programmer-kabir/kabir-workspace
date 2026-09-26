<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

$data = json_decode(file_get_contents("php://input"));

if(
    !isset($data->user_id) || 
    !isset($data->start_date) || 
    !isset($data->end_date) || 
    !isset($data->type) || 
    !isset($data->reason)
) {
    echo json_encode(["status" => "error", "message" => "All fields are required."]);
    exit;
}

$query = "INSERT INTO leave_requests (user_id, start_date, end_date, type, reason) VALUES (:user_id, :start_date, :end_date, :type, :reason)";
$stmt = $db->prepare($query);

$stmt->bindParam(":user_id", $data->user_id);
$stmt->bindParam(":start_date", $data->start_date);
$stmt->bindParam(":end_date", $data->end_date);
$stmt->bindParam(":type", $data->type);
$stmt->bindParam(":reason", $data->reason);

if($stmt->execute()) {
    $leave_id = $db->lastInsertId();
    
    // Fetch applicant user name
    $u_stmt = $db->prepare("SELECT name FROM users WHERE id = :uid LIMIT 1");
    $u_stmt->execute([':uid' => $data->user_id]);
    $applicant_name = $u_stmt->fetchColumn() ?: 'Staff Member';

    require_once '../notifications/notification_helper.php';
    NotificationHelper::sendToRole(
        $db,
        'admin',
        $data->user_id,
        "Leave Application: {$applicant_name}",
        "Applied for {$data->type} leave from {$data->start_date} to {$data->end_date}.",
        "leave_applied",
        "admin",
        "/leave",
        "normal",
        ["leave_id" => $leave_id, "applicant_name" => $applicant_name]
    );

    echo json_encode(["status" => "success", "message" => "Leave application submitted successfully."]);
} else {
    echo json_encode(["status" => "error", "message" => "Failed to submit leave application."]);
}
?>
