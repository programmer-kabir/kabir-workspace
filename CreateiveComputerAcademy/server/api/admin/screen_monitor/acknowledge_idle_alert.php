<?php
// server/api/admin/screen_monitor/acknowledge_idle_alert.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/PusherHelper.php';

date_default_timezone_set('Asia/Dhaka');

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

$alertId = !empty($data['alert_id']) ? $data['alert_id'] : null;
$markAll = !empty($data['mark_all']) || $alertId === 'all';
$adminId = !empty($data['admin_id']) ? (int)$data['admin_id'] : null;

if (!$data || (!$alertId && !$markAll)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'alert_id or mark_all is required']);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();
    if (!$db) {
        throw new Exception("Database connection unavailable");
    }

    if ($markAll) {
        // Bulk acknowledge all unacknowledged (idle or resumed) alerts
        $stmt = $db->prepare("
            UPDATE staff_idle_alerts 
            SET status = 'acknowledged',
                idle_seconds = CASE 
                    WHEN status = 'idle' THEN idle_seconds + GREATEST(0, TIMESTAMPDIFF(SECOND, started_at, NOW()))
                    ELSE idle_seconds 
                END,
                resumed_at = COALESCE(resumed_at, NOW()),
                acknowledged_by = :admin_id,
                acknowledged_at = NOW(),
                updated_at = NOW()
            WHERE status IN ('idle', 'resumed')
        ");
        $stmt->execute([':admin_id' => $adminId]);
        $affectedCount = $stmt->rowCount();

        try {
            $pusher = new PusherHelper();
            $pusher->trigger('screen-admin-channel', 'screen-signal', [
                'signal_type' => 'idle-alerts-all-acknowledged',
                'sender_id' => $adminId ?: 'admin',
                'payload' => [
                    'acknowledged_by' => $adminId,
                    'affected_count' => $affectedCount,
                    'acknowledged_at' => date('Y-m-d H:i:s')
                ],
                'timestamp' => time()
            ]);
        } catch (Exception $e) {}

        echo json_encode([
            'status' => 'success',
            'message' => "All {$affectedCount} alert(s) marked as acknowledged",
            'affected_count' => $affectedCount
        ]);
        exit();
    }

    $stmt = $db->prepare("
        UPDATE staff_idle_alerts 
        SET status = 'acknowledged',
            idle_seconds = CASE 
                WHEN status = 'idle' THEN idle_seconds + GREATEST(0, TIMESTAMPDIFF(SECOND, started_at, NOW()))
                ELSE idle_seconds 
            END,
            resumed_at = COALESCE(resumed_at, NOW()),
            acknowledged_by = :admin_id,
            acknowledged_at = NOW(),
            updated_at = NOW()
        WHERE id = :id
    ");
    $stmt->execute([
        ':admin_id' => $adminId,
        ':id' => $alertId
    ]);

    // Fetch updated idle duration to include in Pusher event
    $fetchStmt = $db->prepare("SELECT idle_seconds, resumed_at FROM staff_idle_alerts WHERE id = :id");
    $fetchStmt->execute([':id' => $alertId]);
    $updatedRow = $fetchStmt->fetch(PDO::FETCH_ASSOC);
    $finalIdleSecs = $updatedRow ? (int)$updatedRow['idle_seconds'] : 300;
    $finalResumedAt = $updatedRow ? $updatedRow['resumed_at'] : date('Y-m-d H:i:s');

    // Dispatch realtime signal so all open admin sessions update live
    try {
        $pusher = new PusherHelper();
        $pusher->trigger('screen-admin-channel', 'screen-signal', [
            'signal_type' => 'idle-alert-acknowledged',
            'sender_id' => $adminId ?: 'admin',
            'payload' => [
                'alert_id' => $alertId,
                'acknowledged_by' => $adminId,
                'acknowledged_at' => date('Y-m-d H:i:s'),
                'idle_seconds' => $finalIdleSecs,
                'resumed_at' => $finalResumedAt
            ],
            'timestamp' => time()
        ]);
    } catch (Exception $e) {
        // Non-blocking Pusher notification
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Alert marked as acknowledged',
        'alert_id' => $alertId
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to acknowledge alert: ' . $e->getMessage()
    ]);
}
