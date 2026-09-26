<?php
require_once '../config/cors.php';
require_once '../config/db.php';
require_once '../middleware/auth.php';
require_once '../helper/notification_helper.php';

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

$user_id = (int)($GLOBALS['user']['id'] ?? 0);

if (!$user_id) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);

$type    = $input['type']    ?? 'file_upload';
$title   = trim($input['title']   ?? 'New File Uploaded');
$message = trim($input['message'] ?? 'A contributor has uploaded new files.');
$icon    = $input['icon']    ?? null;
$link    = $input['link']    ?? null;

// Send to admin
$notif_id = sendNotification($mysqli, [
    'user_id'     => null, // Admin sees it based on target_role='admin'
    'sender_id'   => $user_id,
    'sender_type' => 'author',
    'target_role' => 'admin',
    'type'        => $type,
    'title'       => $title,
    'message'     => $message,
    'icon'        => $icon,
    'link'        => $link,
    'priority'    => 'normal',
]);

if ($notif_id) {
    echo json_encode(["success" => true, "message" => "Admin notified successfully", "notification_id" => $notif_id]);
} else {
    echo json_encode(["success" => false, "message" => "Failed to notify admin"]);
}

$mysqli->close();
?>
