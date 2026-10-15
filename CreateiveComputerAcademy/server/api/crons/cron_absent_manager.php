<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/PusherHelper.php';
require_once __DIR__ . '/../notifications/notification_helper.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

$now = date('Y-m-d H:i:s');
$current_time = date('H:i:s');
$current_hour = (int)date('H');
$current_minute = (int)date('i');

// 1. Determine target date (default today, allow override for manual back-testing)
$target_date = isset($_GET['date']) ? trim($_GET['date']) : date('Y-m-d');
if (isset($argv) && is_array($argv)) {
    foreach ($argv as $arg) {
        if (strpos($arg, '--date=') === 0 || strpos($arg, 'date=') === 0) {
            $parts = explode('=', $arg, 2);
            if (!empty($parts[1])) {
                $target_date = trim($parts[1]);
            }
        }
    }
}

// Validate target date format
$dCheck = DateTime::createFromFormat('Y-m-d', $target_date);
if (!$dCheck || $dCheck->format('Y-m-d') !== $target_date) {
    echo json_encode(["status" => "error", "message" => "Invalid date format. Expected YYYY-MM-DD."]);
    exit;
}

// 2. Force flag
$force_run = isset($_GET['force']) || (isset($argv) && is_array($argv) && in_array('--force', $argv));

// 3. Determine action: explicitly via parameter or auto-detected by time
$action = isset($_GET['action']) ? strtolower(trim($_GET['action'])) : (isset($_POST['action']) ? strtolower(trim($_POST['action'])) : null);
if (!$action && isset($argv) && is_array($argv)) {
    foreach ($argv as $arg) {
        if (strpos($arg, '--action=') === 0 || strpos($arg, 'action=') === 0) {
            $parts = explode('=', $arg, 2);
            $action = strtolower(trim($parts[1]));
        } elseif (in_array(strtolower($arg), ['warning', 'execute'])) {
            $action = strtolower($arg);
        }
    }
}

// Auto-detection if not specified
if (!$action) {
    // 20:00 (8:00 PM) to 23:14 (11:14 PM) -> Warning Phase
    // 23:15 (11:15 PM) onwards -> Execution Phase
    if ($current_hour >= 20 && ($current_hour < 23 || ($current_hour == 23 && $current_minute < 15))) {
        $action = 'warning';
    } elseif ($current_hour >= 23 && $current_minute >= 15) {
        $action = 'execute';
    } else {
        // Outside the scheduled night window
        if ($force_run) {
            $action = 'warning'; // default to warning if forced
        } else {
            echo json_encode([
                "status" => "idle",
                "message" => "Current time ({$current_time}) is outside absent cron execution window (8:00 PM for Warning, 11:15 PM for Execution). Pass action=warning or action=execute to run manually.",
                "current_time" => $current_time
            ]);
            exit;
        }
    }
}

// 4. Log setup
$log_file = __DIR__ . '/cron_absent_log.txt';
$log = "[{$now}] [ACTION: {$action}] [DATE: {$target_date}] Auto-Absent Manager started.\n";

