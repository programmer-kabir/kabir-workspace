<?php
require_once '../config/cors.php';
require_once '../config/db.php';
require_once '../middleware/check_role.php'; // requireRole

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

requireRole('admin');

$input       = json_decode(file_get_contents("php://input"), true);
$unread_only = !empty($input['unread_only']);
$limit       = min((int)($input['limit'] ?? 50), 100);
$offset      = (int)($input['offset'] ?? 0);

// Admin এর সব incoming notifications (target_role = 'admin')
// user_id দিয়ে কোন user পাঠিয়েছে সেটা জানা যাবে
// users table JOIN করে sender এর name ও email দেখানো হচ্ছে
$where = "n.target_role = 'admin' AND n.is_deleted = 0";
if ($unread_only) {
    $where .= " AND n.is_read = 0";
}

$sql = "
    SELECT
        n.id,
        n.user_id,
        n.sender_id,
        n.sender_type,
        n.target_role,
        n.type,
        n.title,
        n.message,
        n.icon,
        n.link,
        n.priority,
        n.is_read,
        n.read_at,
        n.created_at,
        u.name  AS sender_name,
        u.email AS sender_email,
        u.photo AS sender_photo
    FROM notifications n
    LEFT JOIN users u ON u.id = n.user_id
    WHERE {$where}
    ORDER BY n.created_at DESC
    LIMIT ? OFFSET ?
";

$stmt = $mysqli->prepare($sql);
$stmt->bind_param("ii", $limit, $offset);
$stmt->execute();
$result = $stmt->get_result();

$notifications = [];
while ($row = $result->fetch_assoc()) {
    $row['is_read'] = (bool)(int)$row['is_read'];
    $notifications[] = $row;
}
$stmt->close();

// Unread count
$countSql = "SELECT COUNT(*) AS cnt FROM notifications WHERE target_role = 'admin' AND is_read = 0 AND is_deleted = 0";
$countRow = $mysqli->query($countSql)->fetch_assoc();
$unread_count = (int)$countRow['cnt'];

$mysqli->close();

echo json_encode([
    "success"       => true,
    "notifications" => $notifications,
    "unread_count"  => $unread_count,
    "total"         => count($notifications)
]);
?>
