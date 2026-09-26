<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');
$db->exec("SET time_zone = '+06:00'");

// Read filter (daily, weekly, monthly, yearly, overall)
$filter = isset($_GET['time_filter']) ? $_GET['time_filter'] : 'daily';

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
        $start_date = '1970-01-01';
        $end_date = '2099-12-31';
        break;
}

$start_dt = $start_date . ' 00:00:00';
$end_dt = $end_date . ' 23:59:59';

$response = [
    "status" => "success",
    "filter_used" => $filter,
    "start_date" => $start_date,
    "end_date" => $end_date,
    "attendance" => [],
    "completed" => [],
    "in_review" => []
];

// Student filter clause: user must be a student
$student_where = " (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role = 'student')
    OR EXISTS (SELECT 1 FROM students st2 WHERE st2.user_id = u.id)
) ";

// 1. Attendance Leaderboard (Top 5 Students by Worked / Academy / Lab Hours)
try {
    $att_query = "
        SELECT 
            u.id, 
            u.name, 
            u.profile_picture, 
            'Student' as role,
            SUM(
                TIME_TO_SEC(
                    IFNULL(
                        a.check_out, 
                        IF(a.date = :today, :current_time, a.check_in)
                    )
                ) - TIME_TO_SEC(a.check_in)
            ) as total_seconds
        FROM users u 
        JOIN attendance a ON u.id = a.user_id 
        WHERE a.date >= :start_date AND a.date <= :end_date 
          AND a.check_in IS NOT NULL
          AND (a.status = 'Present' OR a.status = 'Late')
          AND {$student_where}
        GROUP BY u.id 
        ORDER BY total_seconds DESC 
        LIMIT 5
    ";
    $att_stmt = $db->prepare($att_query);
    $today_str = date('Y-m-d');
    $current_time_str = date('H:i:s');
    $att_stmt->bindParam(':start_date', $start_date);
    $att_stmt->bindParam(':end_date', $end_date);
    $att_stmt->bindParam(':today', $today_str);
    $att_stmt->bindParam(':current_time', $current_time_str);
    $att_stmt->execute();

    while($row = $att_stmt->fetch(PDO::FETCH_ASSOC)) {
        if ($row['total_seconds'] > 0) {
            $h = floor($row['total_seconds'] / 3600);
            $m = floor(($row['total_seconds'] % 3600) / 60);
            $row['score'] = $h . 'h ' . $m . 'm';
        } else {
            $row['score'] = '0h 0m';
        }
        unset($row['total_seconds']);
        $response["attendance"][] = $row;
    }
} catch (PDOException $e) {
    // Ignore error or log to keep other queries working
}

// 2. Completed Tasks / Assignments / Lessons Leaderboard
try {
    $comp_query = "
        SELECT 
            u.id, 
            u.name, 
            u.profile_picture, 
            'Student' as role,
            (
                COALESCE(
                    (SELECT COUNT(*) FROM student_submissions sub 
                     WHERE sub.user_id = u.id 
                       AND sub.status IN ('reviewed', 'submitted')
                       AND sub.submitted_at >= :start_date AND sub.submitted_at <= :end_date), 0
                )
                +
                COALESCE(
                    (SELECT COUNT(*) FROM student_lesson_progress slp 
                     WHERE slp.user_id = u.id 
                       AND slp.is_completed = 1
                       AND slp.completed_at >= :start_date AND slp.completed_at <= :end_date), 0
                )
            ) as score
        FROM users u
        WHERE {$student_where}
        GROUP BY u.id
        HAVING score > 0
        ORDER BY score DESC
        LIMIT 5
    ";
    $comp_stmt = $db->prepare($comp_query);
    $comp_stmt->bindParam(':start_date', $start_dt);
    $comp_stmt->bindParam(':end_date', $end_dt);
    $comp_stmt->execute();

    while($row = $comp_stmt->fetch(PDO::FETCH_ASSOC)) {
        $row['score'] = intval($row['score']);
        $response["completed"][] = $row;
    }
} catch (PDOException $e) {
    // Keep working
}

// 3. In Review Submissions Leaderboard
try {
    $rev_query = "
        SELECT 
            u.id, 
            u.name, 
            u.profile_picture, 
            'Student' as role,
            COUNT(sub.id) as score 
        FROM users u 
        JOIN student_submissions sub ON u.id = sub.user_id 
        WHERE sub.status = 'submitted' 
          AND sub.submitted_at >= :start_date AND sub.submitted_at <= :end_date 
          AND {$student_where}
        GROUP BY u.id 
        HAVING score > 0
        ORDER BY score DESC 
        LIMIT 5
    ";
    $rev_stmt = $db->prepare($rev_query);
    $rev_stmt->bindParam(':start_date', $start_dt);
    $rev_stmt->bindParam(':end_date', $end_dt);
    $rev_stmt->execute();

    while($row = $rev_stmt->fetch(PDO::FETCH_ASSOC)) {
        $row['score'] = intval($row['score']);
        $response["in_review"][] = $row;
    }
} catch (PDOException $e) {
    // Keep working
}

echo json_encode($response);
?>
