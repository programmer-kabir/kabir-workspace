<?php
// server/api/payroll/get_payout_settings.php
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

    $stmt = $pdo->prepare("SELECT * FROM staff_payout_settings WHERE user_id = :user_id LIMIT 1");
    $stmt->execute([':user_id' => $userId]);
    $settings = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'has_settings' => (bool)$settings,
        'data' => $settings ?: [
            'user_id' => $userId,
            'payment_method' => 'bkash',
            'account_number' => '',
            'account_holder_name' => '',
            'bank_name' => '',
            'branch_name' => '',
            'routing_number' => ''
        ]
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