try {
    // ── SAFETY CHECK 1: FRIDAY (WEEKLY OFF-DAY) ──────────────────────────────────
    $day_of_week = (int)date('N', strtotime($target_date)); // 5 is Friday
    if ($day_of_week === 5 && !$force_run) {
        $log .= "  -> [WEEKEND] {$target_date} is Friday. Academy closed. Skipping auto-absent.\n\n";
        file_put_contents($log_file, $log, FILE_APPEND);
        echo json_encode([
            "status" => "skipped",
            "reason" => "weekend_friday",
            "message" => "Target date ({$target_date}) is Friday. Academy is closed, no attendance required."
        ]);
        exit;
    }

    // ── SAFETY CHECK 2: PUBLIC / ACADEMY HOLIDAYS ───────────────────────────────
    $holStmt = $db->prepare("SELECT title, expected_hours FROM holidays WHERE date = :target_date LIMIT 1");
    $holStmt->execute([':target_date' => $target_date]);
    $holiday = $holStmt->fetch(PDO::FETCH_ASSOC);

    if ($holiday && (float)($holiday['expected_hours'] ?? 0) <= 0 && !$force_run) {
        $holTitle = $holiday['title'] ?? 'Official Holiday';
        $log .= "  -> [HOLIDAY] {$target_date} is an Academy Holiday ({$holTitle}). Skipping auto-absent.\n\n";
        file_put_contents($log_file, $log, FILE_APPEND);
        echo json_encode([
            "status" => "skipped",
            "reason" => "holiday",
            "holiday_title" => $holTitle,
            "message" => "Target date ({$target_date}) is an Academy Holiday ({$holTitle}). No attendance required."
        ]);
        exit;
    }

    // ── 5. FETCH ALL ACTIVE STAFF MEMBERS ───────────────────────────────────────
    $staffQuery = "
        SELECT u.id as user_id, u.name, u.email, u.phone,
               COALESCE(e.shift_hours, 8) as shift_hours,
               COALESCE(e.shift_start, '09:00:00') as shift_start,
               COALESCE(e.shift_end, '17:00:00') as shift_end
        FROM users u
        INNER JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN employees e ON u.id = e.user_id
        WHERE ur.role IN ('staff', 'manager', 'instructor')
          AND u.status = 'active'
          AND (e.employment_status IS NULL OR e.employment_status = 'active')
          AND (e.resignation_date IS NULL OR e.resignation_date > :target_date)
        GROUP BY u.id
        ORDER BY u.name ASC
    ";
    $staffStmt = $db->prepare($staffQuery);
    $staffStmt->execute([':target_date' => $target_date]);
    $allStaff = $staffStmt->fetchAll(PDO::FETCH_ASSOC);

    $totalStaff = count($allStaff);
    $presentCount = 0;
    $leaveCount = 0;
    $absentStaffList = [];

    // Prepared statements for lookups
    $attStmt = $db->prepare("
        SELECT id, check_in, check_out, status 
        FROM attendance 
        WHERE user_id = :user_id AND date = :target_date 
        ORDER BY id DESC LIMIT 1
    ");

    $leaveStmt = $db->prepare("
        SELECT id, type, reason 
        FROM leave_requests 
        WHERE user_id = :user_id 
          AND status = 'Approved' 
          AND :target_date BETWEEN start_date AND end_date 
        LIMIT 1
    ");

    foreach ($allStaff as $staff) {
        $uid = (int)$staff['user_id'];
        $name = $staff['name'];

        // 1. Check Attendance Record
        $attStmt->execute([':user_id' => $uid, ':target_date' => $target_date]);
        $attRecord = $attStmt->fetch(PDO::FETCH_ASSOC);

        $hasCheckedIn = false;
        $isExistingLeave = false;
        $isExistingAbsent = false;

        if ($attRecord) {
            $attStatus = strtolower($attRecord['status'] ?? '');
            if (!empty($attRecord['check_in']) || in_array($attStatus, ['present', 'late', 'half day', 'in_progress', 'completed'])) {
                $hasCheckedIn = true;
            } elseif ($attStatus === 'leave') {
                $isExistingLeave = true;
            } elseif ($attStatus === 'absent') {
                $isExistingAbsent = true;
            }
        }

        if ($hasCheckedIn) {
            $presentCount++;
            continue;
        }

        // 2. Check Approved Leave Requests
        $leaveStmt->execute([':user_id' => $uid, ':target_date' => $target_date]);
        $approvedLeave = $leaveStmt->fetch(PDO::FETCH_ASSOC);

        if ($approvedLeave || $isExistingLeave) {
            $leaveCount++;
            continue;
        }

        // Staff did NOT check in and has NO approved leave -> Target for Warning / Absent!
        $absentStaffList[] = [
            'user_id' => $uid,
            'name' => $name,
            'shift_hours' => (float)$staff['shift_hours'],
            'existing_attendance_id' => $attRecord ? (int)$attRecord['id'] : null,
            'is_existing_absent' => $isExistingAbsent
        ];
    }

    $missingCount = count($absentStaffList);
    $log .= "  -> Total Active Staff: {$totalStaff} | Present: {$presentCount} | On Leave: {$leaveCount} | Unexcused Missing: {$missingCount}\n";

    // ── PHASE 1: WARNING PHASE (8:00 PM) ─────────────────────────────────────────
    if ($action === 'warning') {
        $warningsSent = 0;
        $alreadyWarned = 0;

        $checkWarnStmt = $db->prepare("
            SELECT id FROM notifications 
            WHERE user_id = :user_id 
              AND type = 'attendance_absent_warning' 
              AND DATE(created_at) = :target_date 
            LIMIT 1
        ");

        foreach ($absentStaffList as $target) {
            $uid = $target['user_id'];
            $name = $target['name'];

            // Avoid double warning on the same date unless forced
            if (!$force_run) {
                $checkWarnStmt->execute([':user_id' => $uid, ':target_date' => $target_date]);
                if ($checkWarnStmt->fetch()) {
                    $alreadyWarned++;
                    continue;
                }
            }

            // In-app Notification
            $warnTitle = "হাজিরা সতর্কতা ⚠️ (Attendance Warning)";
            $warnMessage = "আজ {$target_date} কর্মদিবসে রাত ৮:০০ টা পর্যন্ত আপনার কোনো উপস্থিতি রেকর্ড পাওয়া যায়নি। যদি আপনি উপস্থিত থেকে থাকেন, তবে অনুগ্রহ করে রাত ১১:১৫ এর পূর্বেই হাজিরা প্রদান করুন। অন্যথায় সিস্টেম স্বয়ংক্রিয়ভাবে আপনাকে 'Absent' চিহ্নিত করবে এবং আম গাছ থেকে ৮ ঘণ্টা ঘাটতি ঋণ (Overtime Debt) কাটা হবে।";

            NotificationHelper::sendToUser(
                $db,
                $uid,
                null,
                $warnTitle,
                $warnMessage,
                'attendance_absent_warning',
                'staff',
                '/attendance',
                'high',
                [
                    'date' => $target_date,
                    'warning_time' => '20:00:00',
                    'cutoff_time' => '23:15:00',
                    'penalty_hours' => $target['shift_hours']
                ]
            );

            // Real-time Pusher Event to notify staff instant toast/alert
            try {
                PusherHelper::trigger('user-' . $uid, 'attendance-warning', [
                    'title' => $warnTitle,
                    'message' => $warnMessage,
                    'date' => $target_date,
                    'cutoff_time' => '11:15 PM'
                ]);

                PusherHelper::trigger('staff-attendance', 'attendance-warning', [
                    'user_id' => $uid,
                    'name' => $name,
                    'date' => $target_date
                ]);
            } catch (Throwable $pe) {}

            $warningsSent++;
            $log .= "  -> [WARNING SENT] Staff #{$uid} ({$name})\n";
        }

        $log .= "[{$now}] Warning Phase Completed: {$warningsSent} sent, {$alreadyWarned} already warned.\n\n";
        file_put_contents($log_file, $log, FILE_APPEND);

        echo json_encode([
            "status" => "success",
            "action" => "warning",
            "date" => $target_date,
            "total_staff" => $totalStaff,
            "present_count" => $presentCount,
            "leave_count" => $leaveCount,
            "missing_count" => $missingCount,
            "warnings_sent" => $warningsSent,
            "already_warned" => $alreadyWarned,
            "staff_warned" => array_column($absentStaffList, 'name')
        ]);
        exit;
    }

    // ── PHASE 2: EXECUTION PHASE (11:15 PM) ───────────────────────────────────────
    if ($action === 'execute') {
        $markedAbsentCount = 0;
        $alreadyMarkedCount = 0;
        $absentStaffNames = [];

        $insertAttStmt = $db->prepare("
            INSERT INTO attendance (user_id, date, status, check_in, check_out, is_forgotten_checkout) 
            VALUES (:user_id, :target_date, 'Absent', NULL, NULL, 0)
        ");

        $updateAttStmt = $db->prepare("
            UPDATE attendance 
            SET status = 'Absent', check_in = NULL, check_out = NULL 
            WHERE id = :id
        ");

        foreach ($absentStaffList as $target) {
            $uid = $target['user_id'];
            $name = $target['name'];
            $attId = $target['existing_attendance_id'];
            $isAlreadyAbsent = $target['is_existing_absent'];

            if ($isAlreadyAbsent) {
                $alreadyMarkedCount++;
                continue;
            }

            // Insert or Update as Absent in attendance table
            if ($attId) {
                $updateAttStmt->execute([':id' => $attId]);
            } else {
                $insertAttStmt->execute([
                    ':user_id' => $uid,
                    ':target_date' => $target_date
                ]);
            }

            // In-app Notification for Staff
            $absentTitle = "অনুপস্থিতি চিহ্নিতকরণ ⚠️ (Marked as Absent)";
            $absentMessage = "আজ {$target_date} কর্মদিবসে রাত ১১:১৫ পর্যন্ত আপনার কোনো হাজিরা পাওয়া যায়নি। সিস্টেম স্বয়ংক্রিয়ভাবে আপনাকে 'Absent' চিহ্নিত করেছে এবং আম গাছ থেকে ৮ ঘণ্টার ঘাটতি ঋণ (Overtime Debt) প্রযোজ্য হয়েছে।";

            NotificationHelper::sendToUser(
                $db,
                $uid,
                null,
                $absentTitle,
                $absentMessage,
                'attendance_absent_executed',
                'staff',
                '/mango-break-tree',
                'high',
                [
                    'date' => $target_date,
                    'status' => 'Absent',
                    'deduction_hours' => $target['shift_hours']
                ]
            );

            // Pusher Event to staff & admin channels
            try {
                PusherHelper::trigger('user-' . $uid, 'staff-absent-marked', [
                    'title' => $absentTitle,
                    'message' => $absentMessage,
                    'date' => $target_date,
                    'status' => 'Absent'
                ]);

                PusherHelper::trigger('staff-attendance', 'staff-absent-marked', [
                    'user_id' => $uid,
                    'name' => $name,
                    'date' => $target_date,
                    'status' => 'Absent'
                ]);
            } catch (Throwable $pe) {}

            $markedAbsentCount++;
            $absentStaffNames[] = $name;
            $log .= "  -> [MARKED ABSENT] Staff #{$uid} ({$name}) on {$target_date}. -{$target['shift_hours']}h Overtime Debt applies.\n";
        }

        // Notify Admins if any staff were marked absent
        if ($markedAbsentCount > 0) {
            try {
                $adminTitle = "দৈনিক অনুপস্থিতি রিপোর্ট 📋";
                $adminMsg = "আজ {$target_date} তারিখে মোট {$markedAbsentCount} জন স্টাফ অনুপস্থিত ছিলেন এবং স্বয়ংক্রিয়ভাবে 'Absent' চিহ্নিত হয়েছেন: " . implode(', ', $absentStaffNames);
                NotificationHelper::sendToRole(
                    $db,
                    'admin',
                    null,
                    $adminTitle,
                    $adminMsg,
                    'admin_absent_summary',
                    'admin',
                    '/attendance',
                    'high',
                    [
                        'date' => $target_date,
                        'absent_count' => $markedAbsentCount,
                        'absent_names' => $absentStaffNames
                    ]
                );
            } catch (Throwable $te) {}
        }

        $log .= "[{$now}] Execution Phase Completed: {$markedAbsentCount} marked Absent, {$alreadyMarkedCount} already absent.\n\n";
        file_put_contents($log_file, $log, FILE_APPEND);

        echo json_encode([
            "status" => "success",
            "action" => "execute",
            "date" => $target_date,
            "total_staff" => $totalStaff,
            "present_count" => $presentCount,
            "leave_count" => $leaveCount,
            "marked_absent_count" => $markedAbsentCount,
            "already_marked_count" => $alreadyMarkedCount,
            "absent_staff_names" => $absentStaffNames
        ]);
        exit;
    }

} catch (PDOException $e) {
    $err = "[{$now}] ERROR: " . $e->getMessage() . "\n\n";
    file_put_contents($log_file, $err, FILE_APPEND);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
} catch (Throwable $t) {
    $err = "[{$now}] CRITICAL THROWABLE: " . $t->getMessage() . "\n\n";
    file_put_contents($log_file, $err, FILE_APPEND);
    echo json_encode(["status" => "error", "message" => $t->getMessage()]);
}
?>
