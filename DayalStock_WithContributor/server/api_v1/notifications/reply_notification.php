<?php
require_once '../config/cors.php';
require_once '../config/db.php';
require_once '../middleware/check_role.php';
require_once '../helper/notification_helper.php';

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

requireRole('admin');

$admin_id = (int)($GLOBALS['user']['id'] ?? 0); // sender_id = admin এর id

$input = json_decode(file_get_contents("php://input"), true);

$recipient_user_id       = isset($input['user_id'])                  ? (int)$input['user_id']                  : null;
$reference_notification_id = isset($input['reference_notification_id']) ? (int)$input['reference_notification_id'] : null;
$title    = trim($input['title']    ?? 'Admin Reply');
$message  = trim($input['message']  ?? '');
$type     = $input['type']     ?? 'reply';
$icon     = $input['icon']     ?? null;
$link     = $input['link']     ?? null;
$priority = $input['priority'] ?? 'normal';

if (!$recipient_user_id || empty($message)) {
    echo json_encode(["success" => false, "message" => "user_id and message are required"]);
    exit;
}

// Admin → User notification
// user_id    = recipient user id (কে দেখবে)
// sender_id  = admin এর DB id  (কে পাঠিয়েছে)
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
    // মূল notification টি read mark করা (admin replied করেছে)
    if ($reference_notification_id) {
        $markSql = "UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ?";
        $ms = $mysqli->prepare($markSql);
        $ms->bind_param("i", $reference_notification_id);
        $ms->execute();
        $ms->close();
    }

    echo json_encode([
        "success"         => true,
        "message"         => "Reply sent to user successfully",
        "notification_id" => $notif_id
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Failed to send reply"]);
}

$mysqli->close();
?>
