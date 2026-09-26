<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->user_id)) {
    echo json_encode(["status" => "error", "message" => "User ID required."]);
    exit;
}

$user_id = intval($data->user_id);

try {
    // 1. Update this user's last_activity to now using PHP time (Asia/Dhaka)
    $now = date('Y-m-d H:i:s');
    $update_act = $db->prepare("UPDATE users SET last_activity = :now WHERE id = :user_id");
    $update_act->execute([':now' => $now, ':user_id' => $user_id]);

    // 1.5. Mark all pending messages for this user as DELIVERED (Double Grey Tick)
    $deliver_query = "UPDATE chat_message_receipts 
                      SET delivered_at = :now 
                      WHERE user_id = :user_id AND delivered_at IS NULL";
    $deliver_stmt = $db->prepare($deliver_query);
    $deliver_stmt->execute([':now' => $now, ':user_id' => $user_id]);

    // 2. Fetch chats
    $query = "SELECT c.id, c.name, c.group_picture, c.type, c.created_by, c.created_at,
                     cp.last_read_message_id,
                     (SELECT COUNT(*) FROM chat_messages cm WHERE cm.chat_id = c.id AND (cp.last_read_message_id IS NULL OR cm.id > cp.last_read_message_id) AND (cp.status = 'active' OR (cp.status = 'removed' AND cm.created_at <= cp.removed_at))) as unread_count,
                     (SELECT cm.message FROM chat_messages cm WHERE cm.chat_id = c.id AND (cp.status = 'active' OR (cp.status = 'removed' AND cm.created_at <= cp.removed_at)) ORDER BY cm.id DESC LIMIT 1) as last_message,
                     (SELECT cm.file_path FROM chat_messages cm WHERE cm.chat_id = c.id AND (cp.status = 'active' OR (cp.status = 'removed' AND cm.created_at <= cp.removed_at)) ORDER BY cm.id DESC LIMIT 1) as last_message_file_path,
                     (SELECT cm.created_at FROM chat_messages cm WHERE cm.chat_id = c.id AND (cp.status = 'active' OR (cp.status = 'removed' AND cm.created_at <= cp.removed_at)) ORDER BY cm.id DESC LIMIT 1) as last_message_time
              FROM chat_participants cp
              JOIN chats c ON cp.chat_id = c.id
              WHERE cp.user_id = :user_id
              ORDER BY COALESCE(last_message_time, c.created_at) DESC";
              
    $stmt = $db->prepare($query);
    $stmt->execute([':user_id' => $user_id]);
    
    $chats = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $chat_id = intval($row['id']);
        
        // Fetch participants for this chat
        $part_query = "SELECT u.id, u.name, u.email, u.phone, u.profile_picture, u.last_activity,
                              ur.role as role_name, e.employee_code, cp.is_admin, cp.status, cp.removed_at
                       FROM chat_participants cp
                       JOIN users u ON cp.user_id = u.id
                       LEFT JOIN user_roles ur ON u.id = ur.user_id
                       LEFT JOIN employees e ON u.id = e.user_id
                       WHERE cp.chat_id = :chat_id";
        $part_stmt = $db->prepare($part_query);
        $part_stmt->execute([':chat_id' => $chat_id]);
        
        $participants = [];
        $is_online = false;
        $other_last_activity = null;
        while ($p = $part_stmt->fetch(PDO::FETCH_ASSOC)) {
            $p['id'] = intval($p['id']);
            
            // Check if participant is online (active within last 5 minutes = 300 seconds)
            $online = false;
            if ($p['last_activity']) {
                $last_act_ts = strtotime($p['last_activity']);
                if ((time() - $last_act_ts) <= 300) {
                    $online = true;
                }
            }
            $p['is_online'] = $online;
            $p['is_admin'] = (isset($p['is_admin']) && $p['is_admin'] == 1) ? true : false;
            
            // For direct chat, check if the other user is online and capture their last activity
            if ($p['id'] !== $user_id) {
                if ($online) {
                    $is_online = true;
                }
                $other_last_activity = $p['last_activity'];
            }
            
            $participants[] = $p;
        }
        
        $row['id'] = $chat_id;
        $row['unread_count'] = intval($row['unread_count']);
        $row['participants'] = $participants;
        $row['is_online'] = $is_online; // Flag representing if other person is online in direct chat
        $row['last_activity'] = $other_last_activity;
        
        $chats[] = $row;
    }
    
    echo json_encode([
        "status" => "success",
        "chats" => $chats
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
