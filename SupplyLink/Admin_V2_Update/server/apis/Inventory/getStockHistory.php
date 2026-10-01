<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json");

// OPTIONS handle (CORS)
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
  http_response_code(204);
  exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
  http_response_code(405);
  echo json_encode([
    "success" => false,
    "message" => "Method not allowed. Use GET."
  ], JSON_UNESCAPED_UNICODE);
  exit;
}

$stock_id = isset($_GET["stock_id"]) ? (int)$_GET["stock_id"] : 0;

$mysqli->query("CREATE TABLE IF NOT EXISTS Stock_Inventory_History (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stock_id INT NOT NULL,
    action VARCHAR(50) DEFAULT 'Updated',
    changes JSON NULL,
    note VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX (stock_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

if ($stock_id > 0) {
    $stmt = $mysqli->prepare("SELECT * FROM Stock_Inventory_History WHERE stock_id = ? ORDER BY id DESC");
    $stmt->bind_param("i", $stock_id);
    $stmt->execute();
    $result = $stmt->get_result();
} else {
    $result = $mysqli->query("SELECT * FROM Stock_Inventory_History ORDER BY id DESC LIMIT 100");
}

$history = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $changes = null;
        if (!empty($row["changes"])) {
            $changes = json_decode($row["changes"], true);
        }

        $history[] = [
            "id" => (int)$row["id"],
            "stock_id" => (int)$row["stock_id"],
            "action" => $row["action"],
            "changes" => $changes,
            "note" => $row["note"],
            "created_at" => $row["created_at"]
        ];
    }
}

echo json_encode([
    "success" => true,
    "data" => $history
], JSON_UNESCAPED_UNICODE);
?>
