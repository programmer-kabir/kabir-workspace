<?php
require_once '../config/cors.php';
require_once '../config/db.php';
require_once '../middleware/auth.php';

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

$user_id = (int)($GLOBALS['user']['id'] ?? 0);
$roles   = $GLOBALS['user']['roles'] ?? [];
$isAdmin = in_array('admin', $roles);

$input           = json_decode(file_get_contents("php://input"), true);
$notification_id = isset($input['notification_id']) ? (int)$input['notification_id'] : null;

if (!$user_id && !$isAdmin) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

if ($notification_id && $isAdmin) {
    // Admin: যেকোনো notification mark করতে পারবে
    $sql  = "UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ?";
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param("i", $notification_id);

} elseif ($notification_id && $user_id) {
    // User: নিজের specific notification
    $sql  = "UPDATE notifications SET is_read = 1, read_at = NOW()
             WHERE id = ? AND user_id = ? AND target_role = 'user'";
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param("ii", $notification_id, $user_id);

} elseif (!$notification_id && $user_id) {
    // User: নিজের সব unread notifications mark করবে
    $sql  = "UPDATE notifications SET is_read = 1, read_at = NOW()
             WHERE user_id = ? AND target_role = 'user' AND is_read = 0";
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param("i", $user_id);

} else {
    echo json_encode(["success" => false, "message" => "Invalid request"]);
    exit;
}

if ($stmt->execute()) {
    echo json_encode(["success" => true, "affected" => $stmt->affected_rows]);
} else {
    echo json_encode(["success" => false, "message" => "Update failed: " . $stmt->error]);
}

$stmt->close();
$mysqli->close();
?>
