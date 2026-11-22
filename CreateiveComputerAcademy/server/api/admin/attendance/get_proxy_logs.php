<?php
// get_proxy_logs.php - Fetch Proxy Attendance Audit Trail
require_once '../../../config/cors.php';
require_once '../../../config/database.php';
require_once '../attendance/AttendanceDbHelper.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

AttendanceDbHelper::ensureSchema($db);

$limit = isset($_GET['limit']) ? min(100, max(1, (int)$_GET['limit'])) : 30;
$targetUserId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
$date = isset($_GET['date']) ? trim($_GET['date']) : '';

try {
    $whereParts = [];
    $params = [];

    if ($targetUserId > 0) {
        $whereParts[] = "l.target_user_id = :target_id";
        $params[':target_id'] = $targetUserId;
    }
    if (!empty($date)) {
        $whereParts[] = "l.punch_date = :pdate";
        $params[':pdate'] = $date;
    }

    $whereSql = count($whereParts) > 0 ? "WHERE " . implode(" AND ", $whereParts) : "";

    $sql = "
        SELECT 
            l.id,
            l.target_user_id,
            tu.name AS target_user_name,
            tu.profile_picture AS target_user_avatar,
            l.operator_id,
            ou.name AS operator_name,
            l.punch_type,
            l.punch_date,
            l.punch_time,
            l.reason,
            l.notes,
            l.ip_address,
            l.created_at
        FROM attendance_proxy_logs l
        LEFT JOIN users tu ON l.target_user_id = tu.id
        LEFT JOIN users ou ON l.operator_id = ou.id
        {$whereSql}
        ORDER BY l.id DESC
        LIMIT {$limit}
    ";

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "total"  => count($logs),
        "logs"   => $logs
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
