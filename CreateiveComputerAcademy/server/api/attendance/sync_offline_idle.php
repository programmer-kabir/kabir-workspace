<?php
// server/api/attendance/sync_offline_idle.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/PusherHelper.php';

date_default_timezone_set('Asia/Dhaka');

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!isset($data['user_id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "user_id is required."]);
    exit();
}

$userId = (int)$data['user_id'];
$alerts = isset($data['alerts']) && is_array($data['alerts']) ? $data['alerts'] : [];

if (empty($alerts)) {
    echo json_encode(["status" => "success", "message" => "No offline idle alerts to sync.", "synced_count" => 0]);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();
    if (!$db) {
        throw new Exception("Database connection unavailable.");
    }

    // 1. Ensure staff_idle_alerts table exists
    $db->exec("
        CREATE TABLE IF NOT EXISTS staff_idle_alerts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            staff_name VARCHAR(150) NOT NULL,
            staff_email VARCHAR(150) DEFAULT NULL,
            idle_seconds INT NOT NULL DEFAULT 300,
            active_process VARCHAR(100) DEFAULT NULL,
            active_window_title VARCHAR(255) DEFAULT NULL,
            status ENUM('idle', 'resumed', 'acknowledged') DEFAULT 'idle',
            started_at DATETIME NOT NULL,
            resumed_at DATETIME DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_user_date (user_id, started_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // Get user info
    $uStmt = $db->prepare("SELECT name, email FROM users WHERE id = :uid LIMIT 1");
    $uStmt->execute([':uid' => $userId]);
    $userRow = $uStmt->fetch(PDO::FETCH_ASSOC);

    if (!$userRow) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "User not found."]);
        exit();
    }

    $staffName = $userRow['name'] ?? 'Staff #' . $userId;
    $staffEmail = $userRow['email'] ?? null;

    $insStmt = $db->prepare("
        INSERT INTO staff_idle_alerts (
            user_id, staff_name, staff_email, idle_seconds, 
            active_process, active_window_title, status, 
            started_at, resumed_at, updated_at
        ) VALUES (
            :uid, :name, :email, :sec, 
            :proc, :title, 'resumed', 
            :started, :resumed, NOW()
        )
    ");

    $syncedCount = 0;
    foreach ($alerts as $item) {
        $idleSeconds = isset($item['idle_seconds']) ? (int)$item['idle_seconds'] : 300;
        // Sanity bound: between 5 minutes and 12 hours
        if ($idleSeconds < 300 || $idleSeconds > 43200) {
            $idleSeconds = 300;
        }

        $startedAt = !empty($item['started_at']) ? date('Y-m-d H:i:s', strtotime($item['started_at'])) : date('Y-m-d H:i:s', time() - $idleSeconds);
        $resumedAt = !empty($item['resumed_at']) ? date('Y-m-d H:i:s', strtotime($item['resumed_at'])) : date('Y-m-d H:i:s', strtotime($startedAt) + $idleSeconds);

        $activeProcess = !empty($item['active_process']) ? substr(trim($item['active_process']), 0, 100) : null;
        $activeWindowTitle = !empty($item['active_window_title']) ? substr(trim($item['active_window_title']), 0, 255) : null;

        // Check if identical alert already logged to prevent duplicates
        $dupCheck = $db->prepare("
            SELECT id FROM staff_idle_alerts 
            WHERE user_id = :uid AND started_at = :started 
            LIMIT 1
        ");
        $dupCheck->execute([
            ':uid' => $userId,
            ':started' => $startedAt
        ]);

        if ($dupCheck->fetchColumn()) {
            continue; // Already saved, skip
        }

        $insStmt->execute([
            ':uid'     => $userId,
            ':name'    => $staffName,
            ':email'   => $staffEmail,
            ':sec'     => $idleSeconds,
            ':proc'    => $activeProcess,
            ':title'   => $activeWindowTitle,
            ':started' => $startedAt,
            ':resumed' => $resumedAt
        ]);
        $syncedCount++;
    }

    // Trigger Pusher notification if alerts were synced
    if ($syncedCount > 0 && class_exists('PusherHelper')) {
        try {
            PusherHelper::trigger('admin-notifications', 'staff-idle-synced', [
                'user_id' => $userId,
                'staff_name' => $staffName,
                'synced_count' => $syncedCount,
                'message' => "{$staffName} এর {$syncedCount} টি অফলাইন ইনঅ্যাক্টিভিটি এলার্ট সিঙ্ক হয়েছে।"
            ]);
        } catch (Exception $pe) {
            // non-blocking
        }
    }

    echo json_encode([
        "status" => "success",
        "message" => "{$syncedCount} offline idle incident(s) synced successfully.",
        "synced_count" => $syncedCount
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Sync failed: " . $e->getMessage()
    ]);
}
