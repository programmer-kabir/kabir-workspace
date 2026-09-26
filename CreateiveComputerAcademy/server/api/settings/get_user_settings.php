<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit();
}

// Auto-ensure user_settings table exists
$createTableQuery = "CREATE TABLE IF NOT EXISTS `user_settings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL UNIQUE,
    `task_creation_mode` ENUM('agentic', 'manual') DEFAULT 'agentic',
    `theme_mode` ENUM('light', 'dark', 'system') DEFAULT 'system',
    `language` ENUM('bn', 'en') DEFAULT 'bn',
    `notification_sound` TINYINT(1) DEFAULT 1,
    `email_notifications` TINYINT(1) DEFAULT 1,
    `ai_model` VARCHAR(50) DEFAULT 'gemini-1.5-pro',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

try {
    $db->exec($createTableQuery);
} catch (Exception $e) {
    // Ignore if exists
}

$input = json_decode(file_get_contents("php://input"), true);
$userId = $input['user_id'] ?? $_GET['user_id'] ?? null;

if (!$userId) {
    echo json_encode(["status" => "error", "message" => "User ID is required"]);
    exit();
}

try {
    $stmt = $db->prepare("SELECT * FROM user_settings WHERE user_id = :user_id LIMIT 1");
    $stmt->execute([':user_id' => $userId]);
    $settings = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$settings) {
        // Create default settings row for this user
        $insertStmt = $db->prepare("INSERT INTO user_settings (user_id, task_creation_mode, theme_mode, language) VALUES (:user_id, 'agentic', 'system', 'bn')");
        $insertStmt->execute([':user_id' => $userId]);

        $settings = [
            'user_id' => $userId,
            'task_creation_mode' => 'agentic',
            'theme_mode' => 'system',
            'language' => 'bn',
            'notification_sound' => 1,
            'email_notifications' => 1,
            'ai_model' => 'gemini-1.5-pro'
        ];
    }

    echo json_encode([
        "status" => "success",
        "settings" => $settings
    ]);
} catch (PDOException $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>
