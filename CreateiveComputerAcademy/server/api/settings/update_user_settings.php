<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit();
}

$input = json_decode(file_get_contents("php://input"), true);
$userId = $input['user_id'] ?? null;

if (!$userId) {
    echo json_encode(["status" => "error", "message" => "User ID is required"]);
    exit();
}

$taskCreationMode = $input['task_creation_mode'] ?? 'agentic';
$themeMode = $input['theme_mode'] ?? 'system';
$language = $input['language'] ?? 'bn';
$notificationSound = isset($input['notification_sound']) ? (int)$input['notification_sound'] : 1;
$emailNotifications = isset($input['email_notifications']) ? (int)$input['email_notifications'] : 1;
$aiModel = $input['ai_model'] ?? 'gemini-1.5-pro';

try {
    // Check if record exists
    $checkStmt = $db->prepare("SELECT id FROM user_settings WHERE user_id = :user_id");
    $checkStmt->execute([':user_id' => $userId]);
    $exists = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if ($exists) {
        $updateSql = "UPDATE user_settings SET 
            task_creation_mode = :task_mode,
            theme_mode = :theme_mode,
            language = :language,
            notification_sound = :notification_sound,
            email_notifications = :email_notifications,
            ai_model = :ai_model,
            updated_at = NOW()
            WHERE user_id = :user_id";
        $stmt = $db->prepare($updateSql);
    } else {
        $insertSql = "INSERT INTO user_settings 
            (user_id, task_creation_mode, theme_mode, language, notification_sound, email_notifications, ai_model)
            VALUES 
            (:user_id, :task_mode, :theme_mode, :language, :notification_sound, :email_notifications, :ai_model)";
        $stmt = $db->prepare($insertSql);
    }

    $stmt->execute([
        ':user_id' => $userId,
        ':task_mode' => $taskCreationMode,
        ':theme_mode' => $themeMode,
        ':language' => $language,
        ':notification_sound' => $notificationSound,
        ':email_notifications' => $emailNotifications,
        ':ai_model' => $aiModel
    ]);

    echo json_encode([
        "status" => "success",
        "message" => "Settings updated successfully",
        "settings" => [
            "user_id" => $userId,
            "task_creation_mode" => $taskCreationMode,
            "theme_mode" => $themeMode,
            "language" => $language,
            "notification_sound" => $notificationSound,
            "email_notifications" => $emailNotifications,
            "ai_model" => $aiModel
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>
