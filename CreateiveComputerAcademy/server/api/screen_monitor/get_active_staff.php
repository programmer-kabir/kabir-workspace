<?php
// server/api/screen_monitor/get_active_staff.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/cors.php';

date_default_timezone_set('Asia/Dhaka');

try {
    $database = new Database();
    $db = $database->getConnection();
    $today = date('Y-m-d');

    // 1. Ensure staff_heartbeats table exists with all required columns
    $db->exec("
        CREATE TABLE IF NOT EXISTS staff_heartbeats (
            user_id INT PRIMARY KEY,
            last_heartbeat DATETIME NOT NULL,
            is_idle TINYINT(1) DEFAULT 0,
            idle_seconds INT DEFAULT 0,
            status VARCHAR(30) DEFAULT 'checked_in',
            active_process VARCHAR(100) DEFAULT NULL,
            active_window_title VARCHAR(255) DEFAULT NULL,
            running_apps TEXT DEFAULT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_heartbeat_time (last_heartbeat)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // Auto-migrate columns if table already existed without them
    try { $db->exec("ALTER TABLE staff_heartbeats ADD COLUMN active_process VARCHAR(100) DEFAULT NULL"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE staff_heartbeats ADD COLUMN active_window_title VARCHAR(255) DEFAULT NULL"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE staff_heartbeats ADD COLUMN running_apps TEXT DEFAULT NULL"); } catch (Exception $e) {}


    // 2. Retrieve all active staff who checked in today and haven't checked out yet
    $stmt = $db->prepare("
        SELECT 
            u.id AS user_id,
            u.name,
            u.email,
            u.profile_picture,
            a.id AS attendance_id,
            a.date,
            a.check_in,
            a.status AS attendance_status,
            e.employee_code,
            e.designation,
            d.name AS department_name,
            hb.last_heartbeat,
            hb.is_idle,
            hb.idle_seconds,
            hb.status AS heartbeat_status,
            hb.active_process,
            hb.active_window_title,
            hb.running_apps,
            TIMESTAMPDIFF(SECOND, hb.last_heartbeat, NOW()) AS seconds_since_heartbeat
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        LEFT JOIN employees e ON u.id = e.user_id
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN staff_heartbeats hb ON u.id = hb.user_id
        WHERE a.date = :today
          AND a.check_in IS NOT NULL
          AND a.check_out IS NULL
          AND u.status = 'active'
        ORDER BY a.check_in DESC
    ");
    $stmt->execute(['today' => $today]);
    $rawStaff = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format and flag abrupt offline status (no heartbeat for > 90 seconds)
    $activeStaff = array_map(function($staff) {
        $sec = isset($staff['seconds_since_heartbeat']) && $staff['seconds_since_heartbeat'] !== null 
            ? (int)$staff['seconds_since_heartbeat'] 
            : null;
        
        // Considered abruptly offline if on duty but no heartbeat for > 90s
        $isAbruptOffline = ($sec === null || $sec > 90);

        $runningAppsList = [];
        if (!empty($staff['running_apps'])) {
            $decoded = json_decode($staff['running_apps'], true);
            if (is_array($decoded)) {
                $runningAppsList = $decoded;
            }
        }

        return array_merge($staff, [
            'seconds_since_heartbeat' => $sec,
            'is_abrupt_offline'       => $isAbruptOffline,
            'is_idle'                 => !empty($staff['is_idle']),
            'active_process'          => $staff['active_process'] ?? null,
            'active_window_title'     => $staff['active_window_title'] ?? null,
            'running_apps_list'       => $runningAppsList
        ]);
    }, $rawStaff);


    echo json_encode([
        'status' => 'success',
        'server_time' => date('Y-m-d H:i:s'),
        'count' => count($activeStaff),
        'data' => $activeStaff
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
