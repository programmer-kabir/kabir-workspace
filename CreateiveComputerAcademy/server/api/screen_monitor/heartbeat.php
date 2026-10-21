<?php
// server/api/screen_monitor/heartbeat.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/PusherHelper.php';

date_default_timezone_set('Asia/Dhaka');

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data || empty($data['user_id'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing user_id parameter']);
    exit();
}

$userId            = (int)$data['user_id'];
$isIdle            = !empty($data['is_idle']) ? 1 : 0;
$idleSeconds       = isset($data['idle_seconds']) ? (int)$data['idle_seconds'] : 0;

// Sanity guard against Windows Win32 tick underflow glitch (e.g. 4294967 seconds) or impossible values
if ($idleSeconds > 43200 || $idleSeconds < 0) {
    $idleSeconds = 0;
    $isIdle = 0;
}

$status            = isset($data['status']) ? trim($data['status']) : 'checked_in';
$activeProcess     = !empty($data['active_process']) ? substr(trim($data['active_process']), 0, 100) : null;
$activeWindowTitle = !empty($data['active_window_title']) ? substr(trim($data['active_window_title']), 0, 255) : null;
$runningApps       = !empty($data['running_apps']) ? (is_string($data['running_apps']) ? $data['running_apps'] : json_encode($data['running_apps'])) : null;

try {
    $database = new Database();
    $db = $database->getConnection();

    // 1. Ensure staff_heartbeats table exists with active window columns
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
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_heartbeat_time (last_heartbeat)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // Seamless migration for existing tables
    try { $db->exec("ALTER TABLE staff_heartbeats ADD COLUMN active_process VARCHAR(100) DEFAULT NULL"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE staff_heartbeats ADD COLUMN active_window_title VARCHAR(255) DEFAULT NULL"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE staff_heartbeats ADD COLUMN running_apps TEXT DEFAULT NULL"); } catch (Exception $e) {}

    if ($status === 'checked_out') {
        $stmt = $db->prepare("
            INSERT INTO staff_heartbeats (user_id, last_heartbeat, is_idle, idle_seconds, status, active_process, active_window_title, running_apps)
            VALUES (:user_id, NOW(), 0, 0, 'checked_out', NULL, NULL, NULL)
            ON DUPLICATE KEY UPDATE 
                last_heartbeat = NOW(),
                is_idle = 0,
                idle_seconds = 0,
                status = 'checked_out',
                active_process = NULL,
                active_window_title = NULL,
                running_apps = NULL
        ");
        $stmt->execute(['user_id' => $userId]);
    } else {
        $stmt = $db->prepare("
            INSERT INTO staff_heartbeats (user_id, last_heartbeat, is_idle, idle_seconds, status, active_process, active_window_title, running_apps)
            VALUES (:user_id, NOW(), :is_idle, :idle_seconds, 'checked_in', :active_process, :active_window_title, :running_apps)
            ON DUPLICATE KEY UPDATE 
                last_heartbeat = NOW(),
                is_idle = VALUES(is_idle),
                idle_seconds = VALUES(idle_seconds),
                status = 'checked_in',
                active_process = VALUES(active_process),
                active_window_title = VALUES(active_window_title),
                running_apps = VALUES(running_apps)
        ");
        $stmt->execute([
            'user_id'             => $userId,
            'is_idle'             => $isIdle,
            'idle_seconds'        => $idleSeconds,
            'active_process'      => $activeProcess,
            'active_window_title' => $activeWindowTitle,
            'running_apps'        => $runningApps
        ]);

        // Sync with staff_idle_alerts table
        if ($isIdle === 1 && $idleSeconds >= 300) {
            $chkAlert = $db->prepare("
                SELECT id FROM staff_idle_alerts 
                WHERE user_id = :uid AND status = 'idle'
                ORDER BY id DESC LIMIT 1
            ");
            $chkAlert->execute([':uid' => $userId]);
            $existingAlertId = $chkAlert->fetchColumn();

            if ($existingAlertId) {
                $updAlert = $db->prepare("
                    UPDATE staff_idle_alerts 
                    SET idle_seconds = GREATEST(idle_seconds, :sec),
                        active_process = COALESCE(:proc, active_process),
                        active_window_title = COALESCE(:title, active_window_title),
                        updated_at = NOW()
                    WHERE id = :id
                ");
                $updAlert->execute([
                    ':sec'   => $idleSeconds,
                    ':proc'  => $activeProcess,
                    ':title' => $activeWindowTitle,
                    ':id'    => $existingAlertId
                ]);
            } else {
                $uNameStmt = $db->prepare("SELECT name, email FROM users WHERE id = :uid LIMIT 1");
                $uNameStmt->execute([':uid' => $userId]);
                $uData = $uNameStmt->fetch(PDO::FETCH_ASSOC);
                $stName = $uData ? $uData['name'] : 'Staff #' . $userId;
                $stEmail = $uData ? $uData['email'] : null;

                $insAlert = $db->prepare("
                    INSERT INTO staff_idle_alerts (user_id, staff_name, staff_email, idle_seconds, active_process, active_window_title, status, started_at)
                    VALUES (:uid, :name, :email, :sec, :proc, :title, 'idle', NOW())
                ");
                $insAlert->execute([
                    ':uid'   => $userId,
                    ':name'  => $stName,
                    ':email' => $stEmail,
                    ':sec'   => $idleSeconds,
                    ':proc'  => $activeProcess,
                    ':title' => $activeWindowTitle
                ]);
            }
        } elseif ($isIdle === 0 || $status === 'checked_out') {
            $findOpen = $db->prepare("
                SELECT id, started_at, idle_seconds FROM staff_idle_alerts 
                WHERE user_id = :uid AND status = 'idle'
                ORDER BY id DESC LIMIT 1
            ");
            $findOpen->execute([':uid' => $userId]);
            $openAlert = $findOpen->fetch(PDO::FETCH_ASSOC);
            if ($openAlert) {
                $startedTs = strtotime($openAlert['started_at']);
                $elapsedSinceTrigger = max(0, time() - $startedTs);
                
                // Safe calculation: real elapsed time from trigger + baseline threshold, capped at 12 hours
                $safeInitial = (!empty($openAlert['idle_seconds']) && (int)$openAlert['idle_seconds'] <= 43200) 
                    ? (int)$openAlert['idle_seconds'] 
                    : 300;
                $safeCurrent = ($idleSeconds > 0 && $idleSeconds <= 43200) ? (int)$idleSeconds : 0;
                $totalSecs = min(43200, max(300, $safeCurrent, $safeInitial + $elapsedSinceTrigger));

                $closeStmt = $db->prepare("
                    UPDATE staff_idle_alerts 
                    SET status = 'resumed',
                        resumed_at = NOW(),
                        idle_seconds = :sec,
                        updated_at = NOW()
                    WHERE id = :id
                ");
                $closeStmt->execute([
                    ':sec' => $totalSecs,
                    ':id'  => $openAlert['id']
                ]);
            }
        }
    }

    echo json_encode([
        'status' => 'success',
        'server_time' => date('Y-m-d H:i:s'),
        'user_id' => $userId,
        'heartbeat_status' => $status
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
