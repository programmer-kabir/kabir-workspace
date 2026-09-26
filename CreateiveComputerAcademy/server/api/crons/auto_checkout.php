<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../notifications/notification_helper.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

$date = date('Y-m-d');
$log_file = __DIR__ . '/auto_checkout_log.txt';
$log_time = date('Y-m-d H:i:s');
$log = "[{$log_time}] Auto Check-Out Cron started.\n";

try {
    // Find all attendance records where staff checked in but forgot to check out
    $query = "SELECT a.id as attendance_id, a.user_id, a.date, a.check_in, e.shift_end, u.name
              FROM attendance a
              LEFT JOIN employees e ON a.user_id = e.user_id
              LEFT JOIN users u ON a.user_id = u.id
              WHERE a.check_in IS NOT NULL 
                AND (a.check_out IS NULL OR a.check_out = '')
                AND a.date <= :date";

    $stmt = $db->prepare($query);
    $stmt->execute([':date' => $date]);
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $processed_count = 0;
    $update_stmt = $db->prepare("UPDATE attendance SET check_out = :check_out, is_forgotten_checkout = 1 WHERE id = :id");

    foreach ($records as $rec) {
        $attendance_id = $rec['attendance_id'];
        $user_id = $rec['user_id'];
        $shift_end = !empty($rec['shift_end']) ? $rec['shift_end'] : '17:00:00';

        // Set the check-out time to the shift end time
        $update_stmt->execute([
            ':check_out' => $shift_end,
            ':id' => $attendance_id
        ]);

        $formatted_shift_end = date('h:i A', strtotime($shift_end));

        // Send push & database notification to the staff
        NotificationHelper::sendToUser(
            $db,
            $user_id,
            null,
            'Auto Check-Out Completed',
            "আপনি আজ চেক-আউট করতে ভুলে গেছেন। সিস্টেম স্বয়ংক্রিয়ভাবে আপনার শিফট শেষে ({$formatted_shift_end}) চেক-আউট সম্পন্ন করেছে।",
            'attendance_alert',
            'staff',
            '/attendance',
            'high',
            [
                'attendance_id' => $attendance_id,
                'is_forgotten_checkout' => 1,
                'date' => $rec['date'],
                'check_out' => $shift_end
            ]
        );

        $processed_count++;
        $log .= "  -> User {$rec['name']} (ID: {$user_id}) auto checked out at {$shift_end} for date {$rec['date']}.\n";
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
