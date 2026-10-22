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

$edit_id     = (int)($input["edit_id"] ?? 0);
$action      = trim($input["action"] ?? ""); // 'approved' or 'rejected'
$reviewer_id = (int)($input["reviewer_id"] ?? 0);
$review_note = trim($input["review_note"] ?? "");

if ($edit_id <= 0 || !in_array($action, ['approved', 'rejected']) || $reviewer_id <= 0) {
    echo json_encode(["success" => false, "error" => "Invalid request parameters"]);
    exit;
}

// 1. Fetch edit request
$stmtEdit = $mysqli->prepare("SELECT * FROM daily_installment_edits WHERE id = ? LIMIT 1");
$stmtEdit->bind_param("i", $edit_id);
$stmtEdit->execute();
$editReq = $stmtEdit->get_result()->fetch_assoc();
$stmtEdit->close();

if (!$editReq) {
    echo json_encode(["success" => false, "error" => "অনুরোধটি পাওয়া যায়নি"]);
    exit;
}

if ($editReq['status'] !== 'pending') {
    echo json_encode(["success" => false, "error" => "এই অনুরোধটি ইতিপূর্বে " . ($editReq['status'] === 'approved' ? 'অনুমোদিত' : 'বাতিল') . " হয়েছে"]);
    exit;
}

$installment_id = (int)$editReq['installment_id'];
$card_id        = (int)$editReq['card_id'];
$requested_by   = (int)$editReq['requested_by'];
$new_amount     = (float)$editReq['new_amount'];
$new_date       = $editReq['new_date'];
$request_reason = $editReq['request_reason'];
$now            = date("Y-m-d H:i:s");

// Fetch reviewer name
$reviewerName = "অ্যাডমিন";
$stmtRev = $mysqli->prepare("SELECT name FROM users WHERE id = ? LIMIT 1");
if ($stmtRev) {
    $stmtRev->bind_param("i", $reviewer_id);
    $stmtRev->execute();
    $rRev = $stmtRev->get_result()->fetch_assoc();
    if ($rRev && !empty($rRev['name'])) $reviewerName = $rRev['name'];
    $stmtRev->close();
}

