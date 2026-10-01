<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json");

// OPTIONS handle (CORS)
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
  http_response_code(204);
  exit;
}

// Only GET allowed
if ($_SERVER["REQUEST_METHOD"] !== "GET") {
  http_response_code(405);
  echo json_encode([
    "success" => false,
    "message" => "Method not allowed. Use GET."
  ], JSON_UNESCAPED_UNICODE);
  exit;
}

// Ensure category column and image column and history table exist
$mysqli->query("ALTER TABLE Stock_Inventory ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Mobile'");
$mysqli->query("ALTER TABLE Stock_Inventory ADD COLUMN IF NOT EXISTS image VARCHAR(255) NULL");
$mysqli->query("CREATE TABLE IF NOT EXISTS Stock_Inventory_History (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stock_id INT NOT NULL,
    action VARCHAR(50) DEFAULT 'Updated',
    changes JSON NULL,
    note VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX (stock_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

/**
 * ✅ Fetch all stock with edit count
 */
$sql = "SELECT s.*, 
  COALESCE((SELECT COUNT(*) FROM Stock_Inventory_History h WHERE h.stock_id = s.id AND h.action != 'Created'), 0) AS edit_count
FROM Stock_Inventory s 
ORDER BY s.id DESC";

$result = $mysqli->query($sql);

if (!$result) {
  http_response_code(500);
  echo json_encode([
    "success" => false,
    "message" => "Query failed",
    "error"   => $mysqli->error
  ], JSON_UNESCAPED_UNICODE);
  exit;
}

$stocks = [];
while ($row = $result->fetch_assoc()) {
  $stocks[] = [
    "id" => (int)$row["id"],
    "date" => $row["date"],
    "category" => !empty($row["category"]) ? $row["category"] : "Mobile",
    "brand" => $row["brand"],
    "model" => $row["model"],
    "image" => $row["image"] ?? null,
    "imei1" => $row["imei1"],
    "imei2" => $row["imei2"],
    "variant" => $row["variant"],
    "color" => $row["color"],
    "purchase_price" => (float)$row["purchase_price"],
    "mrp" => (float)$row["mrp"],
    "supplier" => $row["supplier"],
    "status" => $row["status"],
    "edit_count" => (int)($row["edit_count"] ?? 0),
    "created_at" => $row["created_at"]
  ];
}

echo json_encode([
  "success" => true,
  "data" => $stocks
], JSON_UNESCAPED_UNICODE);