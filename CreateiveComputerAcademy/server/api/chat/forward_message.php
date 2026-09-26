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

if (!isset($data->message_id) || !isset($data->sender_id)) {
    echo json_encode(["status" => "error", "message" => "Message ID and Sender ID required."]);
    exit;
}

$message_id = intval($data->message_id);
$sender_id = intval($data->sender_id);
$target_users = isset($data->target_users) ? $data->target_users : [];
$target_chats = isset($data->target_chats) ? $data->target_chats : [];

if (empty($target_users) && empty($target_chats)) {
    echo json_encode(["status" => "error", "message" => "No targets specified."]);
    exit;
}

try {
    $db->beginTransaction();

    // 1. Fetch original message
    $q_msg = "SELECT message, file_path, file_name FROM chat_messages WHERE id = :id";
    $stmt_msg = $db->prepare($q_msg);
    $stmt_msg->execute([':id' => $message_id]);
    $original_message = $stmt_msg->fetch(PDO::FETCH_ASSOC);

    if (!$original_message) {
        throw new Exception("Original message not found.");
    }

    $final_chat_ids = [];

    // 2. Add existing target chats
    foreach ($target_chats as $cid) {
        $final_chat_ids[] = intval($cid);
    }

    // 3. Resolve direct chats for target users
    foreach ($target_users as $target_uid) {
        $target_uid = intval($target_uid);
        if ($target_uid === $sender_id) continue;

        // Check if direct chat exists
        $q_check = "SELECT c.id 
                    FROM chats c
                    JOIN chat_participants cp1 ON c.id = cp1.chat_id
                    JOIN chat_participants cp2 ON c.id = cp2.chat_id
                    WHERE c.type = 'direct' 
                    AND cp1.user_id = :u1 AND cp2.user_id = :u2
                    LIMIT 1";
        $stmt_check = $db->prepare($q_check);
        $stmt_check->execute([':u1' => $sender_id, ':u2' => $target_uid]);
        
        if ($stmt_check->rowCount() > 0) {
            $existing_chat = $stmt_check->fetch(PDO::FETCH_ASSOC);
            $final_chat_ids[] = $existing_chat['id'];
        } else {
            // Create new direct chat
            $q_create = "INSERT INTO chats (type, created_by) VALUES ('direct', :created_by)";
            $stmt_create = $db->prepare($q_create);
            $stmt_create->execute([':created_by' => $sender_id]);
            $new_chat_id = $db->lastInsertId();

            // Add participants
            $q_part = "INSERT INTO chat_participants (chat_id, user_id) VALUES (:chat_id, :uid)";
            $stmt_part = $db->prepare($q_part);
            $stmt_part->execute([':chat_id' => $new_chat_id, ':uid' => $sender_id]);
            $stmt_part->execute([':chat_id' => $new_chat_id, ':uid' => $target_uid]);

            $final_chat_ids[] = $new_chat_id;
        }
    }

    $final_chat_ids = array_unique($final_chat_ids);

    // 4. Insert message into all target chats
    $q_insert = "INSERT INTO chat_messages (chat_id, sender_id, message, file_path, file_name, is_forwarded) 
                 VALUES (:chat_id, :sender_id, :message, :file_path, :file_name, 1)";
    $stmt_insert = $db->prepare($q_insert);

    foreach ($final_chat_ids as $cid) {
        $stmt_insert->execute([
            ':chat_id' => $cid,
            ':sender_id' => $sender_id,
            ':message' => $original_message['message'],
            ':file_path' => $original_message['file_path'],
            ':file_name' => $original_message['file_name']
        ]);
        $new_msg_id = $db->lastInsertId();

        // Add receipt for sender (delivered+read instantly)
        $q_rec = "INSERT INTO chat_message_receipts (message_id, user_id, delivered_at, read_at) 
                  VALUES (:msg_id, :uid, NOW(), NOW())";
        $stmt_rec = $db->prepare($q_rec);
        $stmt_rec->execute([':msg_id' => $new_msg_id, ':uid' => $sender_id]);
    }

    $db->commit();

    echo json_encode([
        "status" => "success",
        "message" => "Message forwarded successfully to " . count($final_chat_ids) . " chats."
    ]);

} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
