<?php
// server/api/security_deposit/save_security_deposit.php
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
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data || !is_array($data)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid JSON payload.']);
        exit();
    }

    $adminId = isset($data['admin_id']) ? intval($data['admin_id']) : null;
    $result = SecurityDepositHelper::saveDepositConfig($pdo, $data, $adminId);

    echo json_encode($result);

} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>

