<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

$data = json_decode(file_get_contents("php://input"));

if(!isset($data->user_id)) {
    echo json_encode(["status" => "error", "message" => "User ID required."]);
    exit;
}

$user_id = $data->user_id;
$today = date('Y-m-d');
$current_month = date('m');
$current_year = date('Y');

// Get Employee Shift Hours
$emp_query = "SELECT shift_hours FROM employees WHERE user_id = :user_id LIMIT 1";
$emp_stmt = $db->prepare($emp_query);
$emp_stmt->bindParam(':user_id', $user_id);
$emp_stmt->execute();
$shift_hours = 8; // Default
if($emp_stmt->rowCount() > 0) {
    $shift_hours = $emp_stmt->fetch(PDO::FETCH_ASSOC)['shift_hours'];
}

// Get Today's Status
$today_query = "SELECT check_in, check_out, status, COALESCE(is_forgotten_checkout, 0) as is_forgotten_checkout FROM attendance WHERE user_id = :user_id AND date = :today LIMIT 1";
$today_stmt = $db->prepare($today_query);
$today_stmt->bindParam(':user_id', $user_id);
$today_stmt->bindParam(':today', $today);
$today_stmt->execute();

$today_status = null;
if($today_stmt->rowCount() > 0) {
    $today_status = $today_stmt->fetch(PDO::FETCH_ASSOC);
}

// Get Total Break Time Today
$break_query = "SELECT SUM(duration_minutes) as total_break_minutes FROM employee_breaks WHERE user_id = :user_id AND date = :today";
$break_stmt = $db->prepare($break_query);
$break_stmt->bindParam(':user_id', $user_id);
$break_stmt->bindParam(':today', $today);
$break_stmt->execute();
$total_break_minutes = $break_stmt->fetch(PDO::FETCH_ASSOC)['total_break_minutes'] ?? 0;

// Get Monthly History
$history_query = "SELECT date, check_in, check_out, status, COALESCE(is_forgotten_checkout, 0) as is_forgotten_checkout FROM attendance WHERE user_id = :user_id AND MONTH(date) = :month AND YEAR(date) = :year ORDER BY date DESC";
$history_stmt = $db->prepare($history_query);
$history_stmt->bindParam(':user_id', $user_id);
$history_stmt->bindParam(':month', $current_month);
$history_stmt->bindParam(':year', $current_year);
$history_stmt->execute();

// Get Holidays for this month
$holidays = [];
$hol_query = "SELECT date, title, expected_hours FROM holidays WHERE MONTH(date) = :month AND YEAR(date) = :year";
$hol_stmt = $db->prepare($hol_query);
$hol_stmt->bindParam(':month', $current_month);
$hol_stmt->bindParam(':year', $current_year);
$hol_stmt->execute();
while($h = $hol_stmt->fetch(PDO::FETCH_ASSOC)) {
    $holidays[$h['date']] = $h;
}

// Get Monthly Breaks
$monthly_breaks = [];
$mb_query = "SELECT date, SUM(duration_minutes) as total_mins FROM employee_breaks WHERE user_id = :user_id AND MONTH(date) = :month AND YEAR(date) = :year AND status = 'Completed' GROUP BY date";
$mb_stmt = $db->prepare($mb_query);
$mb_stmt->bindParam(':user_id', $user_id);
$mb_stmt->bindParam(':month', $current_month);
$mb_stmt->bindParam(':year', $current_year);
$mb_stmt->execute();
while ($mb_row = $mb_stmt->fetch(PDO::FETCH_ASSOC)) {
    $monthly_breaks[$mb_row['date']] = (int)$mb_row['total_mins'];
}

$history = [];
while ($row = $history_stmt->fetch(PDO::FETCH_ASSOC)) {
    $row['total_hours'] = null;
    $row['overtime'] = null;
    $row['is_short'] = false;
    $row['total_break_minutes'] = isset($monthly_breaks[$row['date']]) ? $monthly_breaks[$row['date']] : 0;
    
    if($row['check_in'] && $row['check_out']) {
        $in_time = strtotime($row['check_in']);
        $out_time = strtotime($row['check_out']);
        $diff_seconds = $out_time - $in_time;
        
        $hours = floor($diff_seconds / 3600);
        $minutes = floor(($diff_seconds % 3600) / 60);
        $row['total_hours'] = $hours . 'h ' . $minutes . 'm';
        
        $is_weekend = (date('N', strtotime($row['date'])) == 5); // 5 is Friday
        $expected_seconds = $is_weekend ? 0 : ($shift_hours * 3600);
        
        $date_key = $row['date'];
        $is_special_day = false;
        if (isset($holidays[$date_key])) {
            $expected_seconds = $holidays[$date_key]['expected_hours'] * 3600;
            $is_special_day = true;
        }
        
        if($diff_seconds > $expected_seconds) {
            $ot_seconds = $diff_seconds - $expected_seconds;
            $ot_hours = floor($ot_seconds / 3600);
            $ot_minutes = floor(($ot_seconds % 3600) / 60);
            $row['overtime'] = '+' . $ot_hours . 'h ' . $ot_minutes . 'm';
            if($is_weekend || $is_special_day) {
                $row['overtime'] .= ' (OT)';
            }
        } else if ($diff_seconds < $expected_seconds) {
            $short_seconds = $expected_seconds - $diff_seconds;
            // Only count as short if it's significant (e.g. more than 15 mins early)
            if ($short_seconds > 900) {
                $row['is_short'] = true;
                $sh_hours = floor($short_seconds / 3600);
                $sh_minutes = floor(($short_seconds % 3600) / 60);
                $row['overtime'] = '-' . $sh_hours . 'h ' . $sh_minutes . 'm';
            }
        }
    }
    $history[] = $row;
}

echo json_encode([
    "status" => "success", 
    "today" => $today_status,
    "total_break_minutes" => (int)$total_break_minutes,
    "shift_hours" => (int)$shift_hours,
    "history" => $history
]);
?>
