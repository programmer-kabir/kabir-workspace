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

if (!isset($data->chat_id) || !isset($data->user_id)) {
    echo json_encode(["status" => "error", "message" => "Chat ID and User ID required."]);
    exit;
}

$chat_id = intval($data->chat_id);
$user_id = intval($data->user_id);

try {
    // Get max message ID in this chat
    $max_stmt = $db->prepare("SELECT MAX(id) as max_id FROM chat_messages WHERE chat_id = :chat_id");
    $max_stmt->execute([':chat_id' => $chat_id]);
    $max_row = $max_stmt->fetch(PDO::FETCH_ASSOC);
    $max_id = $max_row['max_id'] ? intval($max_row['max_id']) : null;
    
    if ($max_id) {
        $update_read = "UPDATE chat_participants 
                        SET last_read_message_id = :max_id 
                        WHERE chat_id = :chat_id AND user_id = :user_id";
        $up_stmt = $db->prepare($update_read);
        $up_stmt->execute([
            ':max_id' => $max_id,
            ':chat_id' => $chat_id,
            ':user_id' => $user_id
        ]);
        
        $update_receipts = "UPDATE chat_message_receipts r
                            JOIN chat_messages m ON r.message_id = m.id
                            SET r.read_at = NOW() 
                            WHERE m.chat_id = :chat_id 
                              AND r.user_id = :user_id 
                              AND r.read_at IS NULL";
        $rec_stmt = $db->prepare($update_receipts);
        $rec_stmt->execute([
            ':chat_id' => $chat_id,
            ':user_id' => $user_id
        ]);
    }
    
    echo json_encode(["status" => "success", "message" => "Chat marked as read."]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
