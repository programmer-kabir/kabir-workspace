<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/PusherHelper.php';
require_once __DIR__ . '/BreakDbHelper.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();
BreakDbHelper::ensureSchema($db);

$data = json_decode(file_get_contents("php://input"));
$action = !empty($data->action) ? strtolower(trim($data->action)) : 'status';
$today = date('Y-m-d');
$now = date('Y-m-d H:i:s');
$pusher = null;
try {
    $pusher = new PusherHelper();
} catch (Throwable $e) {}

try {
    if ($action === 'start_all') {
        // 1. Fetch active schedule to know allocated minutes & start_time
        $schedule = BreakDbHelper::getActivePrayerSchedule($db);
        $sStartTime = $schedule && !empty($schedule['start_time']) ? $schedule['start_time'] : date('H:i:s');
        $startDatetime = $today . ' ' . $sStartTime;

        // 2. Fetch all staff who checked in today
        $query = "SELECT a.user_id, u.name 
                  FROM attendance a
                  JOIN users u ON a.user_id = u.id
                  WHERE a.date = :today AND a.check_in IS NOT NULL";
        $stmt = $db->prepare($query);
        $stmt->execute([':today' => $today]);
        $attendees = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $startedCount = 0;
        $alreadyActiveCount = 0;

        foreach ($attendees as $att) {
            $uid = (int)$att['user_id'];

            // Check if user already has an active break or completed Namaz break today
            $chk = $db->prepare("SELECT id, status, break_type FROM user_breaks 
                                 WHERE user_id = :uid AND date = :today AND (status = 'Active' OR (break_type = 'Namaz' AND status = 'Completed')) 
                                 ORDER BY id DESC LIMIT 1");
            $chk->execute([':uid' => $uid, ':today' => $today]);
            $exist = $chk->fetch(PDO::FETCH_ASSOC);

            if ($exist) {
                $alreadyActiveCount++;
                continue;
            }

            // Insert active Namaz break
            $ins = $db->prepare("INSERT INTO user_breaks 
                (user_id, date, break_type, purpose, start_time, end_time, duration_minutes, status, reason, approved_at, created_at, updated_at) 
                VALUES (:uid, :today, 'Namaz', 'Namaz', :start_time, NULL, NULL, 'Active', 'Center Scheduled Namaz Break', :now, :now, :now)");
            $ins->execute([
                ':uid' => $uid,
                ':today' => $today,
                ':start_time' => $now,
                ':now' => $now
            ]);
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

        echo json_encode([
            "status" => "success",
            "message" => "Namaz Break initiated for {$startedCount} staff members ({$alreadyActiveCount} already on break or completed).",
            "data" => [
                "started_count" => $startedCount,
                "already_active_count" => $alreadyActiveCount
            ]
        ]);
        exit;
    }

    if ($action === 'end_all') {
        // Find all active Namaz breaks today
        $actStmt = $db->prepare("SELECT id, user_id, start_time FROM user_breaks 
                                 WHERE date = :today AND break_type = 'Namaz' AND status = 'Active'");
        $actStmt->execute([':today' => $today]);
        $activeNamaz = $actStmt->fetchAll(PDO::FETCH_ASSOC);

        $endedCount = 0;

        foreach ($activeNamaz as $b) {
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

        echo json_encode([
            "status" => "success",
            "message" => "Ended {$endedCount} active Namaz breaks.",
            "data" => ["ended_count" => $endedCount]
        ]);
        exit;
    }

    // Default status check: How many active Namaz breaks right now?
    $qCheck = $db->prepare("SELECT COUNT(*) FROM user_breaks WHERE date = :today AND break_type = 'Namaz' AND status = 'Active'");
    $qCheck->execute([':today' => $today]);
    $activeCount = (int)$qCheck->fetchColumn();

    $schedule = BreakDbHelper::getActivePrayerSchedule($db);

    echo json_encode([
        "status" => "success",
        "data" => [
            "active_namaz_count" => $activeCount,
            "schedule" => $schedule,
            "server_time" => $now
        ]
    ]);

} catch (Throwable $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
