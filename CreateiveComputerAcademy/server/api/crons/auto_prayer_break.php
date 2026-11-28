<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/PusherHelper.php';
require_once __DIR__ . '/../breaks/BreakDbHelper.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();
BreakDbHelper::ensureSchema($db);

$date = date('Y-m-d');
$now = date('Y-m-d H:i:s');
$current_time = date('H:i:s');

// 1. Fetch dynamic prayer schedule from DB (Admin-configured)
$schedule = BreakDbHelper::getActivePrayerSchedule($db);
if (!$schedule || empty($schedule['is_active'])) {
    exit("Auto Prayer Break: Prayer schedule is inactive or not found.\n");
}

$startTime = !empty($schedule['start_time']) ? $schedule['start_time'] : '16:15:00';
$endTime = !empty($schedule['end_time']) ? $schedule['end_time'] : '16:35:00';
$allocatedMins = !empty($schedule['allocated_minutes']) ? (int)$schedule['allocated_minutes'] : 20;

// Determine action: explicitly via parameter or auto-detected by current Dhaka time
$action = isset($_GET['action']) ? strtolower(trim($_GET['action'])) : (isset($_POST['action']) ? strtolower(trim($_POST['action'])) : null);

if (!$action && isset($argv) && is_array($argv)) {
    foreach ($argv as $arg) {
        if (strpos($arg, 'action=') === 0) {
            $action = strtolower(trim(substr($arg, 7)));
        } elseif (in_array(strtolower($arg), ['start', 'end'])) {
            $action = strtolower($arg);
        }
    }
}

if (!$action) {
    $nowSec = strtotime($current_time);
    $startSec = strtotime($startTime);
    $endSec = strtotime($endTime);

    // If within start window (start_time to start_time + 10 mins) -> start phase
    if ($nowSec >= $startSec && $nowSec < ($startSec + 600)) {
        $action = 'start';
    } elseif ($nowSec >= $endSec) {
        $action = 'end';
    }
}

$logFile = __DIR__ . '/auto_prayer_log.txt';
$log = "[{$now}] [ACTION: {$action}] Auto Prayer Cron check (Schedule: {$startTime} - {$endTime}).\n";

$pusher = null;
try {
    $pusher = new PusherHelper();
} catch (Throwable $e) {}

try {
    if ($action === 'start') {
        // Find checked-in staff who don't have an active or completed Namaz break today
        $query = "SELECT a.user_id, u.name 
                  FROM attendance a
                  JOIN users u ON a.user_id = u.id
                  WHERE a.date = :date AND a.check_in IS NOT NULL";
        $stmt = $db->prepare($query);
        $stmt->execute([':date' => $date]);
        $attendees = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $startedCount = 0;
        foreach ($attendees as $att) {
            $uid = (int)$att['user_id'];
            $chk = $db->prepare("SELECT id FROM user_breaks 
                                 WHERE user_id = :uid AND date = :date AND (status = 'Active' OR (break_type = 'Namaz' AND status = 'Completed')) 
                                 LIMIT 1");
            $chk->execute([':uid' => $uid, ':date' => $date]);
            if ($chk->rowCount() > 0) continue;

            $ins = $db->prepare("INSERT INTO user_breaks 
                (user_id, date, break_type, purpose, start_time, end_time, duration_minutes, status, reason, approved_at, created_at, updated_at) 
                VALUES (:uid, :date, 'Namaz', 'Namaz', :now, NULL, NULL, 'Active', 'Auto Scheduled Namaz Break', :now, :now, :now)");
            $ins->execute([':uid' => $uid, ':date' => $date, ':now' => $now]);
            $newBreakId = $db->lastInsertId();
            $startedCount++;

            if ($pusher) {
                try {
                    $pusher->trigger('staff-breaks', 'break-approved', [
                        'break_id' => (int)$newBreakId,
                        'user_id' => $uid,
                        'user_name' => $att['name'],
                        'break_type' => 'Namaz',
                        'purpose' => 'Namaz',
                        'start_time' => $now
                    ]);
                } catch (Throwable $pe) {}
            }
        }
        $log .= "  -> Started Namaz break for {$startedCount} staff.\n";
    } elseif ($action === 'end') {
        // Find active Namaz breaks and close them
        $actStmt = $db->prepare("SELECT id, user_id, start_time FROM user_breaks 
                                 WHERE date = :date AND break_type = 'Namaz' AND status = 'Active'");
        $actStmt->execute([':date' => $date]);
        $activeBreaks = $actStmt->fetchAll(PDO::FETCH_ASSOC);

        $endedCount = 0;
        foreach ($activeBreaks as $b) {
            $bId = (int)$b['id'];
            $uid = (int)$b['user_id'];
            $sTime = strtotime($b['start_time']);
            $durMinutes = max(1, round((time() - $sTime) / 60));
            $tiffinDelta = BreakDbHelper::calculateBreakDelta('Namaz', $durMinutes);

            $uStmt = $db->prepare("UPDATE user_breaks 
                                   SET end_time = :now, 
                                       duration_minutes = :dur, 
                                       tiffin_delta_minutes = :delta, 
                                       status = 'Completed', 
                                       updated_at = :now 
                                   WHERE id = :id");
            $uStmt->execute([
                ':now' => $now,
                ':dur' => $durMinutes,
                ':delta' => $tiffinDelta,
                ':id' => $bId
            ]);
            $endedCount++;

            if ($pusher) {
                try {
                    $pusher->trigger('staff-breaks', 'break-ended', [
                        'break_id' => $bId,
                        'user_id' => $uid,
                        'duration_minutes' => $durMinutes,
                        'tiffin_delta_minutes' => $tiffinDelta
                    ]);
                } catch (Throwable $pe) {}
            }
        }
        $log .= "  -> Ended {$endedCount} active Namaz breaks.\n";
    } else {
        $log .= "  -> No action required at current time.\n";
    }
} catch (Throwable $e) {
    $log .= "  -> ERROR: " . $e->getMessage() . "\n";
}

file_put_contents($logFile, $log, FILE_APPEND);
echo json_encode(["status" => "success", "action" => $action, "schedule" => $schedule, "log" => trim($log)]);
