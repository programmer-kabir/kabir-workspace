<?php
// server/api/attendance/get_my_idle_status.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/cors.php';

date_default_timezone_set('Asia/Dhaka');

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

$userId = isset($data['user_id']) ? (int)$data['user_id'] : (isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0);

if (!$userId) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'user_id is required']);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();
    if (!$db) {
        throw new Exception("Database connection unavailable");
    }

    // Ensure table exists
    $db->exec("
        CREATE TABLE IF NOT EXISTS staff_idle_alerts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            staff_name VARCHAR(150) NOT NULL,
            staff_email VARCHAR(150) DEFAULT NULL,
            idle_seconds INT DEFAULT 300,
            active_process VARCHAR(100) DEFAULT NULL,
            active_window_title VARCHAR(255) DEFAULT NULL,
            status ENUM('idle', 'resumed', 'acknowledged') DEFAULT 'idle',
            started_at DATETIME NOT NULL,
            resumed_at DATETIME DEFAULT NULL,
            acknowledged_by INT DEFAULT NULL,
            acknowledged_at DATETIME DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_user (user_id),
            INDEX idx_status (status),
            INDEX idx_started (started_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 1. Fetch current heartbeat status
    $hbStmt = $db->prepare("
        SELECT is_idle, idle_seconds, active_process, active_window_title, status, last_heartbeat
        FROM staff_heartbeats
        WHERE user_id = :uid
        LIMIT 1
    ");
    $hbStmt->execute([':uid' => $userId]);
    $heartbeat = $hbStmt->fetch(PDO::FETCH_ASSOC);

    // 2. Fetch today's alerts for this staff member
    $alertsStmt = $db->prepare("
        SELECT 
            id,
            idle_seconds,
            active_process,
            active_window_title,
            status,
            DATE_FORMAT(CONVERT_TZ(started_at, @@session.time_zone, '+06:00'), '%Y-%m-%dT%H:%i:%s+06:00') AS started_at,
            DATE_FORMAT(CONVERT_TZ(resumed_at, @@session.time_zone, '+06:00'), '%Y-%m-%dT%H:%i:%s+06:00') AS resumed_at,
            DATE_FORMAT(CONVERT_TZ(acknowledged_at, @@session.time_zone, '+06:00'), '%Y-%m-%dT%H:%i:%s+06:00') AS acknowledged_at,
            TIMESTAMPDIFF(SECOND, started_at, COALESCE(resumed_at, NOW())) AS duration_seconds
        FROM staff_idle_alerts
        WHERE user_id = :uid AND DATE(started_at) = CURDATE()
        ORDER BY started_at DESC
        LIMIT 10
    ");
    $alertsStmt->execute([':uid' => $userId]);
    $todayAlerts = $alertsStmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Stats for today
    $todayCount = count($todayAlerts);
    $todayTotalSeconds = 0;
    $currentlyIdle = false;
    $currentIdleSeconds = 0;

    foreach ($todayAlerts as $a) {
        $todayTotalSeconds += (int)$a['idle_seconds'];
        if ($a['status'] === 'idle') {
            $currentlyIdle = true;
            $currentIdleSeconds = max($currentIdleSeconds, (int)$a['idle_seconds']);
        }
    }

    if ($heartbeat && !empty($heartbeat['is_idle'])) {
        $currentlyIdle = true;
        $currentIdleSeconds = max($currentIdleSeconds, (int)$heartbeat['idle_seconds']);
    }

    echo json_encode([
        'status' => 'success',
        'data' => [
            'is_currently_idle'       => $currentlyIdle,
            'current_idle_seconds'    => $currentIdleSeconds,
            'today_incidents_count'   => $todayCount,
            'today_total_minutes'     => round($todayTotalSeconds / 60),
            'today_total_seconds'     => $todayTotalSeconds,
            'today_alerts'            => $todayAlerts,
            'heartbeat'               => $heartbeat
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to fetch staff idle status: ' . $e->getMessage()
    ]);
}
