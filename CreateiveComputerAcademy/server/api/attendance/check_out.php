<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);


require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once 'AttendanceSecurityHelper.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

$data = json_decode(file_get_contents("php://input"), true);

if(!isset($data['user_id'])) {
    echo json_encode(["status" => "error", "message" => "User ID required."]);
    exit;
}

$user_id = $data['user_id'];
$device_info = isset($data['device_info']) && is_array($data['device_info']) ? $data['device_info'] : [];
$location = isset($data['location']) && is_array($data['location']) ? $data['location'] : [];

// Diagnostic check to verify if the user exists in the users table
$user_check = $db->prepare("SELECT id FROM users WHERE id = :id");
$user_check->execute([':id' => $user_id]);
if ($user_check->rowCount() === 0) {
    echo json_encode([
        "status" => "error",
        "message" => "User ID '" . $user_id . "' does not exist in the users table."
    ]);
    exit;
}

$today = date('Y-m-d');
$current_time = date('H:i:s');

// Find active attendance record for today
$find_query = "SELECT id FROM attendance WHERE user_id = :user_id AND date = :date AND check_out IS NULL LIMIT 1";
$find_stmt = $db->prepare($find_query);
$find_stmt->execute([':user_id' => $user_id, ':date' => $today]);
$att_record = $find_stmt->fetch(PDO::FETCH_ASSOC);

if (!$att_record) {
    echo json_encode([
        "status" => "error", 
        "message" => "Could not check out. You may not have checked in today, or you have already checked out."
    ]);
    exit;
}

$attendance_id = $att_record['id'];

// Resolve real IP & evaluate Geofence
$user_ip = AttendanceSecurityHelper::getRealClientIP();
$eval = AttendanceSecurityHelper::evaluateSecurity($db, $user_id, 'check_out', $user_ip, $device_info, $location);

// Check if blocked under Strict Mode
if (!empty($eval['is_blocked'])) {
    echo json_encode([
        "status" => "error",
        "message" => $eval['block_message'],
        "ip" => $user_ip,
        "distance_meters" => $eval['distance_meters']
    ]);
    exit;
}

$query = "UPDATE attendance SET check_out = :check_out WHERE id = :id";
$stmt = $db->prepare($query);
$stmt->bindParam(':check_out', $current_time);
$stmt->bindParam(':id', $attendance_id);

if($stmt->execute() && $stmt->rowCount() > 0) {
    // Log check_out device and location metadata
    AttendanceSecurityHelper::logDevicePunch($db, $attendance_id, $user_id, 'check_out', $eval);

    echo json_encode([
        "status" => "success", 
        "message" => "Checked out successfully",
        "time" => $current_time,
        "trust_score" => $eval['trust_score'],
        "distance_meters" => $eval['distance_meters'],
        "verification_status" => $eval['verification_status']
    ]);
} else {
    echo json_encode(["status" => "error", "message" => "Could not check out. Please try again."]);
}
?>
