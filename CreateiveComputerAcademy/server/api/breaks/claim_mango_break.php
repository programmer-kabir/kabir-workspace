<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../config/PusherHelper.php';
require_once 'BreakDbHelper.php';
require_once '../payroll/PayrollHelper.php';

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
$leave_date = trim($data->leave_date);
$reason = isset($data->reason) ? trim($data->reason) : 'Redeemed from Mango Overtime Tree';
$today = date('Y-m-d');

// ── 1. Date Format Validation ──────────────────────────────────────────────────
$dObj = DateTime::createFromFormat('Y-m-d', $leave_date);
if (!$dObj || $dObj->format('Y-m-d') !== $leave_date) {
    echo json_encode(["status" => "error", "message" => "ভুল তারিখের ফরমেট! অনুগ্রহ করে YYYY-MM-DD ফরমেটে তারিখ দিন।"]);
    exit;
}

// ── 2. Friday (Weekly Holiday) Check ───────────────────────────────────────────
if (date('N', strtotime($leave_date)) == 5) {
    echo json_encode(["status" => "error", "message" => "শুক্রবার একাডেমি বন্ধ! সাপ্তাহিক ছুটির দিনে ম্যাঙ্গো ব্রেক ক্লেইম করার প্রয়োজন নেই।"]);
    exit;
}

// ── 3. Public/Academic Holiday Check ───────────────────────────────────────────
try {
    $holStmt = $db->prepare("SELECT title FROM holidays WHERE date = :leave_date LIMIT 1");
    $holStmt->execute([':leave_date' => $leave_date]);
    $holiday = $holStmt->fetch(PDO::FETCH_ASSOC);
    if ($holiday) {
        $holTitle = htmlspecialchars($holiday['title']);
        echo json_encode(["status" => "error", "message" => "নির্বাচিত তারিখে ইতোমধ্যে একাডেমি ছুটি রয়েছে ({$holTitle})। ছুটির দিনে ম্যাঙ্গো ব্রেক ক্লেইম করা যাবে না।"]);
        exit;
    }
} catch (Throwable $e) {}

// ── 4. Attendance Collision Check (Cannot claim on a day already worked) ───────
try {
    $attStmt = $db->prepare("SELECT id FROM attendance WHERE user_id = :user_id AND date = :leave_date AND check_in IS NOT NULL LIMIT 1");
    $attStmt->execute([':user_id' => $user_id, ':leave_date' => $leave_date]);
    if ($attStmt->fetch()) {
        echo json_encode(["status" => "error", "message" => "আপনি এই তারিখে ইতোমধ্যে অফিসে উপস্থিত ছিলেন! কাজের দিনে ছুটির ব্রেক ক্লেইম করা যাবে না।"]);
        exit;
    }
} catch (Throwable $e) {}

// ── 5. Duplicate Claim in user_breaks Check ────────────────────────────────────
try {
    $dupStmt = $db->prepare("SELECT id FROM user_breaks WHERE user_id = :user_id AND date = :leave_date AND break_type = 'Mango Full Day' AND status != 'Rejected' LIMIT 1");
    $dupStmt->execute([':user_id' => $user_id, ':leave_date' => $leave_date]);
    if ($dupStmt->fetch()) {
        echo json_encode(["status" => "error", "message" => "এই তারিখের জন্য আপনি ইতোমধ্যে ১টি ম্যাঙ্গো ব্রেক ডে ক্লেইম করেছেন।"]);
        exit;
    }
} catch (Throwable $e) {}

// ── 6. Existing Approved Leave in leave_requests Check ─────────────────────────
try {
    $lrDupStmt = $db->prepare("SELECT id, type FROM leave_requests WHERE user_id = :user_id AND :leave_date BETWEEN start_date AND end_date AND status = 'Approved' LIMIT 1");
    $lrDupStmt->execute([':user_id' => $user_id, ':leave_date' => $leave_date]);
    $existingLeave = $lrDupStmt->fetch(PDO::FETCH_ASSOC);
    if ($existingLeave) {
        $lType = htmlspecialchars($existingLeave['type']);
        echo json_encode(["status" => "error", "message" => "এই তারিখে ইতোমধ্যে আপনার একটি অনুমোদিত ছুটি ({$lType}) রয়েছে।"]);
        exit;
    }
} catch (Throwable $e) {}

// ── 7. Fetch Staff Shift Hours & Required Minutes ──────────────────────────────
$empStmt = $db->prepare("SELECT COALESCE(e.shift_hours, 8) as shift_hours FROM users u LEFT JOIN employees e ON u.id = e.user_id WHERE u.id = :user_id LIMIT 1");
$empStmt->execute([':user_id' => $user_id]);
$empRow = $empStmt->fetch(PDO::FETCH_ASSOC);
$shiftHours = $empRow ? (float)$empRow['shift_hours'] : 8.0;
if ($shiftHours <= 0) $shiftHours = 8.0;

$requiredMinutes = (int)round($shiftHours * 60);
$claimHours = $shiftHours; // Exactly 1 standard shift day

