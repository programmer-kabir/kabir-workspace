<?php
require_once '../../../config/cors.php';

require_once '../../../config/database.php';
require_once '../../notifications/notification_helper.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

$data = json_decode(file_get_contents("php://input"));

if(!isset($data->dispute_id) || !isset($data->status) || !isset($data->admin_id)) {
    echo json_encode(["status" => "error", "message" => "Required fields missing."]);
    exit;
}

$dispute_id = $data->dispute_id;
$status = $data->status;
$admin_id = $data->admin_id;
$admin_comment = isset($data->admin_comment) ? $data->admin_comment : null;
$check_in = isset($data->check_in) ? $data->check_in : null;
$check_out = isset($data->check_out) ? $data->check_out : null;
$break_start = isset($data->break_start) ? $data->break_start : null;
$break_end = isset($data->break_end) ? $data->break_end : null;
$break_type = isset($data->break_type) ? $data->break_type : 'Admin Correction';

if (!in_array($status, ['approved', 'rejected'])) {
    echo json_encode(["status" => "error", "message" => "Invalid status."]);
    exit;
}

// Fetch dispute details for notification
$fetch_stmt = $db->prepare("SELECT user_id as staff_id, date FROM attendance_disputes WHERE id = :id");
$fetch_stmt->execute([':id' => $dispute_id]);
$dispute_data = $fetch_stmt->fetch(PDO::FETCH_ASSOC);

// Update the dispute
$query = "UPDATE attendance_disputes SET status = :status, admin_comment = :admin_comment, resolved_by = :admin_id WHERE id = :dispute_id";
$stmt = $db->prepare($query);

$stmt->bindParam(':status', $status);
$stmt->bindParam(':admin_comment', $admin_comment);
$stmt->bindParam(':admin_id', $admin_id);
$stmt->bindParam(':dispute_id', $dispute_id);

if($stmt->execute()) {
    // If the admin provided updated time details, update the attendance record
    if ($status === 'approved' && $dispute_data) {
        $update_parts = [];
        $params = [':staff_id' => $dispute_data['staff_id'], ':date' => $dispute_data['date']];
        
        if ($check_in !== null && $check_in !== '') {
            $update_parts[] = "check_in = :check_in";
            $params[':check_in'] = $check_in;
        }
        if ($check_out !== null && $check_out !== '') {
            $update_parts[] = "check_out = :check_out";
            $params[':check_out'] = $check_out;
            $update_parts[] = "is_forgotten_checkout = 0";
        }

        if (count($update_parts) > 0) {
            $update_query = "UPDATE attendance SET " . implode(", ", $update_parts) . " WHERE user_id = :staff_id AND date = :date";
            $update_stmt = $db->prepare($update_query);
            $update_stmt->execute($params);
        }

        // Handle break times by overwriting existing breaks
        if ($break_start !== null && $break_start !== '' && $break_end !== null && $break_end !== '') {
            $del_break = $db->prepare("DELETE FROM employee_breaks WHERE user_id = :staff_id AND date = :date");
            $del_break->execute([':staff_id' => $dispute_data['staff_id'], ':date' => $dispute_data['date']]);

            // Calculate duration in minutes
            $start_timestamp = strtotime($dispute_data['date'] . ' ' . $break_start);
            $end_timestamp = strtotime($dispute_data['date'] . ' ' . $break_end);
            $duration_minutes = floor(($end_timestamp - $start_timestamp) / 60);

            if ($duration_minutes > 0) {
                $ins_break = $db->prepare("INSERT INTO employee_breaks (user_id, date, duration_minutes, status, break_type, start_time, end_time) VALUES (:staff_id, :date, :mins, 'Completed', :break_type, :start_time, :end_time)");
                $ins_break->execute([
                    ':staff_id' => $dispute_data['staff_id'], 
                    ':date' => $dispute_data['date'], 
                    ':mins' => $duration_minutes,
                    ':break_type' => $break_type,
                    ':start_time' => date('Y-m-d H:i:s', $start_timestamp),
                    ':end_time' => date('Y-m-d H:i:s', $end_timestamp)
                ]);
            }
        }
    }

    if ($dispute_data) {
        NotificationHelper::sendToUser(
            $db,
            $dispute_data['staff_id'],
            $admin_id,
            'Attendance Dispute ' . ucfirst($status),
            'Your attendance dispute for ' . $dispute_data['date'] . ' has been ' . $status . '.',
            'attendance_alert',
            'staff',
            '/attendance'
        );
    }

    echo json_encode([
        "status" => "success", 
        "message" => "Dispute resolved successfully."
    ]);
} else {
    echo json_encode(["status" => "error", "message" => "Failed to resolve dispute."]);
}
?>
