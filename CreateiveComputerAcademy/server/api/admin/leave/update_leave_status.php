<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../../../config/database.php';
require_once '../../notifications/notification_helper.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

$data = json_decode(file_get_contents("php://input"));

if(!isset($data->leave_id) || !isset($data->status)) {
    echo json_encode(["status" => "error", "message" => "Missing required fields"]);
    exit;
}

try {
    // 1. Fetch leave record details first
    $get_leave_stmt = $db->prepare("SELECT user_id, start_date, end_date, type FROM leave_requests WHERE id = :id LIMIT 1");
    $get_leave_stmt->execute([':id' => $data->leave_id]);
    $leave_data = $get_leave_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$leave_data) {
        echo json_encode(["status" => "error", "message" => "Leave request not found."]);
        exit;
    }

    $user_id = $leave_data['user_id'];
    $start_date = $leave_data['start_date'];
    $end_date = $leave_data['end_date'];
    $admin_comment = isset($data->admin_comment) ? $data->admin_comment : '';

    // 2. Update leave request status and admin_comment
    try {
        $query = "UPDATE leave_requests SET status = :status, admin_comment = :admin_comment WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":status", $data->status);
        $stmt->bindParam(":admin_comment", $admin_comment);
        $stmt->bindParam(":id", $data->leave_id);
        $stmt->execute();
    } catch (Exception $e) {
        $query2 = "UPDATE leave_requests SET status = :status WHERE id = :id";
        $stmt2 = $db->prepare($query2);
        $stmt2->bindParam(":status", $data->status);
        $stmt2->bindParam(":id", $data->leave_id);
        $stmt2->execute();
    }

    // 3. Sync with attendance table
    if ($data->status === 'Approved') {
        // Fetch staff shift start and end times
        $emp_stmt = $db->prepare("SELECT shift_start, shift_end FROM employees WHERE user_id = :user_id LIMIT 1");
        $emp_stmt->execute([':user_id' => $user_id]);
        $emp_shift = $emp_stmt->fetch(PDO::FETCH_ASSOC);

        $shift_start = (!empty($emp_shift['shift_start'])) ? $emp_shift['shift_start'] : '09:00:00';
        $shift_end   = (!empty($emp_shift['shift_end']))   ? $emp_shift['shift_end']   : '17:00:00';

        // Loop through all dates in the range
        $cur_ts = strtotime($start_date);
        $end_ts = strtotime($end_date);

        while ($cur_ts <= $end_ts) {
            $dt_str = date('Y-m-d', $cur_ts);

            // Check if attendance row exists for this date
            $chk_att = $db->prepare("SELECT id FROM attendance WHERE user_id = :uid AND date = :date LIMIT 1");
            $chk_att->execute([':uid' => $user_id, ':date' => $dt_str]);
            $existing_att = $chk_att->fetch(PDO::FETCH_ASSOC);

            if ($existing_att) {
                // Update existing record
                $upd_att = $db->prepare("UPDATE attendance SET status = 'Leave', check_in = :cin, check_out = :cout, is_forgotten_checkout = 0 WHERE id = :aid");
                $upd_att->execute([
                    ':cin'  => $shift_start,
                    ':cout' => $shift_end,
                    ':aid'  => $existing_att['id']
                ]);
            } else {
                // Insert new record with Leave status
                $ins_att = $db->prepare("INSERT INTO attendance (user_id, date, check_in, check_out, status, is_forgotten_checkout) VALUES (:uid, :date, :cin, :cout, 'Leave', 0)");
                $ins_att->execute([
                    ':uid'  => $user_id,
                    ':date' => $dt_str,
                    ':cin'  => $shift_start,
                    ':cout' => $shift_end
                ]);
            }

            $cur_ts = strtotime('+1 day', $cur_ts);
        }
    } elseif ($data->status === 'Rejected') {
        // If rejected, remove or reset auto-created Leave attendance records for this date range
        $del_att = $db->prepare("DELETE FROM attendance WHERE user_id = :uid AND date >= :start AND date <= :end AND status = 'Leave'");
        $del_att->execute([
            ':uid'   => $user_id,
            ':start' => $start_date,
            ':end'   => $end_date
        ]);
    }

    // 4. Send Push & Database Notification
    try {
        $title = "Leave " . $data->status;
        $message = "Your leave request has been " . strtolower($data->status) . ".";
        if (!empty($admin_comment)) {
            $message .= " Reason: " . $admin_comment;
        }

        NotificationHelper::sendToUser($db, $user_id, null, $title, $message, 'leave', 'staff', '/leave');
    } catch (Exception $e) {
        // Ignore notification error
    }

    echo json_encode(["status" => "success", "message" => "Leave status updated and attendance synced."]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
