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

if (!isset($data->chat_id)) {
    echo json_encode(["status" => "error", "message" => "Chat ID required."]);
    exit;
}

$chat_id = intval($data->chat_id);
$user_id = isset($data->user_id) ? intval($data->user_id) : null;

try {
    // 1. Fetch messages
    $query = "SELECT cm.id, cm.chat_id, cm.sender_id, cm.message, cm.file_path, cm.file_name, cm.created_at, cm.reply_to_id, cm.is_deleted, cm.is_edited, cm.is_forwarded,
                     u.name as sender_name, u.profile_picture as sender_profile_picture,
                     rm.message as reply_to_message, ru.name as reply_to_name, rm.file_name as reply_to_file, rm.is_deleted as reply_to_is_deleted, rm.is_edited as reply_to_is_edited
              FROM chat_messages cm
              JOIN users u ON cm.sender_id = u.id
              JOIN chat_participants cp ON cp.chat_id = cm.chat_id AND cp.user_id = :user_id
              LEFT JOIN chat_messages rm ON cm.reply_to_id = rm.id
              LEFT JOIN users ru ON rm.sender_id = ru.id
              WHERE cm.chat_id = :chat_id 
              AND (cp.status = 'active' OR (cp.status = 'removed' AND cm.created_at <= cp.removed_at))
              ORDER BY cm.id ASC";
              
    $stmt = $db->prepare($query);
    $stmt->execute([':chat_id' => $chat_id, ':user_id' => $user_id]);
    
    $messages = [];
    $max_message_id = 0;
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $row['id'] = intval($row['id']);
        $row['chat_id'] = intval($row['chat_id']);
        $row['sender_id'] = intval($row['sender_id']);
        $row['is_deleted'] = intval($row['is_deleted']);
        $row['is_edited'] = intval($row['is_edited']);
        $row['is_forwarded'] = intval($row['is_forwarded']);
        
        if ($row['is_deleted']) {
            $row['message'] = 'This message was deleted';
            $row['file_path'] = null;
            $row['file_name'] = null;
        }

        if (isset($row['reply_to_is_deleted']) && intval($row['reply_to_is_deleted'])) {
            $row['reply_to_message'] = 'This message was deleted';
            $row['reply_to_file'] = null;
        }
        
        if ($row['id'] > $max_message_id) {
            $max_message_id = $row['id'];
        }
        
        $messages[] = $row;
    }

    // 2. Mark as READ for this user for any messages where they are the recipient
    if ($user_id && count($messages) > 0) {
        $msg_ids = array_column($messages, 'id');
        $placeholders = implode(',', array_fill(0, count($msg_ids), '?'));
        
        $read_query = "UPDATE chat_message_receipts 
                          SET read_at = NOW() 
                          WHERE user_id = ? AND read_at IS NULL AND message_id IN ($placeholders)";
        $read_stmt = $db->prepare($read_query);
        $read_params = array_merge([$user_id], $msg_ids);
        $read_stmt->execute($read_params);
        
        // Also update last_read_message_id for unread badge logic
        $update_read = "UPDATE chat_participants 
                        SET last_read_message_id = :max_id 
                        WHERE chat_id = :chat_id AND user_id = :user_id";
        $up_stmt = $db->prepare($update_read);
        $up_stmt->execute([
            ':max_id' => $max_message_id,
            ':chat_id' => $chat_id,
            ':user_id' => $user_id
        ]);
    }
    
    // 3. Fetch receipts for these messages
    if (count($messages) > 0) {
        $msg_ids = array_column($messages, 'id');
        $placeholders = implode(',', array_fill(0, count($msg_ids), '?'));
        
        $receipts_query = "SELECT r.message_id, r.user_id, r.delivered_at, r.read_at, u.name 
                           FROM chat_message_receipts r
                           JOIN users u ON r.user_id = u.id
                           WHERE r.message_id IN ($placeholders)";
        $receipts_stmt = $db->prepare($receipts_query);
        $receipts_stmt->execute($msg_ids);
        
        $all_receipts = [];
        while ($row = $receipts_stmt->fetch(PDO::FETCH_ASSOC)) {
            $msg_id = intval($row['message_id']);
            if (!isset($all_receipts[$msg_id])) {
                $all_receipts[$msg_id] = [];
            }
            $all_receipts[$msg_id][] = [
                'user_id' => intval($row['user_id']),
                'name' => $row['name'],
                'delivered_at' => $row['delivered_at'],
                'read_at' => $row['read_at']
            ];
        }
        
        // Attach receipts to messages
        foreach ($messages as &$msg) {
            $msg_id = $msg['id'];
            $msg['receipts'] = isset($all_receipts[$msg_id]) ? $all_receipts[$msg_id] : [];
        }

        // 4. Fetch reactions for these messages
        $reactions_query = "SELECT r.message_id, r.user_id, r.reaction, u.name 
                            FROM chat_message_reactions r
                            JOIN users u ON r.user_id = u.id
                            WHERE r.message_id IN ($placeholders)";
        try {
            $reactions_stmt = $db->prepare($reactions_query);
            $reactions_stmt->execute($msg_ids);
            
            $all_reactions = [];
            while ($row = $reactions_stmt->fetch(PDO::FETCH_ASSOC)) {
                $msg_id = intval($row['message_id']);
                if (!isset($all_reactions[$msg_id])) {
                    $all_reactions[$msg_id] = [];
                }
                $all_reactions[$msg_id][] = [
                    'user_id' => intval($row['user_id']),
                    'name' => $row['name'],
                    'reaction' => $row['reaction']
                ];
            }
            
            foreach ($messages as &$msg) {
                $msg_id = $msg['id'];
                $msg['reactions'] = isset($all_reactions[$msg_id]) ? $all_reactions[$msg_id] : [];
            }
        } catch (PDOException $e) {
            foreach ($messages as &$msg) {
                $msg['reactions'] = [];
            }
        }
    }
    
    echo json_encode([
        "status" => "success",
        "messages" => $messages
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
