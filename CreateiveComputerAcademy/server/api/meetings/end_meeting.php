<?php
// end_meeting.php - End Meeting by Host
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

$roomId = !empty($data['room_id']) ? trim($data['room_id']) : '';
$userId = !empty($data['user_id']) ? (int)$data['user_id'] : (isset($data['admin_id']) ? (int)$data['admin_id'] : 0);

if (empty($roomId)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Room ID is required."]);
    exit;
}

try {
    $mStmt = $db->prepare("SELECT id, created_by, status FROM academy_meetings WHERE room_id = :rid LIMIT 1");
    $mStmt->execute([':rid' => $roomId]);
    $meeting = $mStmt->fetch(PDO::FETCH_ASSOC);

    if (!$meeting) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Meeting not found."]);
        exit;
    }

    $meetingId = (int)$meeting['id'];

    // Update meeting status to ended
    $endStmt = $db->prepare("
        UPDATE academy_meetings 
        SET status = 'ended', actual_end = NOW() 
        WHERE id = :id
    ");
    $endStmt->execute([':id' => $meetingId]);

    // Close all open attendee logs
    $closeAll = $db->prepare("
        UPDATE meeting_attendance_logs 
        SET left_at = NOW(), 
            duration_minutes = GREATEST(1, TIMESTAMPDIFF(MINUTE, joined_at, NOW()))
        WHERE meeting_id = :mid AND left_at IS NULL
    ");
    $closeAll->execute([':mid' => $meetingId]);

    echo json_encode([
        "status"     => "success",
        "message"    => "Meeting has ended successfully.",
        "meeting_id" => $meetingId,
        "room_id"    => $roomId
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
