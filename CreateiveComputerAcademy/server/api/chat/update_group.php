<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$chat_id = null;
$user_id = null;
$name = null;
$group_picture = null;

// Handle both JSON and FormData
if (!empty($_POST)) {
    $chat_id = isset($_POST['chat_id']) ? intval($_POST['chat_id']) : null;
    $user_id = isset($_POST['user_id']) ? intval($_POST['user_id']) : null;
    $name = isset($_POST['name']) ? trim($_POST['name']) : null;
} else {
    $data = json_decode(file_get_contents("php://input"));
    if ($data) {
        $chat_id = isset($data->chat_id) ? intval($data->chat_id) : null;
        $user_id = isset($data->user_id) ? intval($data->user_id) : null;
        $name = isset($data->name) ? trim($data->name) : null;
        $group_picture = isset($data->group_picture) ? trim($data->group_picture) : null;
    }
}

if (!$chat_id || !$user_id) {
    echo json_encode(["status" => "error", "message" => "Missing required parameters."]);
    exit;
}

// Handle file upload
if (isset($_FILES['file'])) {
    $file = $_FILES['file'];
    $file_ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowed_extensions = ['jpg', 'jpeg', 'png', 'gif'];
    
    if (in_array($file_ext, $allowed_extensions)) {
        $upload_dir = '../../uploads/chat_profiles/';
        if (!file_exists($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }
        
        $new_filename = uniqid('group_', true) . '.' . $file_ext;
        $target_file = $upload_dir . $new_filename;
        
        if (move_uploaded_file($file['tmp_name'], $target_file)) {
            $group_picture = 'uploads/chat_profiles/' . $new_filename;
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to upload file."]);
            exit;
        }
    } else {
        echo json_encode(["status" => "error", "message" => "File type not allowed (only jpg, jpeg, png, gif)."]);
        exit;
    }
}

try {
    // Check if user is admin
    $admin_check = $db->prepare("SELECT is_admin, status FROM chat_participants WHERE chat_id = :chat_id AND user_id = :user_id LIMIT 1");
    $admin_check->execute([':chat_id' => $chat_id, ':user_id' => $user_id]);
    
    if ($admin_check->rowCount() === 0) {
        echo json_encode(["status" => "error", "message" => "You are not a participant in this chat."]);
        exit;
    }
    
    $row = $admin_check->fetch(PDO::FETCH_ASSOC);
    if ($row['is_admin'] != 1 || $row['status'] === 'removed') {
        echo json_encode(["status" => "error", "message" => "Only active group admins can update group info."]);
        exit;
    }
    
    // Update fields conditionally
    if ($name !== null && $group_picture !== null) {
        $update = $db->prepare("UPDATE chats SET name = :name, group_picture = :pic WHERE id = :chat_id");
        $update->execute([':name' => $name, ':pic' => $group_picture, ':chat_id' => $chat_id]);
    } else if ($name !== null) {
        $update = $db->prepare("UPDATE chats SET name = :name WHERE id = :chat_id");
        $update->execute([':name' => $name, ':chat_id' => $chat_id]);
    } else if ($group_picture !== null) {
        $update = $db->prepare("UPDATE chats SET group_picture = :pic WHERE id = :chat_id");
        $update->execute([':pic' => $group_picture, ':chat_id' => $chat_id]);
    }

    // Insert system message about update
    $admin_name_stmt = $db->prepare("SELECT name FROM users WHERE id = :user_id");
    $admin_name_stmt->execute([':user_id' => $user_id]);
    $admin_name = $admin_name_stmt->fetchColumn() ?: 'Admin';
    
    $msg_text = "";
    if ($name !== null && $group_picture !== null) $msg_text = "__SYSTEM__:" . $admin_name . " updated the group info";
    else if ($name !== null) $msg_text = "__SYSTEM__:" . $admin_name . " changed the group name to '" . $name . "'";
    else if ($group_picture !== null) $msg_text = "__SYSTEM__:" . $admin_name . " updated the group picture";

    if ($msg_text !== "") {
        $sys_msg = $db->prepare("INSERT INTO chat_messages (chat_id, sender_id, message) VALUES (:chat_id, :admin_id, :msg)");
        $sys_msg->execute([':chat_id' => $chat_id, ':admin_id' => $user_id, ':msg' => $msg_text]);
    }

    echo json_encode(["status" => "success", "message" => "Group updated successfully.", "group_picture" => $group_picture]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
