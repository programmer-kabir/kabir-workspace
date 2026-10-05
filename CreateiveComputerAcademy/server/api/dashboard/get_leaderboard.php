<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

if (!$db) {
    echo json_encode(["status" => "error", "message" => "Database connection unavailable."]);
    exit;
}
$db->exec("SET time_zone = '+06:00'");

// Read inputs
$filter = isset($_GET['time_filter']) ? trim($_GET['time_filter']) : 'monthly';
$current_user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : (isset($_GET['current_user_id']) ? (int)$_GET['current_user_id'] : 0);

// Calculate dates based on filter
$start_date = '';
$end_date = '';

switch($filter) {
    case 'daily':
        $start_date = date('Y-m-d');
        $end_date = date('Y-m-d');
        break;
    case 'weekly':
        // In Bangladesh, week starts on Saturday
        $day_of_week = date('w'); // 0 = Sunday, 6 = Saturday
        if ($day_of_week == 6) {
            $start_date = date('Y-m-d');
        } else {
            $start_date = date('Y-m-d', strtotime('last saturday'));
        }
        $end_date = date('Y-m-d', strtotime($start_date . ' +6 days'));
        break;
    case 'monthly':
        $start_date = date('Y-m-01');
        $end_date = date('Y-m-t');
        break;
    case 'yearly':
        $start_date = date('Y-01-01');
        $end_date = date('Y-12-31');
        break;
    case 'overall':
    default:
        $start_date = '2025-01-01';
        $end_date = date('Y-m-d');
        break;
}

$start_dt = $start_date . ' 00:00:00';
$end_dt = $end_date . ' 23:59:59';
$today_str = date('Y-m-d');
$current_time_str = date('H:i:s');

// Working days in period (excluding Fridays)
$cur = strtotime($start_date);
$end = min(time(), strtotime($end_date));
$working_days_count = 0;
while ($cur <= $end) {
    if (date('N', $cur) != 5) {
        $working_days_count++;
    }
    $cur = strtotime('+1 day', $cur);
}
$working_days_count = max(1, $working_days_count);

