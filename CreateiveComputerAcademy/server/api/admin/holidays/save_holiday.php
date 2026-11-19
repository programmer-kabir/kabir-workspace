<?php
/**
 * save_holiday.php — Declare or update an official holiday / center closure
 */
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/HolidayHelper.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $raw = file_get_contents("php://input");
    $input = json_decode($raw, true);

    if (empty($input)) {
        $input = $_POST;
    }

    $adminId = isset($input['admin_id']) ? intval($input['admin_id']) : null;

    $saved = HolidayHelper::saveHoliday($db, $input, $adminId);

    echo json_encode([
        "status" => "success",
        "message" => "Holiday / Center closure saved successfully. Payroll earnings updated.",
        "data" => $saved
    ]);
} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
