<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../../config/database.php';

$database = new Database();
$pdo = $database->getConnection();

// 1. Ensure table exists
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS chat_message_reactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            message_id INT NOT NULL,
            user_id INT NOT NULL,
            reaction VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_reaction (message_id, user_id),
            FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Failed to initialize reactions table: ' . $e->getMessage()]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['message_id']) || !isset($data['user_id']) || !isset($data['reaction'])) {
    echo json_encode(['status' => 'error', 'message' => 'Missing required parameters.']);
    exit;
}

$message_id = (int)$data['message_id'];
$user_id = (int)$data['user_id'];
$reaction = $data['reaction'];

try {
    // Check existing reaction
    $stmt = $pdo->prepare("SELECT id, reaction FROM chat_message_reactions WHERE message_id = ? AND user_id = ?");
    $stmt->execute([$message_id, $user_id]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        if ($existing['reaction'] === $reaction) {
            // Toggle off (delete)
            $stmt = $pdo->prepare("DELETE FROM chat_message_reactions WHERE id = ?");
            $stmt->execute([$existing['id']]);
            $action = 'removed';
        } else {
            // Update to new reaction
            $stmt = $pdo->prepare("UPDATE chat_message_reactions SET reaction = ? WHERE id = ?");
            $stmt->execute([$reaction, $existing['id']]);
            $action = 'updated';
        }
    } else {
        // Insert new reaction
        $stmt = $pdo->prepare("INSERT INTO chat_message_reactions (message_id, user_id, reaction) VALUES (?, ?, ?)");
        $stmt->execute([$message_id, $user_id, $reaction]);
        $action = 'added';
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Reaction ' . $action,
        'action' => $action,
        'reaction' => $reaction
    ]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
