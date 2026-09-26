<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->chat_id) || !isset($data->user_id)) {
    echo json_encode(["status" => "error", "message" => "chat_id and user_id are required."]);
    exit;
}

$chat_id = intval($data->chat_id);
$user_id = intval($data->user_id);

try {
    // Verify the user is a participant of this chat
    $check = $db->prepare("SELECT id FROM chat_participants WHERE chat_id = :chat_id AND user_id = :user_id AND status != 'removed'");
    $check->execute([':chat_id' => $chat_id, ':user_id' => $user_id]);
    if (!$check->fetch()) {
        echo json_encode(["status" => "error", "message" => "You are not a participant of this chat."]);
        exit;
    }

    // Soft-delete all messages in this chat for this user
    // We mark them deleted only if sender is the user, else we use a hidden-for table approach.
    // Simple approach: delete all messages where sender = this user in this chat
    $stmt = $db->prepare("UPDATE chat_messages SET is_deleted = 1, deleted_at = NOW() WHERE chat_id = :chat_id AND sender_id = :user_id AND is_deleted = 0");
    $stmt->execute([':chat_id' => $chat_id, ':user_id' => $user_id]);

    echo json_encode([
        "status" => "success",
        "message" => "Chat cleared successfully.",
        "deleted_count" => $stmt->rowCount()
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
