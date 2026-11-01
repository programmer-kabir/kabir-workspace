<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "error" => "Invalid request method"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);

$required = ["installment_id", "new_amount", "new_date", "request_reason", "requested_by"];
foreach ($required as $f) {
    if (!isset($input[$f]) || trim((string)$input[$f]) === "") {
        echo json_encode(["success" => false, "error" => "Missing required field: $f"]);
        exit;
    }
}

$installment_id = (int)$input["installment_id"];
$new_amount     = (float)$input["new_amount"];
$new_date       = trim($input["new_date"]);
$request_reason = trim($input["request_reason"]);
$requested_by   = (int)$input["requested_by"];

if ($installment_id <= 0 || $new_amount <= 0 || empty($new_date) || empty($request_reason) || $requested_by <= 0) {
    echo json_encode(["success" => false, "error" => "Invalid request parameters"]);
    exit;
}

// 1. Fetch existing installment
$stmtInst = $mysqli->prepare("
    SELECT id, investment_card_no, investor_id, investment_no, investment_date, amount
    FROM investment_installments 
    WHERE id = ? 
    LIMIT 1
");
if (!$stmtInst) {
    echo json_encode(["success" => false, "error" => "DB prepare error: " . $mysqli->error]);
    exit;
}
$stmtInst->bind_param("i", $installment_id);
$stmtInst->execute();
$current = $stmtInst->get_result()->fetch_assoc();
$stmtInst->close();

if (!$current) {
    echo json_encode(["success" => false, "error" => "কিস্তি পাওয়া যায়নি"]);
    exit;
}

$card_id       = (int)$current["investment_card_no"];
$investor_id   = (int)$current["investor_id"];
$installment_no = (int)$current["investment_no"];
$old_amount    = (float)$current["amount"];
$old_date      = $current["investment_date"];

// 2. Fetch Requester, Investor and Card Names
$requesterName = "কর্মী";
$stmtReq = $mysqli->prepare("SELECT name FROM users WHERE id = ? LIMIT 1");
if ($stmtReq) {
    $stmtReq->bind_param("i", $requested_by);
    $stmtReq->execute();
    $resReq = $stmtReq->get_result()->fetch_assoc();
    if ($resReq && !empty($resReq['name'])) $requesterName = $resReq['name'];
    $stmtReq->close();
}

$investorName = "ইনভেস্টর";
$stmtInv = $mysqli->prepare("SELECT name FROM users WHERE id = ? LIMIT 1");
if ($stmtInv) {
    $stmtInv->bind_param("i", $investor_id);
    $stmtInv->execute();
    $resInv = $stmtInv->get_result()->fetch_assoc();
    if ($resInv && !empty($resInv['name'])) $investorName = $resInv['name'];
    $stmtInv->close();
}

$cardName = "কার্ড #{$card_id}";
$stmtCard = $mysqli->prepare("SELECT card_name FROM investment_cards WHERE id = ? LIMIT 1");
if ($stmtCard) {
    $stmtCard->bind_param("i", $card_id);
    $stmtCard->execute();
    $resCard = $stmtCard->get_result()->fetch_assoc();
    if ($resCard && !empty($resCard['card_name'])) $cardName = $resCard['card_name'];
    $stmtCard->close();
}

// 3. Check for existing pending request
$stmtCheck = $mysqli->prepare("SELECT id FROM investment_installment_edits WHERE installment_id = ? AND status = 'pending' LIMIT 1");
$stmtCheck->bind_param("i", $installment_id);
$stmtCheck->execute();
$existingPending = $stmtCheck->get_result()->fetch_assoc();
$stmtCheck->close();

$edit_id = 0;
if ($existingPending) {
    // Update existing pending
    $edit_id = (int)$existingPending['id'];
    $stmtUpd = $mysqli->prepare("
        UPDATE investment_installment_edits
        SET new_amount = ?, new_date = ?, request_reason = ?, requested_by = ?, updated_at = NOW()
        WHERE id = ?
    ");
    $stmtUpd->bind_param("dssii", $new_amount, $new_date, $request_reason, $requested_by, $edit_id);
    $stmtUpd->execute();
    $stmtUpd->close();
} else {
    // Insert new pending request
    $stmtIns = $mysqli->prepare("
        INSERT INTO investment_installment_edits
        (installment_id, card_id, investor_id, old_amount, new_amount, old_date, new_date, request_reason, requested_by, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())
    ");
    if (!$stmtIns) {
        echo json_encode(["success" => false, "error" => "Prepare failed: " . $mysqli->error]);
        exit;
    }
    $stmtIns->bind_param(
        "iiiddsssi",
        $installment_id,
        $card_id,
        $investor_id,
        $old_amount,
        $new_amount,
        $old_date,
        $new_date,
        $request_reason,
        $requested_by
    );
    if (!$stmtIns->execute()) {
        echo json_encode(["success" => false, "error" => "Execute failed: " . $stmtIns->error]);
        exit;
    }
    $edit_id = $stmtIns->insert_id;
    $stmtIns->close();
}

// 4. Send Notification to Admin & Developer
$oldAmtFormatted = number_format($old_amount, 2);
$newAmtFormatted = number_format($new_amount, 2);
$notifTitle = "বিনিয়োগ কিস্তি সংশোধনের অনুরোধ";
$notifMsg = "{$requesterName} ইনভেস্টর {$investorName} এর কার্ড #{$card_id} ({$cardName}) কিস্তি #{$installment_no} (৳{$oldAmtFormatted} ➔ ৳{$newAmtFormatted}) এডিটের অনুরোধ পাঠিয়েছেন। কারণ: {$request_reason}";
$notifLink = "/investors/investment_payments?card_id={$card_id}";

$stmtNotif = $mysqli->prepare("
    INSERT INTO notifications (target_roles, type, title, message, link, edit_id, created_at)
    VALUES ('admin,developer', 'investment_edit_request', ?, ?, ?, ?, NOW())
");
if ($stmtNotif) {
    $stmtNotif->bind_param("sssi", $notifTitle, $notifMsg, $notifLink, $edit_id);
    $stmtNotif->execute();
    $stmtNotif->close();
}

echo json_encode([
    "success" => true,
    "message" => "কিস্তি সংশোধনের অনুরোধ সফলভাবে পাঠানো হয়েছে। অ্যাডমিন বা ডেভেলপার অনুমোদন করলে এটি কার্যকর হবে।",
    "edit_id" => $edit_id,
    "status"  => "pending",
    "old_amount" => $old_amount,
    "new_amount" => $new_amount
], JSON_UNESCAPED_UNICODE);
