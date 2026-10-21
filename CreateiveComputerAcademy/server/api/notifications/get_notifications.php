<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

date_default_timezone_set('Asia/Dhaka');

$user_id = isset($data->user_id) ? (int)$data->user_id : (isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0);
$portal  = isset($data->portal) ? trim($data->portal) : (isset($_GET['portal']) ? trim($_GET['portal']) : null);

if (!$user_id) {
    echo json_encode(["status" => "error", "message" => "user_id is required."]);
    exit;
}

try {
    // Count unread notifications
    $unread_query = "SELECT COUNT(*) FROM notifications WHERE user_id = :user_id AND is_read = 0";
    if ($portal) {
        $unread_query .= " AND (portal = :portal OR portal = 'all')";
    }
    $unread_stmt = $db->prepare($unread_query);
    $unread_params = [':user_id' => $user_id];
    if ($portal) $unread_params[':portal'] = $portal;
    $unread_stmt->execute($unread_params);
    $unread_count = (int)$unread_stmt->fetchColumn();

    // Fetch latest 30 notifications with sender info & ISO 8601 timestamp (+06:00)
    $query = "SELECT n.id, n.user_id, n.sender_id, n.title, n.message, n.type, n.priority, n.portal, n.action_url, n.metadata, n.is_read, n.read_at,
                     DATE_FORMAT(CONVERT_TZ(n.created_at, @@session.time_zone, '+06:00'), '%Y-%m-%dT%H:%i:%s+06:00') AS created_at,
                     u.name AS sender_name, 
                     u.profile_picture AS sender_avatar
              FROM notifications n
              LEFT JOIN users u ON n.sender_id = u.id
              WHERE n.user_id = :user_id";

    if ($portal) {
        $query .= " AND (n.portal = :portal OR n.portal = 'all')";
    }

    $query .= " ORDER BY n.created_at DESC LIMIT 30";

    $stmt = $db->prepare($query);
    $stmt->execute($unread_params);
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // One-time auto-clean of any corrupted legacy 71583+ minutes notifications
    try {
        $db->exec("
            UPDATE notifications 
            SET message = REPLACE(message, '71583+ minutes', '5 minutes')
            WHERE message LIKE '%idle for%71583%'
        ");
        $db->exec("
            UPDATE notifications 
            SET message = REPLACE(message, '71582+ minutes', '5 minutes')
            WHERE message LIKE '%idle for%71582%'
        ");
    } catch (Exception $e) {}

    // Format metadata as JSON object if string & clean title of any leading '?' marks
    foreach ($notifications as &$n) {
        $n['id'] = (int)$n['id'];
        $n['user_id'] = (int)$n['user_id'];
        $n['sender_id'] = $n['sender_id'] ? (int)$n['sender_id'] : null;
        $n['is_read'] = (int)$n['is_read'];
        if (!empty($n['title'])) {
            $n['title'] = preg_replace('/^[\?\s\x00-\x1F\x7F]+/u', '', $n['title']);
            $n['title'] = ltrim($n['title'], '? ');
        }
        if (!empty($n['message']) && strpos($n['message'], 'idle for') !== false) {
            $n['message'] = preg_replace('/\b\d{4,}\+?\s*minutes/i', '5 minutes', $n['message']);
        }
        if (!empty($n['metadata']) && is_string($n['metadata'])) {
            $n['metadata'] = json_decode($n['metadata'], true);
        }
    }

    echo json_encode([
        "status" => "success",
        "unread_count" => $unread_count,
        "notifications" => $notifications
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