try {
    // 1. Fetch all active staff users with departments
    $staff_query = "
        SELECT u.id, u.name, u.email, u.profile_picture, e.id as employee_id, e.employee_code, e.designation, d.name as department_name
        FROM users u
        INNER JOIN user_roles ur ON u.id = ur.user_id AND ur.role = 'staff'
        LEFT JOIN employees e ON u.id = e.user_id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE u.status = 'active' OR u.status IS NULL
        GROUP BY u.id
    ";
    $staff_stmt = $db->query($staff_query);
    $staff_list = $staff_stmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. Fetch Tasks in period (using exact Master Report logic)
    $tasks_query = "
        SELECT e.user_id,
               COUNT(t.id) as assigned_count,
               SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) as completed_count,
               SUM(CASE WHEN t.status = 'In Review' THEN 1 ELSE 0 END) as in_review_count,
               SUM(CASE WHEN t.status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_count,
               SUM(CASE WHEN t.status = 'Rejected' THEN 1 ELSE 0 END) as rejected_count,
               SUM(t.total_time_spent) as task_worked_secs
        FROM tasks t
        JOIN employees e ON t.assigned_to = e.id
        WHERE (DATE(COALESCE(t.assign_date, t.created_at)) >= :start_date AND DATE(COALESCE(t.assign_date, t.created_at)) <= :end_date)
           OR (t.submitted_at >= :start_dt AND t.submitted_at <= :end_dt)
        GROUP BY e.user_id
    ";
    $tasks_stmt = $db->prepare($tasks_query);
    $tasks_stmt->execute([
        ':start_date' => $start_date,
        ':end_date' => $end_date,
        ':start_dt' => $start_dt,
        ':end_dt' => $end_dt
    ]);
    $task_counts = [];
    while ($r = $tasks_stmt->fetch(PDO::FETCH_ASSOC)) {
        $task_counts[$r['user_id']] = $r;
    }

    // 3. Fetch task ratings in period (using exact Master Report logic)
    $reviews_query = "
        SELECT e.user_id, 
               AVG(tr.rating) as avg_rating,
               COUNT(tr.id) as rated_count,
               SUM(tr.rating) as rating_sum
        FROM task_reviews tr
        JOIN tasks t ON tr.task_id = t.id
        JOIN employees e ON t.assigned_to = e.id
        WHERE tr.created_at >= :start_dt AND tr.created_at <= :end_dt
        GROUP BY e.user_id
    ";
    $reviews_stmt = $db->prepare($reviews_query);
    $reviews_stmt->execute([':start_dt' => $start_dt, ':end_dt' => $end_dt]);
    $review_counts = [];
    while ($r = $reviews_stmt->fetch(PDO::FETCH_ASSOC)) {
        $review_counts[$r['user_id']] = $r;
    }

    // 4. Fetch Attendance in period (using exact Master Report logic)
    $att_query = "
        SELECT a.user_id,
               SUM(TIME_TO_SEC(IFNULL(a.check_out, IF(a.date = :today, :current_time, a.check_in))) - TIME_TO_SEC(a.check_in)) as total_seconds,
               SUM(CASE WHEN a.status = 'Late' THEN 1 ELSE 0 END) as late_days,
               COUNT(DISTINCT a.date) as present_days
        FROM attendance a
        WHERE a.date >= :start_date AND a.date <= :end_date
          AND a.check_in IS NOT NULL
          AND (a.status = 'Present' OR a.status = 'Late')
        GROUP BY a.user_id
    ";
    $att_stmt = $db->prepare($att_query);
    $att_stmt->execute([
        ':start_date' => $start_date,
        ':end_date' => $end_date,
        ':today' => $today_str,
        ':current_time' => $current_time_str
    ]);
    $att_counts = [];
    while ($r = $att_stmt->fetch(PDO::FETCH_ASSOC)) {
        $att_counts[$r['user_id']] = $r;
    }

    // 5. Fetch Credits earned in period
    $cred_query = "
        SELECT ct.user_id, SUM(ct.amount) as credits_earned
        FROM credit_transactions ct
        WHERE ct.amount > 0
          AND ct.created_at >= :start_dt AND ct.created_at <= :end_dt
        GROUP BY ct.user_id
    ";
    $cred_stmt = $db->prepare($cred_query);
    $cred_stmt->execute([':start_dt' => $start_dt, ':end_dt' => $end_dt]);
    $cred_counts = [];
    while ($r = $cred_stmt->fetch(PDO::FETCH_ASSOC)) {
        $cred_counts[$r['user_id']] = (int)$r['credits_earned'];
    }

    // Fallback credits balance from user_credits
    $uc_query = "SELECT user_id, balance, total_earned FROM user_credits";
    $uc_stmt = $db->query($uc_query);
    $uc_balances = [];
    while ($r = $uc_stmt->fetch(PDO::FETCH_ASSOC)) {
        $uc_balances[$r['user_id']] = $r;
    }

    // 6. Compute exact Master Report Efficiency Score (0-100%) for each staff
    $all_staff_stats = [];

    foreach ($staff_list as $staff) {
        $uid = (int)$staff['id'];
        $tc = $task_counts[$uid] ?? [
            'assigned_count' => 0, 'completed_count' => 0, 'in_review_count' => 0,
            'in_progress_count' => 0, 'rejected_count' => 0, 'task_worked_secs' => 0
        ];
        $rc = $review_counts[$uid] ?? ['avg_rating' => 0, 'rated_count' => 0];
        $ac = $att_counts[$uid] ?? ['total_seconds' => 0, 'late_days' => 0, 'present_days' => 0];

        $assigned_count = (int)$tc['assigned_count'];
        $completed_count = (int)$tc['completed_count'];
        $in_review_count = (int)$tc['in_review_count'];
        $rejected_count = (int)$tc['rejected_count'];
        $rated_count = (int)$rc['rated_count'];
        $avg_rating = $rated_count > 0 ? round((float)$rc['avg_rating'], 1) : null;

        $present_days = (int)$ac['present_days'];
        $worked_secs = max(0, (int)$ac['total_seconds']);
        $total_worked_hours = round($worked_secs / 3600, 1);
        $wh = floor($worked_secs / 3600);
        $wm = floor(($worked_secs % 3600) / 60);
        $duty_time_formatted = "{$wh}h {$wm}m";

        $credits_period = $cred_counts[$uid] ?? 0;
        if ($credits_period === 0 && isset($uc_balances[$uid])) {
            $credits_period = (int)($uc_balances[$uid]['balance'] ?? 0);
        }

        // Exact Master Report Formula:
        $attendance_rate = min(100, round(($present_days / $working_days_count) * 100));
        $completion_rate = $assigned_count > 0 ? round(($completed_count / $assigned_count) * 100) : 0;
        $rejection_rate = $assigned_count > 0 ? round(($rejected_count / $assigned_count) * 100) : 0;
        $rej_penalty = min(20, $rejection_rate * 0.5);

        if ($assigned_count === 0 && $present_days === 0) {
            $efficiency_score = 0;
            $tier = 'Needs Attention';
            $tier_badge = '⚠️ Needs Attention';
        } elseif ($assigned_count === 0 && $present_days > 0) {
            $efficiency_score = round($attendance_rate * 0.30);
            $tier = $efficiency_score >= 50 ? 'Good Standing' : 'Needs Attention';
            $tier_badge = $efficiency_score >= 50 ? '✓ Good Standing' : '⚠️ Needs Attention';
        } else {
            $comp_pts = $completion_rate * 0.35;
            $att_pts = $attendance_rate * 0.30;
            if ($rated_count > 0 && $avg_rating > 0) {
                $quality_pts = ($avg_rating / 5.0) * 100 * 0.35;
                $efficiency_score = round($comp_pts + $quality_pts + $att_pts - $rej_penalty);
            } else {
                $efficiency_score = round($comp_pts + $att_pts - $rej_penalty);
            }
            $efficiency_score = max(0, min(100, $efficiency_score));

            if ($efficiency_score >= 85) {
                $tier = 'Top Performer';
                $tier_badge = '🏆 Top Performer';
            } elseif ($efficiency_score >= 70) {
                $tier = 'High Output';
                $tier_badge = '🚀 High Output';
            } elseif ($efficiency_score >= 50) {
                $tier = 'Good Standing';
                $tier_badge = '✓ Good Standing';
            } else {
                $tier = 'Needs Attention';
                $tier_badge = '⚠️ Needs Attention';
            }
        }

        $all_staff_stats[$uid] = [
            'id' => $uid,
            'name' => $staff['name'],
            'employee_code' => $staff['employee_code'] ?? 'Staff',
            'designation' => $staff['designation'] ?? 'Staff Member',
            'department_name' => $staff['department_name'] ?? 'Academy Staff',
            'profile_picture' => $staff['profile_picture'],
            // Master Report Exact Metrics
            'efficiency_score' => $efficiency_score,
            'performance_tier' => $tier,
            'tier_badge' => $tier_badge,
            'attendance_rate' => $attendance_rate,
            'completion_rate' => $completion_rate,
            'rejection_rate' => $rejection_rate,
            'tasks_assigned' => $assigned_count,
            'tasks_completed' => $completed_count,
            'tasks_in_review' => $in_review_count,
            'tasks_rejected' => $rejected_count,
            'avg_rating' => $avg_rating !== null ? $avg_rating : ($completed_count > 0 ? 5.0 : null),
            'rated_count' => $rated_count,
            'present_days' => $present_days,
            'worked_hours' => $total_worked_hours,
            'duty_time_formatted' => $duty_time_formatted,
            'credits_earned' => $credits_period
        ];
    }

    // Helper to rank and extract Top 5
    $getRankings = function($items, $sortPrimary, $sortSecondary, $formatScoreFn, $targetUserId) {
        usort($items, function($a, $b) use ($sortPrimary, $sortSecondary) {
            if ($b[$sortPrimary] !== $a[$sortPrimary]) {
                return $b[$sortPrimary] - $a[$sortPrimary];
            }
            if ($b[$sortSecondary] !== $a[$sortSecondary]) {
                return $b[$sortSecondary] - $a[$sortSecondary];
            }
            return $b['tasks_completed'] - $a['tasks_completed'];
        });

        $top5 = [];
        $myRankInfo = null;

        foreach ($items as $idx => $item) {
            $rank = $idx + 1;
            $formatted = $item;
            $formatted['rank'] = $rank;
            $formatted['score_display'] = $formatScoreFn($item);

            if ($rank <= 5) {
                $top5[] = $formatted;
            }

            if ($targetUserId > 0 && $item['id'] === $targetUserId) {
                $gap = 0;
                $aheadName = '';
                if ($idx > 0) {
                    $aheadItem = $items[$idx - 1];
                    $aheadName = explode(' ', $aheadItem['name'])[0];
                    $gap = max(1, $aheadItem[$sortPrimary] - $item[$sortPrimary]);
                }
                $myRankInfo = [
                    'rank' => $rank,
                    'score_display' => $formatted['score_display'],
                    'efficiency_score' => $item['efficiency_score'],
                    'gap_to_next' => $gap,
                    'ahead_name' => $aheadName,
                    'performance_tier' => $item['performance_tier'],
                    'tier_badge' => $item['tier_badge'],
                    'item' => $formatted
                ];
            }
        }

        return ['top5' => $top5, 'my_standing' => $myRankInfo];
    };

    // 1. Overall Performance (Master Report Efficiency Score %)
    $overallRes = $getRankings($all_staff_stats, 'efficiency_score', 'tasks_completed', function($item) {
        return $item['efficiency_score'] . '% Score';
    }, $current_user_id);

    // 2. Tasks Output Ranking
    $tasksRes = $getRankings($all_staff_stats, 'tasks_completed', 'efficiency_score', function($item) {
        return $item['tasks_completed'] . ' Tasks Done';
    }, $current_user_id);

    // 3. Attendance & Duty Hours Ranking
    $attRes = $getRankings($all_staff_stats, 'attendance_rate', 'worked_hours', function($item) {
        return $item['attendance_rate'] . '% (' . $item['duty_time_formatted'] . ')';
    }, $current_user_id);

    // 4. Credits Ranking
    $credRes = $getRankings($all_staff_stats, 'credits_earned', 'efficiency_score', function($item) {
        return '+' . number_format($item['credits_earned']) . ' Credits';
    }, $current_user_id);

    // Legacy backward compatibility arrays
    $compat_completed = array_map(function($i) {
        return ['id' => $i['id'], 'name' => $i['name'], 'profile_picture' => $i['profile_picture'], 'score' => $i['tasks_completed']];
    }, $tasksRes['top5']);

    $compat_attendance = array_map(function($i) {
        return ['id' => $i['id'], 'name' => $i['name'], 'profile_picture' => $i['profile_picture'], 'score' => $i['duty_time_formatted']];
    }, $attRes['top5']);

    $compat_credits = array_map(function($i) {
        return ['id' => $i['id'], 'name' => $i['name'], 'profile_picture' => $i['profile_picture'], 'score' => '+' . $i['credits_earned'] . ' Credits'];
    }, $credRes['top5']);

    echo json_encode([
        "status" => "success",
        "filter_used" => $filter,
        "period" => [
            "start_date" => $start_date,
            "end_date" => $end_date,
            "working_days" => $working_days_count
        ],
        "top5_overall" => $overallRes['top5'],
        "top5_tasks" => $tasksRes['top5'],
        "top5_attendance" => $attRes['top5'],
        "top5_credits" => $credRes['top5'],
        "my_standing" => [
            "overall" => $overallRes['my_standing'],
            "tasks" => $tasksRes['my_standing'],
            "attendance" => $attRes['my_standing'],
            "credits" => $credRes['my_standing']
        ],
        // Backward compatibility
        "completed" => $compat_completed,
        "attendance" => $compat_attendance,
        "credits" => $compat_credits
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
