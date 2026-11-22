<?php
// proxy_punch.php - Master Proxy Attendance & Administrative Punch Override API
// Allows authorized Admin and Developer users to punch in / punch out for any staff member

require_once '../../../config/cors.php';
require_once '../../../config/database.php';
require_once '../../notifications/notification_helper.php';
require_once '../attendance/AttendanceDbHelper.php';
require_once '../../attendance/AttendanceSecurityHelper.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

// Self-heal schemas automatically
AttendanceDbHelper::ensureSchema($db);
AttendanceSecurityHelper::ensureTables($db);

$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput, true);
if (!is_array($data)) {
    $data = [];
}

// 1. Resolve Authorization Token / Operator
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$token = $data['token'] ?? '';
if (empty($token) && !empty($authHeader) && strpos($authHeader, 'Bearer ') === 0) {
    $token = substr($authHeader, 7);
}

$operatorId = isset($data['operator_id']) ? (int)$data['operator_id'] : (isset($data['admin_id']) ? (int)$data['admin_id'] : 0);
$operatorUser = null;

if (!empty($token)) {
    $tokStmt = $db->prepare("
        SELECT u.id, u.name, u.email 
        FROM user_tokens ut
        INNER JOIN users u ON ut.user_id = u.id
        WHERE ut.token = :token AND ut.expires_at > NOW()
        LIMIT 1
    ");
    $tokStmt->execute([':token' => $token]);
    $operatorUser = $tokStmt->fetch(PDO::FETCH_ASSOC);
    if ($operatorUser) {
        $operatorId = (int)$operatorUser['id'];
    }
}

if (!$operatorUser && $operatorId > 0) {
    $uStmt = $db->prepare("SELECT id, name, email FROM users WHERE id = :id LIMIT 1");
    $uStmt->execute([':id' => $operatorId]);
    $operatorUser = $uStmt->fetch(PDO::FETCH_ASSOC);
}

if (!$operatorUser) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Authentication required. Please log in as Admin or Developer."]);
    exit;
}

// Verify Admin or Developer privileges
$rStmt = $db->prepare("SELECT role FROM user_roles WHERE user_id = :id");
$rStmt->execute([':id' => $operatorId]);
$operatorRoles = $rStmt->fetchAll(PDO::FETCH_COLUMN);

if (!in_array('admin', $operatorRoles) && !in_array('developer', $operatorRoles)) {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Access denied. Only Admin and Developer accounts can perform proxy punches."]);
    exit;
}

// 2. Validate Target User
$targetUserId = isset($data['target_user_id']) ? (int)$data['target_user_id'] : 0;
if (!$targetUserId) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Target user ID is required."]);
    exit;
}

