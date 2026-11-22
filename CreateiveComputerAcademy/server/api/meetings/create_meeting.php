<?php
// create_meeting.php - Create an Instant or Scheduled Meeting
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../notifications/notification_helper.php';
require_once 'MeetingDbHelper.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

MeetingDbHelper::ensureSchema($db);

$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput, true);
if (!is_array($data)) $data = [];

// Resolve operator
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$token = $data['token'] ?? '';
if (empty($token) && !empty($authHeader) && strpos($authHeader, 'Bearer ') === 0) {
    $token = substr($authHeader, 7);
}

$operatorId = isset($data['user_id']) ? (int)$data['user_id'] : (isset($data['admin_id']) ? (int)$data['admin_id'] : 0);
$operatorUser = null;

if (!empty($token)) {
    $tokStmt = $db->prepare("
        SELECT u.id, u.name, u.email 
        FROM user_tokens ut
        INNER JOIN users u ON ut.user_id = u.id
        WHERE ut.token = :token AND ut.expires_at > NOW()
        LIMIT 1
    ");
    $tokStmt->execute([':token' => $token]);
    $operatorUser = $tokStmt->fetch(PDO::FETCH_ASSOC);
    if ($operatorUser) {
        $operatorId = (int)$operatorUser['id'];
    }
}

if (!$operatorUser && $operatorId > 0) {
    $uStmt = $db->prepare("SELECT id, name, email FROM users WHERE id = :id LIMIT 1");
    $uStmt->execute([':id' => $operatorId]);
    $operatorUser = $uStmt->fetch(PDO::FETCH_ASSOC);
}

if (!$operatorUser) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Authentication required."]);
    exit;
}

// Check role
$rStmt = $db->prepare("SELECT role FROM user_roles WHERE user_id = :id");
$rStmt->execute([':id' => $operatorId]);
$roles = $rStmt->fetchAll(PDO::FETCH_COLUMN);

if (!in_array('admin', $roles) && !in_array('developer', $roles) && !in_array('manager', $roles)) {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Access denied. Only Admin and Developer can create meetings."]);
    exit;
}

$title = !empty($data['title']) ? trim($data['title']) : 'Academy Team Meeting';
$agenda = !empty($data['agenda']) ? trim($data['agenda']) : null;
$meetingType = (!empty($data['meeting_type']) && $data['meeting_type'] === 'scheduled') ? 'scheduled' : 'instant';
$scheduledStart = !empty($data['scheduled_start']) ? trim($data['scheduled_start']) : null;
$departmentId = !empty($data['department_id']) ? (int)$data['department_id'] : null;

$roomId = MeetingDbHelper::generateRoomId('cca');
$status = ($meetingType === 'instant') ? 'active' : 'scheduled';
$actualStart = ($meetingType === 'instant') ? date('Y-m-d H:i:s') : null;

try {
    $stmt = $db->prepare("
        INSERT INTO academy_meetings 
            (room_id, title, agenda, meeting_type, created_by, department_id, scheduled_start, actual_start, status, created_at)
        VALUES 
            (:rid, :title, :agenda, :mtype, :creator, :dept, :sched, :act, :stat, NOW())
    ");

    $stmt->execute([
        ':rid'     => $roomId,
        ':title'   => $title,
        ':agenda'  => $agenda,
        ':mtype'   => $meetingType,
        ':creator' => $operatorId,
        ':dept'    => $departmentId,
        ':sched'   => $scheduledStart,
        ':act'     => $actualStart,
        ':stat'    => $status
    ]);

    $meetingId = (int)$db->lastInsertId();

    // If instant meeting, notify all target users
    if ($meetingType === 'instant') {
        try {
            $userQuery = "
                SELECT DISTINCT u.id 
                FROM users u
                INNER JOIN user_roles ur ON u.id = ur.user_id
                LEFT JOIN employees e ON u.id = e.user_id
                WHERE u.status = 'active' AND u.id != :creator
            ";
            $uParams = [':creator' => $operatorId];
            if ($departmentId !== null) {
                $userQuery .= " AND e.department_id = :dept";
                $uParams[':dept'] = $departmentId;
            }

            $uListStmt = $db->prepare($userQuery);
            $uListStmt->execute($uParams);
            $targetStaff = $uListStmt->fetchAll(PDO::FETCH_COLUMN);

            foreach ($targetStaff as $targetId) {
                NotificationHelper::sendToUser(
                    $db,
                    $targetId,
                    $operatorId,
                    "🔴 Live Meeting Started: " . $title,
                    "Admin {$operatorUser['name']} has launched an instant meeting. Click to join now!",
                    'meeting_alert',
                    'staff',
                    "/meetings/" . $roomId,
                    'high',
                    ['room_id' => $roomId, 'title' => $title]
                );
            }
        } catch (Throwable $eNotif) {}
    }

    echo json_encode([
        "status"         => "success",
        "message"        => ($meetingType === 'instant') ? "Instant meeting started successfully!" : "Meeting scheduled successfully!",
        "meeting_id"     => $meetingId,
        "room_id"        => $roomId,
        "title"          => $title,
        "meeting_status" => $status
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
