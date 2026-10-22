<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "error" => "Invalid request method"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);

$edit_id     = (int)($input["edit_id"] ?? 0);
$action      = trim($input["action"] ?? ""); // 'approved' | 'rejected'
$reviewer_id = (int)($input["reviewer_id"] ?? 0);

if ($edit_id <= 0 || !in_array($action, ["approved", "rejected"]) || $reviewer_id <= 0) {
    echo json_encode(["success" => false, "error" => "Invalid action parameters"]);
    exit;
}

// 1. Fetch Edit Request
$stmt = $mysqli->prepare("
    SELECT 
        e.*,
        inst.investment_no,
        u_req.name AS requester_name,
        u_inv.name AS investor_name,
        ic.card_name
    FROM investment_installment_edits e
    LEFT JOIN investment_installments inst ON e.installment_id = inst.id
    LEFT JOIN users u_req ON e.requested_by = u_req.id
    LEFT JOIN users u_inv ON e.investor_id = u_inv.id
    LEFT JOIN investment_cards ic ON e.card_id = ic.id
    WHERE e.id = ? 
    LIMIT 1
");
if (!$stmt) {
    echo json_encode(["success" => false, "error" => "DB error: " . $mysqli->error]);
    exit;
}
$stmt->bind_param("i", $edit_id);
$stmt->execute();
$edit = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$edit) {
    echo json_encode(["success" => false, "error" => "অনুরোধটি পাওয়া যায়নি"]);
    exit;
}

if ($edit["status"] !== "pending") {
    echo json_encode([
        "success" => false, 
        "error" => "এই অনুরোধটি ইতিপূর্বেই " . ($edit["status"] === "approved" ? "অনুমোদিত" : "বাতিল") . " হয়েছে।"
    ]);
    exit;
}

// 2. Fetch Reviewer Name
$reviewerName = "অ্যাডমিন/ডেভেলপার";
$stmtRev = $mysqli->prepare("SELECT name FROM users WHERE id = ? LIMIT 1");
if ($stmtRev) {
    $stmtRev->bind_param("i", $reviewer_id);
    $stmtRev->execute();
    $resRev = $stmtRev->get_result()->fetch_assoc();
    if ($resRev && !empty($resRev["name"])) $reviewerName = $resRev["name"];
    $stmtRev->close();
}

$installment_id = (int)$edit["installment_id"];
$card_id        = (int)$edit["card_id"];
$installment_no = (int)($edit["investment_no"] ?? 1);
$investorName   = $edit["investor_name"] ?? "ইনভেস্টর";
$requester_id   = (int)$edit["requested_by"];
$old_amount     = (float)$edit["old_amount"];
$new_amount     = (float)$edit["new_amount"];
$new_date       = $edit["new_date"];
$reason         = $edit["request_reason"];

