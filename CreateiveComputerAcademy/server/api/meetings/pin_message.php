<?php
// pin_message.php - Pin or Unpin In-Meeting Chat Messages
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

$roomId    = !empty($data['room_id']) ? trim($data['room_id']) : '';
$messageId = !empty($data['message_id']) ? (int)$data['message_id'] : 0;
$userId    = !empty($data['user_id']) ? (int)$data['user_id'] : 0;
$action    = !empty($data['action']) ? strtolower(trim($data['action'])) : 'pin'; // pin | unpin

if (empty($roomId) || !$messageId || !$userId) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Room ID, Message ID, and User ID are required."]);
    exit;
}

try {
    $mStmt = $db->prepare("SELECT id FROM academy_meetings WHERE room_id = :rid LIMIT 1");
    $mStmt->execute([':rid' => $roomId]);
    $meeting = $mStmt->fetch(PDO::FETCH_ASSOC);

    if (!$meeting) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Meeting not found."]);
        exit;
    }

    $meetingId = (int)$meeting['id'];

    if ($action === 'unpin') {
        $upStmt = $db->prepare("
            UPDATE meeting_messages 
            SET is_pinned = 0, pinned_by = NULL, pinned_at = NULL 
            WHERE id = :mid AND meeting_id = :mtid
        ");
        $upStmt->execute([':mid' => $messageId, ':mtid' => $meetingId]);
        $isPinned = 0;
    } else {
        $upStmt = $db->prepare("
            UPDATE meeting_messages 
            SET is_pinned = 1, pinned_by = :uid, pinned_at = NOW() 
            WHERE id = :mid AND meeting_id = :mtid
        ");
        $upStmt->execute([':uid' => $userId, ':mid' => $messageId, ':mtid' => $meetingId]);
        $isPinned = 1;
    }

    echo json_encode([
        "status"     => "success",
        "message_id" => $messageId,
        "is_pinned"  => $isPinned,
        "action"     => $action
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>