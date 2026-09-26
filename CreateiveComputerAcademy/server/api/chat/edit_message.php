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

if (!isset($data->message_id) || !isset($data->user_id) || !isset($data->message)) {
    echo json_encode(["status" => "error", "message" => "Message ID, User ID and Message content required."]);
    exit;
}

$message_id = intval($data->message_id);
$user_id = intval($data->user_id);
$new_message = trim($data->message);

if (empty($new_message)) {
    echo json_encode(["status" => "error", "message" => "Message content cannot be empty."]);
    exit;
}

try {
    // Check if the user is the sender of this message and it's not deleted
    $check_query = "SELECT sender_id, is_deleted FROM chat_messages WHERE id = :message_id";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->execute([':message_id' => $message_id]);
    $message = $check_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$message) {
        echo json_encode(["status" => "error", "message" => "Message not found."]);
        exit;
    }

    if (intval($message['is_deleted']) === 1) {
        echo json_encode(["status" => "error", "message" => "Cannot edit a deleted message."]);
        exit;
    }

    if (intval($message['sender_id']) !== $user_id) {
        echo json_encode(["status" => "error", "message" => "You can only edit your own messages."]);
        exit;
    }

    // Update message and mark as edited
    $update_query = "UPDATE chat_messages SET message = :message, is_edited = 1 WHERE id = :message_id";
    $update_stmt = $db->prepare($update_query);
    $update_stmt->execute([
        ':message' => $new_message,
        ':message_id' => $message_id
    ]);

    echo json_encode([
        "status" => "success",
        "message" => "Message updated successfully."
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
