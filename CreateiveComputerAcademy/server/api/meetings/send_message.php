<?php
// send_message.php - Live In-Meeting Chat Message Broadcaster & Store
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
$userName = !empty($data['user_name']) ? trim($data['user_name']) : 'Participant';
$userRole = !empty($data['user_role']) ? trim($data['user_role']) : 'Member';
$message  = !empty($data['message']) ? trim($data['message']) : '';

if (empty($roomId) || !$userId || empty($message)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Room ID, User ID, and message cannot be empty."]);
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

    $insStmt = $db->prepare("
        INSERT INTO meeting_messages (meeting_id, user_id, user_name, user_role, message, created_at)
        VALUES (:mid, :uid, :uname, :urole, :msg, NOW())
    ");
    $insStmt->execute([
        ':mid'   => $meetingId,
        ':uid'   => $userId,
        ':uname' => $userName,
        ':urole' => $userRole,
        ':msg'   => $message
    ]);

    $newId = (int)$db->lastInsertId();

    echo json_encode([
        "status"  => "success",
        "message" => [
            "id"         => $newId,
            "meeting_id" => $meetingId,
            "user_id"    => $userId,
            "user_name"  => $userName,
            "user_role"  => $userRole,
            "message"    => $message,
            "created_at" => date('Y-m-d H:i:s')
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>