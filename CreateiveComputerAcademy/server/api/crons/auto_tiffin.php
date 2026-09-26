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
$break_type = 'Tiffin';

// Determine action: explicitly from query/body/CLI OR auto-detected based on time
$action = isset($_GET['action']) ? strtolower(trim($_GET['action'])) : (isset($_POST['action']) ? strtolower(trim($_POST['action'])) : null);

// Check CLI arguments if executed via /usr/bin/php
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
    // Auto-detect based on Dhaka current hour & minute (since timezone is Asia/Dhaka)
    $hour = (int)date('H');
    $minute = (int)date('i');
    
    // If between 13:00 and 13:50 -> Start phase; Otherwise (13:50 onwards / 14:00) -> End phase
    if ($hour == 13 && $minute < 50) {
        $action = 'start';
    } else {
        $action = 'end';
    }
}

// Log file path
$log_file = __DIR__ . '/auto_tiffin_log.txt';
$log = "[{$now}] [ACTION: {$action}] Auto Tiffin Cron started.\n";

try {
    if ($action === 'start') {
        // ── 1. START PHASE (1:20 PM) ──
        // Find all staff who checked in today and have tiffin break enabled (excluding user_id 2)
        $query = "SELECT a.user_id, u.name, e.tiffin_start_time, e.tiffin_end_time, e.tiffin_duration_minutes 
                  FROM attendance a
                  JOIN employees e ON a.user_id = e.user_id
                  JOIN users u ON a.user_id = u.id
                  WHERE a.date = :date 
                    AND a.check_in IS NOT NULL 
                    AND e.has_tiffin_break = 1 
                    AND a.user_id != 2";
        $stmt = $db->prepare($query);
        $stmt->execute([':date' => $date]);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $started_count = 0;
        $already_active = 0;

        foreach ($users as $u) {
            $user_id = (int)$u['user_id'];
            $staff_name = $u['name'];
            $tiffin_start = !empty($u['tiffin_start_time']) ? $u['tiffin_start_time'] : '13:20:00';
            $start_datetime = $date . ' ' . $tiffin_start;

            // Check if any tiffin record already exists for today
            $check = $db->prepare("SELECT id, status FROM employee_breaks WHERE user_id = :user_id AND date = :date AND break_type = 'Tiffin' LIMIT 1");
            $check->execute([':user_id' => $user_id, ':date' => $date]);
            $existing = $check->fetch(PDO::FETCH_ASSOC);

            if (!$existing) {
                // Insert as ACTIVE break
                $insert = $db->prepare("INSERT INTO employee_breaks 
                    (user_id, date, break_type, start_time, end_time, duration_minutes, status, reason, approved_at, created_at, updated_at) 
                    VALUES (:user_id, :date, :break_type, :start_time, NULL, NULL, 'Active', 'Scheduled Daily Tiffin Break', :now, :now, :now)");
                $insert->execute([
                    ':user_id' => $user_id,
                    ':date' => $date,
                    ':break_type' => $break_type,
                    ':start_time' => $start_datetime,
                    ':now' => $now
                ]);
                $new_break_id = $db->lastInsertId();
                $started_count++;

                $log .= "  -> Started Tiffin for {$staff_name} (User #{$user_id}, Break #{$new_break_id}) at {$tiffin_start}\n";

                // Trigger Pusher real-time event so UI and Admin Monitor instantly update
                try {
                    $pusherPayload = [
                        'break_id' => $new_break_id,
                        'user_id' => $user_id,
                        'user_name' => $staff_name,
                        'break_type' => 'Tiffin',
                        'start_time' => $start_datetime,
                        'status' => 'Active',
                        'reason' => 'Scheduled Daily Tiffin Break',
                        'approved_at' => $now
                    ];
                    PusherHelper::trigger('staff-breaks', 'break-approved', $pusherPayload);
                    PusherHelper::trigger("user-channel-{$user_id}", 'break-approved', $pusherPayload);
                } catch (Exception $pe) {}

            } else {
                $already_active++;
            }
        }

        $log .= "[{$now}] Success: Tiffin started for {$started_count} users ({$already_active} already existed).\n\n";
        file_put_contents($log_file, $log, FILE_APPEND);

        echo json_encode([
            "status" => "success",
            "action" => "start",
            "message" => "Tiffin started for {$started_count} staff member(s).",
            "started_count" => $started_count,
            "already_active_count" => $already_active
        ]);

    } else {
        // ── 2. END PHASE (2:00 PM) ──
        // A. Find all active tiffin breaks for today
        $query = "SELECT eb.id, eb.user_id, eb.start_time, u.name, e.tiffin_end_time, e.tiffin_duration_minutes 
                  FROM employee_breaks eb
                  JOIN users u ON eb.user_id = u.id
                  LEFT JOIN employees e ON eb.user_id = e.user_id
                  WHERE eb.date = :date 
                    AND eb.break_type = 'Tiffin' 
                    AND eb.status = 'Active'";
        $stmt = $db->prepare($query);
        $stmt->execute([':date' => $date]);
        $active_breaks = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $completed_count = 0;

        foreach ($active_breaks as $ab) {
            $break_id = (int)$ab['id'];
            $user_id = (int)$ab['user_id'];
            $staff_name = $ab['name'];
            $tiffin_end = !empty($ab['tiffin_end_time']) ? $ab['tiffin_end_time'] : '14:00:00';
            $end_datetime = $date . ' ' . $tiffin_end;
            $duration_mins = !empty($ab['tiffin_duration_minutes']) ? (int)$ab['tiffin_duration_minutes'] : 40;

            // If start_time exists, calculate accurate minutes
            if (!empty($ab['start_time'])) {
                $sTs = strtotime($ab['start_time']);
                $eTs = strtotime($end_datetime);
                if ($eTs > $sTs) {
                    $duration_mins = (int)round(($eTs - $sTs) / 60);
                }
            }

            // Update to Completed
            $upd = $db->prepare("UPDATE employee_breaks 
                                 SET end_time = :end_time, 
                                     duration_minutes = :duration, 
                                     status = 'Completed', 
                                     updated_at = :now 
                                 WHERE id = :id");
            $upd->execute([
                ':end_time' => $end_datetime,
                ':duration' => $duration_mins,
                ':now' => $now,
                ':id' => $break_id
            ]);

            $completed_count++;
            $log .= "  -> Completed Tiffin for {$staff_name} (User #{$user_id}, Break #{$break_id}), Duration: {$duration_mins} mins\n";

            // Trigger Pusher real-time event so UI and Admin Monitor instantly update
            try {
                $pusherPayload = [
                    'break_id' => $break_id,
                    'user_id' => $user_id,
                    'user_name' => $staff_name,
                    'break_type' => 'Tiffin',
                    'end_time' => $end_datetime,
                    'duration' => $duration_mins,
                    'status' => 'Completed'
                ];
                PusherHelper::trigger('staff-breaks', 'break-ended', $pusherPayload);
                PusherHelper::trigger("user-channel-{$user_id}", 'break-ended', $pusherPayload);
            } catch (Exception $pe) {}
        }

        // B. Safety Net: Check if any checked-in staff missed the 1:20 start cron
        $missedQuery = "SELECT a.user_id, u.name, e.tiffin_start_time, e.tiffin_end_time, e.tiffin_duration_minutes 
                        FROM attendance a
                        JOIN employees e ON a.user_id = e.user_id
                        JOIN users u ON a.user_id = u.id
                        WHERE a.date = :date 
                          AND a.check_in IS NOT NULL 
                          AND e.has_tiffin_break = 1 
                          AND a.user_id != 2";
        $mStmt = $db->prepare($missedQuery);
        $mStmt->execute([':date' => $date]);
        $all_eligible = $mStmt->fetchAll(PDO::FETCH_ASSOC);

        $recovered_count = 0;
        foreach ($all_eligible as $u) {
            $user_id = (int)$u['user_id'];
            $staff_name = $u['name'];
            $chk = $db->prepare("SELECT id FROM employee_breaks WHERE user_id = :user_id AND date = :date AND break_type = 'Tiffin' LIMIT 1");
            $chk->execute([':user_id' => $user_id, ':date' => $date]);
            if ($chk->rowCount() == 0) {
                // Create completed entry directly
                $tiffin_start = !empty($u['tiffin_start_time']) ? $u['tiffin_start_time'] : '13:20:00';
                $tiffin_end = !empty($u['tiffin_end_time']) ? $u['tiffin_end_time'] : '14:00:00';
                $duration = !empty($u['tiffin_duration_minutes']) ? (int)$u['tiffin_duration_minutes'] : 40;

                $ins = $db->prepare("INSERT INTO employee_breaks 
                    (user_id, date, break_type, start_time, end_time, duration_minutes, status, reason, approved_at, created_at, updated_at) 
                    VALUES (:user_id, :date, 'Tiffin', :start_time, :end_time, :duration, 'Completed', 'Scheduled Daily Tiffin Break', :now, :now, :now)");
                $ins->execute([
                    ':user_id' => $user_id,
                    ':date' => $date,
                    ':start_time' => $date . ' ' . $tiffin_start,
                    ':end_time' => $date . ' ' . $tiffin_end,
                    ':duration' => $duration,
                    ':now' => $now
                ]);
                $recovered_count++;
                $log .= "  -> [Recovery] Inserted completed Tiffin for missed User #{$user_id} ({$staff_name})\n";
            }
        }

        $log .= "[{$now}] Success: Tiffin completed for {$completed_count} users (Recovered: {$recovered_count}).\n\n";
        file_put_contents($log_file, $log, FILE_APPEND);

        echo json_encode([
            "status" => "success",
            "action" => "end",
            "message" => "Tiffin completed for {$completed_count} staff member(s).",
            "completed_count" => $completed_count,
            "recovered_count" => $recovered_count
        ]);
    }
} catch (PDOException $e) {
    $log .= "[{$now}] ERROR: " . $e->getMessage() . "\n\n";
    file_put_contents($log_file, $log, FILE_APPEND);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
