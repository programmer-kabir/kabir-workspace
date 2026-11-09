<?php
// server/api/security_deposit/record_manual_deposit.php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/SecurityDepositHelper.php';

$database = new Database();
$pdo = $database->getConnection();

if (!$pdo) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database connection failed."]);
    exit();
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid JSON payload.']);
        exit();
    }

    $adminId = isset($input['admin_id']) ? intval($input['admin_id']) : null;
    $result = SecurityDepositHelper::recordLedgerEntry($pdo, $input, $adminId);

    echo json_encode($result);

} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>

