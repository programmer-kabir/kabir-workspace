<?php
// manage_host.php - Meeting Host & Co-Host Privilege Manager
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

$roomId       = !empty($data['room_id']) ? trim($data['room_id']) : '';
$requesterId  = !empty($data['requester_id']) ? (int)$data['requester_id'] : 0;
$targetUserId = !empty($data['target_user_id']) ? (int)$data['target_user_id'] : 0;
$action       = !empty($data['action']) ? strtolower(trim($data['action'])) : 'promote'; // promote | demote

if (empty($roomId) || !$requesterId || !$targetUserId) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Room ID, requester ID, and target user ID are required."]);
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
    $isRequesterHost = MeetingDbHelper::isUserHost($db, $meeting, $requesterId);
    if (!$isRequesterHost) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Only a meeting host can appoint or remove co-hosts."]);
        exit;
    }

    $hosts = !empty($meeting['hosts_json']) ? json_decode($meeting['hosts_json'], true) : [];
    if (!is_array($hosts)) $hosts = [];
    $hosts = array_map('intval', $hosts);

    // Always include creator
    if (!in_array((int)$meeting['created_by'], $hosts)) {
        $hosts[] = (int)$meeting['created_by'];
    }

    if ($action === 'promote') {
        if (!in_array($targetUserId, $hosts)) {
            $hosts[] = $targetUserId;
        }
    } else {
        // Demote: cannot demote original creator
        if ($targetUserId === (int)$meeting['created_by']) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Cannot demote the primary meeting creator."]);
            exit;
        }
        $hosts = array_values(array_filter($hosts, fn($id) => $id !== $targetUserId));
    }

    $upStmt = $db->prepare("UPDATE academy_meetings SET hosts_json = :hj WHERE id = :mid");
    $upStmt->execute([
        ':hj'  => json_encode($hosts),
        ':mid' => (int)$meeting['id']
    ]);

    // Fetch target user name for display
    $uStmt = $db->prepare("SELECT name FROM users WHERE id = :uid LIMIT 1");
    $uStmt->execute([':uid' => $targetUserId]);
    $targetUser = $uStmt->fetch(PDO::FETCH_ASSOC);
    $targetName = $targetUser['name'] ?? 'User';

    echo json_encode([
        "status"         => "success",
        "action"         => $action,
        "target_user_id" => $targetUserId,
        "target_name"    => $targetName,
        "hosts"          => $hosts,
        "message"        => $action === 'promote' 
            ? "{$targetName} is now a Co-Host!" 
            : "{$targetName} is no longer a Co-Host."
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>