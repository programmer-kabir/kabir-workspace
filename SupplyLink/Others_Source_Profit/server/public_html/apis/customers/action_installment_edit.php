<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=UTF-8");

function apiError($message, $debug = null, $code = 400) {
  http_response_code($code);
  echo json_encode([
    "success" => false,
    "message" => $message,
    "debug"   => $debug
  ], JSON_UNESCAPED_UNICODE);
  exit;
}

$input = json_decode(file_get_contents("php://input"), true);
if (!is_array($input)) apiError("Invalid JSON input");

$edit_id     = (int)($input['edit_id'] ?? 0);
$action      = strtolower(trim($input['action'] ?? ''));
$reviewer_id = (int)($input['reviewer_id'] ?? 0);

if ($edit_id <= 0) apiError("Invalid edit request ID");
if (!in_array($action, ['approved', 'rejected'])) apiError("Invalid action: must be approved or rejected");
if ($reviewer_id <= 0) apiError("Invalid reviewer ID");

// Verify Role: Must be Admin or Developer
$roleStmt = $mysqli->prepare("
    SELECT role FROM user_roles 
    WHERE user_id = ? AND role IN ('admin', 'developer')
    LIMIT 1
");
if (!$roleStmt) apiError("Query failed", $mysqli->error);
$roleStmt->bind_param("i", $reviewer_id);
$roleStmt->execute();
$hasRole = $roleStmt->get_result()->fetch_assoc();
$roleStmt->close();

if (!$hasRole) {
    apiError("অনুমোদনের অনুমতি শুধুমাত্র অ্যাডমিন এবং ডেভেলপারের রয়েছে।", null, 403);
}

// Fetch the edit request
$editStmt = $mysqli->prepare("
    SELECT id, payment_id, card_id, amount, status, requested_by 
    FROM installment_payment_edits 
    WHERE id = ?
");
$editStmt->bind_param("i", $edit_id);
$editStmt->execute();
$editReq = $editStmt->get_result()->fetch_assoc();
$editStmt->close();

if (!$editReq) apiError("Edit request not found", null, 404);
if ($editReq['status'] !== 'pending') {
    apiError("এই অনুরোধটি ইতিপূর্বে নিষ্পত্তি করা হয়েছে (বর্তমান অবস্থা: " . $editReq['status'] . ")", null, 400);
}

$payment_id = (int)$editReq['payment_id'];
$card_id = (int)$editReq['card_id'];
$amount = (float)$editReq['amount'];
$requested_by = (int)$editReq['requested_by'];

if ($action === 'approved') {
    // 1. Mark edit request as approved
    $updReq = $mysqli->prepare("
        UPDATE installment_payment_edits 
        SET status = 'approved', reviewed_by = ?, reviewed_at = NOW() 
        WHERE id = ?
    ");
    $updReq->bind_param("ii", $reviewer_id, $edit_id);
    $updReq->execute();
    $updReq->close();

    // 2. Update installment payment to Unpaid
    $updPay = $mysqli->prepare("
        UPDATE installment_payments 
        SET status = 'Unpaid', paid_date = NULL, payment_method = NULL, receipt_number = NULL, has_pending_edit = 0 
        WHERE id = ?
    ");
    $updPay->bind_param("i", $payment_id);
    $updPay->execute();
    $updPay->close();

    // 3. Delete Cash In entry for this payment
    $refId = "installment_" . $payment_id;
    $delCash = $mysqli->prepare("DELETE FROM cash WHERE refId = ?");
    if ($delCash) {
        $delCash->bind_param("s", $refId);
        $delCash->execute();
        $delCash->close();
    }

    // 5. Send feedback notification back to Manager & Staff (and specifically requested user)
    $revName = "অ্যাডমিন";
    $revQ = $mysqli->prepare("SELECT name FROM users WHERE id = ?");
    if ($revQ) {
        $revQ->bind_param("i", $reviewer_id);
        $revQ->execute();
        $revRow = $revQ->get_result()->fetch_assoc();
        if ($revRow && !empty($revRow['name'])) $revName = $revRow['name'];
        $revQ->close();
    }

    $tagQ = $mysqli->prepare("SELECT tag, installment_no FROM installment_payments WHERE id = ?");
    $tag = "কিস্তি";
    if ($tagQ) {
        $tagQ->bind_param("i", $payment_id);
        $tagQ->execute();
        $tRow = $tagQ->get_result()->fetch_assoc();
        if ($tRow) {
            $tag = $tRow['tag'] ?: ($tRow['installment_no'] == 0 ? "ডাউন পেমেন্ট" : "{$tRow['installment_no']}তম কিস্তি");
        }
        $tagQ->close();
    }

    // 5. Send feedback notification back to Manager & Staff (Safe try-catch)
    try {
        $notifTitle = "কিস্তি আনপেইড অনুমোদন সম্পন্ন";
        $notifMsg = "{$revName} কার্ড #{$card_id} ({$tag}) আনপেইড করার অনুরোধ অনুমোদন করেছেন।";
        $notifLink = "/customer/update_installment_chart?cardId={$card_id}";
        $targetRoles = "manager,staff";
        $notifType = "installment_unpaid_approved";

        $insNotif = $mysqli->prepare("
            INSERT INTO notifications (user_id, target_roles, type, title, message, link, edit_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        if ($insNotif) {
            $insNotif->bind_param("isssssi", $requested_by, $targetRoles, $notifType, $notifTitle, $notifMsg, $notifLink, $edit_id);
            $insNotif->execute();
            $insNotif->close();
        }
    } catch (Throwable $notifErr) {
        error_log("Approved notification insert non-fatal error: " . $notifErr->getMessage());
    }

    echo json_encode([
        "success" => true,
        "action" => "approved",
        "message" => "অনুরোধটি সফলভাবে অনুমোদিত হয়েছে এবং কিস্তিটি আনপেইড করা হয়েছে।"
    ], JSON_UNESCAPED_UNICODE);
    exit;
} else {
    // Rejected
    // 1. Mark edit request as rejected
    $updReq = $mysqli->prepare("
        UPDATE installment_payment_edits 
        SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW() 
        WHERE id = ?
    ");
    $updReq->bind_param("ii", $reviewer_id, $edit_id);
    $updReq->execute();
    $updReq->close();

    // 2. Clear pending flag on installment payment (it remains Paid)
    $updPay = $mysqli->prepare("UPDATE installment_payments SET has_pending_edit = 0 WHERE id = ?");
    $updPay->bind_param("i", $payment_id);
    $updPay->execute();
    $updPay->close();

    // 4. Send feedback notification back to Manager & Staff (and specifically requested user)
    $revName = "অ্যাডমিন";
    $revQ = $mysqli->prepare("SELECT name FROM users WHERE id = ?");
    if ($revQ) {
        $revQ->bind_param("i", $reviewer_id);
        $revQ->execute();
        $revRow = $revQ->get_result()->fetch_assoc();
        if ($revRow && !empty($revRow['name'])) $revName = $revRow['name'];
        $revQ->close();
    }

    $tagQ = $mysqli->prepare("SELECT tag, installment_no FROM installment_payments WHERE id = ?");
    $tag = "কিস্তি";
    if ($tagQ) {
        $tagQ->bind_param("i", $payment_id);
        $tagQ->execute();
        $tRow = $tagQ->get_result()->fetch_assoc();
        if ($tRow) {
            $tag = $tRow['tag'] ?: ($tRow['installment_no'] == 0 ? "ডাউন পেমেন্ট" : "{$tRow['installment_no']}তম কিস্তি");
        }
        $tagQ->close();
    }

    // Safe try-catch for notification
    try {
        $notifTitle = "কিস্তি আনপেইড অনুরোধ বাতিল";
        $notifMsg = "{$revName} কার্ড #{$card_id} ({$tag}) আনপেইড করার অনুরোধটি বাতিল করেছেন। কিস্তিটি পেইড অবস্থায় বহাল রয়েছে।";
        $notifLink = "/customer/update_installment_chart?cardId={$card_id}";
        $targetRoles = "manager,staff";
        $notifType = "installment_unpaid_rejected";

        $insNotif = $mysqli->prepare("
            INSERT INTO notifications (user_id, target_roles, type, title, message, link, edit_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        if ($insNotif) {
            $insNotif->bind_param("isssssi", $requested_by, $targetRoles, $notifType, $notifTitle, $notifMsg, $notifLink, $edit_id);
            $insNotif->execute();
            $insNotif->close();
        }
    } catch (Throwable $notifErr) {
        error_log("Rejected notification insert non-fatal error: " . $notifErr->getMessage());
    }

    echo json_encode([
        "success" => true,
        "action" => "rejected",
        "message" => "অনুরোধটি বাতিল করা হয়েছে। কিস্তিটি পেইড অবস্থায় বহাল রয়েছে।"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
