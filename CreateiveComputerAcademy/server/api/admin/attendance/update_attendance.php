<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';
require_once '../../notifications/notification_helper.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->user_id) || !isset($data->date) || !isset($data->admin_id)) {
    echo json_encode(["status" => "error", "message" => "Required fields missing."]);
    exit;
}

$user_id  = $data->user_id;
$date     = $data->date;
$admin_id = $data->admin_id;
$check_in  = isset($data->check_in)  ? $data->check_in  : null;
$check_out = isset($data->check_out) ? $data->check_out : null;

try {
    // Check if an attendance record already exists for this staff/date
    $check = $db->prepare("SELECT id FROM attendance WHERE user_id = :uid AND date = :date LIMIT 1");
    $check->execute([':uid' => $user_id, ':date' => $date]);

    if ($check->rowCount() > 0) {
        // UPDATE existing record
        $update_parts = [];
        $params = [':uid' => $user_id, ':date' => $date];

        if ($check_in !== null && $check_in !== '') {
            $update_parts[] = "check_in = :check_in";
            $params[':check_in'] = $date . ' ' . $check_in;
        }
        if ($check_out !== null && $check_out !== '') {
            $update_parts[] = "check_out = :check_out";
            $params[':check_out'] = $date . ' ' . $check_out;
            $update_parts[] = "is_forgotten_checkout = 0";
        }

        if (count($update_parts) === 0) {
            echo json_encode(["status" => "error", "message" => "Nothing to update."]);
            exit;
        }

        $sql = "UPDATE attendance SET " . implode(", ", $update_parts) . " WHERE user_id = :uid AND date = :date";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
    } else {
        // INSERT new record
        $ci = ($check_in  && $check_in  !== '') ? ($date . ' ' . $check_in)  : null;
        $co = ($check_out && $check_out !== '') ? ($date . ' ' . $check_out) : null;

        $stmt = $db->prepare("INSERT INTO attendance (user_id, date, check_in, check_out, status, is_forgotten_checkout) VALUES (:uid, :date, :ci, :co, 'Present', 0)");
        $stmt->execute([':uid' => $user_id, ':date' => $date, ':ci' => $ci, ':co' => $co]);
    }

    // Send notification to the staff member
    NotificationHelper::sendToUser(
        $db,
        $user_id,
        $admin_id,
        'Attendance Updated',
        'Your attendance record for ' . $date . ' has been updated by Admin.',
        'attendance_alert',
        'staff',
        '/attendance'
    );

    echo json_encode(["status" => "success", "message" => "Attendance updated successfully."]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
