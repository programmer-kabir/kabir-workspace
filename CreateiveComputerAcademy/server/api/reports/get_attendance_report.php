<?php
require_once '../../config/database.php';
require_once '../../config/cors.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

$data = json_decode(file_get_contents("php://input"));

if(!isset($data->user_id) || !isset($data->start_date) || !isset($data->end_date)) {
    echo json_encode(["status" => "error", "message" => "Missing required parameters."]);
    exit;
}

$user_id = $data->user_id;
$start_date = $data->start_date;
$end_date = $data->end_date;

// Get Employee Shift Hours and Joining Date
$shift_hours = 8; // Default
$join_date_ts = 0; // Default

try {
    $emp_query = "SELECT * FROM employees WHERE user_id = :user_id LIMIT 1";
    $emp_stmt = $db->prepare($emp_query);
    $emp_stmt->bindParam(':user_id', $user_id);
    $emp_stmt->execute();
    if($emp_stmt->rowCount() > 0) {
        $row = $emp_stmt->fetch(PDO::FETCH_ASSOC);
        if(isset($row['shift_hours'])) $shift_hours = $row['shift_hours'];
        if(isset($row['joining_date']) && !empty($row['joining_date'])) {
            $join_date_ts = strtotime(date('Y-m-d', strtotime($row['joining_date'])));
        }
    }
} catch (Exception $e) {
    // Ignore error
}

if ($join_date_ts == 0) {
    try {
        $usr_query = "SELECT * FROM users WHERE id = :user_id LIMIT 1";
        $usr_stmt = $db->prepare($usr_query);
        $usr_stmt->bindParam(':user_id', $user_id);
        $usr_stmt->execute();
        if($usr_stmt->rowCount() > 0) {
            $row = $usr_stmt->fetch(PDO::FETCH_ASSOC);
            if(isset($row['created_at']) && !empty($row['created_at'])) {
                $join_date_ts = strtotime(date('Y-m-d', strtotime($row['created_at'])));
            }
        }
    } catch (Exception $e) {
        // Ignore error
    }
}

$query = "SELECT date, check_in, check_out, status FROM attendance 
          WHERE user_id = :user_id AND date >= :start_date AND date <= :end_date 
          ORDER BY date DESC";
$stmt = $db->prepare($query);
$stmt->bindParam(':user_id', $user_id);
$stmt->bindParam(':start_date', $start_date);
$stmt->bindParam(':end_date', $end_date);
$stmt->execute();

// Get Holidays for this period
$holidays = [];
$hol_query = "SELECT date, title, expected_hours FROM holidays WHERE date >= :start_date AND date <= :end_date";
$hol_stmt = $db->prepare($hol_query);
$hol_stmt->bindParam(':start_date', $start_date);
$hol_stmt->bindParam(':end_date', $end_date);
$hol_stmt->execute();
while($h = $hol_stmt->fetch(PDO::FETCH_ASSOC)) {
    $holidays[$h['date']] = $h;
}

$db_records = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $db_records[$row['date']] = $row;
}

// Get Breaks for this period
$breaks_by_date = [];
$break_query = "SELECT date, SUM(duration_minutes) as total_mins FROM user_breaks WHERE user_id = :user_id AND date >= :start_date AND date <= :end_date AND status = 'Completed' GROUP BY date";
$break_stmt = $db->prepare($break_query);
$break_stmt->bindParam(':user_id', $user_id);
$break_stmt->bindParam(':start_date', $start_date);
$break_stmt->bindParam(':end_date', $end_date);
$break_stmt->execute();
while($b = $break_stmt->fetch(PDO::FETCH_ASSOC)) {
    $breaks_by_date[$b['date']] = (int)$b['total_mins'];
}

$history = [];
$summary = [
    'total_days' => 0,
    'present' => 0,
    'late' => 0,
    'leave' => 0,
    'student_leave' => 0,
    'absent' => 0,
    'total_overtime_seconds' => 0,
    'total_short_seconds' => 0,
    'total_expected_seconds' => 0,
    'total_worked_seconds' => 0
];

