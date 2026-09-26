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

if (!isset($data->type) || !isset($data->participant_ids) || !is_array($data->participant_ids) || count($data->participant_ids) < 1) {
    echo json_encode(["status" => "error", "message" => "Missing required parameters."]);
    exit;
}

$type = $data->type;
$participant_ids = array_map('intval', $data->participant_ids);
$creator_id = isset($data->created_by) ? intval($data->created_by) : null;
$name = isset($data->name) ? trim($data->name) : null;

try {
    $db->beginTransaction();

    if ($type === 'direct') {
        // Direct chat must have exactly 2 participants
        if (count($participant_ids) < 2) {
            echo json_encode(["status" => "error", "message" => "Direct chat requires at least 2 participants."]);
            $db->rollBack();
            exit;
        }

        $user_1 = $participant_ids[0];
        $user_2 = $participant_ids[1];

        // Check if direct chat already exists
        $check_query = "SELECT cp1.chat_id FROM chat_participants cp1
                        JOIN chat_participants cp2 ON cp1.chat_id = cp2.chat_id
                        JOIN chats c ON cp1.chat_id = c.id
                        WHERE c.type = 'direct' AND cp1.user_id = :user_1 AND cp2.user_id = :user_2
                        LIMIT 1";
        $check_stmt = $db->prepare($check_query);
        $check_stmt->execute([':user_1' => $user_1, ':user_2' => $user_2]);

        if ($check_stmt->rowCount() > 0) {
            $existing_chat = $check_stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode([
                "status" => "success",
                "message" => "Chat already exists.",
                "chat_id" => intval($existing_chat['chat_id'])
            ]);
            $db->rollBack();
            exit;
        }
    }

    // Insert new chat
    $chat_query = "INSERT INTO chats (name, type, created_by) VALUES (:name, :type, :created_by)";
    $chat_stmt = $db->prepare($chat_query);
    $chat_stmt->execute([
        ':name' => $name,
        ':type' => $type,
        ':created_by' => $creator_id
    ]);
    
    $chat_id = intval($db->lastInsertId());

    // Insert participants
    $part_query = "INSERT INTO chat_participants (chat_id, user_id, is_admin) VALUES (:chat_id, :user_id, :is_admin)";
    $part_stmt = $db->prepare($part_query);

    foreach ($participant_ids as $uid) {
        $is_admin = ($type === 'group' && $uid == $creator_id) ? 1 : 0;
        $part_stmt->execute([
            ':chat_id' => $chat_id,
            ':user_id' => $uid,
            ':is_admin' => $is_admin
        ]);
    }

    $db->commit();
    echo json_encode([
        "status" => "success",
        "message" => "Chat created successfully.",
        "chat_id" => $chat_id
    ]);

} catch (PDOException $e) {
    $db->rollBack();
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
