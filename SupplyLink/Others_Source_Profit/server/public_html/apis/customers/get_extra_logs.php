<?php
// get_extra_logs.php - Fetch full extra amount history/ledger for a card
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';
requireAuth();

header("Content-Type: application/json; charset=UTF-8");

$card_id = (int)($_GET['card_id'] ?? 0);
if ($card_id <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "অবৈধ কার্ড আইডি"]);
    exit;
}

// Auto-ensure table exists
try {
    $mysqli->query("
        CREATE TABLE IF NOT EXISTS `installment_extra_logs` (
          `id` INT AUTO_INCREMENT PRIMARY KEY,
          `card_id` INT NOT NULL,
          `payment_id` INT NULL,
          `customer_id` INT NOT NULL DEFAULT 0,
          `type` ENUM('deposit', 'adjustment', 'refund') NOT NULL,
          `amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
          `previous_balance` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
          `current_balance` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
          `cash_id` INT NULL,
          `receipt_number` VARCHAR(100) NULL,
          `created_by` INT NOT NULL DEFAULT 0,
          `remarks` TEXT NULL,
          `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          KEY (`card_id`),
          KEY (`customer_id`),
          KEY (`payment_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
} catch (Throwable $e) {}

$stmt = $mysqli->prepare("
    SELECT l.id, l.card_id, l.payment_id, l.customer_id, l.type, l.amount,
           l.previous_balance, l.current_balance, l.cash_id, l.receipt_number,
           l.created_by, l.remarks, l.created_at,
           u.name AS creator_name,
           p.tag AS installment_tag, p.installment_no
    FROM installment_extra_logs l
    LEFT JOIN users u ON u.id = l.created_by
    LEFT JOIN installment_payments p ON p.id = l.payment_id
    WHERE l.card_id = ?
    ORDER BY l.id DESC
");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Query failed: " . $mysqli->error]);
    exit;
}

$stmt->bind_param("i", $card_id);
$stmt->execute();
$res = $stmt->get_result();
$logs = [];

while ($row = $res->fetch_assoc()) {
    $row['id'] = (int)$row['id'];
    $row['card_id'] = (int)$row['card_id'];
    $row['payment_id'] = $row['payment_id'] ? (int)$row['payment_id'] : null;
    $row['customer_id'] = (int)$row['customer_id'];
    $row['amount'] = (float)$row['amount'];
    $row['previous_balance'] = (float)$row['previous_balance'];
    $row['current_balance'] = (float)$row['current_balance'];
    $row['cash_id'] = $row['cash_id'] ? (int)$row['cash_id'] : null;
    $row['created_by'] = (int)$row['created_by'];
    $logs[] = $row;
}
$stmt->close();

echo json_encode([
    "success" => true,
    "total" => count($logs),
    "data" => $logs
], JSON_UNESCAPED_UNICODE);
