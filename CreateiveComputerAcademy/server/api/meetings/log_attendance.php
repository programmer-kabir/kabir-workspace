<?php
// log_attendance.php - Real-Time Meeting Attendance & Peer Sync Logger
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
$peerId = !empty($data['peer_id']) ? trim($data['peer_id']) : null;

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
                peer_id = NULL,
                duration_minutes = GREATEST(1, TIMESTAMPDIFF(MINUTE, joined_at, NOW()))
            WHERE meeting_id = :mid AND user_id = :uid AND left_at IS NULL
        ");
        $closeStmt->execute([':mid' => $meetingId, ':uid' => $userId]);

        // Insert new join record
        $joinStmt = $db->prepare("
            INSERT INTO meeting_attendance_logs (meeting_id, user_id, peer_id, joined_at, last_ping, duration_minutes, created_at)
            VALUES (:mid, :uid, :peer, NOW(), NOW(), 0, NOW())
        ");
        $joinStmt->execute([
            ':mid'  => $meetingId,
            ':uid'  => $userId,
            ':peer' => $peerId
        ]);
        $logId = (int)$db->lastInsertId();

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
                    SET left_at = NOW(), peer_id = NULL, duration_minutes = :dur 
                    WHERE id = :id
                ");
                $upStmt->execute([':dur' => $durMinutes, ':id' => $logId]);
            } else {
                // ping: keep last_ping and duration refreshed
                if ($peerId) {
                    $upStmt = $db->prepare("
                        UPDATE meeting_attendance_logs 
                        SET last_ping = NOW(), peer_id = :peer, duration_minutes = :dur 
                        WHERE id = :id
                    ");
                    $upStmt->execute([':peer' => $peerId, ':dur' => $durMinutes, ':id' => $logId]);
                } else {
                    $upStmt = $db->prepare("
                        UPDATE meeting_attendance_logs 
                        SET last_ping = NOW(), duration_minutes = :dur 
                        WHERE id = :id
                    ");
                    $upStmt->execute([':dur' => $durMinutes, ':id' => $logId]);
                }
            }
        } elseif ($action === 'ping') {
            // Auto-heal session if ping arrived without prior join record
            $joinStmt = $db->prepare("
                INSERT INTO meeting_attendance_logs (meeting_id, user_id, peer_id, joined_at, last_ping, duration_minutes, created_at)
                VALUES (:mid, :uid, :peer, NOW(), NOW(), 0, NOW())
            ");
            $joinStmt->execute([
                ':mid'  => $meetingId,
                ':uid'  => $userId,
                ':peer' => $peerId
            ]);
        }
    }

    // Return current active peers in this meeting for WebRTC auto-mesh connection
    $peersStmt = $db->prepare("
        SELECT mal.user_id, mal.peer_id, u.name as user_name, u.profile_picture,
               (SELECT role FROM user_roles WHERE user_id = mal.user_id LIMIT 1) as role
        FROM meeting_attendance_logs mal
        INNER JOIN users u ON mal.user_id = u.id
        WHERE mal.meeting_id = :mid 
          AND mal.left_at IS NULL 
          AND mal.user_id != :uid 
          AND mal.peer_id IS NOT NULL 
          AND mal.peer_id != ''
          AND (mal.last_ping IS NULL OR TIMESTAMPDIFF(MINUTE, mal.last_ping, NOW()) < 3)
        GROUP BY mal.user_id, mal.peer_id
    ");
    $peersStmt->execute([':mid' => $meetingId, ':uid' => $userId]);
    $activePeers = $peersStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status"       => "success",
        "action"       => $action,
        "meeting_id"   => $meetingId,
        "room_id"      => $roomId,
        "active_peers" => $activePeers
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
