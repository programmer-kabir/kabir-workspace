<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../../config/database.php';
require_once '../notifications/notification_helper.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

$data = json_decode(file_get_contents("php://input"));

if(!isset($data->user_id) || !isset($data->date) || !isset($data->dispute_type) || !isset($data->description)) {
    echo json_encode(["status" => "error", "message" => "All fields are required."]);
    exit;
}

$user_id = $data->user_id;
$date = $data->date;
$dispute_type = $data->dispute_type;
$description = $data->description;
$claimed_start_time = isset($data->claimed_start_time) && $data->claimed_start_time ? $data->claimed_start_time : null;
$claimed_end_time = isset($data->claimed_end_time) && $data->claimed_end_time ? $data->claimed_end_time : null;

$today = date('Y-m-d');

if ($date > $today) {
    echo json_encode(["status" => "error", "message" => "Cannot dispute future dates."]);
    exit;
}

// Check for duplicate pending requests
$check_query = "SELECT id FROM attendance_disputes WHERE user_id = :user_id AND date = :date AND status = 'pending' LIMIT 1";
$check_stmt = $db->prepare($check_query);
$check_stmt->bindParam(':user_id', $user_id);
$check_stmt->bindParam(':date', $date);
$check_stmt->execute();

if($check_stmt->rowCount() > 0) {
    echo json_encode(["status" => "error", "message" => "You already have a pending dispute for this date."]);
    exit;
}

// Insert Dispute
$query = "INSERT INTO attendance_disputes (user_id, date, dispute_type, description, status, claimed_start_time, claimed_end_time) VALUES (:user_id, :date, :dispute_type, :description, 'pending', :claimed_start, :claimed_end)";
$stmt = $db->prepare($query);

$stmt->bindParam(':user_id', $user_id);
$stmt->bindParam(':date', $date);
$stmt->bindParam(':dispute_type', $dispute_type);
$stmt->bindParam(':description', $description);
$stmt->bindParam(':claimed_start', $claimed_start_time);
$stmt->bindParam(':claimed_end', $claimed_end_time);

if($stmt->execute()) {
    NotificationHelper::sendToRole(
        $db, 
        'admin', 
        $user_id, 
        'New Attendance Dispute', 
        'A staff member has reported an issue with their attendance.', 
        'attendance_alert', 
        'admin', 
        '/attendance-disputes'
    );

    echo json_encode([
        "status" => "success", 
        "message" => "Your dispute has been submitted to the admin for review."
    ]);
} else {
    echo json_encode(["status" => "error", "message" => "Failed to submit dispute."]);
}
?>
