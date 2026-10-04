<?php
// server/api/payroll/request_withdrawal.php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/PayrollHelper.php';

$database = new Database();
$pdo = $database->getConnection();

if (!$pdo) {
    echo json_encode(["status" => "error", "message" => "Database connection failed."]);
    exit();
}

try {
    $data = json_decode(file_get_contents('php://input'), true);

    $userId = isset($data['user_id']) ? intval($data['user_id']) : 0;
    $amount = isset($data['amount']) ? floatval($data['amount']) : 0.0;
    $paymentMethod = isset($data['payment_method']) ? trim($data['payment_method']) : 'bkash';
    $accountDetails = isset($data['account_details']) ? trim($data['account_details']) : '';

    if ($userId <= 0 || $amount <= 0) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Valid user_id and amount are required.']);
        exit();
    }

    $result = PayrollHelper::requestWithdrawal($pdo, $userId, $amount, $paymentMethod, $accountDetails);

    echo json_encode([
        'status' => 'success',
        'message' => 'Withdrawal request submitted successfully.',
        'data' => $result
    ]);

} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
