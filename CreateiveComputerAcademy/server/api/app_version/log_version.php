<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/AppVersionHelper.php';

try {
    $input = json_decode(file_get_contents("php://input"), true);
    if (!$input) {
        $input = $_POST;
    }

    $userId     = isset($input['user_id']) ? intval($input['user_id']) : 0;
    $version    = isset($input['version']) ? trim($input['version']) : '1.0.0';
    $deviceName = isset($input['device_name']) ? trim($input['device_name']) : null;
    $platform   = isset($input['platform']) ? trim($input['platform']) : 'Windows';
    $isCheckIn  = !empty($input['is_check_in']);

    if (empty($userId)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "user_id is required."]);
        exit();
    }

    AppVersionHelper::logStaffVersion($userId, $version, $deviceName, $platform, $isCheckIn);

    echo json_encode([
        "status"  => "success",
        "message" => "Staff app version logged successfully."
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Failed to log staff version: " . $e->getMessage()
    ]);
}
