<?php

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/cors.php';

date_default_timezone_set('Asia/Dhaka');

$rawDate = !empty($_GET['date']) ? trim($_GET['date']) : date('Y-m-d');
$userId  = !empty($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
$range   = !empty($_GET['range']) ? trim($_GET['range']) : 'date'; // 'date', 'today', 'yesterday', 'week', 'month', 'all'

$ts = strtotime($rawDate);
if ($ts === false) $ts = time();
$filterDate = date('Y-m-d', $ts);

if ($userId <= 0) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Valid user_id is required.'
    ]);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();
    if (!$db) {
        throw new Exception("Database connection failed");
    }

    // 1. Ensure tables exist (Self-healing JIT schema)
    $db->exec("
        CREATE TABLE IF NOT EXISTS staff_workstation_videos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            staff_name VARCHAR(150) NOT NULL,
            date DATE NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            chunk_index INT DEFAULT 1,
            duration_seconds INT DEFAULT 1800,
            file_size_bytes BIGINT NOT NULL,
            drive_file_id VARCHAR(100) NOT NULL,
            drive_view_link TEXT DEFAULT NULL,
            storage_provider VARCHAR(20) DEFAULT 'gdrive',
            status ENUM('uploaded', 'processing', 'failed') DEFAULT 'uploaded',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_user_date (user_id, date),
            INDEX idx_date (date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

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

    // 2. Fetch User Profile Info
    $uStmt = $db->prepare("SELECT id, name, email, profile_picture FROM users WHERE id = :uid LIMIT 1");
    $uStmt->execute([':uid' => $userId]);
    $userRow = $uStmt->fetch(PDO::FETCH_ASSOC);

    // 3. Fetch Workstation Video Clips for this user on the selected date
    $vSql = "
        SELECT 
            id,
            user_id,
            staff_name,
            date,
            DATE_FORMAT(start_time, '%h:%i %p') AS start_time_formatted,
            DATE_FORMAT(end_time, '%h:%i %p') AS end_time_formatted,
            start_time,
            end_time,
            chunk_index,
            duration_seconds,
            ROUND(duration_seconds / 60) AS duration_minutes,
            file_size_bytes,
            ROUND(file_size_bytes / (1024 * 1024), 2) AS file_size_mb,
            drive_file_id,
            drive_view_link,
            storage_provider,
            status,
            created_at
        FROM staff_workstation_videos
        WHERE user_id = :uid AND date = :filter_date
        ORDER BY chunk_index ASC, start_time ASC
    ";
    $vStmt = $db->prepare($vSql);
    $vStmt->execute([':uid' => $userId, ':filter_date' => $filterDate]);
    $rawVideos = $vStmt->fetchAll(PDO::FETCH_ASSOC);

    $videoClips = [];
    $totalRecordedSeconds = 0;
    $totalVideoSizeMb = 0.0;

    foreach ($rawVideos as $vid) {
        $embedLink = $vid['drive_view_link'];
        if ($vid['storage_provider'] === 'gdrive' && !empty($vid['drive_file_id'])) {
            $embedLink = "https://drive.google.com/file/d/{$vid['drive_file_id']}/preview";
        }
        $vid['embed_url'] = $embedLink;
        $totalRecordedSeconds += (int)$vid['duration_seconds'];
        $totalVideoSizeMb += (float)$vid['file_size_mb'];
        $videoClips[] = $vid;
    }

    // 4. Fetch Inactivity / Idle Alerts for this user
    // Supports either specific selected date or range filter
    $aWhere = ["a.user_id = :uid"];
    $aParams = [':uid' => $userId];

    if ($range === 'today') {
        $aWhere[] = "DATE(a.started_at) = CURDATE()";
    } elseif ($range === 'yesterday') {
        $aWhere[] = "DATE(a.started_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)";
    } elseif ($range === 'week') {
        $aWhere[] = "a.started_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
    } elseif ($range === 'month') {
        $aWhere[] = "a.started_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
    } elseif ($range === 'all') {
        // no date bound, limit 100
    } else {
        // Default: match the selected date from datepicker
        $aWhere[] = "DATE(a.started_at) = :filter_date";
        $aParams[':filter_date'] = $filterDate;
    }

    $aWhereClause = implode(" AND ", $aWhere);

    $aSql = "
        SELECT 
            a.id,
            a.user_id,
            a.staff_name,
            LEAST(43200, a.idle_seconds) AS idle_seconds,
            ROUND(LEAST(43200, a.idle_seconds) / 60) AS idle_minutes,
            a.active_process,
            a.active_window_title,
            a.status,
            a.started_at,
            a.resumed_at,
            DATE_FORMAT(CONVERT_TZ(a.started_at, @@session.time_zone, '+06:00'), '%h:%i %p') AS started_at_time,
            DATE_FORMAT(CONVERT_TZ(a.resumed_at, @@session.time_zone, '+06:00'), '%h:%i %p') AS resumed_at_time,
            DATE(a.started_at) AS alert_date,
            TIMESTAMPDIFF(SECOND, a.started_at, COALESCE(a.resumed_at, NOW())) AS duration_seconds,
            ROUND(TIMESTAMPDIFF(SECOND, a.started_at, COALESCE(a.resumed_at, NOW())) / 60) AS duration_minutes,
            a.acknowledged_at
        FROM staff_idle_alerts a
        WHERE {$aWhereClause}
        ORDER BY a.started_at DESC
        LIMIT 100
    ";
    $aStmt = $db->prepare($aSql);
    $aStmt->execute($aParams);
    $alerts = $aStmt->fetchAll(PDO::FETCH_ASSOC);

    // 5. Aggregate Metrics for Selected Date & Today
    // A. Idle time on selected date
    $dateIdleStmt = $db->prepare("
        SELECT 
            COUNT(*) AS alert_count,
            COALESCE(ROUND(SUM(LEAST(43200, idle_seconds)) / 60), 0) AS total_idle_minutes
        FROM staff_idle_alerts
        WHERE user_id = :uid AND DATE(started_at) = :fdate
    ");
    $dateIdleStmt->execute([':uid' => $userId, ':fdate' => $filterDate]);
    $dateIdleStats = $dateIdleStmt->fetch(PDO::FETCH_ASSOC) ?: ['alert_count' => 0, 'total_idle_minutes' => 0];

    // B. Idle time today
    $todayIdleStmt = $db->prepare("
        SELECT 
            COUNT(*) AS alert_count,
            COALESCE(ROUND(SUM(LEAST(43200, idle_seconds)) / 60), 0) AS total_idle_minutes
        FROM staff_idle_alerts
        WHERE user_id = :uid AND DATE(started_at) = CURDATE()
    ");
    $todayIdleStmt->execute([':uid' => $userId]);
    $todayIdleStats = $todayIdleStmt->fetch(PDO::FETCH_ASSOC) ?: ['alert_count' => 0, 'total_idle_minutes' => 0];

    // C. Check live workstation heartbeat status
    $hbStmt = $db->prepare("
        SELECT 
            is_idle,
            LEAST(43200, idle_seconds) AS idle_seconds,
            active_process,
            active_window_title,
            last_heartbeat,
            (last_heartbeat >= DATE_SUB(NOW(), INTERVAL 3 MINUTE)) AS is_online
        FROM staff_heartbeats 
        WHERE user_id = :uid 
        LIMIT 1
    ");
    $hbStmt->execute([':uid' => $userId]);
    $liveHeartbeat = $hbStmt->fetch(PDO::FETCH_ASSOC);

    $isCurrentlyIdle = false;
    if ($liveHeartbeat && !empty($liveHeartbeat['is_online']) && !empty($liveHeartbeat['is_idle'])) {
        $isCurrentlyIdle = true;
    }

    echo json_encode([
        'status' => 'success',
        'query_date' => $filterDate,
        'user' => [
            'id' => $userId,
            'name' => $userRow['name'] ?? 'Staff',
            'email' => $userRow['email'] ?? '',
            'profile_picture' => $userRow['profile_picture'] ?? null
        ],
        'stats' => [
            'selected_date' => $filterDate,
            'total_clips' => count($videoClips),
            'total_recorded_minutes' => round($totalRecordedSeconds / 60),
            'total_recorded_hours' => round($totalRecordedSeconds / 3600, 2),
            'total_video_size_mb' => round($totalVideoSizeMb, 2),
            'date_idle_minutes' => (int)$dateIdleStats['total_idle_minutes'],
            'date_alert_count' => (int)$dateIdleStats['alert_count'],
            'today_idle_minutes' => (int)$todayIdleStats['total_idle_minutes'],
            'today_alert_count' => (int)$todayIdleStats['alert_count'],
            'is_currently_idle' => $isCurrentlyIdle,
            'current_idle_seconds' => $isCurrentlyIdle ? (int)$liveHeartbeat['idle_seconds'] : 0,
            'live_active_window' => $liveHeartbeat['active_window_title'] ?? null,
            'live_active_process' => $liveHeartbeat['active_process'] ?? null,
            'is_workstation_online' => !empty($liveHeartbeat['is_online'])
        ],
        'videos' => $videoClips,
        'alerts' => $alerts
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to fetch workstation logs: ' . $e->getMessage()
    ]);
}
