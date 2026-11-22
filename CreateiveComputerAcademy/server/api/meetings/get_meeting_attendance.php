<?php
// get_meeting_attendance.php - Fetch Attendance Breakdown for a Meeting
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once 'MeetingDbHelper.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

MeetingDbHelper::ensureSchema($db);

$meetingId = isset($_GET['meeting_id']) ? (int)$_GET['meeting_id'] : 0;
$roomId = isset($_GET['room_id']) ? trim($_GET['room_id']) : '';

if (!$meetingId && empty($roomId)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Meeting ID or Room ID required."]);
    exit;
}

try {
    if (!$meetingId && !empty($roomId)) {
        $mStmt = $db->prepare("SELECT id FROM academy_meetings WHERE room_id = :rid LIMIT 1");
        $mStmt->execute([':rid' => $roomId]);
        $meetingId = (int)$mStmt->fetchColumn();
    }

    $sql = "
        SELECT 
            l.id,
            l.meeting_id,
            l.user_id,
            u.name AS user_name,
            u.email,
            u.profile_picture,
            e.designation,
            l.joined_at,
            l.left_at,
            l.duration_minutes
        FROM meeting_attendance_logs l
        LEFT JOIN users u ON l.user_id = u.id
        LEFT JOIN employees e ON u.id = e.user_id
        WHERE l.meeting_id = :mid
        ORDER BY l.joined_at ASC
    ";

    $stmt = $db->prepare($sql);
    $stmt->execute([':mid' => $meetingId]);
    $attendees = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status"     => "success",
        "meeting_id" => $meetingId,
        "total"      => count($attendees),
        "attendees"  => $attendees
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
