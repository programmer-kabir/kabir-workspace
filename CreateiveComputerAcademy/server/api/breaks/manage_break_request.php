<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../config/PusherHelper.php';
require_once 'BreakDbHelper.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();
BreakDbHelper::ensureSchema($db);

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->break_id) || !isset($data->action)) {
    echo json_encode(["status" => "error", "message" => "break_id and action ('approve' or 'reject') are required."]);
    exit;
}

$break_id = (int)$data->break_id;
$action = strtolower(trim($data->action));
$admin_id = isset($data->admin_id) ? (int)$data->admin_id : null;

try {
    // 1. Fetch break record
    $stmt = $db->prepare("SELECT eb.*, u.name as user_name FROM employee_breaks eb 
                          LEFT JOIN users u ON eb.user_id = u.id 
                          WHERE eb.id = :id LIMIT 1");
    $stmt->execute([':id' => $break_id]);
    $breakRecord = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$breakRecord) {
        echo json_encode(["status" => "error", "message" => "Break record not found."]);
        exit;
    }

    if ($breakRecord['status'] !== 'Pending') {
        echo json_encode(["status" => "error", "message" => "This break request is already {$breakRecord['status']}."]);
        exit;
    }

    $staffUserId = (int)$breakRecord['user_id'];
    $staffName = $breakRecord['user_name'] ?: "Staff #{$staffUserId}";
    $now = date('Y-m-d H:i:s');

    if ($action === 'approve') {
        $upd = $db->prepare("UPDATE employee_breaks 
                             SET status = 'Active', 
                                 start_time = :now, 
                                 approved_by = :admin_id, 
                                 approved_at = :now, 
                                 updated_at = :now 
                             WHERE id = :id");
        $upd->execute([
            ':now' => $now,
            ':admin_id' => $admin_id,
            ':id' => $break_id
        ]);

        $payload = [
            "break_id" => $break_id,
            "user_id" => $staffUserId,
            "user_name" => $staffName,
            "break_type" => $breakRecord['break_type'],
            "status" => "Active",
            "start_time" => $now,
            "reason" => $breakRecord['reason'],
            "estimated_minutes" => $breakRecord['estimated_minutes'],
            "server_time" => $now
        ];

        // Pusher Realtime Notification to Staff
        try {
            $pusher = new PusherHelper();
            $pusher->trigger('staff-breaks', 'break-approved', $payload);
            $pusher->trigger("user-channel-{$staffUserId}", 'break-approved', $payload);
        } catch (Throwable $pe) {}

        // In-app notification
        try {
            if (file_exists(__DIR__ . '/../notifications/notification_helper.php')) {
                require_once __DIR__ . '/../notifications/notification_helper.php';
                NotificationHelper::sendToUser(
                    $db,
                    $staffUserId,
                    $admin_id,
                    "✅ Break Request Approved!",
                    "Your {$breakRecord['break_type']} break request has been approved. You may now take your break.",
                    "break_approved",
                    "staff",
                    "/dashboard",
                    "normal",
                    ["break_id" => $break_id, "start_time" => $now]
                );
            }
        } catch (Throwable $ne) {}

        echo json_encode([
            "status" => "success",
            "message" => "Break request approved successfully.",
            "data" => $payload
        ]);

    } else if ($action === 'reject') {
        $upd = $db->prepare("UPDATE employee_breaks 
                             SET status = 'Rejected', 
                                 end_time = :now, 
                                 approved_by = :admin_id, 
                                 approved_at = :now, 
                                 updated_at = :now 
                             WHERE id = :id");
        $upd->execute([
            ':now' => $now,
            ':admin_id' => $admin_id,
            ':id' => $break_id
        ]);

        $payload = [
            "break_id" => $break_id,
            "user_id" => $staffUserId,
            "status" => "Rejected"
        ];

        // Pusher Realtime Notification to Staff
        try {
            $pusher = new PusherHelper();
            $pusher->trigger('staff-breaks', 'break-rejected', $payload);
            $pusher->trigger("user-channel-{$staffUserId}", 'break-rejected', $payload);
        } catch (Throwable $pe) {}

        // In-app notification
        try {
            if (file_exists(__DIR__ . '/../notifications/notification_helper.php')) {
                require_once __DIR__ . '/../notifications/notification_helper.php';
                NotificationHelper::sendToUser(
                    $db,
                    $staffUserId,
                    $admin_id,
                    "❌ Break Request Declined",
                    "Your {$breakRecord['break_type']} break request was not approved by Admin.",
                    "break_rejected",
                    "staff",
                    "/dashboard",
                    "normal",
                    ["break_id" => $break_id]
                );
            }
        } catch (Throwable $ne) {}

        echo json_encode([
            "status" => "success",
            "message" => "Break request rejected.",
            "data" => $payload
        ]);

    } else {
        echo json_encode(["status" => "error", "message" => "Invalid action. Use 'approve' or 'reject'."]);
    }

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
