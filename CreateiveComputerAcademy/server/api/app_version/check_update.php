<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/AppVersionHelper.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $input = json_decode(file_get_contents("php://input"), true);
    if (!$input) {
        $input = $_REQUEST;
    }

    $clientVersion = trim($input['client_version'] ?? $input['version'] ?? $_GET['client_version'] ?? $_GET['version'] ?? '1.0.0');
    $userId        = isset($input['user_id']) ? intval($input['user_id']) : 0;
    $deviceName    = isset($input['device_name']) ? trim($input['device_name']) : null;
    $platform      = isset($input['platform']) ? trim($input['platform']) : 'Windows';

    // Check version update
    $result = AppVersionHelper::checkUpdate($clientVersion, $db);

    // If userId provided, log heartbeat/presence version
    if (!empty($userId)) {
        AppVersionHelper::logStaffVersion($userId, $clientVersion, $deviceName, $platform, false);
    }

    echo json_encode([
        "status" => "success",
        "data"   => $result
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Failed to check app updates: " . $e->getMessage()
    ]);
}
