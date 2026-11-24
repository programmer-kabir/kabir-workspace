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

$roomId         = !empty($data['room_id']) ? trim($data['room_id']) : '';
$userId         = !empty($data['user_id']) ? (int)$data['user_id'] : 0;
$userName       = !empty($data['user_name']) ? trim($data['user_name']) : 'Participant';
$userRole       = !empty($data['user_role']) ? trim($data['user_role']) : 'Member';
$message        = !empty($data['message']) ? trim($data['message']) : '';
$messageType    = !empty($data['message_type']) ? trim($data['message_type']) : 'text'; // 'text', 'code', 'file', 'image'
$attachmentUrl  = !empty($data['attachment_url']) ? trim($data['attachment_url']) : null;
$attachmentName = !empty($data['attachment_name']) ? trim($data['attachment_name']) : null;
$attachmentSize = !empty($data['attachment_size']) ? (int)$data['attachment_size'] : null;
$codeLanguage   = !empty($data['code_language']) ? trim($data['code_language']) : null;

// If message is empty for file or image, fallback to filename
if (empty($message) && in_array($messageType, ['file', 'image']) && !empty($attachmentName)) {
    $message = $attachmentName;
}

if (empty($roomId) || !$userId || empty($message)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Room ID, User ID, and message cannot be empty."]);
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

    $meetingId = (int)$meeting['id'];
    $isChatLocked = isset($meeting['is_chat_locked']) ? (int)$meeting['is_chat_locked'] : 1;

    // If chat is locked, only Hosts / Co-Hosts can send messages
    if ($isChatLocked === 1) {
        $isHost = MeetingDbHelper::isUserHost($db, $meeting, $userId, $userRole);
        if (!$isHost) {
            http_response_code(403);
            echo json_encode(["status" => "error", "message" => "Chat is currently locked by the host."]);
            exit;
        }
    }

    $insStmt = $db->prepare("
        INSERT INTO meeting_messages (
            meeting_id, user_id, user_name, user_role, message,
            message_type, attachment_url, attachment_name, attachment_size, code_language,
            created_at
        )
        VALUES (
            :mid, :uid, :uname, :urole, :msg,
            :mtype, :aurl, :aname, :asize, :clang,
            NOW()
        )
    ");
    $insStmt->execute([
        ':mid'   => $meetingId,
        ':uid'   => $userId,
        ':uname' => $userName,
        ':urole' => $userRole,
        ':msg'   => $message,
        ':mtype' => $messageType,
        ':aurl'  => $attachmentUrl,
        ':aname' => $attachmentName,
        ':asize' => $attachmentSize,
        ':clang' => $codeLanguage
    ]);

    $newId = (int)$db->lastInsertId();

    // Fetch user profile picture
    $uStmt = $db->prepare("SELECT profile_picture FROM users WHERE id = :uid LIMIT 1");
    $uStmt->execute([':uid' => $userId]);
    $uRow = $uStmt->fetch(PDO::FETCH_ASSOC);
    $profilePic = $uRow['profile_picture'] ?? null;

    echo json_encode([
        "status"  => "success",
        "message" => [
            "id"              => $newId,
            "meeting_id"      => $meetingId,
            "user_id"         => $userId,
            "user_name"       => $userName,
            "user_role"       => $userRole,
            "profile_picture" => $profilePic,
            "message"         => $message,
            "message_type"    => $messageType,
            "attachment_url"  => $attachmentUrl,
            "attachment_name" => $attachmentName,
            "attachment_size" => $attachmentSize,
            "code_language"   => $codeLanguage,
            "is_pinned"       => 0,
            "pinned_by"       => null,
            "pinned_at"       => null,
            "created_at"      => date('Y-m-d H:i:s')
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>