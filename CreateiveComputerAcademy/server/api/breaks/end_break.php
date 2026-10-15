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
        $query = "SELECT id, user_id, break_type, purpose, start_time FROM user_breaks WHERE id = :id AND status = 'Active'";
        $stmt = $db->prepare($query);
        $stmt->execute([':id' => $data->break_id]);
    } else {
        // Staff self end
        $query = "SELECT id, user_id, break_type, purpose, start_time FROM user_breaks WHERE user_id = :user_id AND status = 'Active' ORDER BY id DESC LIMIT 1";
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
    $purpose = $break_record['purpose'] ?? null;
    $start_time = $break_record['start_time'];

    // Calculate duration in minutes
    $start_ts = strtotime($start_time);
    $end_ts = strtotime($end_time);
    $duration_minutes = max(1, round(abs($end_ts - $start_ts) / 60));

    // Calculate Tiffin Efficiency Delta if this is a Tiffin break
    $tiffin_delta = 0;
    if ($break_type === 'Tiffin') {
        $tiffin_delta = BreakDbHelper::calculateTiffinDelta($duration_minutes);
    }

    $update_query = "UPDATE user_breaks 
                     SET end_time = :end_time, 
                         duration_minutes = :duration, 
                         tiffin_delta_minutes = :tiffin_delta, 
                         status = 'Completed', 
                         updated_at = :end_time 
                     WHERE id = :id";
    $update_stmt = $db->prepare($update_query);
    
    if ($update_stmt->execute([
        ':end_time' => $end_time,
        ':duration' => $duration_minutes,
        ':tiffin_delta' => $tiffin_delta,
        ':id' => $break_id
    ])) {
        // Fetch updated mango balance
        $availableMangoMins = BreakDbHelper::getAvailableMangoMinutes($db, $user_id);

        // Friendly message
        $customMessage = "Break ended successfully.";
        if ($break_type === 'Tiffin') {
            if ($tiffin_delta > 0) {
                $customMessage = "Tiffin completed in {$duration_minutes}m! You saved {$tiffin_delta} mins (+{$tiffin_delta}m credited to Mango Tree 🥭).";
            } elseif ($tiffin_delta < 0) {
                $absDelta = abs($tiffin_delta);
                $customMessage = "Tiffin exceeded by {$absDelta} mins ({$tiffin_delta}m deducted from Mango Overtime ⚡).";
            } else {
                $customMessage = "Tiffin completed right on schedule (40m limit).";
            }
        }

        // Realtime notification via Pusher
        try {
            $pusher = new PusherHelper();
            $pusherPayload = [
                "break_id" => $break_id,
                "user_id" => $user_id,
                "break_type" => $break_type,
                "purpose" => $purpose,
                "status" => "Completed",
                "duration_minutes" => $duration_minutes,
                "tiffin_delta" => $tiffin_delta,
                "available_mango_minutes" => $availableMangoMins,
                "message" => $customMessage,
                "end_time" => $end_time
            ];
            $pusher->trigger('staff-breaks', 'break-ended', $pusherPayload);
            $pusher->trigger("user-channel-{$user_id}", 'break-ended', $pusherPayload);
        } catch (Throwable $pe) {}

        echo json_encode([
            "status" => "success", 
            "message" => $customMessage, 
            "duration" => $duration_minutes,
            "tiffin_delta" => $tiffin_delta,
            "available_mango_minutes" => $availableMangoMins,
            "data" => [
                "break_id" => $break_id,
                "user_id" => $user_id,
                "break_type" => $break_type,
                "purpose" => $purpose,
                "duration_minutes" => $duration_minutes,
                "tiffin_delta" => $tiffin_delta,
                "available_mango_minutes" => $availableMangoMins,
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
