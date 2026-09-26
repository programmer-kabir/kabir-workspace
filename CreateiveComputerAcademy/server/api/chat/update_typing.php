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
    // Update last_typed_at to current timestamp
    $query = "UPDATE chat_participants SET last_typed_at = NOW() WHERE chat_id = :chat_id AND user_id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->execute([
        ':chat_id' => $chat_id,
        ':user_id' => $user_id
    ]);

    echo json_encode([
        "status" => "success"
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
