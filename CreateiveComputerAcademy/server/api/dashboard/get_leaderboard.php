<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');
$db->exec("SET time_zone = '+06:00'");

// Read input (could be GET or POST)
$filter = isset($_GET['time_filter']) ? $_GET['time_filter'] : 'monthly';

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
    "credits" => [],
    "completed" => [],
    "in_review" => [],
    "attendance" => []
];

// 1. Top Credit Earners Leaderboard (Within time filter or All-time)
$cred_query = "
    SELECT u.id, u.name, u.profile_picture, SUM(ct.amount) as score 
    FROM users u 
    INNER JOIN (SELECT DISTINCT user_id FROM user_roles WHERE role = 'staff') ur ON u.id = ur.user_id
    JOIN credit_transactions ct ON u.id = ct.user_id 
    WHERE ct.amount > 0 
      AND ct.created_at >= :start_date AND ct.created_at <= :end_date 
    GROUP BY u.id 
    ORDER BY score DESC 
    LIMIT 5
";
$cred_stmt = $db->prepare($cred_query);
$cred_stmt->bindParam(':start_date', $start_dt);
$cred_stmt->bindParam(':end_date', $end_dt);
$cred_stmt->execute();

$cred_rows = $cred_stmt->fetchAll(PDO::FETCH_ASSOC);

// If no transactions found in that period or for overall, fallback / combine with user_credits.balance or total_earned
if (empty($cred_rows)) {
    $fb_query = "
        SELECT u.id, u.name, u.profile_picture, uc.total_earned as score
        FROM users u
        INNER JOIN (SELECT DISTINCT user_id FROM user_roles WHERE role = 'staff') ur ON u.id = ur.user_id
        JOIN user_credits uc ON u.id = uc.user_id
        WHERE uc.total_earned > 0
        GROUP BY u.id
        ORDER BY uc.total_earned DESC, uc.balance DESC
        LIMIT 5
    ";
    $fb_stmt = $db->query($fb_query);
    if ($fb_stmt) {
        $cred_rows = $fb_stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

foreach ($cred_rows as $row) {
    $row['score'] = '+' . intval($row['score']) . ' Credits';
    $response["credits"][] = $row;
}

// 2. Attendance Leaderboard (Total Worked Hours)
$att_query = "
    SELECT u.id, u.name, u.profile_picture, 
           SUM(TIME_TO_SEC(IFNULL(a.check_out, IF(a.date = :today, :current_time, a.check_in))) - TIME_TO_SEC(a.check_in)) as total_seconds
    FROM users u 
    INNER JOIN (SELECT DISTINCT user_id FROM user_roles WHERE role = 'staff') ur ON u.id = ur.user_id
    JOIN attendance a ON u.id = a.user_id 
    WHERE a.date >= :start_date AND a.date <= :end_date 
      AND a.check_in IS NOT NULL
      AND (a.status = 'Present' OR a.status = 'Late')
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

// 3. Completed Tasks Leaderboard
$comp_query = "
    SELECT u.id, u.name, u.profile_picture, COUNT(t.id) as score 
    FROM users u 
    INNER JOIN (SELECT DISTINCT user_id FROM user_roles WHERE role = 'staff') ur ON u.id = ur.user_id
    JOIN employees e ON u.id = e.user_id
    JOIN tasks t ON e.id = t.assigned_to 
    WHERE t.status = 'Completed' 
    AND t.created_at >= :start_date AND t.created_at <= :end_date 
    GROUP BY u.id 
    ORDER BY score DESC 
    LIMIT 5
";
$comp_stmt = $db->prepare($comp_query);
$comp_stmt->bindParam(':start_date', $start_dt);
$comp_stmt->bindParam(':end_date', $end_dt);
$comp_stmt->execute();

while($row = $comp_stmt->fetch(PDO::FETCH_ASSOC)) {
    $response["completed"][] = $row;
}

// 4. In Review Tasks Leaderboard
$rev_query = "
    SELECT u.id, u.name, u.profile_picture, COUNT(t.id) as score 
    FROM users u 
    INNER JOIN (SELECT DISTINCT user_id FROM user_roles WHERE role = 'staff') ur ON u.id = ur.user_id
    JOIN employees e ON u.id = e.user_id
    JOIN tasks t ON e.id = t.assigned_to 
    WHERE t.status = 'In Review' 
    AND t.created_at >= :start_date AND t.created_at <= :end_date 
    GROUP BY u.id 
    ORDER BY score DESC 
    LIMIT 5
";
$rev_stmt = $db->prepare($rev_query);
$rev_stmt->bindParam(':start_date', $start_dt);
$rev_stmt->bindParam(':end_date', $end_dt);
$rev_stmt->execute();

while($row = $rev_stmt->fetch(PDO::FETCH_ASSOC)) {
    $response["in_review"][] = $row;
}

echo json_encode($response);
?>
