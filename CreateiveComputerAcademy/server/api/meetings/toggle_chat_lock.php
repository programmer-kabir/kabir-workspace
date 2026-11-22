<?php
// toggle_chat_lock.php - Host Chat Lock / Unlock Controller
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once 'MeetingDbHelper.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

MeetingDbHelper::ensureSchema($db);

$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput, true);
if (!is_array($data)) $data = [];

$roomId   = !empty($data['room_id']) ? trim($data['room_id']) : '';
$userId   = !empty($data['user_id']) ? (int)$data['user_id'] : 0;
$isLocked = isset($data['is_locked']) ? ((int)$data['is_locked'] ? 1 : 0) : 1;

if (empty($roomId) || !$userId) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Room ID and user ID are required."]);
    exit;
}

try {
    $mStmt = $db->prepare("SELECT id, created_by, hosts_json, is_chat_locked FROM academy_meetings WHERE room_id = :rid LIMIT 1");
    $mStmt->execute([':rid' => $roomId]);
    $meeting = $mStmt->fetch(PDO::FETCH_ASSOC);

    if (!$meeting) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Meeting not found."]);
        exit;
    }

    // Verify requester has Host/Admin authority
    $isHost = MeetingDbHelper::isUserHost($db, $meeting, $userId);
    if (!$isHost) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Only a meeting host can lock or unlock the chat."]);
        exit;
    }

    $upStmt = $db->prepare("UPDATE academy_meetings SET is_chat_locked = :lock WHERE id = :mid");
    $upStmt->execute([
        ':lock' => $isLocked,
        ':mid'  => (int)$meeting['id']
    ]);

    echo json_encode([
        "status"         => "success",
        "room_id"        => $roomId,
        "is_chat_locked" => $isLocked,
        "message"        => $isLocked ? "Chat is now locked for participants." : "Chat is now unlocked for everyone!"
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>