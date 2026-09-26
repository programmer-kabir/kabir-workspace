<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $results = [];

    // 1. Add group_picture to chats
    $check_pic = $db->query("SHOW COLUMNS FROM chats LIKE 'group_picture'");
    if ($check_pic->rowCount() == 0) {
        $db->exec("ALTER TABLE chats ADD COLUMN group_picture VARCHAR(255) NULL DEFAULT NULL AFTER name");
        $results[] = "Added group_picture to chats table.";
    } else {
        $results[] = "group_picture already exists in chats table.";
    }

    // 2. Add is_admin to chat_participants
    $check_admin = $db->query("SHOW COLUMNS FROM chat_participants LIKE 'is_admin'");
    if ($check_admin->rowCount() == 0) {
        $db->exec("ALTER TABLE chat_participants ADD COLUMN is_admin TINYINT(1) NOT NULL DEFAULT 0 AFTER user_id");
        $results[] = "Added is_admin to chat_participants table.";
        
        // Make the creator of the chat the admin
        $db->exec("UPDATE chat_participants cp JOIN chats c ON cp.chat_id = c.id SET cp.is_admin = 1 WHERE cp.user_id = c.created_by AND c.type = 'group'");
        $results[] = "Assigned admin roles to existing group creators.";
    } else {
        $results[] = "is_admin already exists in chat_participants table.";
    }

    // 3. Add status to chat_participants
    $check_status = $db->query("SHOW COLUMNS FROM chat_participants LIKE 'status'");
    if ($check_status->rowCount() == 0) {
        $db->exec("ALTER TABLE chat_participants ADD COLUMN status ENUM('active', 'removed') NOT NULL DEFAULT 'active' AFTER is_admin");
        $results[] = "Added status to chat_participants table.";
    }

    // 4. Add removed_at to chat_participants
    $check_removed = $db->query("SHOW COLUMNS FROM chat_participants LIKE 'removed_at'");
    if ($check_removed->rowCount() == 0) {
        $db->exec("ALTER TABLE chat_participants ADD COLUMN removed_at DATETIME NULL DEFAULT NULL AFTER status");
        $results[] = "Added removed_at to chat_participants table.";
    }

    echo json_encode(["status" => "success", "messages" => $results]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
