<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->blocker_id) || !isset($data->blocked_id)) {
    echo json_encode(["status" => "error", "message" => "blocker_id and blocked_id are required."]);
    exit;
}

$blocker_id = intval($data->blocker_id);
$blocked_id  = intval($data->blocked_id);

if ($blocker_id === $blocked_id) {
    echo json_encode(["status" => "error", "message" => "You cannot block yourself."]);
    exit;
}

try {
    // Ensure the chat_blocks table exists
    $db->exec("CREATE TABLE IF NOT EXISTS chat_blocks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        blocker_id INT NOT NULL,
        blocked_id INT NOT NULL,
        created_at DATETIME DEFAULT NOW(),
        UNIQUE KEY unique_block (blocker_id, blocked_id)
    )");

    // Check if already blocked
    $check = $db->prepare("SELECT id FROM chat_blocks WHERE blocker_id = :blocker_id AND blocked_id = :blocked_id");
    $check->execute([':blocker_id' => $blocker_id, ':blocked_id' => $blocked_id]);
    $existing = $check->fetch();

    if ($existing) {
        // Unblock
        $stmt = $db->prepare("DELETE FROM chat_blocks WHERE blocker_id = :blocker_id AND blocked_id = :blocked_id");
        $stmt->execute([':blocker_id' => $blocker_id, ':blocked_id' => $blocked_id]);
        echo json_encode(["status" => "success", "action" => "unblocked", "message" => "User unblocked successfully."]);
    } else {
        // Block
        $stmt = $db->prepare("INSERT INTO chat_blocks (blocker_id, blocked_id) VALUES (:blocker_id, :blocked_id)");
        $stmt->execute([':blocker_id' => $blocker_id, ':blocked_id' => $blocked_id]);
        echo json_encode(["status" => "success", "action" => "blocked", "message" => "User blocked successfully."]);
    }

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
