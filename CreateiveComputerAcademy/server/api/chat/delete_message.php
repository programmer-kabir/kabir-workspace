<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->message_id) || !isset($data->user_id)) {
    echo json_encode(["status" => "error", "message" => "Message ID and User ID required."]);
    exit;
}

$message_id = intval($data->message_id);
$user_id = intval($data->user_id);

try {
    // Check if the user is the sender of this message
    $check_query = "SELECT sender_id FROM chat_messages WHERE id = :message_id";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->execute([':message_id' => $message_id]);
    $message = $check_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$message) {
        echo json_encode(["status" => "error", "message" => "Message not found."]);
        exit;
    }

    if (intval($message['sender_id']) !== $user_id) {
        echo json_encode(["status" => "error", "message" => "You can only delete your own messages."]);
        exit;
    }

    // Mark as deleted
    $update_query = "UPDATE chat_messages SET is_deleted = 1, deleted_at = NOW() WHERE id = :message_id";
    $update_stmt = $db->prepare($update_query);
    $update_stmt->execute([':message_id' => $message_id]);

    echo json_encode([
        "status" => "success",
        "message" => "Message deleted successfully."
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
