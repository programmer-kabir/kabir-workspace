<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../notifications/notification_helper.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

$today = date('Y-m-d');
$current_time = date('H:i:s');
$current_hour = (int)date('H');
$log_file = __DIR__ . '/auto_checkout_log.txt';
$log_time = date('Y-m-d H:i:s');
$log = "[{$log_time}] Auto Check-Out Cron started.\n";

$force_run = isset($_GET['force']) || (isset($argv) && is_array($argv) && in_array('--force', $argv));

try {
    // Find attendance records where staff checked in but forgot to check out.
    // Safety guard: For today's date, only process if running late at night (>= 23:00 / 11:00 PM) or if force flag is passed.
    $dateCondition = $force_run 
        ? "a.date <= :today" 
        : "(a.date < :today OR (a.date = :today AND :current_hour >= 23))";

    $query = "SELECT a.id as attendance_id, a.user_id, a.date, a.check_in, 
                     COALESCE(e.shift_end, r.shift_end, '17:00:00') as shift_end, 
                     u.name
              FROM attendance a
              LEFT JOIN employees e ON a.user_id = e.user_id
              LEFT JOIN reviewers r ON a.user_id = r.user_id
              LEFT JOIN users u ON a.user_id = u.id
              WHERE a.check_in IS NOT NULL 
                AND (a.check_out IS NULL OR a.check_out = '')
                AND {$dateCondition}";

    $stmt = $db->prepare($query);
    $params = [':today' => $today];
    if (!$force_run) {
        $params[':current_hour'] = $current_hour;
    }
    $stmt->execute($params);
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $processed_count = 0;
    $update_stmt = $db->prepare("UPDATE attendance SET check_out = :check_out, is_forgotten_checkout = 1 WHERE id = :id");

    foreach ($records as $rec) {
        $attendance_id = $rec['attendance_id'];
        $user_id = $rec['user_id'];
        $shift_end = !empty($rec['shift_end']) ? $rec['shift_end'] : '17:00:00';
        $check_in = !empty($rec['check_in']) ? $rec['check_in'] : null;

        // Ensure check_out is not earlier than check_in (handles late check-ins / evening shifts)
        $effective_checkout = $shift_end;
        if ($check_in && strtotime($shift_end) <= strtotime($check_in)) {
            $effective_checkout = date('H:i:s', min(strtotime('+1 hour', strtotime($check_in)), strtotime('23:59:00')));
        }

        // Set the check-out time
        $update_stmt->execute([
            ':check_out' => $effective_checkout,
            ':id' => $attendance_id
        ]);

        $formatted_checkout = date('h:i A', strtotime($effective_checkout));
        $is_today = ($rec['date'] === $today);
        $date_phrase = $is_today ? "আজ" : date('d M, Y', strtotime($rec['date'])) . " তারিখে";

        // Send push & database notification to the staff
        NotificationHelper::sendToUser(
            $db,
            $user_id,
            null,
            'Auto Check-Out Completed',
            "আপনি {$date_phrase} চেক-আউট করতে ভুলে গেছেন। সিস্টেম স্বয়ংক্রিয়ভাবে আপনার শিফট শেষে ({$formatted_checkout}) চেক-আউট সম্পন্ন করেছে।",
            'attendance_alert',
            'staff',
            '/attendance',
            'high',
            [
                'attendance_id' => $attendance_id,
                'is_forgotten_checkout' => 1,
                'date' => $rec['date'],
                'check_out' => $effective_checkout
            ]
        );

        // Auto-sync payroll earning (non-blocking)
        try {
            if (file_exists(__DIR__ . '/../payroll/PayrollHelper.php')) {
                require_once __DIR__ . '/../payroll/PayrollHelper.php';
                PayrollHelper::syncAttendanceEarnings($db, $user_id);
            }
        } catch (Throwable $e) {
            // Non-blocking payroll sync
        }

        $processed_count++;
        $log .= "  -> User {$rec['name']} (ID: {$user_id}) auto checked out at {$effective_checkout} for date {$rec['date']}.\n";
    }

    $log .= "[{$log_time}] Success: Auto check-out completed for {$processed_count} staff member(s).\n\n";
    file_put_contents($log_file, $log, FILE_APPEND);

    echo json_encode([
        "status" => "success",
        "message" => "Auto check-out processed for {$processed_count} staff member(s).",
        "processed_count" => $processed_count
    ]);
} catch (PDOException $e) {
    $log .= "[{$log_time}] ERROR: " . $e->getMessage() . "\n\n";
    file_put_contents($log_file, $log, FILE_APPEND);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
