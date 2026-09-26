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

$chat_id = isset($data->chat_id) ? intval($data->chat_id) : null;
$user_ids = isset($data->user_ids) && is_array($data->user_ids) ? $data->user_ids : [];
$requested_by = isset($data->requested_by) ? intval($data->requested_by) : null;

if (!$chat_id || empty($user_ids) || !$requested_by) {
    echo json_encode(["status" => "error", "message" => "Chat ID, User IDs, and Requester ID are required."]);
    exit;
}

try {
    // Check if chat is group
    $chat_check = $db->prepare("SELECT type FROM chats WHERE id = :chat_id");
    $chat_check->execute([':chat_id' => $chat_id]);
    $chat = $chat_check->fetch(PDO::FETCH_ASSOC);
    
    if (!$chat || $chat['type'] !== 'group') {
        echo json_encode(["status" => "error", "message" => "Invalid chat or not a group."]);
        exit;
    }

    // Check if requester is admin and active
    $admin_check = $db->prepare("SELECT is_admin, status FROM chat_participants WHERE chat_id = :chat_id AND user_id = :requested_by");
    $admin_check->execute([':chat_id' => $chat_id, ':requested_by' => $requested_by]);
    $admin = $admin_check->fetch(PDO::FETCH_ASSOC);
    
    if (!$admin || $admin['is_admin'] != 1 || $admin['status'] === 'removed') {
        echo json_encode(["status" => "error", "message" => "Unauthorized. Only active admins can add members."]);
        exit;
    }

    $db->beginTransaction();
    $added_count = 0;
    
    // Get admin name
    $admin_name_stmt = $db->prepare("SELECT name FROM users WHERE id = :requested_by");
    $admin_name_stmt->execute([':requested_by' => $requested_by]);
    $admin_name = $admin_name_stmt->fetchColumn() ?: 'Admin';

    // Get added user names
    if (!empty($user_ids)) {
        $in_placeholders = str_repeat('?,', count($user_ids) - 1) . '?';
        $names_stmt = $db->prepare("SELECT id, name FROM users WHERE id IN ($in_placeholders)");
        $names_stmt->execute($user_ids);
        $added_names = [];
        while($r = $names_stmt->fetch(PDO::FETCH_ASSOC)) { $added_names[$r['id']] = $r['name']; }
    }

    $stmt = $db->prepare("INSERT INTO chat_participants (chat_id, user_id, joined_at, is_admin, status) 
                          VALUES (:chat_id, :user_id, NOW(), 0, 'active') 
                          ON DUPLICATE KEY UPDATE status = 'active', removed_at = NULL");

    foreach ($user_ids as $uid) {
        $stmt->execute([
            ':chat_id' => $chat_id,
            ':user_id' => intval($uid)
        ]);
        if ($stmt->rowCount() > 0) {
            $added_count++;
            // Insert system message
            $target_name = $added_names[$uid] ?? 'User';
            $sys_msg = $db->prepare("INSERT INTO chat_messages (chat_id, sender_id, message) VALUES (:chat_id, :admin_id, :msg)");
            $sys_msg->execute([':chat_id' => $chat_id, ':admin_id' => $requested_by, ':msg' => "__SYSTEM__:" . $admin_name . " added " . $target_name]);
        }
    }

    $db->commit();
    echo json_encode(["status" => "success", "message" => "$added_count members added successfully."]);
} catch (PDOException $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
