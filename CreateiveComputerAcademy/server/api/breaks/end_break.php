<?php
require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../config/PusherHelper.php';
require_once 'BreakDbHelper.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();
BreakDbHelper::ensureSchema($db);

$data = json_decode(file_get_contents("php://input"));

// Either break_id or user_id must be provided
if (!isset($data->break_id) && !isset($data->user_id)) {
    echo json_encode(["status" => "error", "message" => "break_id or user_id is required."]);
    exit;
}

$end_time = date('Y-m-d H:i:s');

try {
    if (isset($data->break_id)) {
        // Admin force end
        $query = "SELECT id, user_id, break_type, start_time FROM employee_breaks WHERE id = :id AND status = 'Active'";
        $stmt = $db->prepare($query);
        $stmt->execute([':id' => $data->break_id]);
    } else {
        // Staff self end
        $query = "SELECT id, user_id, break_type, start_time FROM employee_breaks WHERE user_id = :user_id AND status = 'Active' ORDER BY id DESC LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->execute([':user_id' => $data->user_id]);
    }

    if ($stmt->rowCount() == 0) {
        echo json_encode(["status" => "error", "message" => "No active break found."]);
        exit;
    }

    $break_record = $stmt->fetch(PDO::FETCH_ASSOC);
    $break_id = (int)$break_record['id'];
    $user_id = (int)$break_record['user_id'];
    $break_type = $break_record['break_type'];
    $start_time = $break_record['start_time'];

    // Calculate duration in minutes
    $start_ts = strtotime($start_time);
    $end_ts = strtotime($end_time);
    $duration_minutes = max(1, round(abs($end_ts - $start_ts) / 60));

    $update_query = "UPDATE employee_breaks 
                     SET end_time = :end_time, 
                         duration_minutes = :duration, 
                         status = 'Completed', 
                         updated_at = :end_time 
                     WHERE id = :id";
    $update_stmt = $db->prepare($update_query);
    
    if ($update_stmt->execute([
        ':end_time' => $end_time,
        ':duration' => $duration_minutes,
        ':id' => $break_id
    ])) {
        // Realtime notification via Pusher
        try {
            $pusher = new PusherHelper();
            $pusherPayload = [
                "break_id" => $break_id,
                "user_id" => $user_id,
                "break_type" => $break_type,
                "status" => "Completed",
                "duration_minutes" => $duration_minutes,
                "end_time" => $end_time
            ];
            $pusher->trigger('staff-breaks', 'break-ended', $pusherPayload);
            $pusher->trigger("user-channel-{$user_id}", 'break-ended', $pusherPayload);
        } catch (Throwable $pe) {}

        echo json_encode([
            "status" => "success", 
            "message" => "Break ended successfully.", 
            "duration" => $duration_minutes,
            "data" => [
                "break_id" => $break_id,
                "user_id" => $user_id,
                "duration_minutes" => $duration_minutes,
                "end_time" => $end_time
            ]
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to end break."]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
