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

// Notification query: user-specific notifications + broadcasts
$sql = "
    SELECT n.id, n.user_id, n.sender_id, n.sender_type, n.target_role, n.type,
           n.title, n.message, n.icon, n.link, n.priority, n.is_read, n.read_at, n.created_at,
           u.name AS sender_name
    FROM notifications n
    LEFT JOIN users u ON n.sender_id = u.id
    WHERE n.is_deleted = 0
      AND (
          n.user_id = ?
          OR (n.user_id IS NULL AND n.target_role IN ('user', 'all'))
      )
    ORDER BY n.created_at DESC
    LIMIT 50
";

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

// Unread count
$unreadSql = "
    SELECT COUNT(*) AS cnt FROM notifications
    WHERE is_deleted = 0 AND is_read = 0
      AND (
          user_id = ?
          OR (user_id IS NULL AND target_role IN ('user', 'all'))
      )
";

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