$tStmt = $db->prepare("
    SELECT u.id, u.name, u.email, e.shift_start, e.shift_end 
    FROM users u
    LEFT JOIN employees e ON u.id = e.user_id
    WHERE u.id = :uid LIMIT 1
");
$tStmt->execute([':uid' => $targetUserId]);
$targetUser = $tStmt->fetch(PDO::FETCH_ASSOC);

if (!$targetUser) {
    http_response_code(404);
    echo json_encode(["status" => "error", "message" => "Target staff member not found."]);
    exit;
}

// 3. Parse Parameters
$punchType = isset($data['punch_type']) ? strtolower(trim($data['punch_type'])) : 'check_in';
if (!in_array($punchType, ['check_in', 'check_out', 'both'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid punch_type. Must be check_in, check_out, or both."]);
    exit;
}

$today = date('Y-m-d');
$nowTime = date('H:i:s');

$punchDate = !empty($data['punch_date']) ? trim($data['punch_date']) : $today;
$punchTime = !empty($data['punch_time']) ? trim($data['punch_time']) : $nowTime;

// Normalize time string (HH:MM or HH:MM:SS)
if (preg_match('/^(\d{2}:\d{2})$/', $punchTime)) {
    $punchTime .= ':00';
}

$reason = !empty($data['reason']) ? trim($data['reason']) : 'System Maintenance / সাইট আপডেট';
$notes = !empty($data['notes']) ? trim($data['notes']) : null;
$clientIp = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';

try {
    $attendanceId = null;
    $actionMessage = '';

    // Check existing attendance on that date
    $checkStmt = $db->prepare("SELECT id, check_in, check_out, status FROM attendance WHERE user_id = :uid AND date = :date LIMIT 1");
    $checkStmt->execute([':uid' => $targetUserId, ':date' => $punchDate]);
    $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if ($punchType === 'check_in') {
        $formattedCheckIn = $punchDate . ' ' . $punchTime;

        if ($existing) {
            $attendanceId = (int)$existing['id'];
            $upStmt = $db->prepare("
                UPDATE attendance 
                SET check_in = :ci, 
                    status = 'Present', 
                    is_admin_override = 1, 
                    punched_by_user_id = :op_id, 
                    admin_override_reason = :reason 
                WHERE id = :id
            ");
            $upStmt->execute([
                ':ci'     => $formattedCheckIn,
                ':op_id'  => $operatorId,
                ':reason' => $reason,
                ':id'     => $attendanceId
            ]);
            $actionMessage = "Check-in updated for {$targetUser['name']} at {$punchTime}.";
        } else {
            $inStmt = $db->prepare("
                INSERT INTO attendance 
                    (user_id, date, check_in, status, is_admin_override, punched_by_user_id, admin_override_reason, is_forgotten_checkout) 
                VALUES 
                    (:uid, :date, :ci, 'Present', 1, :op_id, :reason, 0)
            ");
            $inStmt->execute([
                ':uid'    => $targetUserId,
                ':date'   => $punchDate,
                ':ci'     => $formattedCheckIn,
                ':op_id'  => $operatorId,
                ':reason' => $reason
            ]);
            $attendanceId = (int)$db->lastInsertId();
            $actionMessage = "Proxy Check-in recorded for {$targetUser['name']} at {$punchTime}.";
        }

        // Device log override entry
        try {
            $db->prepare("
                INSERT INTO attendance_device_logs 
                    (attendance_id, user_id, punch_type, timestamp, ip_address, network_type, device_type, device_brand, device_model, os_name, browser_name, screen_res, device_fingerprint, is_within_geofence, trust_score, fraud_flags, verification_status)
                VALUES 
                    (:att_id, :uid, 'check_in', NOW(), :ip, 'master_proxy', 'Admin Override', 'Master Console', 'Administrative Punch', 'Authorized Session', 'Staff/Admin Hub', 'N/A', 'proxy_override_hash', 1, 100, '[]', 'verified')
            ")->execute([
                ':att_id' => $attendanceId,
                ':uid'    => $targetUserId,
                ':ip'     => $clientIp
            ]);
        } catch (Throwable $eDev) {}

    } elseif ($punchType === 'check_out') {
        $formattedCheckOut = $punchDate . ' ' . $punchTime;

        if ($existing) {
            $attendanceId = (int)$existing['id'];
            $upStmt = $db->prepare("
                UPDATE attendance 
                SET check_out = :co, 
                    is_forgotten_checkout = 0, 
                    is_admin_override = 1, 
                    punched_by_user_id = :op_id, 
                    admin_override_reason = :reason 
                WHERE id = :id
            ");
            $upStmt->execute([
                ':co'     => $formattedCheckOut,
                ':op_id'  => $operatorId,
                ':reason' => $reason,
                ':id'     => $attendanceId
            ]);
            $actionMessage = "Check-out recorded for {$targetUser['name']} at {$punchTime}.";
        } else {
            // No record exists at all for today - auto insert check-in using shift_start or 09:00:00 and check-out at punchTime
            $defaultInTime = !empty($targetUser['shift_start']) ? $targetUser['shift_start'] : '09:00:00';
            $formattedCheckIn = $punchDate . ' ' . $defaultInTime;

            $inStmt = $db->prepare("
                INSERT INTO attendance 
                    (user_id, date, check_in, check_out, status, is_admin_override, punched_by_user_id, admin_override_reason, is_forgotten_checkout) 
                VALUES 
                    (:uid, :date, :ci, :co, 'Present', 1, :op_id, :reason, 0)
            ");
            $inStmt->execute([
                ':uid'    => $targetUserId,
                ':date'   => $punchDate,
                ':ci'     => $formattedCheckIn,
                ':co'     => $formattedCheckOut,
                ':op_id'  => $operatorId,
                ':reason' => $reason
            ]);
            $attendanceId = (int)$db->lastInsertId();
            $actionMessage = "Created attendance & recorded Check-out for {$targetUser['name']} at {$punchTime}.";
        }

        // Auto-close any active break safely
        try {
            $abStmt = $db->prepare("SELECT id, break_type, start_time FROM user_breaks WHERE user_id = :user_id AND status = 'Active' ORDER BY id DESC LIMIT 1");
            $abStmt->execute([':user_id' => $targetUserId]);
            $activeBreak = $abStmt->fetch(PDO::FETCH_ASSOC);
            if ($activeBreak) {
                $abId = (int)$activeBreak['id'];
                $abType = $activeBreak['break_type'];
                $sTime = strtotime($activeBreak['start_time']);
                $nowTs = time();
                $durMins = max(1, round(abs($nowTs - $sTime) / 60));
                $tDelta = 0;
                if ($abType === 'Tiffin') {
                    require_once __DIR__ . '/../../breaks/BreakDbHelper.php';
                    $tDelta = BreakDbHelper::calculateTiffinDelta($durMins);
                }
                $closeStmt = $db->prepare("UPDATE user_breaks SET end_time = NOW(), duration_minutes = :dur, tiffin_delta_minutes = :delta, status = 'Completed', updated_at = NOW() WHERE id = :id");
                $closeStmt->execute([':dur' => $durMins, ':delta' => $tDelta, ':id' => $abId]);
            }
        } catch (Throwable $eBrk) {}

        // Log device entry
        try {
            $db->prepare("
                INSERT INTO attendance_device_logs 
                    (attendance_id, user_id, punch_type, timestamp, ip_address, network_type, device_type, device_brand, device_model, os_name, browser_name, screen_res, device_fingerprint, is_within_geofence, trust_score, fraud_flags, verification_status)
                VALUES 
                    (:att_id, :uid, 'check_out', NOW(), :ip, 'master_proxy', 'Admin Override', 'Master Console', 'Administrative Punch', 'Authorized Session', 'Staff/Admin Hub', 'N/A', 'proxy_override_hash', 1, 100, '[]', 'verified')
            ")->execute([
                ':att_id' => $attendanceId,
                ':uid'    => $targetUserId,
                ':ip'     => $clientIp
            ]);
        } catch (Throwable $eDev) {}

    } elseif ($punchType === 'both') {
        $inTime = !empty($data['check_in_time']) ? trim($data['check_in_time']) : (!empty($targetUser['shift_start']) ? $targetUser['shift_start'] : '09:00:00');
        $outTime = !empty($data['check_out_time']) ? trim($data['check_out_time']) : (!empty($targetUser['shift_end']) ? $targetUser['shift_end'] : '17:00:00');

        if (preg_match('/^(\d{2}:\d{2})$/', $inTime)) $inTime .= ':00';
        if (preg_match('/^(\d{2}:\d{2})$/', $outTime)) $outTime .= ':00';

        $formattedCheckIn = $punchDate . ' ' . $inTime;
        $formattedCheckOut = $punchDate . ' ' . $outTime;

        if ($existing) {
            $attendanceId = (int)$existing['id'];
            $upStmt = $db->prepare("
                UPDATE attendance 
                SET check_in = :ci, 
                    check_out = :co, 
                    status = 'Present', 
                    is_forgotten_checkout = 0, 
                    is_admin_override = 1, 
                    punched_by_user_id = :op_id, 
                    admin_override_reason = :reason 
                WHERE id = :id
            ");
            $upStmt->execute([
                ':ci'     => $formattedCheckIn,
                ':co'     => $formattedCheckOut,
                ':op_id'  => $operatorId,
                ':reason' => $reason,
                ':id'     => $attendanceId
            ]);
        } else {
            $inStmt = $db->prepare("
                INSERT INTO attendance 
                    (user_id, date, check_in, check_out, status, is_admin_override, punched_by_user_id, admin_override_reason, is_forgotten_checkout) 
                VALUES 
                    (:uid, :date, :ci, :co, 'Present', 1, :op_id, :reason, 0)
            ");
            $inStmt->execute([
                ':uid'    => $targetUserId,
                ':date'   => $punchDate,
                ':ci'     => $formattedCheckIn,
                ':co'     => $formattedCheckOut,
                ':op_id'  => $operatorId,
                ':reason' => $reason
            ]);
            $attendanceId = (int)$db->lastInsertId();
        }
        $actionMessage = "Full Shift Proxy Attendance recorded for {$targetUser['name']} ({$inTime} - {$outTime}).";
    }

    // Auto-sync staff work-time earnings into payroll ledger
    try {
        require_once __DIR__ . '/../../payroll/PayrollHelper.php';
        PayrollHelper::syncAttendanceEarnings($db, $targetUserId);
    } catch (Throwable $ePay) {}

    // Audit log this proxy punch
    AttendanceDbHelper::logProxyPunch(
        $db,
        $targetUserId,
        $operatorId,
        $punchType,
        $punchDate,
        $punchTime,
        $reason,
        $notes,
        $clientIp
    );

    // Send notification to the staff member
    try {
        $ptLabel = ($punchType === 'check_in') ? 'Check-In' : (($punchType === 'check_out') ? 'Check-Out' : 'Full Attendance');
        NotificationHelper::sendToUser(
            $db,
            $targetUserId,
            $operatorId,
            "Proxy Attendance ({$ptLabel})",
            "Your attendance for {$punchDate} was recorded by {$operatorUser['name']} ({$reason}).",
            'attendance_alert',
            'staff',
            '/attendance'
        );
    } catch (Throwable $eNotif) {}

    // Fetch freshly updated attendance record
    $refStmt = $db->prepare("SELECT id, user_id, date, check_in, check_out, status, is_admin_override, punched_by_user_id, admin_override_reason FROM attendance WHERE id = :id LIMIT 1");
    $refStmt->execute([':id' => $attendanceId]);
    $updatedRecord = $refStmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        "status"            => "success",
        "message"           => $actionMessage,
        "attendance_id"     => $attendanceId,
        "target_user"       => [
            "id"   => $targetUser['id'],
            "name" => $targetUser['name']
        ],
        "punch_type"        => $punchType,
        "punch_date"        => $punchDate,
        "punch_time"        => $punchTime,
        "reason"            => $reason,
        "attendance_record" => $updatedRecord
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
