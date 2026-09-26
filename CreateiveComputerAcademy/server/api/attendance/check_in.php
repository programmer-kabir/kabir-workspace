<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);


require_once '../../config/database.php';
require_once '../../config/cors.php';
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

// Resolve real IP taking Cloudflare/proxies into account
$user_ip = AttendanceSecurityHelper::getRealClientIP();

// Evaluate Geofence, IP & Security
$eval = AttendanceSecurityHelper::evaluateSecurity($db, $user_id, 'check_in', $user_ip, $device_info, $location);

// Check if blocked under Strict Mode
if (!empty($eval['is_blocked'])) {
    echo json_encode([
        "status" => "error",
        "message" => $eval['block_message'],
        "ip" => $user_ip,
        "distance_meters" => $eval['distance_meters'],
        "is_within_geofence" => $eval['is_within_geofence']
    ]);
    exit;
}

$today = date('Y-m-d');
$current_time = date('H:i:s');

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

// Get employee shift start time
$emp_query = "SELECT shift_start FROM employees WHERE user_id = :user_id LIMIT 1";
$emp_stmt = $db->prepare($emp_query);
$emp_stmt->bindParam(':user_id', $user_id);
$emp_stmt->execute();

$shift_start = '10:00:00'; // Default
if($emp_stmt->rowCount() > 0) {
    $emp_row = $emp_stmt->fetch(PDO::FETCH_ASSOC);
    if(!empty($emp_row['shift_start'])) {
        $shift_start = $emp_row['shift_start'];
    }
}

// Check if already checked in today
$check_query = "SELECT id, check_in, check_out FROM attendance WHERE user_id = :user_id AND date = :today LIMIT 1";
$check_stmt = $db->prepare($check_query);
$check_stmt->bindParam(':user_id', $user_id);
$check_stmt->bindParam(':today', $today);
$check_stmt->execute();

if($check_stmt->rowCount() > 0) {
    echo json_encode(["status" => "error", "message" => "You have already checked in today."]);
    exit;
}

// Determine Status
$status = 'Present';

// Insert Check-in
$query = "INSERT INTO attendance (user_id, date, check_in, status) VALUES (:user_id, :date, :check_in, :status)";
$stmt = $db->prepare($query);

$stmt->bindParam(':user_id', $user_id);
$stmt->bindParam(':date', $today);
$stmt->bindParam(':check_in', $current_time);
$stmt->bindParam(':status', $status);

if($stmt->execute()) {
    $attendance_id = $db->lastInsertId();

    // Log complete device & security metadata to attendance_device_logs
    AttendanceSecurityHelper::logDevicePunch($db, $attendance_id, $user_id, 'check_in', $eval);

    echo json_encode([
        "status" => "success", 
        "message" => "Checked in successfully as " . $status,
        "time" => $current_time,
        "attendance_status" => $status,
        "trust_score" => $eval['trust_score'],
        "distance_meters" => $eval['distance_meters'],
        "verification_status" => $eval['verification_status']
    ]);
} else {
    echo json_encode(["status" => "error", "message" => "Failed to check in."]);
}
?>
