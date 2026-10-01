<?php

// ✅ CORS FIRST
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json");

// OPTIONS handle
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
  http_response_code(200);
  exit;
}

// Only GET allowed
if ($_SERVER["REQUEST_METHOD"] !== "GET") {
  http_response_code(405);
  echo json_encode([
    "success" => false,
    "message" => "Method not allowed. Use GET."
  ]);
  exit;
}

// Ensure history table exists
$mysqli->query("CREATE TABLE IF NOT EXISTS supplier_payment_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payment_id INT NOT NULL,
    action VARCHAR(50) DEFAULT 'Updated',
    changes JSON NULL,
    note VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX (payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

// 🔥 Query with edit count
$sql = "SELECT p.*, 
  COALESCE((SELECT COUNT(*) FROM supplier_payment_history h WHERE h.payment_id = p.id AND h.action != 'Created'), 0) AS edit_count
FROM supplier_payment p 
ORDER BY p.id DESC";

$result = $mysqli->query($sql);

if (!$result) {
  http_response_code(500);
  echo json_encode([
    "success" => false,
    "message" => "Query failed",
    "error" => $mysqli->error
  ]);
  exit;
}

$data = [];

while ($row = $result->fetch_assoc()) {
  $data[] = [
    "id" => (int)$row["id"],
    "memo_no" => $row["memo_no"],
    "date" => $row["date"],
    "shop_name" => $row["shop_name"],
    "supplier" => $row["supplier"],
    "brand" => $row["brand"],
    "total_amount" => (float)$row["total_amount"],
    "paid" => (float)$row["paid"],
    "due" => (float)$row["due"],
    "image" => $row["image"],
    "remarks" => $row["remarks"],
    "edit_count" => (int)($row["edit_count"] ?? 0)
  ];
}

// ✅ response
echo json_encode([
  "success" => true,
  "data" => $data
]);