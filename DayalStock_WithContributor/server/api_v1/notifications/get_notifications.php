<?php
require_once '../config/cors.php';
require_once '../config/db.php';
require_once '../middleware/auth.php'; // $GLOBALS['user'] → id, roles

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

$user_id    = (int)($GLOBALS['user']['id']    ?? 0);
$user_roles = $GLOBALS['user']['roles']        ?? ['user'];

if (!$user_id) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

// User contributor/author কিনা check করা
$is_contributor = in_array('author', $user_roles) || in_array('contributor', $user_roles);

$input = json_decode(file_get_contents('php://input'), true);
$target_role_filter = $input['target_role'] ?? $_POST['target_role'] ?? 'user';

// ===================================================================
// Notification দেখার নিয়ম:
//
// 1. target_role = 'author' -> শুধু author-দের নোটিফিকেশন দেখাবে
// 2. target_role = 'user'   -> শুধু সাধারণ ইউজারদের নোটিফিকেশন দেখাবে
// ===================================================================

if ($target_role_filter === 'author' && $is_contributor) {
    // Contributor/Author: শুধু নিজের author specific + 'all' broadcast দেখবে
    $sql = "
        SELECT n.id, n.user_id, n.sender_id, n.sender_type, n.target_role, n.type,
               n.title, n.message, n.icon, n.link, n.priority, n.is_read, n.read_at, n.created_at,
               u.name AS sender_name
        FROM notifications n
        LEFT JOIN users u ON n.sender_id = u.id
        WHERE n.is_deleted = 0
          AND (
              (n.target_role = 'author' AND n.user_id = ?)
              OR (n.target_role = 'author' AND n.user_id IS NULL)
              OR (n.target_role = 'all' AND n.user_id IS NULL)
          )
        ORDER BY n.created_at DESC
        LIMIT 50
    ";
} else {
    // Regular User: নিজের specific + user broadcast + all broadcast দেখবে
    $sql = "
        SELECT n.id, n.user_id, n.sender_id, n.sender_type, n.target_role, n.type,
               n.title, n.message, n.icon, n.link, n.priority, n.is_read, n.read_at, n.created_at,
               u.name AS sender_name
        FROM notifications n
        LEFT JOIN users u ON n.sender_id = u.id
        WHERE n.is_deleted = 0
          AND (
              (n.target_role = 'user' AND n.user_id = ?)
              OR (n.target_role = 'user' AND n.user_id IS NULL)
              OR (n.target_role = 'all' AND n.user_id IS NULL)
          )
        ORDER BY n.created_at DESC
        LIMIT 50
    ";
}

$stmt = $mysqli->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

$notifications = [];
while ($row = $result->fetch_assoc()) {
    $row['is_read'] = (bool)(int)$row['is_read'];
    $notifications[] = $row;
}
$stmt->close();

// Unread count (same logic)
if ($target_role_filter === 'author' && $is_contributor) {
    $unreadSql = "
        SELECT COUNT(*) AS cnt FROM notifications
        WHERE is_deleted = 0 AND is_read = 0
          AND (
              (target_role = 'author' AND user_id = ?)
              OR (target_role = 'author' AND user_id IS NULL)
              OR (target_role = 'all' AND user_id IS NULL)
          )
    ";
} else {
    $unreadSql = "
        SELECT COUNT(*) AS cnt FROM notifications
        WHERE is_deleted = 0 AND is_read = 0
          AND (
              (target_role = 'user'  AND user_id = ?)
              OR (target_role = 'user' AND user_id IS NULL)
              OR (target_role = 'all' AND user_id IS NULL)
          )
    ";
}

$us = $mysqli->prepare($unreadSql);
$us->bind_param("i", $user_id);
$us->execute();
$unread_count = (int)$us->get_result()->fetch_assoc()['cnt'];
$us->close();

$mysqli->close();

echo json_encode([
    "success"       => true,
    "notifications" => $notifications,
    "unread_count"  => $unread_count
]);
?>
