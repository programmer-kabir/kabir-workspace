<?php
// get_messages.php - Fetch In-Meeting Chat Messages
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once 'MeetingDbHelper.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

MeetingDbHelper::ensureSchema($db);

$roomId  = !empty($_GET['room_id']) ? trim($_GET['room_id']) : '';
$afterId = !empty($_GET['after_id']) ? (int)$_GET['after_id'] : 0;

if (empty($roomId)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Room ID is required."]);
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

    if ($afterId > 0) {
        $stmt = $db->prepare("
            SELECT mm.id, mm.meeting_id, mm.user_id, mm.user_name, mm.user_role, mm.message, mm.created_at,
                   u.profile_picture
            FROM meeting_messages mm
            LEFT JOIN users u ON mm.user_id = u.id
            WHERE mm.meeting_id = :mid AND mm.id > :aid
            ORDER BY mm.id ASC
        ");
        $stmt->execute([':mid' => $meetingId, ':aid' => $afterId]);
    } else {
        $stmt = $db->prepare("
            SELECT mm.id, mm.meeting_id, mm.user_id, mm.user_name, mm.user_role, mm.message, mm.created_at,
                   u.profile_picture
            FROM meeting_messages mm
            LEFT JOIN users u ON mm.user_id = u.id
            WHERE mm.meeting_id = :mid
            ORDER BY mm.id ASC
            LIMIT 200
        ");
        $stmt->execute([':mid' => $meetingId]);
    }

    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status"   => "success",
        "messages" => $messages
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>