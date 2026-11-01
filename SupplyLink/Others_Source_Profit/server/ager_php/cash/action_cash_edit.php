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
$review_note = trim($input["review_note"] ?? "");

if ($edit_id <= 0 || !in_array($action, ["approved", "rejected"]) || $reviewer_id <= 0) {
    echo json_encode(["success" => false, "error" => "সঠিক প্যারামিটার দিন"]);
    exit;
}

// 1. Fetch Edit Request
$stmt = $mysqli->prepare("
    SELECT * 
    FROM cash_edits 
    WHERE id = ? 
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
    if ($resRev && !empty($resRev["name"])) {
        $reviewerName = $resRev["name"];
    }
    $stmtRev->close();
}

$cash_id    = (int)$edit["cash_id"];
$type       = $edit["type"];
$old_amount = (float)$edit["old_amount"];
$new_amount = (float)$edit["new_amount"];
$new_date   = $edit["new_date"];
$new_cat    = $edit["new_category"];
$new_src    = $edit["new_source"];
$new_purp   = $edit["new_purpose"];
$new_rem    = $edit["new_remarks"];

$now = date("Y-m-d H:i:s");

if ($action === "approved") {
    // 3. Update cash row
    $auditRemark = " [সংশোধিত: পূর্বের পরিমাণ ৳" . number_format($old_amount, 2) . " থেকে ৳" . number_format($new_amount, 2) . " - অনুমোদক: " . $reviewerName . "]";
    
    // Combine new remarks with audit remark
    $finalRemarks = (!empty($new_rem) ? $new_rem : $edit["old_remarks"]) . $auditRemark;

    if ($type === 'in') {
        $updCash = $mysqli->prepare("
            UPDATE cash
            SET 
                amount = ?, 
                date = ?, 
                category = ?, 
                source = ?, 
                remarks = ?, 
                approval_status = 'approved',
                approved_by = ?, 
                approved_at = ?
            WHERE id = ?
        ");
        $updCash->bind_param(
            "dssssisi",
            $new_amount,
            $new_date,
            $new_cat,
            $new_src,
            $finalRemarks,
            $reviewer_id,
            $now,
            $cash_id
        );
    } else {
        $updCash = $mysqli->prepare("
            UPDATE cash
            SET 
                amount = ?, 
                date = ?, 
                category = ?, 
                purpose = ?, 
                source = ?, 
                remarks = ?, 
                approval_status = 'approved',
                approved_by = ?, 
                approved_at = ?
            WHERE id = ?
        ");
        $updCash->bind_param(
            "dsssssisi",
            $new_amount,
            $new_date,
            $new_cat,
            $new_purp,
            $new_src,
            $finalRemarks,
            $reviewer_id,
            $now,
            $cash_id
        );
    }

    if (!$updCash->execute()) {
        echo json_encode(["success" => false, "error" => "ক্যাশ আপডেট ব্যর্থ: " . $updCash->error]);
        exit;
    }
    $updCash->close();

    // 4. Update cash_edits
    $updEdit = $mysqli->prepare("
        UPDATE cash_edits
        SET 
            status = 'approved',
            reviewed_by = ?,
            reviewed_at = ?,
            review_note = ?,
            updated_at = ?
        WHERE id = ?
    ");
    $updEdit->bind_param("isssi", $reviewer_id, $now, $review_note, $now, $edit_id);
    $updEdit->execute();
    $updEdit->close();

    echo json_encode([
        "success" => true,
        "message" => "ক্যাশ সংশোধনের অনুরোধ সফলভাবে অনুমোদিত হয়েছে এবং ক্যাশ রেকর্ড আপডেট করা হয়েছে।"
    ], JSON_UNESCAPED_UNICODE);
    exit;

} else {
    // Rejected: keep cash row untouched, update cash_edits
    $updEdit = $mysqli->prepare("
        UPDATE cash_edits
        SET 
            status = 'rejected',
            reviewed_by = ?,
            reviewed_at = ?,
            review_note = ?,
            updated_at = ?
        WHERE id = ?
    ");
    $updEdit->bind_param("isssi", $reviewer_id, $now, $review_note, $now, $edit_id);
    $updEdit->execute();
    $updEdit->close();

    echo json_encode([
        "success" => true,
        "message" => "ক্যাশ সংশোধনের অনুরোধটি বাতিল করা হয়েছে। মূল ক্যাশ লেনদেন অপরিবর্তিত থাকবে।"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
