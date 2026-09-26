<?php
require_once '../config/cors.php';
require_once '../config/db.php';
require_once '../middleware/check_role.php';  // auth → $GLOBALS['user']
require_once '../helper/notification_helper.php';

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

// শুধু admin পাঠাতে পারবে
requireRole('admin');

$admin_id = $GLOBALS['user']['id']; // admin এর DB id = sender_id

$input = json_decode(file_get_contents("php://input"), true);

$recipient_user_id = isset($input['user_id'])   ? (int)$input['user_id']   : null;
$type              = $input['type']     ?? 'general';
$title             = trim($input['title']    ?? '');
$message           = trim($input['message']  ?? '');
$icon              = $input['icon']     ?? null;
$link              = $input['link']     ?? null;
$priority          = $input['priority'] ?? 'normal';

if (!$recipient_user_id) {
    echo json_encode(["success" => false, "message" => "user_id (recipient) is required"]);
    exit;
}
if (empty($title) || empty($message)) {
    echo json_encode(["success" => false, "message" => "title and message are required"]);
    exit;
}

// Admin → User notification
// user_id = recipient user id
// sender_id = admin এর id
// sender_type = 'admin'
// target_role = 'user'
$notif_id = sendNotification($mysqli, [
    'user_id'     => $recipient_user_id,
    'sender_id'   => $admin_id,
    'sender_type' => 'admin',
    'target_role' => 'user',
    'type'        => $type,
    'title'       => $title,
    'message'     => $message,
    'icon'        => $icon,
    'link'        => $link,
    'priority'    => $priority,
]);

if ($notif_id) {
    echo json_encode([
        "success"         => true,
        "message"         => "Notification sent to user successfully",
        "notification_id" => $notif_id
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Failed to send notification"]);
}

$mysqli->close();
?>