// ── 8. Strict Overtime Balance Guard ───────────────────────────────────────────
$availableMinutes = BreakDbHelper::getAvailableMangoMinutes($db, $user_id);
if ($availableMinutes < $requiredMinutes) {
    $availH = floor($availableMinutes / 60);
    $availM = $availableMinutes % 60;
    $availStr = $availH > 0 ? "{$availH} ঘণ্টা {$availM} মিনিট" : "{$availM} মিনিট";
    echo json_encode([
        "status" => "error",
        "message" => "অপর্যাপ্ত ম্যাঙ্গো ব্যালেন্স! ১টি পূর্ণ দিনের ছুটির জন্য {$shiftHours} ঘণ্টা ({$requiredMinutes} মিনিট) ওভারটাইম প্রয়োজন। আপনার জমা রয়েছে মাত্র {$availStr}।"
    ]);
    exit;
}

// ── 9. Atomic Database Execution ───────────────────────────────────────────────
try {
    $db->beginTransaction();

    // 9.1 Insert into user_breaks
    $insStmt = $db->prepare("
        INSERT INTO user_breaks (
            user_id, date, break_type, duration_minutes, status, reason, created_at
        ) VALUES (
            :user_id, :leave_date, 'Mango Full Day', :mins, 'Approved', :reason, NOW()
        )
    ");
    $insStmt->execute([
        ':user_id' => $user_id,
        ':leave_date' => $leave_date,
        ':mins' => $requiredMinutes,
        ':reason' => $reason
    ]);
    $claim_id = (int)$db->lastInsertId();

    // 9.2 Sync into leave_requests as Approved Compensatory Leave
    $lrIns = $db->prepare("
        INSERT INTO leave_requests (
            user_id, start_date, end_date, type, reason, status
        ) VALUES (
            :user_id, :leave_date, :leave_date, 'Compensatory Leave', :reason, 'Approved'
        )
    ");
    $lrIns->execute([
        ':user_id' => $user_id,
        ':leave_date' => $leave_date,
        ':reason' => "Redeemed Mango Break: {$reason}"
    ]);

    // 9.3 Credit full paid leave salary into staff_work_earnings
    $activeScheme = PayrollHelper::getActiveScheme($db, $user_id);
    if ($activeScheme) {
        $schemeId = (int)$activeScheme['id'];
        $hourlyRate = floatval($activeScheme['hourly_rate']);
        $earnedAmount = round($claimHours * $hourlyRate, 2);

        $checkEarn = $db->prepare("SELECT id FROM staff_work_earnings WHERE scheme_id = :scheme_id AND source_type = 'mango_leave' AND reference_id = :ref_id LIMIT 1");
        $checkEarn->execute([':scheme_id' => $schemeId, ':ref_id' => $claim_id]);
        if (!$checkEarn->fetch()) {
            $insEarn = $db->prepare("
                INSERT INTO staff_work_earnings (
                    user_id, scheme_id, work_date, session_start, session_end,
                    approved_minutes, applied_rate, earned_amount, is_surplus,
                    source_type, reference_id, notes, created_at
                ) VALUES (
                    :user_id, :scheme_id, :work_date, :session_start, :session_end,
                    :approved_minutes, :applied_rate, :earned_amount, 0,
                    'mango_leave', :reference_id, :notes, NOW()
                )
            ");
            $insEarn->execute([
                ':user_id' => $user_id,
                ':scheme_id' => $schemeId,
                ':work_date' => $leave_date,
                ':session_start' => $leave_date . ' 09:00:00',
                ':session_end' => $leave_date . ' 17:00:00',
                ':approved_minutes' => $requiredMinutes,
                ':applied_rate' => $hourlyRate,
                ':earned_amount' => $earnedAmount,
                ':reference_id' => $claim_id,
                ':notes' => "Paid Mango Day Off (Redeemed {$claimHours}h Break from Overtime Bank)"
            ]);
        }
    }

    $db->commit();

    // ── 10. Real-time Notification & Success Response ───────────────────────────
    $newAvailableMinutes = BreakDbHelper::getAvailableMangoMinutes($db, $user_id);
    $newRipeMangoes = (int)floor($newAvailableMinutes / $shiftHours);

    try {
        $pusher = new PusherHelper();
        $pusher->trigger("user-channel-{$user_id}", 'mango-break-claimed', [
            'claim_id' => $claim_id,
            'leave_date' => $leave_date,
            'hours' => $claimHours,
            'remaining_minutes' => $newAvailableMinutes,
            'remaining_mangoes' => $newRipeMangoes
        ]);
        $pusher->trigger('staff-breaks', 'mango-break-claimed', [
            'user_id' => $user_id,
            'leave_date' => $leave_date
        ]);
    } catch (Throwable $pe) {}

    echo json_encode([
        "status" => "success",
        "message" => "🥭 ম্যাঙ্গো ব্রেক সফলভাবে ক্লেইম করা হয়েছে! আপনার ছুটির দিনটি অনুমোদিত হয়েছে।",
        "data" => [
            "claim_id" => $claim_id,
            "leave_date" => $leave_date,
            "hours_claimed" => $claimHours,
            "minutes_deducted" => $requiredMinutes,
            "remaining_minutes" => $newAvailableMinutes,
            "remaining_mangoes" => $newRipeMangoes
        ]
    ]);

} catch (Throwable $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    echo json_encode(["status" => "error", "message" => "ক্লেইম প্রসেসিং ব্যর্থ হয়েছে: " . $e->getMessage()]);
}
?>
