<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';
require_once '../../attendance/AttendanceSecurityHelper.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

$attendance_id = isset($_GET['attendance_id']) ? (int)$_GET['attendance_id'] : 0;
$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
$date = isset($_GET['date']) ? trim($_GET['date']) : '';

AttendanceSecurityHelper::ensureTables($db);

try {
    if ($attendance_id > 0) {
        $stmt = $db->prepare("
            SELECT adl.*, u.name as user_name, u.email as user_email
            FROM attendance_device_logs adl
            LEFT JOIN users u ON adl.user_id = u.id
            WHERE adl.attendance_id = :attendance_id
            ORDER BY adl.id ASC
        ");
        $stmt->execute([':attendance_id' => $attendance_id]);
    } elseif ($user_id > 0 && !empty($date)) {
        $stmt = $db->prepare("
            SELECT adl.*, u.name as user_name, u.email as user_email
            FROM attendance_device_logs adl
            LEFT JOIN users u ON adl.user_id = u.id
            WHERE adl.user_id = :user_id AND DATE(adl.timestamp) = :date
            ORDER BY adl.id ASC
        ");
        $stmt->execute([':user_id' => $user_id, ':date' => $date]);
    } else {
        echo json_encode(["status" => "error", "message" => "attendance_id or (user_id and date) is required."]);
        exit();
    }

    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format logs with decoded fraud_flags and google maps link
    foreach ($logs as &$log) {
        if (!empty($log['fraud_flags'])) {
            $log['fraud_flags'] = json_decode($log['fraud_flags'], true) ?: [];
        } else {
            $log['fraud_flags'] = [];
        }

        if (!empty($log['latitude']) && !empty($log['longitude'])) {
            $log['google_maps_url'] = "https://www.google.com/maps?q=" . $log['latitude'] . "," . $log['longitude'];
        } else {
            $log['google_maps_url'] = null;
        }
    }

    echo json_encode([
        "status" => "success",
        "data" => $logs
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