// Get Approved Leaves and Mango Full Day Breaks for this period
$leaves_by_date = [];
try {
    $lv_stmt = $db->prepare("SELECT start_date, end_date, type FROM leave_requests WHERE user_id = :user_id AND status = 'Approved' AND start_date <= :end_date AND end_date >= :start_date");
    $lv_stmt->execute([':user_id' => $user_id, ':start_date' => $start_date, ':end_date' => $end_date]);
    while ($lv = $lv_stmt->fetch(PDO::FETCH_ASSOC)) {
        $cur = strtotime($lv['start_date']);
        $last = strtotime($lv['end_date']);
        while ($cur <= $last) {
            $leaves_by_date[date('Y-m-d', $cur)] = $lv['type'] ?: 'Approved Leave';
            $cur = strtotime('+1 day', $cur);
        }
    }
} catch (Throwable $e) {}

try {
    $mb_stmt = $db->prepare("SELECT date, reason FROM user_breaks WHERE user_id = :user_id AND break_type = 'Mango Full Day' AND status = 'Approved' AND date >= :start_date AND date <= :end_date");
    $mb_stmt->execute([':user_id' => $user_id, ':start_date' => $start_date, ':end_date' => $end_date]);
    while ($mb = $mb_stmt->fetch(PDO::FETCH_ASSOC)) {
        $leaves_by_date[$mb['date']] = 'Mango Paid Leave';
    }
} catch (Throwable $e) {}

$today_str = date('Y-m-d');
$loop_end_date = ($end_date > $today_str) ? $today_str : date('Y-m-d', strtotime($end_date));

$current_date_ts = strtotime(date('Y-m-d', strtotime($start_date)));
$end_date_ts = strtotime($loop_end_date);