if ($action === 'approved') {
    // 2. Update daily_installments
    $stmtUp = $mysqli->prepare("
        UPDATE daily_installments 
        SET amount = ?, date = ?, update_by = ?, update_at = ?, update_reason = ? 
        WHERE id = ?
    ");
    $stmtUp->bind_param("dsissi", $new_amount, $new_date, $reviewer_id, $now, $request_reason, $installment_id);
    $stmtUp->execute();
    $stmtUp->close();

    // 3. Sync Cash In entry in cash table
    $cashRefId = "daily_installment_" . $installment_id;
    $stmtCheckCash = $mysqli->prepare("SELECT id FROM cash WHERE refId = ? LIMIT 1");
    $hasExisting = false;
    if ($stmtCheckCash) {
        $stmtCheckCash->bind_param("s", $cashRefId);
        $stmtCheckCash->execute();
        $hasExisting = $stmtCheckCash->get_result()->fetch_assoc();
        $stmtCheckCash->close();
    }

    if ($hasExisting) {
        $stmtCash = $mysqli->prepare("
            UPDATE cash 
            SET amount = ?, date = ?, type = 'in', category = 'daily-installment', remarks = CONCAT(COALESCE(remarks, ''), ' [Updated: ', ?, ']') 
            WHERE refId = ?
        ");
        if ($stmtCash) {
            $syncNote = "৳{$new_amount} on {$new_date} by {$reviewerName}";
            $stmtCash->bind_param("dsss", $new_amount, $new_date, $syncNote, $cashRefId);
            $stmtCash->execute();
            $stmtCash->close();
        }
    } else {
        $cashType     = "in";
        $cashSource   = "{$customerName} - কার্ড #{$card_id} (দৈনিক কিস্তি)";
        $cashPurpose  = "দৈনিক কিস্তি আদায়";
        $cashCategory = "daily-installment";
        $cashRemarks  = "দৈনিক কিস্তি আদায় (অনুমোদিত এডিট): {$customerName}, কার্ড #{$card_id}";
        $cashApproval = "approved";

        $stmtInsCash = $mysqli->prepare("
            INSERT INTO cash 
            (type, source, purpose, amount, category, refId, remarks, date, createdAt, approval_status, approved_by, approved_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        if ($stmtInsCash) {
            $stmtInsCash->bind_param(
                "sssdssssssis",
                $cashType,
                $cashSource,
                $cashPurpose,
                $new_amount,
                $cashCategory,
                $cashRefId,
                $cashRemarks,
                $new_date,
                $now,
                $cashApproval,
                $reviewer_id,
                $now
            );
            $stmtInsCash->execute();
            $stmtInsCash->close();
        }
    }

    // 4. Update request status
    $stmtStatus = $mysqli->prepare("
        UPDATE daily_installment_edits 
        SET status = 'approved', reviewed_by = ?, reviewed_at = ?, review_note = ? 
        WHERE id = ?
    ");
    $stmtStatus->bind_param("issi", $reviewer_id, $now, $review_note, $edit_id);
    $stmtStatus->execute();
    $stmtStatus->close();

    // 5. Notify Requester
    $notifTitle = "দৈনিক কিস্তি সংশোধন অনুমোদিত ✅";
    $notifMsg   = "আপনার কার্ড #{$card_id} এর কিস্তি সংশোধনের অনুরোধ {$reviewerName} দ্বারা অনুমোদিত হয়েছে। পরিবর্তিত পরিমাণ: ৳" . number_format($new_amount, 2);
    $notifLink  = "/DailyInstallments/daily_installments_users/{$card_id}";
    $notifType  = "daily_installment_edit_approved";

    $stmtNotif = $mysqli->prepare("
        INSERT INTO notifications 
        (user_id, type, title, message, link, edit_id, is_read, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    ");
    if ($stmtNotif) {
        $stmtNotif->bind_param("issssis", $requested_by, $notifType, $notifTitle, $notifMsg, $notifLink, $edit_id, $now);
        $stmtNotif->execute();
        $stmtNotif->close();
    }

    echo json_encode([
        "success" => true,
        "message" => "কিস্তি সংশোধন সফলভাবে অনুমোদিত হয়েছে এবং ক্যাশ ইন আপডেট হয়েছে ✅"
    ]);
} else {
    // REJECTED
    $stmtStatus = $mysqli->prepare("
        UPDATE daily_installment_edits 
        SET status = 'rejected', reviewed_by = ?, reviewed_at = ?, review_note = ? 
        WHERE id = ?
    ");
    $stmtStatus->bind_param("issi", $reviewer_id, $now, $review_note, $edit_id);
    $stmtStatus->execute();
    $stmtStatus->close();

    // Notify Requester
    $notifTitle = "দৈনিক কিস্তি সংশোধন প্রত্যাখ্যাত ❌";
    $notifMsg   = "আপনার কার্ড #{$card_id} এর কিস্তি সংশোধনের অনুরোধ প্রত্যাখ্যাত হয়েছে।" . (!empty($review_note) ? " কারণ: {$review_note}" : "");
    $notifLink  = "/DailyInstallments/daily_installments_users/{$card_id}";
    $notifType  = "daily_installment_edit_rejected";

    $stmtNotif = $mysqli->prepare("
        INSERT INTO notifications 
        (user_id, type, title, message, link, edit_id, is_read, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    ");
    if ($stmtNotif) {
        $stmtNotif->bind_param("issssis", $requested_by, $notifType, $notifTitle, $notifMsg, $notifLink, $edit_id, $now);
        $stmtNotif->execute();
        $stmtNotif->close();
    }

    echo json_encode([
        "success" => true,
        "message" => "অনুরোধটি সফলভাবে বাতিল করা হয়েছে ❌"
    ]);
}
