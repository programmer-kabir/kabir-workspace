<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=UTF-8");
date_default_timezone_set('Asia/Dhaka');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "error" => "Invalid request method"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);

$installment_id = (int)($input["installment_id"] ?? 0);
$new_amount     = (float)($input["new_amount"] ?? 0);
$new_date       = trim($input["new_date"] ?? "");
$request_reason = trim($input["request_reason"] ?? "");
$requested_by   = (int)($input["requested_by"] ?? 0);

if ($installment_id <= 0 || $new_amount <= 0 || empty($new_date) || empty($request_reason) || $requested_by <= 0) {
    echo json_encode(["success" => false, "error" => "সবগুলো ফিল্ড সঠিকভাবে পূরণ করুন"]);
    exit;
}

// 1. Fetch current daily installment
$stmtInst = $mysqli->prepare("SELECT id, userId, cardId, amount, date, receiver FROM daily_installments WHERE id = ? LIMIT 1");
if (!$stmtInst) {
    echo json_encode(["success" => false, "error" => "DB error: " . $mysqli->error]);
    exit;
}
$stmtInst->bind_param("i", $installment_id);
$stmtInst->execute();
$current = $stmtInst->get_result()->fetch_assoc();
$stmtInst->close();

if (!$current) {
    echo json_encode(["success" => false, "error" => "দৈনিক কিস্তি পাওয়া যায়নি"]);
    exit;
}

$user_id    = (int)$current["userId"];
$card_id    = (int)$current["cardId"];
$old_amount = (float)$current["amount"];
$old_date   = $current["date"];
$now        = date("Y-m-d H:i:s");

// 2. Requester & Customer names
$requesterName = "User #$requested_by";
$stmtReq = $mysqli->prepare("
    SELECT u.name, r.role 
    FROM users u 
    LEFT JOIN user_roles r ON r.user_id = u.id 
    WHERE u.id = ? 
    LIMIT 1
");
$isDirectAdmin = false;
if ($stmtReq) {
    $stmtReq->bind_param("i", $requested_by);
    $stmtReq->execute();
    $rReq = $stmtReq->get_result()->fetch_assoc();
    if ($rReq) {
        if (!empty($rReq['name'])) $requesterName = $rReq['name'];
        $roleStr = strtolower(json_encode($rReq['role'] ?? ''));
        if (strpos($roleStr, 'admin') !== false || strpos($roleStr, 'developer') !== false) {
            $isDirectAdmin = true;
        }
    }
    $stmtReq->close();
}

$customerName = "User #$user_id";
$stmtCust = $mysqli->prepare("SELECT name FROM users WHERE id = ? LIMIT 1");
if ($stmtCust) {
    $stmtCust->bind_param("i", $user_id);
    $stmtCust->execute();
    $rCust = $stmtCust->get_result()->fetch_assoc();
    if ($rCust && !empty($rCust['name'])) $customerName = $rCust['name'];
    $stmtCust->close();
}

// 3. Check for existing pending request
$stmtCheck = $mysqli->prepare("SELECT id FROM daily_installment_edits WHERE installment_id = ? AND status = 'pending' LIMIT 1");
$stmtCheck->bind_param("i", $installment_id);
$stmtCheck->execute();
$existingPending = $stmtCheck->get_result()->fetch_assoc();
$stmtCheck->close();

$edit_id = 0;
if ($existingPending) {
    // Update existing pending
    $edit_id = (int)$existingPending['id'];
    $stmtUp = $mysqli->prepare("
        UPDATE daily_installment_edits 
        SET new_amount = ?, new_date = ?, request_reason = ?, requested_by = ?, created_at = ? 
        WHERE id = ?
    ");
    $stmtUp->bind_param("dssisi", $new_amount, $new_date, $request_reason, $requested_by, $now, $edit_id);
    $stmtUp->execute();
    $stmtUp->close();
} else {
    // Insert new pending request
    $stmtIns = $mysqli->prepare("
        INSERT INTO daily_installment_edits 
        (installment_id, card_id, user_id, old_amount, new_amount, old_date, new_date, request_reason, requested_by, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    ");
    $stmtIns->bind_param("iiiddsssds", $installment_id, $card_id, $user_id, $old_amount, $new_amount, $old_date, $new_date, $request_reason, $requested_by, $now);
    $stmtIns->execute();
    $edit_id = $stmtIns->insert_id;
    $stmtIns->close();
}

// 4. Send notification to Admin & Developer
$targetRoles = '["admin","developer"]';
$notifType   = 'daily_installment_edit_request';
$notifTitle  = 'দৈনিক কিস্তি সংশোধনের অনুরোধ';
$notifMsg    = "{$requesterName} গ্রাহক {$customerName} (কার্ড #{$card_id}) এর দৈনিক কিস্তির পরিমাণ ৳" . number_format($old_amount, 2) . " থেকে ৳" . number_format($new_amount, 2) . " করার জন্য অনুরোধ জানিয়েছেন। কারণ: {$request_reason}";
$notifLink   = "/DailyInstallments/daily_installments_users/{$card_id}";

$stmtNotif = $mysqli->prepare("
    INSERT INTO notifications 
    (user_id, target_roles, type, title, message, link, edit_id, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
");
if ($stmtNotif) {
    $stmtNotif->bind_param("isssssis", $requested_by, $targetRoles, $notifType, $notifTitle, $notifMsg, $notifLink, $edit_id, $now);
    $stmtNotif->execute();
    $stmtNotif->close();
}

echo json_encode([
    "success" => true,
    "pending_approval" => true,
    "edit_id" => $edit_id,
    "message" => "সংশোধনের অনুরোধ সফলভাবে পাঠানো হয়েছে। অ্যাডমিন বা ডেভেলপার অনুমোদন করলে কিস্তি এবং ক্যাশ স্বয়ংক্রিয়ভাবে আপডেট হবে।"
]);