while ($current_date_ts <= $end_date_ts) {
    // Check if the current loop date is before they joined
    if ($current_date_ts < $join_date_ts) {
        $current_date_ts = strtotime('+1 day', $current_date_ts);
        continue;
    }
    
    $current_date_str = date('Y-m-d', $current_date_ts);
    
    $row = [
        'date' => $current_date_str,
        'check_in' => null,
        'check_out' => null,
        'status' => 'Absent',
        'total_hours' => null,
        'expected_hours' => null,
        'overtime' => null,
        'total_break_minutes' => isset($breaks_by_date[$current_date_str]) ? $breaks_by_date[$current_date_str] : 0,
        'is_short' => false,
        'is_weekend' => false,
        'is_holiday' => false
    ];
    
    $is_weekend = (date('N', $current_date_ts) == 5); // 5 is Friday
    $is_holiday = isset($holidays[$current_date_str]) && $holidays[$current_date_str]['expected_hours'] == 0;
    
    $row['is_weekend'] = $is_weekend;
    $row['is_holiday'] = $is_holiday;
    
    // Determine if this date is an approved leave or student leave
    $db_status = isset($db_records[$current_date_str]) ? $db_records[$current_date_str]['status'] : null;
    $leave_type = isset($leaves_by_date[$current_date_str]) ? $leaves_by_date[$current_date_str] : null;
    $is_student_leave = ($db_status === 'Student Leave' || $leave_type === 'Student Academic Leave');
    $is_regular_leave = ($db_status === 'Leave' || ($leave_type && !$is_student_leave));

    if (!$is_weekend && !$is_holiday) {
        $summary['total_days']++;
    }
    
    // Calculate expected seconds for this day (Student leave and approved leaves excuse daily expected duty)
    $expected_seconds = ($is_weekend || $is_student_leave) ? 0 : ($shift_hours * 3600);
    if (isset($holidays[$current_date_str])) {
        $expected_seconds = $holidays[$current_date_str]['expected_hours'] * 3600;
    }
    if (!$is_student_leave) {
        $summary['total_expected_seconds'] += $expected_seconds;
    }
    
    if (isset($db_records[$current_date_str])) {
        $db_row = $db_records[$current_date_str];
        $row['check_in'] = $db_row['check_in'];
        $row['check_out'] = $db_row['check_out'];
        $row['status'] = $db_row['status'];
        
        if ($row['status'] === 'Present') $summary['present']++;
        if ($row['status'] === 'Late') $summary['late']++;
        if ($row['status'] === 'Student Leave' || $is_student_leave) {
            $row['status'] = 'Student Leave';
            $row['is_unpaid'] = true;
            $row['leave_title'] = $leave_type ?: 'Student Academic Leave';
            $row['expected_hours'] = '0h 0m';
            $row['total_hours'] = '0h 0m';
            $summary['student_leave']++;
        } elseif ($row['status'] === 'Leave' || $is_regular_leave) {
            $row['status'] = 'Leave';
            $row['leave_title'] = $leave_type ?: 'Approved Leave';
            $row['expected_hours'] = '0h 0m';
            $summary['leave']++;
        }
        
        if($row['check_in'] && $row['check_out']) {
            $in_time = strtotime($row['check_in']);
            $out_time = strtotime($row['check_out']);
            $diff_seconds = $out_time - $in_time;
            $summary['total_worked_seconds'] += $diff_seconds;
            
            $hours = floor($diff_seconds / 3600);
            $minutes = floor(($diff_seconds % 3600) / 60);
            $row['total_hours'] = $hours . 'h ' . $minutes . 'm';
            
            $is_special_day = isset($holidays[$current_date_str]);
            
            $exp_h = floor($expected_seconds / 3600);
            $exp_m = floor(($expected_seconds % 3600) / 60);
            $row['expected_hours'] = $exp_h . 'h ' . $exp_m . 'm';
            
            if($diff_seconds > $expected_seconds) {
                $ot_seconds = $diff_seconds - $expected_seconds;
                $summary['total_overtime_seconds'] += $ot_seconds;
                
                $ot_hours = floor($ot_seconds / 3600);
                $ot_minutes = floor(($ot_seconds % 3600) / 60);
                $row['overtime'] = '+' . $ot_hours . 'h ' . $ot_minutes . 'm';
                if($is_weekend || $is_special_day) {
                    $row['overtime'] .= ' (OT)';
                }
            } else if ($diff_seconds < $expected_seconds) {
                $short_seconds = $expected_seconds - $diff_seconds;
                if ($short_seconds > 900) { // more than 15 mins
                    $row['is_short'] = true;
                    $summary['total_short_seconds'] += $short_seconds;
                    
                    $sh_hours = floor($short_seconds / 3600);
                    $sh_minutes = floor(($short_seconds % 3600) / 60);
                    $row['overtime'] = '-' . $sh_hours . 'h ' . $sh_minutes . 'm';
                }
            }
        }
    } else {
        // No check in
        if ($is_holiday) {
            $row['status'] = 'Holiday';
        } else if ($is_weekend) {
            $row['status'] = 'Weekend';
        } else if (isset($leaves_by_date[$current_date_str])) {
            $isStudentLv = ($leaves_by_date[$current_date_str] === 'Student Academic Leave');
            $row['status'] = $isStudentLv ? 'Student Leave' : 'Leave';
            $row['leave_title'] = $leaves_by_date[$current_date_str];
            $row['is_unpaid'] = $isStudentLv;
            if ($isStudentLv) {
                $summary['student_leave']++;
            } else {
                $summary['leave']++;
            }
        } else {
            $row['status'] = 'Absent';
            $summary['absent']++;
        }
        
        $exp_h = floor($expected_seconds / 3600);
        $exp_m = floor(($expected_seconds % 3600) / 60);
        $row['expected_hours'] = $exp_h . 'h ' . $exp_m . 'm';
    }
    
    // Add to history (prepend so most recent is first)
    array_unshift($history, $row);
    
    // Move to next day
    $current_date_ts = strtotime('+1 day', $current_date_ts);
}

// Format summary times
$ot_h = floor($summary['total_overtime_seconds'] / 3600);
$ot_m = floor(($summary['total_overtime_seconds'] % 3600) / 60);
$summary['total_overtime'] = $ot_h . 'h ' . $ot_m . 'm';

$sh_h = floor($summary['total_short_seconds'] / 3600);
$sh_m = floor(($summary['total_short_seconds'] % 3600) / 60);
$summary['total_short_time'] = $sh_h . 'h ' . $sh_m . 'm';

$exp_h = floor($summary['total_expected_seconds'] / 3600);
$exp_m = floor(($summary['total_expected_seconds'] % 3600) / 60);
$summary['total_expected'] = $exp_h . 'h ' . $exp_m . 'm';

$wrk_h = floor($summary['total_worked_seconds'] / 3600);
$wrk_m = floor(($summary['total_worked_seconds'] % 3600) / 60);
$summary['total_worked'] = $wrk_h . 'h ' . $wrk_m . 'm';

echo json_encode([
    "status" => "success", 
    "summary" => $summary,
    "history" => $history
]);
?>
