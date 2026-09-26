<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!isset($_GET['user_id'])) {
    echo json_encode(["status" => "error", "message" => "user_id is required."]);
    exit;
}

$user_id = $_GET['user_id'];

try {
    // 1. Get Employee Info
    $query_emp = "SELECT id as employee_id, shift_hours, joining_date, allocated_break_minutes FROM employees WHERE user_id = :user_id LIMIT 1";
    $stmt_emp = $db->prepare($query_emp);
    $stmt_emp->execute([':user_id' => $user_id]);
    $emp_info = $stmt_emp->fetch(PDO::FETCH_ASSOC);
    
    $employee_id = $emp_info ? $emp_info['employee_id'] : null;
    $shift_hours = $emp_info && isset($emp_info['shift_hours']) ? $emp_info['shift_hours'] : 8;

    // 2. Task Stats
    $task_stats = [
        "total" => 0,
        "completed" => 0,
        "in_progress" => 0,
        "to_do" => 0,
        "in_review" => 0,
        "rejected" => 0
    ];
    $recent_tasks = [];

    if ($employee_id) {
        $query_stats = "SELECT status, COUNT(*) as count FROM tasks WHERE assigned_to = :employee_id GROUP BY status";
        $stmt_stats = $db->prepare($query_stats);
        $stmt_stats->execute([':employee_id' => $employee_id]);
        
        while ($row = $stmt_stats->fetch(PDO::FETCH_ASSOC)) {
            $task_stats["total"] += $row['count'];
            switch (strtolower(str_replace(' ', '_', $row['status']))) {
                case 'completed': $task_stats["completed"] = $row['count']; break;
                case 'in_progress': $task_stats["in_progress"] = $row['count']; break;
                case 'to-do': $task_stats["to_do"] = $row['count']; break;
                case 'in_review': $task_stats["in_review"] = $row['count']; break;
                case 'rejected': $task_stats["rejected"] = $row['count']; break;
            }
        }

        $query_recent = "SELECT id, title, status, priority, deadline FROM tasks WHERE assigned_to = :employee_id ORDER BY created_at DESC LIMIT 5";
        $stmt_recent = $db->prepare($query_recent);
        $stmt_recent->execute([':employee_id' => $employee_id]);
        $recent_tasks = $stmt_recent->fetchAll(PDO::FETCH_ASSOC);
    }

    // 3. Attendance Stats
    $att_stats = [
        "present" => 0,
        "absent" => 0,
        "leave" => 0,
        "half_day" => 0,
        "holiday" => 0,
        "total_expected_seconds" => 0,
        "total_worked_seconds" => 0,
        "total_overtime_seconds" => 0,
        "total_short_seconds" => 0,
        "total_break_minutes" => 0,
        "allocated_break_minutes" => 60
    ];

    if ($employee_id && isset($emp_info['allocated_break_minutes'])) {
        $att_stats['allocated_break_minutes'] = $emp_info['allocated_break_minutes'];
    }

    // Get today's total break minutes
    $break_query = "SELECT SUM(duration_minutes) as total_break FROM employee_breaks WHERE user_id = :user_id AND date = :today AND status = 'Completed'";
    $break_stmt = $db->prepare($break_query);
    $break_stmt->execute([':user_id' => $user_id, ':today' => date('Y-m-d')]);
    $break_row = $break_stmt->fetch(PDO::FETCH_ASSOC);
    if ($break_row && $break_row['total_break']) {
        $att_stats['total_break_minutes'] = (int)$break_row['total_break'];
    }
    
    // Add current active break duration if any
    $active_break_query = "SELECT start_time FROM employee_breaks WHERE user_id = :user_id AND status = 'Active' LIMIT 1";
    $ab_stmt = $db->prepare($active_break_query);
    $ab_stmt->execute([':user_id' => $user_id]);
    if ($ab_row = $ab_stmt->fetch(PDO::FETCH_ASSOC)) {
        $start_ts = strtotime($ab_row['start_time']);
        $now_ts = time();
        $att_stats['total_break_minutes'] += round(abs($now_ts - $start_ts) / 60);
    }

    // Determine joining date
    $join_date_ts = 0;
    if (isset($emp_info['joining_date']) && !empty($emp_info['joining_date'])) {
        $join_date_ts = strtotime(date('Y-m-d', strtotime($emp_info['joining_date'])));
    } else {
        $usr_query = "SELECT created_at FROM users WHERE id = :user_id LIMIT 1";
        $usr_stmt = $db->prepare($usr_query);
        $usr_stmt->execute([':user_id' => $user_id]);
        $u_row = $usr_stmt->fetch(PDO::FETCH_ASSOC);
        if ($u_row && !empty($u_row['created_at'])) {
            $join_date_ts = strtotime(date('Y-m-d', strtotime($u_row['created_at'])));
        }
    }

    $start_date = $join_date_ts ? date('Y-m-d', $join_date_ts) : date('Y-m-d', strtotime('-30 days'));
    $end_date = date('Y-m-d');

    $query_att = "SELECT date, check_in, check_out, status FROM attendance 
                  WHERE user_id = :user_id AND date >= :start_date AND date <= :end_date";
    $stmt_att = $db->prepare($query_att);
    $stmt_att->execute([
        ':user_id' => $user_id,
        ':start_date' => $start_date,
        ':end_date' => $end_date
    ]);
    
    $db_records = [];
    while ($row = $stmt_att->fetch(PDO::FETCH_ASSOC)) {
        $db_records[$row['date']] = $row;
    }

    $holidays = [];
    $hol_query = "SELECT date, expected_hours FROM holidays WHERE date >= :start_date AND date <= :end_date";
    $hol_stmt = $db->prepare($hol_query);
    $hol_stmt->execute([
        ':start_date' => $start_date,
        ':end_date' => $end_date
    ]);
    while($h = $hol_stmt->fetch(PDO::FETCH_ASSOC)) {
        $holidays[$h['date']] = $h;
    }

    $current_date_ts = strtotime($start_date);
    $end_date_ts = strtotime($end_date);

    while ($current_date_ts <= $end_date_ts) {
        $current_date_str = date('Y-m-d', $current_date_ts);
        
        $is_weekend = (date('N', $current_date_ts) == 5); // Friday
        $is_holiday = isset($holidays[$current_date_str]) && $holidays[$current_date_str]['expected_hours'] == 0;
        
        $expected_seconds = $is_weekend ? 0 : ($shift_hours * 3600);
        if (isset($holidays[$current_date_str])) {
            $expected_seconds = $holidays[$current_date_str]['expected_hours'] * 3600;
        }
        $att_stats['total_expected_seconds'] += $expected_seconds;

        if (isset($db_records[$current_date_str])) {
            $db_row = $db_records[$current_date_str];
            $status = strtolower(str_replace(' ', '_', $db_row['status']));
            
            // "Late" counts as "present" basically
            if ($status === 'present' || $status === 'late') {
                $att_stats['present']++;
            } else if (isset($att_stats[$status])) {
                $att_stats[$status]++;
            }

            if ($db_row['check_in'] && $db_row['check_out']) {
                $ci = strtotime($db_row['check_in']);
                $co = strtotime($db_row['check_out']);
                $diff_seconds = $co - $ci;
                
                if ($diff_seconds > 0) {
                    $att_stats['total_worked_seconds'] += $diff_seconds;
                    
                    if ($diff_seconds > $expected_seconds) {
                        $att_stats['total_overtime_seconds'] += ($diff_seconds - $expected_seconds);
                    } else if ($diff_seconds < $expected_seconds) {
                        $short = $expected_seconds - $diff_seconds;
                        if ($short > 900) { // more than 15 mins
                            $att_stats['total_short_seconds'] += $short;
                        }
                    }
                }
            }
        } else {
            if (!$is_weekend && !$is_holiday) {
                $att_stats['absent']++;
            }
        }
        
        $current_date_ts = strtotime('+1 day', $current_date_ts);
    }
    
    // Format numbers
    $format_time = function($secs) {
        $h = floor($secs / 3600);
        $m = floor(($secs % 3600) / 60);
        return "{$h}h {$m}m";
    };

    $att_stats["expected_duty"] = $format_time($att_stats["total_expected_seconds"]);
    $att_stats["hours_worked"] = $format_time($att_stats["total_worked_seconds"]);
    $att_stats["overtime"] = $format_time($att_stats["total_overtime_seconds"]);
    $att_stats["short_time"] = $format_time($att_stats["total_short_seconds"]);

    echo json_encode([
        "status" => "success",
        "data" => [
            "task_stats" => $task_stats,
            "recent_tasks" => $recent_tasks,
            "attendance_stats" => $att_stats
        ]
    ]);
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
