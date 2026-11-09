<?php
// server/api/security_deposit/get_security_deposit.php
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
    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    if ($userId <= 0) {
        $data = json_decode(file_get_contents('php://input'), true);
        $userId = isset($data['user_id']) ? intval($data['user_id']) : 0;
    }

    if ($userId <= 0) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Valid user_id is required.']);
        exit();
    }

    $currentEarned = isset($_GET['current_earned']) ? floatval($_GET['current_earned']) : 0.0;
    $summary = SecurityDepositHelper::getDepositSummaryForUser($pdo, $userId, $currentEarned);

    echo json_encode([
        'status' => 'success',
        'data' => $summary
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>

