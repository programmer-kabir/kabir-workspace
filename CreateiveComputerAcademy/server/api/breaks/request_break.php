<?php

require_once '../../config/database.php';
require_once '../../config/PusherHelper.php';
require_once 'BreakDbHelper.php';
require_once '../../config/cors.php';
date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();
BreakDbHelper::ensureSchema($db);

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->user_id)) {
    echo json_encode(["status" => "error", "message" => "user_id is required."]);
    exit;
}

$user_id = (int)$data->user_id;

// Rule: User ID 2 is excluded from custom break system
if ($user_id === 2) {
    echo json_encode(["status" => "error", "message" => "Custom break requests are not applicable for this user."]);
    exit;
}

$break_type = !empty($data->break_type) ? trim($data->break_type) : 'Personal';
$reason = !empty($data->reason) ? trim($data->reason) : '';
$estimated_minutes = isset($data->estimated_minutes) ? (int)$data->estimated_minutes : 30;
$today = date('Y-m-d');

try {
    // 1. Check if user already has an active or pending break
    $chkStmt = $db->prepare("SELECT id, status, break_type FROM employee_breaks 
                             WHERE user_id = :user_id AND date = :date AND status IN ('Pending', 'Active') 
                             ORDER BY id DESC LIMIT 1");
    $chkStmt->execute([':user_id' => $user_id, ':date' => $today]);
    $existing = $chkStmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        if ($existing['status'] === 'Active') {
            echo json_encode(["status" => "error", "message" => "You already have an active break in progress."]);
            exit;
        } else if ($existing['status'] === 'Pending') {
            echo json_encode(["status" => "error", "message" => "You already have a pending break request waiting for Admin approval."]);
            exit;
        }
    }

    // 2. Fetch user name & avatar for pusher notification
    $uStmt = $db->prepare("SELECT name, profile_picture FROM users WHERE id = :user_id LIMIT 1");
    $uStmt->execute([':user_id' => $user_id]);
    $user = $uStmt->fetch(PDO::FETCH_ASSOC);
    $userName = $user ? $user['name'] : "Staff #{$user_id}";

    // 3. Insert new break request with status = 'Pending'
    $insStmt = $db->prepare("INSERT INTO employee_breaks 
                             (user_id, date, break_type, start_time, status, reason, estimated_minutes, created_at) 
                             VALUES (:user_id, :date, :break_type, NULL, 'Pending', :reason, :estimated_minutes, NOW())");
    $insStmt->execute([
        ':user_id' => $user_id,
        ':date' => $today,
        ':break_type' => $break_type,
        ':reason' => $reason,
        ':estimated_minutes' => $estimated_minutes
    ]);

    $break_id = $db->lastInsertId();

    $responsePayload = [
        "id" => (int)$break_id,
        "user_id" => $user_id,
        "user_name" => $userName,
        "user_avatar" => $user['profile_picture'] ?? null,
        "date" => $today,
        "break_type" => $break_type,
        "reason" => $reason,
        "estimated_minutes" => $estimated_minutes,
        "status" => "Pending",
        "created_at" => date('Y-m-d H:i:s')
    ];

    // 4. Trigger Real-time event via Pusher to Admin
    try {
        $pusher = new PusherHelper();
        $pusher->trigger('staff-breaks', 'break-requested', $responsePayload);
    } catch (Throwable $pe) {
        error_log("Pusher break-requested error: " . $pe->getMessage());
    }

    // 5. Create in-app notification for admin if helper exists
    try {
        if (file_exists(__DIR__ . '/../notifications/notification_helper.php')) {
            require_once __DIR__ . '/../notifications/notification_helper.php';
            // Get admin users
            $admStmt = $db->query("SELECT user_id FROM user_roles WHERE role = 'admin'");
            $adminIds = $admStmt->fetchAll(PDO::FETCH_COLUMN);
            foreach ($adminIds as $adminId) {
                NotificationHelper::sendToUser(
                    $db,
                    $adminId,
                    $user_id,
                    "☕ Break Request from {$userName}",
                    "{$userName} requested {$estimated_minutes} mins {$break_type} break. Reason: {$reason}",
                    "break_request",
                    "admin",
                    "/roster",
                    "normal",
                    ["break_id" => $break_id, "user_id" => $user_id, "break_type" => $break_type]
                );
            }
        }
    } catch (Throwable $ne) {}

    echo json_encode([
        "status" => "success",
        "message" => "Break request submitted. Waiting for Admin approval.",
        "data" => $responsePayload
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
