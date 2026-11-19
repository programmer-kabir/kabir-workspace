<?php
/**
 * delete_holiday.php — Remove an official holiday / center closure
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

    $id = isset($input['id']) ? intval($input['id']) : 0;
    if (!$id && isset($_GET['id'])) {
        $id = intval($_GET['id']);
    }

    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Valid holiday ID required."]);
        exit();
    }

    $deleted = HolidayHelper::deleteHoliday($db, $id);

    echo json_encode([
        "status" => "success",
        "message" => "Holiday / Center closure removed successfully. Associated payroll credits rolled back.",
        "data" => $deleted
    ]);
} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
