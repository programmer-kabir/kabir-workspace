<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$staff_id = isset($_GET['staff_id']) ? $_GET['staff_id'] : '';
$date = isset($_GET['date']) ? $_GET['date'] : '';

if (!$staff_id || !$date) {
    echo json_encode(["status" => "error", "message" => "Missing staff_id or date."]);
    exit;
}

$query = "SELECT check_in, check_out FROM attendance WHERE user_id = :staff_id AND date = :date LIMIT 1";
$stmt = $db->prepare($query);
$stmt->execute([':staff_id' => $staff_id, ':date' => $date]);

if ($stmt->rowCount() > 0) {
    $record = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Fetch break details
    $break_query = "SELECT MIN(start_time) as break_start, MAX(end_time) as break_end, SUM(duration_minutes) as total_break_minutes FROM employee_breaks WHERE user_id = :staff_id AND date = :date AND status = 'Completed'";
    $break_stmt = $db->prepare($break_query);
    $break_stmt->execute([':staff_id' => $staff_id, ':date' => $date]);
    $break_res = $break_stmt->fetch(PDO::FETCH_ASSOC);
    
    $record['total_break_minutes'] = $break_res['total_break_minutes'] ? $break_res['total_break_minutes'] : 0;
    
    // Extract just the time part (HH:MM:SS) from the datetime fields
    $record['break_start'] = $break_res['break_start'] ? date('H:i:s', strtotime($break_res['break_start'])) : '';
    $record['break_end'] = $break_res['break_end'] ? date('H:i:s', strtotime($break_res['break_end'])) : '';

    echo json_encode(["status" => "success", "data" => $record]);
} else {
    echo json_encode(["status" => "error", "message" => "No attendance record found for this date."]);
}
?>
