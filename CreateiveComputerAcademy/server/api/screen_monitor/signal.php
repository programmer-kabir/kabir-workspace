<?php
// server/api/screen_monitor/signal.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/PusherHelper.php';

date_default_timezone_set('Asia/Dhaka');

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid JSON payload']);
    exit();
}

$signalType = isset($data['signal_type']) ? trim($data['signal_type']) : '';
$senderId   = isset($data['sender_id']) ? (string)$data['sender_id'] : 'unknown';
$targetId   = isset($data['target_id']) ? (string)$data['target_id'] : '';
$payload    = isset($data['payload']) ? $data['payload'] : [];

if (empty($signalType)) {
    http_response_code(422);
    echo json_encode(['status' => 'error', 'message' => 'Missing signal_type parameter']);
    exit();
}

try {
    $pusher = new PusherHelper();

    // Determine target channel
    if (!empty($targetId)) {
        if ($targetId === 'admin') {
            $channel = 'screen-admin-channel';
        } else {
            $channel = 'screen-staff-' . $targetId;
        }
    } else {
        $channel = 'screen-monitor-channel';
    }

    // Handle Inactivity & Idle Alert persistence
    if ($signalType === 'staff-idle') {
        try {
            $userId = !empty($payload['user_id']) ? (int)$payload['user_id'] : (int)$senderId;
            $staffName = !empty($payload['name']) ? trim($payload['name']) : 'Staff #' . $userId;
            $staffEmail = !empty($payload['email']) ? trim($payload['email']) : null;
            $idleSecs = !empty($payload['idle_seconds']) ? (int)$payload['idle_seconds'] : 300;

            // Sanity guard against Windows Win32 tick underflow glitch (e.g. 4294967 seconds)
            if ($idleSecs > 43200 || $idleSecs < 0) {
                $idleSecs = 300;
            }

            $activeProcess = !empty($payload['active_process']) ? substr(trim($payload['active_process']), 0, 100) : null;
            $activeTitle = !empty($payload['active_window_title']) ? substr(trim($payload['active_window_title']), 0, 255) : null;

            if ($userId > 0) {
                $database = new Database();
                $db = $database->getConnection();

                // Ensure staff_idle_alerts table exists
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

                // Check if user info is in users table if name is generic
                if ($staffName === 'Staff #' . $userId) {
                    $uStmt = $db->prepare("SELECT name, email FROM users WHERE id = :uid LIMIT 1");
                    $uStmt->execute([':uid' => $userId]);
                    $uRow = $uStmt->fetch(PDO::FETCH_ASSOC);
                    if ($uRow) {
                        $staffName = $uRow['name'] ?: $staffName;
                        $staffEmail = $uRow['email'] ?: $staffEmail;
                    }
                }

                // Check for open idle alert to prevent duplicate alert rows
                $checkStmt = $db->prepare("
                    SELECT id FROM staff_idle_alerts 
                    WHERE user_id = :uid AND status = 'idle'
                    ORDER BY id DESC LIMIT 1
                ");
                $checkStmt->execute([':uid' => $userId]);
                $existingId = $checkStmt->fetchColumn();

                if ($existingId) {
                    $updStmt = $db->prepare("
                        UPDATE staff_idle_alerts 
                        SET idle_seconds = GREATEST(idle_seconds, :sec), 
                             active_process = COALESCE(:proc, active_process),
                            active_window_title = COALESCE(:title, active_window_title),
                            updated_at = NOW()
                        WHERE id = :id
                    ");
                    $updStmt->execute([
                        ':sec' => $idleSecs,
                        ':proc' => $activeProcess,
                        ':title' => $activeTitle,
                        ':id' => $existingId
                    ]);
                    $payload['alert_id'] = (int)$existingId;
                } else {
                    $insStmt = $db->prepare("
                        INSERT INTO staff_idle_alerts (user_id, staff_name, staff_email, idle_seconds, active_process, active_window_title, status, started_at)
                        VALUES (:uid, :name, :email, :sec, :proc, :title, 'idle', NOW())
                    ");
                    $insStmt->execute([
                        ':uid' => $userId,
                        ':name' => $staffName,
                        ':email' => $staffEmail,
                        ':sec' => $idleSecs,
                        ':proc' => $activeProcess,
                        ':title' => $activeTitle
                    ]);
                    $newAlertId = (int)$db->lastInsertId();
                    $payload['alert_id'] = $newAlertId;

                    // Dispatch notification to Admin role
                    $notifHelperPath = __DIR__ . '/../notifications/notification_helper.php';
                    if (file_exists($notifHelperPath)) {
                        require_once $notifHelperPath;
                        $mins = max(5, min(720, round($idleSecs / 60)));
                        NotificationHelper::sendToRole(
                            $db,
                            'admin',
                            $userId,
                            'Inactivity Alert: ' . $staffName,
                            "{$staffName} has been idle for {$mins}+ minutes on desktop workstation.",
                            'staff_idle',
                            'admin',
                            '/idle-alerts',
                            'high',
                            [
                                'alert_id' => $newAlertId,
                                'user_id' => $userId,
                                'idle_seconds' => $idleSecs,
                                'staff_name' => $staffName
                            ]
                        );
                    }
                }
            }
        } catch (Exception $e) {
            error_log("[Signal] Error recording staff-idle alert: " . $e->getMessage());
        }
    } elseif ($signalType === 'staff-active') {
        try {
            $userId = !empty($payload['user_id']) ? (int)$payload['user_id'] : (int)$senderId;
            if ($userId > 0) {
                $database = new Database();
                $db = $database->getConnection();

                $findStmt = $db->prepare("
                    SELECT id, started_at, idle_seconds FROM staff_idle_alerts 
                    WHERE user_id = :uid AND status = 'idle'
                    ORDER BY id DESC LIMIT 1
                ");
                $findStmt->execute([':uid' => $userId]);
                $openRow = $findStmt->fetch(PDO::FETCH_ASSOC);

                if ($openRow) {
                    $startedAt = strtotime($openRow['started_at']);
                    $initialSecs = (!empty($openRow['idle_seconds']) && (int)$openRow['idle_seconds'] <= 43200) ? (int)$openRow['idle_seconds'] : 300;
                    $elapsedSinceTrigger = max(0, time() - $startedAt);
                    $payloadSecs = (!empty($payload['idle_seconds']) && (int)$payload['idle_seconds'] <= 43200) ? (int)$payload['idle_seconds'] : 0;
                    $durationSecs = min(43200, max(300, $payloadSecs, $initialSecs + $elapsedSinceTrigger));

                    $updActiveStmt = $db->prepare("
                        UPDATE staff_idle_alerts 
                        SET status = 'resumed',
                            resumed_at = NOW(),
                            idle_seconds = :sec,
                            updated_at = NOW()
                        WHERE id = :id
                    ");
                    $updActiveStmt->execute([
                        ':sec' => $durationSecs,
                        ':id' => $openRow['id']
                    ]);
                    $payload['resumed_alert_id'] = (int)$openRow['id'];
                    $payload['duration_seconds'] = $durationSecs;
                }
            }
        } catch (Exception $e) {
            error_log("[Signal] Error closing staff-idle alert: " . $e->getMessage());
        }
    }

    $eventData = [
        'signal_type' => $signalType,
        'sender_id'   => $senderId,
        'target_id'   => $targetId,
        'payload'     => $payload,
        'timestamp'   => time()
    ];

    // Trigger Pusher event
    $pusher->trigger($channel, 'screen-signal', $eventData);

    echo json_encode([
        'status' => 'success',
        'channel' => $channel,
        'signal_type' => $signalType,
        'dispatched_at' => date('Y-m-d H:i:s')
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Pusher signaling failed: ' . $e->getMessage()
    ]);
}
?>
