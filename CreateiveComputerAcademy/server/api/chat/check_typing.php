<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

if (!isset($_GET['chat_id']) || !isset($_GET['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Chat ID and User ID required."]);
    exit;
}

$chat_id = intval($_GET['chat_id']);
$user_id = intval($_GET['user_id']); // Exclude the current user

try {
    // Check if requester is removed
    $check_req = $db->prepare("SELECT status FROM chat_participants WHERE chat_id = :chat_id AND user_id = :user_id");
    $check_req->execute([':chat_id' => $chat_id, ':user_id' => $user_id]);
    $req = $check_req->fetch(PDO::FETCH_ASSOC);
    if (!$req || $req['status'] === 'removed') {
        echo json_encode(["status" => "success", "typing_users" => []]);
        exit;
    }

    // Fetch users who typed in the last 3 seconds in this chat (excluding the current user and removed users)
    // 3 seconds is ideal for a 1-second polling interval
    $query = "SELECT u.id, u.name 
              FROM chat_participants cp
              JOIN users u ON cp.user_id = u.id
              WHERE cp.chat_id = :chat_id 
              AND cp.user_id != :user_id 
              AND cp.status != 'removed'
              AND cp.last_typed_at >= DATE_SUB(NOW(), INTERVAL 3 SECOND)";
              
    $stmt = $db->prepare($query);
    $stmt->execute([
        ':chat_id' => $chat_id,
        ':user_id' => $user_id
    ]);

    $typing_users = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $typing_users[] = $row;
    }

    echo json_encode([
        "status" => "success",
        "typing_users" => $typing_users
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
