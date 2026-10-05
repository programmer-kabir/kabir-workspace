<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once 'BreakDbHelper.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();
BreakDbHelper::ensureSchema($db);

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->user_id) || !isset($data->leave_date)) {
    echo json_encode(["status" => "error", "message" => "user_id and leave_date are required."]);
    exit;
}

$user_id = (int)$data->user_id;
$leave_date = $data->leave_date;
$hours = isset($data->hours) ? (float)$data->hours : 8.0;
$mango_index = isset($data->mango_index) ? (int)$data->mango_index : 1;
$reason = isset($data->reason) ? trim($data->reason) : 'Redeemed from Mango Overtime Tree';
$today = date('Y-m-d');

try {
    // Check if user has enough balance
    // 1. Fetch Overtime
    $empStmt = $db->prepare("SELECT COALESCE(shift_hours, 8) as shift_hours FROM employees WHERE user_id = :user_id LIMIT 1");
    $empStmt->execute([':user_id' => $user_id]);
    // Check duplicate claim for the same date
    $dupStmt = $db->prepare("SELECT id FROM mango_break_claims WHERE user_id = :user_id AND leave_date = :leave_date AND status != 'Rejected' LIMIT 1");
    $dupStmt->execute([':user_id' => $user_id, ':leave_date' => $leave_date]);
    if ($dupStmt->fetch()) {
        echo json_encode(["status" => "error", "message" => "You have already redeemed a break day for this date."]);
        exit;
    }

    // Insert claim
    $insStmt = $db->prepare("INSERT INTO mango_break_claims (user_id, mango_index, hours_claimed, claim_date, leave_date, reason, status) 
                             VALUES (:user_id, :mango_index, :hours, :today, :leave_date, :reason, 'Approved')");
    $insStmt->execute([
        ':user_id' => $user_id,
        ':mango_index' => $mango_index,
        ':hours' => $hours,
        ':today' => $today,
        ':leave_date' => $leave_date,
        ':reason' => $reason
    ]);
    $claim_id = $db->lastInsertId();

    // Sync to leave_requests as Approved Compensatory Leave so company roster and attendance recognize it
    try {
        $lrCheck = $db->prepare("SELECT id FROM leave_requests WHERE user_id = :user_id AND start_date = :leave_date LIMIT 1");
        $lrCheck->execute([':user_id' => $user_id, ':leave_date' => $leave_date]);
        if (!$lrCheck->fetch()) {
            $lrIns = $db->prepare("INSERT INTO leave_requests (user_id, start_date, end_date, type, reason, status) 
                                   VALUES (:user_id, :leave_date, :leave_date, 'Compensatory Leave', :reason, 'Approved')");
            $lrIns->execute([
                ':user_id' => $user_id,
                ':leave_date' => $leave_date,
                ':reason' => "Redeemed Mango Break: {$reason}"
            ]);
        }
    } catch (Throwable $e) {}

    // Also record in user_breaks to unify all break records in one single table
    try {
        $ubIns = $db->prepare("INSERT INTO user_breaks (user_id, date, break_type, duration_minutes, status, reason) 
                               VALUES (:user_id, :leave_date, 'Mango Full Day', :mins, 'Approved', :reason)");
        $ubIns->execute([
            ':user_id' => $user_id,
            ':leave_date' => $leave_date,
            ':mins' => (int)round($hours * 60),
            ':reason' => $reason
        ]);
    } catch (Throwable $e) {}

    echo json_encode([
        "status" => "success",
        "message" => "🥭 Mango Break successfully redeemed! Enjoy your earned time off.",
        "claim_id" => $claim_id
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
