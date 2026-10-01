<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=UTF-8");

function apiError($message, $debug = null, $code = 400) {
  http_response_code($code);
  echo json_encode([
    "success" => false,
    "message" => $message,
    "debug"   => $debug
  ], JSON_UNESCAPED_UNICODE);
  exit;
}

// Ensure table exists
$mysqli->query("
CREATE TABLE IF NOT EXISTS `installment_payment_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `payment_id` INT NOT NULL,
  `card_id` INT NOT NULL,
  `installment_no` INT NOT NULL DEFAULT 0,
  `tag` VARCHAR(100) DEFAULT NULL,
  `action` VARCHAR(100) DEFAULT 'Status Updated',
  `old_status` VARCHAR(50) DEFAULT NULL,
  `new_status` VARCHAR(50) DEFAULT NULL,
  `old_paid_date` VARCHAR(50) DEFAULT NULL,
  `new_paid_date` VARCHAR(50) DEFAULT NULL,
  `old_payment_method` VARCHAR(50) DEFAULT NULL,
  `new_payment_method` VARCHAR(50) DEFAULT NULL,
  `old_receipt_number` VARCHAR(100) DEFAULT NULL,
  `new_receipt_number` VARCHAR(100) DEFAULT NULL,
  `changes` TEXT NOT NULL,
  `edited_by_id` INT DEFAULT NULL,
  `edited_by_name` VARCHAR(255) DEFAULT 'Staff/Admin',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY (`payment_id`),
  KEY (`card_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
");

$cardId    = isset($_GET['card_id']) ? (int)$_GET['card_id'] : 0;
$paymentId = isset($_GET['payment_id']) ? (int)$_GET['payment_id'] : 0;

$where = [];
$params = [];
$types = "";

if ($cardId > 0) {
  $where[] = "card_id = ?";
  $params[] = $cardId;
  $types .= "i";
}

if ($paymentId > 0) {
  $where[] = "payment_id = ?";
  $params[] = $paymentId;
  $types .= "i";
}

$whereSql = !empty($where) ? "WHERE " . implode(" AND ", $where) : "";

$sql = "
  SELECT 
    id, payment_id, card_id, installment_no, tag, action,
    old_status, new_status, old_paid_date, new_paid_date,
    old_payment_method, new_payment_method, old_receipt_number, new_receipt_number,
    changes, edited_by_id, edited_by_name, created_at
  FROM installment_payment_history
  {$whereSql}
  ORDER BY id DESC
  LIMIT 100
";

$stmt = $mysqli->prepare($sql);
if (!$stmt) {
  apiError("Failed to prepare history query", $mysqli->error, 500);
}

if (!empty($params)) {
  $stmt->bind_param($types, ...$params);
}

$stmt->execute();
$result = $stmt->get_result();

$history = [];
while ($row = $result->fetch_assoc()) {
  $parsedChanges = json_decode($row['changes'], true);
  $row['changes_list'] = is_array($parsedChanges) ? $parsedChanges : [];
  $history[] = $row;
}
$stmt->close();

echo json_encode([
  "success" => true,
  "total"   => count($history),
  "data"    => $history
], JSON_UNESCAPED_UNICODE);
