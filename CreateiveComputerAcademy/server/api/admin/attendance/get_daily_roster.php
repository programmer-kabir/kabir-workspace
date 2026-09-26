<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';
require_once '../../attendance/AttendanceSecurityHelper.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

$date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');

AttendanceSecurityHelper::ensureTables($db);

try {
    // Get all active staff with their shift info
    $query = "
        SELECT 
            u.id as user_id,
            u.name,
            u.profile_picture,
            e.designation,
            e.shift_start,
            e.shift_end,
            e.allocated_break_minutes,
            a.id as attendance_id,
            a.check_in,
            a.check_out,
            a.status as attendance_status,
            COALESCE(a.is_forgotten_checkout, 0) as is_forgotten_checkout
        FROM users u
        INNER JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN employees e ON u.id = e.user_id
        LEFT JOIN attendance a ON u.id = a.user_id AND a.date = :date
        WHERE ur.role IN ('staff', 'manager', 'instructor') AND u.status = 'active'
        ORDER BY u.name ASC
    ";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':date', $date);
    $stmt->execute();

    $staff_list = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Calculate total break minutes for this staff on this date
        $break_stmt = $db->prepare("
            SELECT SUM(duration_minutes) as total_break_minutes 
            FROM employee_breaks 
            WHERE user_id = :user_id AND date = :date AND status = 'Completed'
        ");
        $break_stmt->execute([':user_id' => $row['user_id'], ':date' => $date]);
        $break_data = $break_stmt->fetch(PDO::FETCH_ASSOC);
        $row['total_break_minutes'] = (int)($break_data['total_break_minutes'] ?? 0);

        // Fetch device log summary if attendance_id exists
        $row['device_log'] = null;
        if (!empty($row['attendance_id'])) {
            $log_stmt = $db->prepare("
                SELECT id, punch_type, ip_address, network_type, device_type, device_brand, device_model, 
                       os_name, browser_name, distance_meters, is_within_geofence, trust_score, 
                       fraud_flags, verification_status, latitude, longitude
                FROM attendance_device_logs 
                WHERE attendance_id = :att_id 
                ORDER BY id DESC LIMIT 1
            ");
            $log_stmt->execute([':att_id' => $row['attendance_id']]);
            $dev_log = $log_stmt->fetch(PDO::FETCH_ASSOC);
            if ($dev_log) {
                if (!empty($dev_log['fraud_flags'])) {
                    $dev_log['fraud_flags'] = json_decode($dev_log['fraud_flags'], true) ?: [];
                } else {
                    $dev_log['fraud_flags'] = [];
                }
                $row['device_log'] = $dev_log;
            }
        }

        // Calculate net work duration & whether they completed their shift
        $row['net_work_minutes'] = null;
        $row['work_status'] = 'absent'; // absent | in_progress | completed | short

        if ($row['attendance_status'] === 'Leave') {
            $row['work_status'] = 'leave';
        } elseif ($row['check_in'] && $row['check_out']) {
            $in_ts  = strtotime($row['check_in']);
            $out_ts = strtotime($row['check_out']);
            $gross_minutes = ($out_ts - $in_ts) / 60;
            $net_minutes = $gross_minutes; // Do not subtract break time
            $row['net_work_minutes'] = (int)$net_minutes;

            // Expected work minutes from shift_start → shift_end (Do not subtract allocated break)
            $shift_start_ts = strtotime($date . ' ' . ($row['shift_start'] ?? '09:00:00'));
            $shift_end_ts   = strtotime($date . ' ' . ($row['shift_end']   ?? '17:00:00'));
            $expected_work_minutes = ($shift_end_ts - $shift_start_ts) / 60;

            $row['expected_work_minutes'] = (int)$expected_work_minutes;

            // 15-minute tolerance
            if ($net_minutes >= ($expected_work_minutes - 15)) {
                $row['work_status'] = 'completed';
            } else {
                $row['work_status'] = 'short';
                $row['short_by_minutes'] = (int)($expected_work_minutes - $net_minutes);
            }

        } elseif ($row['check_in'] && !$row['check_out']) {
            $row['work_status'] = 'in_progress';
        } else {
            $row['work_status'] = 'absent';
        }

        $staff_list[] = $row;
    }

    echo json_encode([
        "status" => "success",
        "date"   => $date,
        "data"   => $staff_list
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
