<?php
// server/api/admin/screen_monitor/get_idle_alerts.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/cors.php';

date_default_timezone_set('Asia/Dhaka');

try {
    $database = new Database();
    $db = $database->getConnection();
    if (!$db) {
        throw new Exception("Database connection unavailable");
    }

    // 1. Ensure table exists
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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_user (user_id),
            INDEX idx_status (status),
            INDEX idx_started (started_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // Auto-heal any legacy corrupted rows that suffered from Windows 32-bit tick underflow (e.g. 4294967 seconds)
    try {
        $db->exec("
            UPDATE staff_idle_alerts 
            SET idle_seconds = LEAST(43200, GREATEST(300, TIMESTAMPDIFF(SECOND, started_at, COALESCE(resumed_at, NOW()))))
            WHERE idle_seconds > 43200
        ");
        $db->exec("
            UPDATE staff_heartbeats
            SET idle_seconds = 0
            WHERE idle_seconds > 43200
        ");
    } catch (Exception $e) {}

    $statusFilter = isset($_GET['status']) ? trim($_GET['status']) : 'all';
    $dateFilter   = isset($_GET['date']) ? trim($_GET['date']) : 'today';
    $search       = isset($_GET['search']) ? trim($_GET['search']) : '';
    $userId       = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
    $limit        = isset($_GET['limit']) ? max(1, min(200, (int)$_GET['limit'])) : 100;

    $where = ["1=1"];
    $params = [];

    // Filter by status
    if ($statusFilter && $statusFilter !== 'all') {
        $where[] = "a.status = :status";
        $params[':status'] = $statusFilter;
    }

    // Filter by specific user
    if ($userId > 0) {
        $where[] = "a.user_id = :uid";
        $params[':uid'] = $userId;
    }

    // Filter by search query
    if ($search !== '') {
        $where[] = "(a.staff_name LIKE :search OR a.staff_email LIKE :search OR u.name LIKE :search OR a.active_process LIKE :search OR a.active_window_title LIKE :search)";
        $params[':search'] = '%' . $search . '%';
    }

    // Filter by date range
    if ($dateFilter === 'today') {
        $where[] = "DATE(a.started_at) = CURDATE()";
    } elseif ($dateFilter === 'yesterday') {
        $where[] = "DATE(a.started_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)";
    } elseif ($dateFilter === 'week') {
        $where[] = "a.started_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
    } elseif ($dateFilter === 'month') {
        $where[] = "a.started_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
    }

    $whereClause = implode(" AND ", $where);

    // Fetch alerts
    $sql = "
        SELECT 
            a.id,
            a.user_id,
            COALESCE(u.name, a.staff_name) AS staff_name,
            COALESCE(u.email, a.staff_email) AS staff_email,
            u.profile_picture AS staff_avatar,
            e.designation,
            d.name AS department_name,
            LEAST(43200, a.idle_seconds) AS idle_seconds,
            a.active_process,
            a.active_window_title,
            a.status,
            DATE_FORMAT(CONVERT_TZ(a.started_at, @@session.time_zone, '+06:00'), '%Y-%m-%dT%H:%i:%s+06:00') AS started_at,
            DATE_FORMAT(CONVERT_TZ(a.resumed_at, @@session.time_zone, '+06:00'), '%Y-%m-%dT%H:%i:%s+06:00') AS resumed_at,
            a.acknowledged_by,
            ack.name AS acknowledged_by_name,
            DATE_FORMAT(CONVERT_TZ(a.acknowledged_at, @@session.time_zone, '+06:00'), '%Y-%m-%dT%H:%i:%s+06:00') AS acknowledged_at,
            TIMESTAMPDIFF(SECOND, a.started_at, COALESCE(a.resumed_at, NOW())) AS duration_seconds,
            h.last_heartbeat,
            h.is_idle AS current_heartbeat_idle,
            LEAST(43200, h.idle_seconds) AS current_heartbeat_idle_seconds
        FROM staff_idle_alerts a
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN employees e ON u.id = e.user_id
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN users ack ON a.acknowledged_by = ack.id
        LEFT JOIN staff_heartbeats h ON a.user_id = h.user_id
        WHERE {$whereClause}
        ORDER BY a.started_at DESC
        LIMIT :limit
    ";

    $stmt = $db->prepare($sql);
    foreach ($params as $k => $v) {
        $stmt->bindValue($k, $v);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $alerts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Compute live summary metrics
    // 1. Currently idle count
    $curIdleStmt = $db->query("
        SELECT COUNT(DISTINCT user_id) 
        FROM staff_idle_alerts 
        WHERE status = 'idle' AND started_at >= DATE_SUB(NOW(), INTERVAL 4 HOUR)
    ");
    $currentlyIdleCount = (int)$curIdleStmt->fetchColumn();

    // 2. Today's total alerts count
    $todayCountStmt = $db->query("
        SELECT COUNT(*) 
        FROM staff_idle_alerts 
        WHERE DATE(started_at) = CURDATE()
    ");
    $todayAlertsCount = (int)$todayCountStmt->fetchColumn();

    // 3. Today's total idle minutes
    $todayMinutesStmt = $db->query("
        SELECT COALESCE(ROUND(SUM(LEAST(43200, idle_seconds)) / 60), 0) 
        FROM staff_idle_alerts 
        WHERE DATE(started_at) = CURDATE()
    ");
    $todayIdleMinutes = (int)$todayMinutesStmt->fetchColumn();

    // 4. Affected distinct staff today
    $todayStaffStmt = $db->query("
        SELECT COUNT(DISTINCT user_id) 
        FROM staff_idle_alerts 
        WHERE DATE(started_at) = CURDATE()
    ");
    $affectedStaffCountToday = (int)$todayStaffStmt->fetchColumn();

    echo json_encode([
        'status' => 'success',
        'data' => [
            'alerts' => $alerts,
            'stats' => [
                'currently_idle_count'     => $currentlyIdleCount,
                'today_alerts_count'       => $todayAlertsCount,
                'today_idle_minutes'       => $todayIdleMinutes,
                'affected_staff_today'     => $affectedStaffCountToday
            ],
            'filters' => [
                'status' => $statusFilter,
                'date'   => $dateFilter,
                'search' => $search
            ]
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to fetch idle alerts: ' . $e->getMessage()
    ]);
}
