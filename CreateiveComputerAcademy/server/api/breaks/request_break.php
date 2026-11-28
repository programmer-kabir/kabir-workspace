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

// Rule: Users with manual allocated break (has_tiffin_break = 0 or allocated_break_minutes > 0) use direct manual BreakWidget
$empStmt = $db->prepare("SELECT has_tiffin_break, allocated_break_minutes FROM employees WHERE user_id = :user_id LIMIT 1");
$empStmt->execute([':user_id' => $user_id]);
$empCfg = $empStmt->fetch(PDO::FETCH_ASSOC);

if ($empCfg) {
    $hasTiffin = isset($empCfg['has_tiffin_break']) ? (int)$empCfg['has_tiffin_break'] : 1;
    $allocBreak = isset($empCfg['allocated_break_minutes']) && $empCfg['allocated_break_minutes'] !== null ? (int)$empCfg['allocated_break_minutes'] : 0;
    if ($hasTiffin === 0 || ($allocBreak > 0 && $hasTiffin === 0)) {
        echo json_encode(["status" => "error", "message" => "Custom break requests are not applicable for your account. You have daily allocated manual breaks."]);
        exit;
    }
}

$break_type = !empty($data->break_type) ? trim($data->break_type) : 'Mango Break';
$purpose = !empty($data->purpose) ? trim($data->purpose) : ($break_type === 'Tiffin' ? 'Tiffin' : ($break_type === 'Namaz' ? 'Namaz' : 'Personal'));
$reason = !empty($data->reason) ? trim($data->reason) : '';
$estimated_minutes = isset($data->estimated_minutes) ? (int)$data->estimated_minutes : 15;
$today = date('Y-m-d');

$isEmergency = ($break_type === 'Emergency Break' || !empty($data->is_emergency) || !empty($data->is_emergency_gap));

try {
    // Rule: Center paid breaks are Tiffin (40m) and Namaz (20m) — no overtime balance required
    if ($isEmergency) {
        $break_type = 'Emergency Break';
        $purpose = 'Emergency Gap';

        if (empty($reason)) {
            echo json_encode(["status" => "error", "message" => "A specific reason is required for an Emergency Break request."]);
            exit;
        }

        // Limit emergency break to max 60 minutes
        if ($estimated_minutes > 60) {
            $estimated_minutes = 60;
        }

        // Monthly emergency break quota: Maximum 3 approved/pending emergency breaks per calendar month
        $curMonth = date('Y-m');
        $mCountStmt = $db->prepare("SELECT COUNT(*) FROM user_breaks WHERE user_id = :uid AND break_type = 'Emergency Break' AND DATE_FORMAT(date, '%Y-%m') = :m AND status != 'Rejected'");
        $mCountStmt->execute([':uid' => $user_id, ':m' => $curMonth]);
        $monthlyCount = (int)$mCountStmt->fetchColumn();

        if ($monthlyCount >= 3) {
            echo json_encode([
                "status" => "error", 
                "message" => "Monthly emergency break limit reached (Maximum 3 emergency breaks allowed per month). Please consult Admin directly."
            ]);
            exit;
        }

    } else if ($break_type === 'Tiffin') {
        $tCheck = $db->prepare("SELECT id FROM user_breaks WHERE user_id = :user_id AND date = :date AND break_type = 'Tiffin' AND status = 'Completed' LIMIT 1");
        $tCheck->execute([':user_id' => $user_id, ':date' => $today]);
        if ($tCheck->rowCount() > 0) {
            echo json_encode(["status" => "error", "message" => "You have already completed your daily scheduled Tiffin break for today."]);
            exit;
        }
    } else if ($break_type === 'Namaz') {
        $nCheck = $db->prepare("SELECT id FROM user_breaks WHERE user_id = :user_id AND date = :date AND break_type = 'Namaz' AND status = 'Completed' LIMIT 1");
        $nCheck->execute([':user_id' => $user_id, ':date' => $today]);
        if ($nCheck->rowCount() > 0) {
            echo json_encode(["status" => "error", "message" => "You have already completed your daily scheduled Namaz break for today."]);
            exit;
        }
    } else {
        // Rule: All regular custom breaks MUST be funded by Mango Overtime Bank
        $break_type = 'Mango Break';
        $availableMinutes = BreakDbHelper::getAvailableMangoMinutes($db, $user_id);

        if ($availableMinutes < $estimated_minutes) {
            $h = floor($availableMinutes / 60);
            $m = $availableMinutes % 60;
            $availStr = $h > 0 ? "{$h}h {$m}m" : "{$m} mins";
            echo json_encode([
                "status" => "error",
                "message" => "Insufficient Mango Overtime balance. You have {$availStr} ({$availableMinutes} mins) available, but requested {$estimated_minutes} mins. For critical emergencies with zero mangoes, use the 'Emergency Break' request option."
            ]);
            exit;
        }
    }

    // 1. Check if user already has an active or pending break
    $chkStmt = $db->prepare("SELECT id, status, break_type, purpose FROM user_breaks 
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
    $userName = $user ? $user['name'] : "User #{$user_id}";

    // 3. Insert new break request with status = 'Pending'
    $insStmt = $db->prepare("INSERT INTO user_breaks 
                             (user_id, date, break_type, purpose, start_time, status, reason, estimated_minutes, created_at) 
                             VALUES (:user_id, :date, :break_type, :purpose, NULL, 'Pending', :reason, :estimated_minutes, NOW())");
    $insStmt->execute([
        ':user_id' => $user_id,
        ':date' => $today,
        ':break_type' => $break_type,
        ':purpose' => $purpose,
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
        "purpose" => $purpose,
        "is_emergency" => (bool)$isEmergency,
        "reason" => $reason,
        "estimated_minutes" => $estimated_minutes,
        "status" => "Pending",
        "created_at" => date('Y-m-d H:i:s')
    ];

    // 4. Trigger Real-time event via Pusher to Admin
    try {
        $pusher = new PusherHelper();
        $pusher->trigger('staff-breaks', 'break-requested', $responsePayload);
        $pusher->trigger('admin-breaks', 'break-requested', $responsePayload);
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
            $notifTitle = $isEmergency ? "🚨 Emergency Break Request from {$userName}" : "☕ Break Request from {$userName}";
            $notifBody = $isEmergency 
                ? "{$userName} requested {$estimated_minutes}m Emergency Break (Zero Mangoes). Reason: '{$reason}'. If approved, counts as work gap."
                : "{$userName} requested {$estimated_minutes} mins {$break_type} ({$purpose}). Reason: {$reason}";

            foreach ($adminIds as $adminId) {
                NotificationHelper::sendToUser(
                    $db,
                    $adminId,
                    $user_id,
                    $notifTitle,
                    $notifBody,
                    $isEmergency ? "emergency_break_request" : "break_request",
                    "admin",
                    "/roster",
                    $isEmergency ? "urgent" : "normal",
                    ["break_id" => $break_id, "user_id" => $user_id, "break_type" => $break_type, "purpose" => $purpose, "is_emergency" => $isEmergency]
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