if ($action === "approved") {
    // 3. Update installment row
    $updInst = $mysqli->prepare("
        UPDATE investment_installments
        SET amount = ?, investment_date = ?, updated_by = ?, updated_at = NOW(), update_reason = ?
        WHERE id = ?
    ");
    if (!$updInst) {
        echo json_encode(["success" => false, "error" => "Failed to prepare installment update: " . $mysqli->error]);
        exit;
    }
    $reviewerIdStr = (string)$reviewer_id;
    $updInst->bind_param("dsssi", $new_amount, $new_date, $reviewerIdStr, $reason, $installment_id);
    if (!$updInst->execute()) {
        echo json_encode(["success" => false, "error" => "Failed to update installment: " . $updInst->error]);
        exit;
    }
    $updInst->close();

    // 4. Update Cash In entry for accounting sync
    $cashRef = "inv_inst_" . $installment_id;
    $auditRemark = " [সংশোধিত: পূর্বের পরিমাণ ৳" . number_format($old_amount, 2) . " থেকে ৳" . number_format($new_amount, 2) . " - অনুমোদক: " . $reviewerName . "]";
    $updCash = $mysqli->prepare("
        UPDATE cash
        SET amount = ?, date = ?, remarks = CONCAT(COALESCE(remarks, ''), ?), approved_by = ?, approved_at = NOW()
        WHERE refId = ?
    ");
    if ($updCash) {
        $updCash->bind_param("dssis", $new_amount, $new_date, $auditRemark, $reviewer_id, $cashRef);
        $updCash->execute();
        $updCash->close();
    }

    // 5. Update edit status to approved
    $updEdit = $mysqli->prepare("
        UPDATE investment_installment_edits
        SET status = 'approved', reviewed_by = ?, reviewed_at = NOW(), updated_at = NOW()
        WHERE id = ?
    ");
    if ($updEdit) {
        $updEdit->bind_param("ii", $reviewer_id, $edit_id);
        $updEdit->execute();
        $updEdit->close();
    }

    // 6. Send Notification to Requester (Staff)
    $formattedNew = number_format($new_amount, 2);
    $notifTitle = "কিস্তি সংশোধন অনুমোদিত হয়েছে";
    $notifMsg = "{$reviewerName} ইনভেস্টর {$investorName} এর কার্ড #{$card_id} কিস্তি #{$installment_no} সংশোধনের অনুরোধ (৳{$formattedNew}) অনুমোদন করেছেন।";
    $notifLink = "/investors/investment_payments?card_id={$card_id}";

    $stmtNotif = $mysqli->prepare("
        INSERT INTO notifications (user_id, target_roles, type, title, message, link, edit_id, created_at)
        VALUES (?, '', 'investment_edit_approved', ?, ?, ?, ?, NOW())
    ");
    if ($stmtNotif) {
        $stmtNotif->bind_param("isssi", $requester_id, $notifTitle, $notifMsg, $notifLink, $edit_id);
        $stmtNotif->execute();
        $stmtNotif->close();
    }

    echo json_encode([
        "success" => true,
        "message" => "কিস্তি সংশোধনের অনুরোধ সফলভাবে অনুমোদিত হয়েছে এবং ক্যাশ সমন্বয় সম্পন্ন হয়েছে।",
        "action"  => "approved",
        "new_amount" => $new_amount
    ], JSON_UNESCAPED_UNICODE);

} else if ($action === "rejected") {
    // 5. Update edit status to rejected (installment & cash remain untouched)
    $updEdit = $mysqli->prepare("
        UPDATE investment_installment_edits
        SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW(), updated_at = NOW()
        WHERE id = ?
    ");
    if ($updEdit) {
        $updEdit->bind_param("ii", $reviewer_id, $edit_id);
        $updEdit->execute();
        $updEdit->close();
    }

    // 6. Send Notification to Requester (Staff)
    $notifTitle = "কিস্তি সংশোধন বাতিল করা হয়েছে";
    $notifMsg = "{$reviewerName} ইনভেস্টর {$investorName} এর কার্ড #{$card_id} কিস্তি #{$installment_no} সংশোধনের অনুরোধটি বাতিল করেছেন।";
    $notifLink = "/investors/investment_payments?card_id={$card_id}";

    $stmtNotif = $mysqli->prepare("
        INSERT INTO notifications (user_id, target_roles, type, title, message, link, edit_id, created_at)
        VALUES (?, '', 'investment_edit_rejected', ?, ?, ?, ?, NOW())
    ");
    if ($stmtNotif) {
        $stmtNotif->bind_param("isssi", $requester_id, $notifTitle, $notifMsg, $notifLink, $edit_id);
        $stmtNotif->execute();
        $stmtNotif->close();
    }

    echo json_encode([
        "success" => true,
        "message" => "কিস্তি সংশোধনের অনুরোধটি বাতিল করা হয়েছে।",
        "action"  => "rejected"
    ], JSON_UNESCAPED_UNICODE);
}
