<?php
// server/api/leave/get_student_quota.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../../config/database.php';
require_once 'StudentLeaveHelper.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

$userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
if ($userId <= 0) {
    $data = json_decode(file_get_contents("php://input"));
    if (!empty($data->user_id)) {
        $userId = intval($data->user_id);
    }
}

if ($userId <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Valid user_id parameter is required."]);
    exit;
}

$month = isset($_GET['month']) ? trim($_GET['month']) : (!empty($data->month) ? trim($data->month) : date('Y-m'));

try {
    $summary = StudentLeaveHelper::getQuotaSummary($db, $userId, $month);
    echo json_encode([
        "status" => "success",
        "data"   => $summary
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Failed to get student leave quota: " . $e->getMessage()
    ]);
}
