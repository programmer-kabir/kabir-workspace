<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

$paymentId = isset($_GET['payment_id']) ? (int)$_GET['payment_id'] : 0;

if (!$paymentId) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "payment_id required"]);
    exit;
}

// Ensure table exists
$mysqli->query("CREATE TABLE IF NOT EXISTS supplier_payment_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payment_id INT NOT NULL,
    action VARCHAR(50) DEFAULT 'Updated',
    changes JSON NULL,
    note VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX (payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

$stmt = $mysqli->prepare("SELECT * FROM supplier_payment_history WHERE payment_id = ? ORDER BY id DESC");
$stmt->bind_param("i", $paymentId);
$stmt->execute();
$result = $stmt->get_result();

$history = [];
while ($row = $result->fetch_assoc()) {
    $changes = null;
    if (!empty($row['changes'])) {
        $changes = json_decode($row['changes'], true);
    }

    $history[] = [
        "id" => (int)$row["id"],
        "payment_id" => (int)$row["payment_id"],
        "action" => $row["action"],
        "changes" => $changes,
        "note" => $row["note"],
        "created_at" => $row["created_at"]
    ];
}

echo json_encode([
    "success" => true,
    "data" => $history
], JSON_UNESCAPED_UNICODE);
