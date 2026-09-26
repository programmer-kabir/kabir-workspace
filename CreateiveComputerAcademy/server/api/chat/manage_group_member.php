<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->chat_id) || !isset($data->admin_id) || !isset($data->target_user_id) || !isset($data->action)) {
    echo json_encode(["status" => "error", "message" => "Missing required parameters."]);
    exit;
}

$chat_id = intval($data->chat_id);
$admin_id = intval($data->admin_id);
$target_user_id = intval($data->target_user_id);
$action = $data->action; // 'add', 'remove', 'make_admin', 'remove_admin'

try {
    // 1. Verify that admin_id is actually an admin for this group
    $admin_check = $db->prepare("SELECT is_admin FROM chat_participants WHERE chat_id = :chat_id AND user_id = :admin_id LIMIT 1");
    $admin_check->execute([':chat_id' => $chat_id, ':admin_id' => $admin_id]);
    
    if ($admin_check->rowCount() === 0) {
        echo json_encode(["status" => "error", "message" => "You are not a participant in this chat."]);
        exit;
    }
    
    $row = $admin_check->fetch(PDO::FETCH_ASSOC);
    // Allow 'remove' if target_user_id == admin_id (User is leaving the group themselves)
    if ($row['is_admin'] != 1 && !($action === 'remove' && $admin_id === $target_user_id)) {
        echo json_encode(["status" => "error", "message" => "Only group admins can perform this action."]);
        exit;
    }
    // Get names for system messages
    $names_stmt = $db->prepare("SELECT id, name FROM users WHERE id IN (:admin_id, :target_user_id)");
    $names_stmt->execute([':admin_id' => $admin_id, ':target_user_id' => $target_user_id]);
    $user_names = [];
    while($r = $names_stmt->fetch(PDO::FETCH_ASSOC)) { $user_names[$r['id']] = $r['name']; }
    $admin_name = $user_names[$admin_id] ?? 'Admin';
    $target_name = $user_names[$target_user_id] ?? 'User';

    // 2. Perform the requested action
    if ($action === 'add') {
        // Check if user is already in group
        $check = $db->prepare("SELECT * FROM chat_participants WHERE chat_id = :chat_id AND user_id = :uid");
        $check->execute([':chat_id' => $chat_id, ':uid' => $target_user_id]);
        if ($check->rowCount() > 0) {
            echo json_encode(["status" => "error", "message" => "User is already in the group."]);
            exit;
        }
        $insert = $db->prepare("INSERT INTO chat_participants (chat_id, user_id, is_admin) VALUES (:chat_id, :uid, 0)");
        $insert->execute([':chat_id' => $chat_id, ':uid' => $target_user_id]);
        
        $sys_msg = $db->prepare("INSERT INTO chat_messages (chat_id, sender_id, message) VALUES (:chat_id, :admin_id, :msg)");
        $sys_msg->execute([':chat_id' => $chat_id, ':admin_id' => $admin_id, ':msg' => "__SYSTEM__:" . $admin_name . " added " . $target_name]);

        echo json_encode(["status" => "success", "message" => "User added to group."]);
        
    } else if ($action === 'remove') {
        $now = date('Y-m-d H:i:s');
        $delete = $db->prepare("UPDATE chat_participants SET status = 'removed', removed_at = :now, is_admin = 0 WHERE chat_id = :chat_id AND user_id = :uid");
        $delete->execute([':now' => $now, ':chat_id' => $chat_id, ':uid' => $target_user_id]);
        
        $sys_msg = $db->prepare("INSERT INTO chat_messages (chat_id, sender_id, message) VALUES (:chat_id, :admin_id, :msg)");
        $sys_msg->execute([':chat_id' => $chat_id, ':admin_id' => $admin_id, ':msg' => "__SYSTEM__:" . ($admin_id == $target_user_id ? $target_name . " left the group" : $admin_name . " removed " . $target_name)]);

        echo json_encode(["status" => "success", "message" => "User removed from group."]);
        
    } else if ($action === 'make_admin') {
        $update = $db->prepare("UPDATE chat_participants SET is_admin = 1 WHERE chat_id = :chat_id AND user_id = :uid");
        $update->execute([':chat_id' => $chat_id, ':uid' => $target_user_id]);
        echo json_encode(["status" => "success", "message" => "User is now an admin."]);
        
    } else if ($action === 'remove_admin') {
        // Prevent removing self as admin if it's the last admin? Not checking for now.
        $update = $db->prepare("UPDATE chat_participants SET is_admin = 0 WHERE chat_id = :chat_id AND user_id = :uid");
        $update->execute([':chat_id' => $chat_id, ':uid' => $target_user_id]);
        echo json_encode(["status" => "success", "message" => "User is no longer an admin."]);
        
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid action."]);
    }

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
