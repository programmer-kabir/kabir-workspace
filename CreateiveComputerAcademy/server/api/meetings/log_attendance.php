<?php
// log_attendance.php - Real-Time Meeting Join/Leave Attendance Logger
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
$userId = !empty($data['user_id']) ? (int)$data['user_id'] : 0;
$action = !empty($data['action']) ? strtolower(trim($data['action'])) : 'join'; // join | leave | ping

if (empty($roomId) || !$userId) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Room ID and User ID are required."]);
    exit;
}

try {
    // Resolve meeting ID
    $mStmt = $db->prepare("SELECT id, status, title FROM academy_meetings WHERE room_id = :rid LIMIT 1");
    $mStmt->execute([':rid' => $roomId]);
    $meeting = $mStmt->fetch(PDO::FETCH_ASSOC);

    if (!$meeting) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Meeting room not found."]);
        exit;
    }

    $meetingId = (int)$meeting['id'];

    if ($action === 'join') {
        // Close any prior orphaned sessions for this user in this meeting
        $closeStmt = $db->prepare("
            UPDATE meeting_attendance_logs 
            SET left_at = NOW(), 
                duration_minutes = GREATEST(1, TIMESTAMPDIFF(MINUTE, joined_at, NOW()))
            WHERE meeting_id = :mid AND user_id = :uid AND left_at IS NULL
        ");
        $closeStmt->execute([':mid' => $meetingId, ':uid' => $userId]);

        // Insert new join record
        $joinStmt = $db->prepare("
            INSERT INTO meeting_attendance_logs (meeting_id, user_id, joined_at, duration_minutes, created_at)
            VALUES (:mid, :uid, NOW(), 0, NOW())
        ");
        $joinStmt->execute([':mid' => $meetingId, ':uid' => $userId]);
        $logId = (int)$db->lastInsertId();

        echo json_encode([
            "status"     => "success",
            "action"     => "join",
            "log_id"     => $logId,
            "meeting_id" => $meetingId,
            "joined_at"  => date('Y-m-d H:i:s')
        ]);

    } elseif ($action === 'leave' || $action === 'ping') {
        $findStmt = $db->prepare("
            SELECT id, joined_at 
            FROM meeting_attendance_logs 
            WHERE meeting_id = :mid AND user_id = :uid AND left_at IS NULL 
            ORDER BY id DESC LIMIT 1
        ");
        $findStmt->execute([':mid' => $meetingId, ':uid' => $userId]);
        $activeLog = $findStmt->fetch(PDO::FETCH_ASSOC);

        if ($activeLog) {
            $logId = (int)$activeLog['id'];
            $joinedTs = strtotime($activeLog['joined_at']);
            $nowTs = time();
            $durMinutes = max(1, round(abs($nowTs - $joinedTs) / 60));

            if ($action === 'leave') {
                $upStmt = $db->prepare("
                    UPDATE meeting_attendance_logs 
                    SET left_at = NOW(), duration_minutes = :dur 
                    WHERE id = :id
                ");
                $upStmt->execute([':dur' => $durMinutes, ':id' => $logId]);
            } else {
                // ping: just keep duration refreshed
                $upStmt = $db->prepare("UPDATE meeting_attendance_logs SET duration_minutes = :dur WHERE id = :id");
                $upStmt->execute([':dur' => $durMinutes, ':id' => $logId]);
            }

            echo json_encode([
                "status"           => "success",
                "action"           => $action,
                "duration_minutes" => $durMinutes
            ]);
        } else {
            echo json_encode([
                "status"  => "success",
                "message" => "No active join record found."
            ]);
        }
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
