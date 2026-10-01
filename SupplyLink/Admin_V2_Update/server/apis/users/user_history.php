<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=UTF-8");
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

// Ensure Table Exists
$createTableSql = "
CREATE TABLE IF NOT EXISTS `user_edit_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `changes` TEXT NOT NULL,
  `edited_by` VARCHAR(255) DEFAULT 'Admin',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
";
$mysqli->query($createTableSql);

$user_id = intval($_GET['user_id'] ?? $_GET['id'] ?? 0);

if (!$user_id) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "User ID is required"]);
    exit;
}

try {
    $stmt = $mysqli->prepare("
        SELECT id, user_id, changes, edited_by, created_at 
        FROM user_edit_history 
        WHERE user_id = ? 
        ORDER BY id DESC
    ");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $history = [];
    while ($row = $result->fetch_assoc()) {
        $parsedChanges = json_decode($row['changes'], true);
        $row['changes'] = $parsedChanges ?: $row['changes'];
        $history[] = $row;
    }
    $stmt->close();

    echo json_encode([
        "success" => true,
        "total"   => count($history),
        "data"    => $history
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to fetch history: " . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
