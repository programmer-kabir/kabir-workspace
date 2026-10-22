<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=UTF-8");

function apiError($message, $debug = null, $code = 400) {
  http_response_code($code);
  echo json_encode([
    "success" => false,
    "message" => $message,
    "debug"   => $debug
  ], JSON_UNESCAPED_UNICODE);
  exit;
}

// Mark read action if requested
$action  = $_POST['action'] ?? $_GET['action'] ?? null;
$notifId = (int)($_POST['notification_id'] ?? $_GET['notification_id'] ?? 0);

if ($action === 'mark_read' && $notifId > 0) {
    $stmt = $mysqli->prepare("UPDATE notifications SET is_read = 1 WHERE id = ?");
    if ($stmt) {
        $stmt->bind_param("i", $notifId);
        $stmt->execute();
        $stmt->close();
    }
    echo json_encode(["success" => true, "message" => "Marked as read"]);
    exit;
}

if ($action === 'mark_all_read') {
    $uId = (int)($_POST['user_id'] ?? $_GET['user_id'] ?? 0);
    $mysqli->query("UPDATE notifications SET is_read = 1 WHERE is_read = 0");
    echo json_encode(["success" => true, "message" => "All marked as read"]);
    exit;
}

$user_id = (int)($_GET['user_id'] ?? 0);
$role    = strtolower(trim($_GET['role'] ?? 'staff'));

$isAdminOrDev = in_array($role, ['admin', 'developer']);

if ($isAdminOrDev) {
    $sql = "
        SELECT 
            n.id,
            n.user_id,
            n.target_roles,
            n.type,
            n.title,
            n.message,
            n.link,
            n.edit_id,
            n.is_read,
            n.created_at,
            e.status AS edit_status,
            e.amount AS edit_amount
        FROM notifications n
        LEFT JOIN installment_payment_edits e ON n.edit_id = e.id
        WHERE n.target_roles LIKE '%admin%' 
           OR n.target_roles LIKE '%developer%'
           OR n.target_roles = 'all'
        ORDER BY n.id DESC
        LIMIT 40
    ";
    $res = $mysqli->query($sql);
} else {
    // For staff or manager
    $rolePattern = "%" . $role . "%";
    $stmt = $mysqli->prepare("
        SELECT 
            n.id,
            n.user_id,
            n.target_roles,
            n.type,
            n.title,
            n.message,
            n.link,
            n.edit_id,
            n.is_read,
            n.created_at,
            e.status AS edit_status,
            e.amount AS edit_amount
        FROM notifications n
        LEFT JOIN installment_payment_edits e ON n.edit_id = e.id
        WHERE n.user_id = ?
           OR n.target_roles LIKE ?
           OR n.target_roles = 'all'
        ORDER BY n.id DESC
        LIMIT 40
    ");
    if (!$stmt) apiError("Query prepare failed", $mysqli->error);
    $stmt->bind_param("is", $user_id, $rolePattern);
    $stmt->execute();
    $res = $stmt->get_result();
}

if (!$res) apiError("Query failed", $mysqli->error);

$data = [];
$unread_count = 0;

while ($row = $res->fetch_assoc()) {
    $row['id'] = (int)$row['id'];
    $row['user_id'] = $row['user_id'] !== null ? (int)$row['user_id'] : null;
    $row['edit_id'] = $row['edit_id'] !== null ? (int)$row['edit_id'] : null;
    $row['is_read'] = (int)$row['is_read'];
    if ($row['is_read'] === 0) {
        $unread_count++;
    }
    $data[] = $row;
}

echo json_encode([
    "success"      => true,
    "count"        => count($data),
    "unread_count" => $unread_count,
    "data"         => $data
], JSON_UNESCAPED_UNICODE);
