<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

$start_date = isset($data->start_date) ? $data->start_date : date('Y-m-01');
$end_date = isset($data->end_date) ? $data->end_date : date('Y-m-d');
$department_id = isset($data->department_id) && $data->department_id !== 'all' ? intval($data->department_id) : null;

try {
    // 1. Fetch all employees
    $emp_query = "
        SELECT 
            e.id AS employee_id,
            e.user_id,
            e.designation,
            e.shift_hours,
            e.joining_date,
            e.department_id,
            u.name,
            u.email,
            u.phone,
            u.profile_picture,
            d.name AS department_name
        FROM employees e
        JOIN users u ON e.user_id = u.id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE u.status = 'active' OR u.status IS NULL
    ";

    if ($department_id) {
        $emp_query .= " AND e.department_id = :department_id";
    }

    $emp_query .= " ORDER BY d.name ASC, u.name ASC";

    $emp_stmt = $db->prepare($emp_query);
    if ($department_id) {
        $emp_stmt->bindParam(':department_id', $department_id, PDO::PARAM_INT);
    }
    $emp_stmt->execute();
    $employees = $emp_stmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. Fetch all attendance in period
    $att_query = "
        SELECT 
            user_id,
            date,
            check_in,
            check_out,
            status
        FROM attendance
        WHERE date >= :start_date AND date <= :end_date
        ORDER BY date DESC
    ";
    $att_stmt = $db->prepare($att_query);
    $att_stmt->execute([':start_date' => $start_date, ':end_date' => $end_date]);
    $attendance_rows = $att_stmt->fetchAll(PDO::FETCH_ASSOC);

    $attendance_by_user = [];
    foreach ($attendance_rows as $att) {
        $attendance_by_user[$att['user_id']][] = $att;
    }

    // 3. Fetch all tasks in period
    $task_query = "
        SELECT 
            t.id,
            t.title,
            t.assigned_to,
            t.created_by,
            COALESCE(tc_child.name, tc_sub.name, tc_main.name, '') AS category,
            t.priority,
            t.status,
            t.is_self_created,
            t.total_time_spent,
            t.assign_date,
            t.deadline,
            t.created_at,
            t.submitted_at,
            t.reviewed_at
        FROM tasks t
        LEFT JOIN task_categories tc_main ON t.category_id = tc_main.id
        LEFT JOIN task_categories tc_sub ON t.subcategory_id = tc_sub.id
        LEFT JOIN task_categories tc_child ON t.child_category_id = tc_child.id
        WHERE (DATE(COALESCE(t.assign_date, t.created_at)) >= :start_date AND DATE(COALESCE(t.assign_date, t.created_at)) <= :end_date)
           OR (t.submitted_at >= :start_dt AND t.submitted_at <= :end_dt)
        ORDER BY t.created_at DESC
    ";
    $task_stmt = $db->prepare($task_query);
    $task_stmt->execute([
        ':start_date' => $start_date,
        ':end_date'   => $end_date,
        ':start_dt'   => $start_date . ' 00:00:00',
        ':end_dt'     => $end_date . ' 23:59:59'
    ]);
    $task_rows = $task_stmt->fetchAll(PDO::FETCH_ASSOC);

    $tasks_by_emp = [];
    foreach ($task_rows as $t) {
        if (!empty($t['assigned_to'])) {
            $tasks_by_emp[$t['assigned_to']][] = $t;
        }
    }

    // 4. Fetch task logs in period for rejections and resubmissions
    $log_query = "
        SELECT task_id, status_from, status_to, created_at 
        FROM task_logs 
        WHERE created_at >= :start_dt AND created_at <= :end_dt
    ";
    $log_stmt = $db->prepare($log_query);
    $log_stmt->execute([
        ':start_dt' => $start_date . ' 00:00:00',
        ':end_dt'   => $end_date . ' 23:59:59'
    ]);
    $log_rows = $log_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $rejections_by_task = [];
    $resubmissions_by_task = [];
    foreach ($log_rows as $l) {
        if ($l['status_to'] === 'Rejected') {
            $rejections_by_task[$l['task_id']] = ($rejections_by_task[$l['task_id']] ?? 0) + 1;
        }
        if ($l['status_from'] === 'Rejected' && $l['status_to'] === 'In Progress') {
            $resubmissions_by_task[$l['task_id']] = ($resubmissions_by_task[$l['task_id']] ?? 0) + 1;
        }
    }

    // 4b. Fetch task reviews for ratings
    $all_task_ids = array_column($task_rows, 'id');
    $reviews_by_task = [];
    if (!empty($all_task_ids)) {
        $in_clause = implode(',', array_map('intval', $all_task_ids));
        $rev_stmt = $db->query("SELECT task_id, rating, feedback_notes, tags FROM task_reviews WHERE task_id IN ($in_clause)");
        if ($rev_stmt) {
            while ($r = $rev_stmt->fetch(PDO::FETCH_ASSOC)) {
                $reviews_by_task[$r['task_id']] = $r;
            }
        }
    }

    // Helper: calculate total calendar days and actual working days (excluding Friday weekly off)
    $start_ts = strtotime($start_date);
    $end_ts = strtotime($end_date);
    $diff_days = max(1, round(($end_ts - $start_ts) / 86400) + 1);

    $working_days_count = 0;
    for ($cur = $start_ts; $cur <= $end_ts; $cur += 86400) {
        $day_of_week = date('N', $cur); // 1 = Mon, 5 = Fri, 7 = Sun
        if ($day_of_week != 5) { // Exclude Friday (Weekly off)
            $working_days_count++;
        }
    }
    if ($working_days_count === 0) {
        $working_days_count = 1;
    }

    // 5. Build Aggregated Staff Data
    $staff_data = [];
    $dept_aggregates = [];
    $company_summary = [
        'total_employees'         => count($employees),
        'total_tasks_assigned'    => 0,
        'total_tasks_completed'   => 0,
        'total_tasks_in_review'   => 0,
        'total_tasks_in_progress' => 0,
        'total_tasks_todo'        => 0,
        'total_tasks_resubmitted' => 0,
        'total_tasks_rejected'    => 0,
        'total_worked_seconds'    => 0,
        'total_working_time_secs' => 0,
        'total_present_count'     => 0,
        'total_late_count'        => 0,
        'total_absent_count'      => 0,
        'total_leave_count'       => 0,
        'total_ratings_sum'       => 0,
        'total_ratings_count'     => 0
    ];

    foreach ($employees as $emp) {
        $u_id = $emp['user_id'];
        $e_id = $emp['employee_id'];
        $d_name = $emp['department_name'] ?: 'General';

        $user_att = $attendance_by_user[$u_id] ?? [];
        $user_tasks = $tasks_by_emp[$e_id] ?? [];

        // Attendance Stats
        $present_days = 0;
        $late_days = 0;
        $absent_days = 0;
        $leave_days = 0;
        $worked_secs = 0;

        foreach ($user_att as $a) {
            $st = strtolower($a['status'] ?? '');
            if ($st === 'present' || !empty($a['check_in'])) {
                $present_days++;
            }
            if ($st === 'late') {
                $late_days++;
            }
            if ($st === 'absent') {
                $absent_days++;
            }
            if ($st === 'leave') {
                $leave_days++;
            }

            // Calculate worked hours/secs from check_in and check_out
            if (!empty($a['check_in']) && !empty($a['check_out'])) {
                $in_t = strtotime($a['check_in']);
                $out_t = strtotime($a['check_out']);
                if ($out_t > $in_t) {
                    $worked_secs += ($out_t - $in_t);
                }
            } elseif (!empty($a['check_in']) && empty($a['check_out'])) {
                // Default shift hours if still checked in or not logged out
                $worked_secs += ($emp['shift_hours'] ? intval($emp['shift_hours']) : 8) * 3600;
            }
        }

        // Task Stats
        $assigned_count = count($user_tasks);
        $completed_count = 0;
        $in_review_count = 0;
        $in_progress_count = 0;
        $todo_count = 0;
        $task_worked_secs = 0;
        $rejections_count = 0;
        $resubmitted_count = 0;
        $on_time_count = 0;
        $rating_sum = 0;
        $rated_count = 0;

        foreach ($user_tasks as &$t) {
            $st = $t['status'];
            if ($st === 'Completed') $completed_count++;
            elseif ($st === 'In Review') $in_review_count++;
            elseif ($st === 'In Progress') $in_progress_count++;
            elseif ($st === 'To-Do') $todo_count++;

            $task_worked_secs += intval($t['total_time_spent'] ?? 0);
            if (isset($rejections_by_task[$t['id']])) {
                $rejections_count += $rejections_by_task[$t['id']];
            }
            if (isset($resubmissions_by_task[$t['id']])) {
                $resubmitted_count += $resubmissions_by_task[$t['id']];
            }

            // Attach review / rating
            if (isset($reviews_by_task[$t['id']])) {
                $t['rating'] = $reviews_by_task[$t['id']]['rating'];
                $t['feedback_notes'] = $reviews_by_task[$t['id']]['feedback_notes'];
                $t['tags'] = $reviews_by_task[$t['id']]['tags'];
                if (intval($t['rating']) > 0) {
                    $rating_sum += intval($t['rating']);
                    $rated_count++;
                }
            } else {
                $t['rating'] = null;
            }

            // Check if on-time
            if ($st === 'Completed' && !empty($t['deadline']) && !empty($t['reviewed_at'])) {
                $dl = strtotime($t['deadline'] . ' 23:59:59');
                $sub = strtotime($t['submitted_at'] ?? $t['reviewed_at']);
                if ($sub <= $dl) {
                    $on_time_count++;
                }
            } elseif ($st === 'Completed') {
                $on_time_count++;
            }
        }
        unset($t);

        // Average rating calculation (null/0 if 0 reviews)
        $avg_rating = $rated_count > 0 ? round($rating_sum / $rated_count, 1) : null;

        // Rates & KPIs: Exclude Fridays and approved leaves from expected working days
        $expected_working_days = max(1, $working_days_count - $leave_days);
        $attendance_rate = min(100, round(($present_days / $expected_working_days) * 100));

        $completion_rate = $assigned_count > 0 ? round(($completed_count / $assigned_count) * 100) : 0;
        $on_time_rate = $completed_count > 0 ? round(($on_time_count / $completed_count) * 100) : 100;
        $rejection_rate = $assigned_count > 0 ? round(($rejections_count / $assigned_count) * 100) : 0;

        // Composite Efficiency Score (0-100):
        $rej_penalty = min(20, $rejection_rate * 0.5);

        if ($assigned_count === 0 && $present_days === 0) {
            // Completely inactive in this date range: 0% score
            $score = 0;
            $tier = 'No Activity';
        } elseif ($assigned_count === 0 && $present_days > 0) {
            // Only office attendance recorded (0 tasks assigned) -> Max 30% from attendance
            $score = round($attendance_rate * 0.30);
            $tier = 'Attendance Only';
        } else {
            // Has tasks assigned
            $comp_pts = $completion_rate * 0.35;
            $att_pts = $attendance_rate * 0.30;

            if ($rated_count > 0) {
                // 35% Task Completion + 35% Quality Star Rating + 30% Attendance - Rejection Penalty
                $quality_pts = ($avg_rating / 5.0) * 100 * 0.35;
                $score = round($comp_pts + $quality_pts + $att_pts - $rej_penalty);
            } else {
                // Tasks assigned/completed but not yet reviewed with stars (quality portion unearned)
                $score = round($comp_pts + $att_pts - $rej_penalty);
            }
            $score = max(0, min(100, $score));

            if ($score >= 85) $tier = 'Top Performer';
            elseif ($score >= 70) $tier = 'High Output';
            elseif ($score >= 50) $tier = 'Good Standing';
            else $tier = 'Needs Attention';
        }

        // Average daily duty hours
        $avg_daily_hours = $present_days > 0 ? round(($worked_secs / 3600) / $present_days, 1) : 0;

        // Formatted strings
        $h = Math_floor_div($worked_secs, 3600);
        $m = Math_floor_div($worked_secs % 3600, 60);
        $total_office_worked_str = "{$h}h {$m}m";

        $th = Math_floor_div($task_worked_secs, 3600);
        $tm = Math_floor_div($task_worked_secs % 3600, 60);
        $total_task_worked_str = "{$th}h {$tm}m";

        // Global additions
        $company_summary['total_tasks_assigned'] += $assigned_count;
        $company_summary['total_tasks_completed'] += $completed_count;
        $company_summary['total_tasks_in_review'] += $in_review_count;
        $company_summary['total_tasks_in_progress'] += $in_progress_count;
        $company_summary['total_tasks_todo'] += $todo_count;
        $company_summary['total_tasks_resubmitted'] += $resubmitted_count;
        $company_summary['total_tasks_rejected'] += $rejections_count;
        $company_summary['total_worked_seconds'] += $worked_secs;
        $company_summary['total_working_time_secs'] += $task_worked_secs;
        $company_summary['total_present_count'] += $present_days;
        $company_summary['total_late_count'] += $late_days;
        $company_summary['total_absent_count'] += $absent_days;
        $company_summary['total_leave_count'] += $leave_days;
        $company_summary['total_ratings_sum'] += $rating_sum;
        $company_summary['total_ratings_count'] += $rated_count;

        // Department Aggregation
        if (!isset($dept_aggregates[$d_name])) {
            $dept_aggregates[$d_name] = [
                'department_name' => $d_name,
                'staff_count'     => 0,
                'tasks_assigned'  => 0,
                'tasks_completed' => 0,
                'worked_seconds'  => 0,
                'task_seconds'    => 0
            ];
        }
        $dept_aggregates[$d_name]['staff_count']++;
        $dept_aggregates[$d_name]['tasks_assigned'] += $assigned_count;
        $dept_aggregates[$d_name]['tasks_completed'] += $completed_count;
        $dept_aggregates[$d_name]['worked_seconds'] += $worked_secs;
        $dept_aggregates[$d_name]['task_seconds'] += $task_worked_secs;

        // Extract Recent 5 Tasks
        $recent_tasks = array_slice($user_tasks, 0, 5);

        // Extract Recent 7 Attendance Logs
        $recent_attendance = array_slice($user_att, 0, 7);

        $staff_data[] = [
            'employee_id'           => $emp['employee_id'],
            'user_id'               => $emp['user_id'],
            'name'                  => $emp['name'],
            'email'                 => $emp['email'],
            'phone'                 => $emp['phone'],
            'designation'           => $emp['designation'] ?: 'Staff',
            'department_name'       => $d_name,
            'department_id'         => $emp['department_id'],
            'profile_picture'       => $emp['profile_picture'],
            // Star Ratings
            'avg_rating'            => $avg_rating,
            'rated_count'           => $rated_count,
            // Attendance
            'present_days'          => $present_days,
            'late_days'             => $late_days,
            'absent_days'           => $absent_days,
            'leave_days'            => $leave_days,
            'total_worked_seconds'  => $worked_secs,
            'total_worked_formatted'=> $total_office_worked_str,
            'avg_daily_hours'       => $avg_daily_hours,
            'attendance_rate'       => $attendance_rate,
            // Tasks
            'tasks_assigned'        => $assigned_count,
            'tasks_completed'       => $completed_count,
            'tasks_in_review'       => $in_review_count,
            'tasks_in_progress'     => $in_progress_count,
            'tasks_todo'            => $todo_count,
            'tasks_resubmitted'     => $resubmitted_count,
            'tasks_rejected'        => $rejections_count,
            'task_worked_seconds'   => $task_worked_secs,
            'task_worked_formatted' => $total_task_worked_str,
            'completion_rate'       => $completion_rate,
            'on_time_rate'          => $on_time_rate,
            'rejection_rate'        => $rejection_rate,
            // Efficiency & Tier
            'efficiency_score'      => $score,
            'performance_tier'      => $tier,
            // Detailed Logs for Drilldown
            'recent_tasks'          => $recent_tasks,
            'recent_attendance'     => $recent_attendance
        ];
    }

    // Format company totals
    $tot_h = Math_floor_div($company_summary['total_worked_seconds'], 3600);
    $tot_m = Math_floor_div($company_summary['total_worked_seconds'] % 3600, 60);
    $company_summary['total_worked_formatted'] = "{$tot_h}h {$tot_m}m";

    $tot_th = Math_floor_div($company_summary['total_working_time_secs'], 3600);
    $tot_tm = Math_floor_div($company_summary['total_working_time_secs'] % 3600, 60);
    $company_summary['total_task_worked_formatted'] = "{$tot_th}h {$tot_tm}m";

    $company_summary['overall_attendance_rate'] = (count($employees) * $diff_days) > 0
        ? round(($company_summary['total_present_count'] / (count($employees) * $diff_days)) * 100)
        : 100;

    $company_summary['overall_completion_rate'] = $company_summary['total_tasks_assigned'] > 0
        ? round(($company_summary['total_tasks_completed'] / $company_summary['total_tasks_assigned']) * 100)
        : 0;

    $company_summary['avg_company_rating'] = $company_summary['total_ratings_count'] > 0
        ? round($company_summary['total_ratings_sum'] / $company_summary['total_ratings_count'], 1)
        : 5.0;

    // Format department summaries
    $dept_list = [];
    foreach ($dept_aggregates as $d) {
        $dh = Math_floor_div($d['task_seconds'], 3600);
        $d['task_worked_formatted'] = "{$dh}h";
        $d['completion_rate'] = $d['tasks_assigned'] > 0 ? round(($d['tasks_completed'] / $d['tasks_assigned']) * 100) : 0;
        $dept_list[] = $d;
    }

    // Sort staff list by efficiency score DESC, tasks completed DESC, avg_rating DESC, total duty hours DESC
    usort($staff_data, function($a, $b) {
        if ($b['efficiency_score'] !== $a['efficiency_score']) {
            return $b['efficiency_score'] - $a['efficiency_score'];
        }
        if ($b['tasks_completed'] !== $a['tasks_completed']) {
            return $b['tasks_completed'] - $a['tasks_completed'];
        }
        $r_a = $a['avg_rating'] !== null ? $a['avg_rating'] : 0;
        $r_b = $b['avg_rating'] !== null ? $b['avg_rating'] : 0;
        if ($r_b != $r_a) {
            return ($r_b > $r_a) ? 1 : -1;
        }
        return $b['total_worked_seconds'] - $a['total_worked_seconds'];
    });

    echo json_encode([
        "status"          => "success",
        "period"          => [
            "start_date" => $start_date,
            "end_date"   => $end_date,
            "days_count" => $diff_days
        ],
        "company_summary" => $company_summary,
        "department_stats"=> $dept_list,
        "staff_data"      => $staff_data
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}

function Math_floor_div($a, $b) {
    return $b == 0 ? 0 : intval(floor($a / $b));
}
?>
