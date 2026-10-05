<?php
// server/api/payroll/save_payout_settings.php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';

$database = new Database();
$pdo = $database->getConnection();

if (!$pdo) {
    echo json_encode(["status" => "error", "message" => "Database connection failed."]);
    exit();
}

try {
    // Auto create table if not exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS staff_payout_settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL UNIQUE,
            payment_method VARCHAR(50) NOT NULL DEFAULT 'bkash',
            account_number VARCHAR(100) NOT NULL,
            account_holder_name VARCHAR(100) NULL,
            bank_name VARCHAR(100) NULL,
            branch_name VARCHAR(100) NULL,
            routing_number VARCHAR(50) NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    $data = json_decode(file_get_contents('php://input'), true);

    $userId = isset($data['user_id']) ? intval($data['user_id']) : 0;
    $paymentMethod = isset($data['payment_method']) ? trim($data['payment_method']) : 'bkash';
    $accountNumber = isset($data['account_number']) ? trim($data['account_number']) : '';
    $accountHolderName = isset($data['account_holder_name']) ? trim($data['account_holder_name']) : null;
    $bankName = isset($data['bank_name']) ? trim($data['bank_name']) : null;
    $branchName = isset($data['branch_name']) ? trim($data['branch_name']) : null;
    $routingNumber = isset($data['routing_number']) ? trim($data['routing_number']) : null;

    if ($userId <= 0 || empty($accountNumber)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'User ID and Account Number are required.']);
        exit();
    }

    $stmt = $pdo->prepare("
        INSERT INTO staff_payout_settings (
            user_id, payment_method, account_number, account_holder_name, bank_name, branch_name, routing_number, updated_at
        ) VALUES (
            :user_id, :payment_method, :account_number, :account_holder_name, :bank_name, :branch_name, :routing_number, NOW()
        ) ON DUPLICATE KEY UPDATE
            payment_method = VALUES(payment_method),
            account_number = VALUES(account_number),
            account_holder_name = VALUES(account_holder_name),
            bank_name = VALUES(bank_name),
            branch_name = VALUES(branch_name),
            routing_number = VALUES(routing_number),
            updated_at = NOW()
    ");

    $stmt->execute([
        ':user_id' => $userId,
        ':payment_method' => $paymentMethod,
        ':account_number' => $accountNumber,
        ':account_holder_name' => $accountHolderName,
        ':bank_name' => $bankName,
        ':branch_name' => $branchName,
        ':routing_number' => $routingNumber,
    ]);

    echo json_encode([
        'status' => 'success',
        'message' => 'Payout payment setup saved successfully!',
        'data' => [
            'user_id' => $userId,
            'payment_method' => $paymentMethod,
            'account_number' => $accountNumber
        ]
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
