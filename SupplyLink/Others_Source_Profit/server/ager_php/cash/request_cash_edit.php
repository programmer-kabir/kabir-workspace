<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "error" => "Invalid request method"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);

$cash_id        = (int)($input["cash_id"] ?? 0);
$new_amount     = (float)($input["new_amount"] ?? 0);
$new_date       = trim($input["new_date"] ?? '');
$new_category   = trim($input["new_category"] ?? '');
$new_source     = trim($input["new_source"] ?? '');
$new_purpose    = trim($input["new_purpose"] ?? '');
$new_remarks    = trim($input["new_remarks"] ?? '');
$request_reason = trim($input["request_reason"] ?? '');
$requested_by   = (int)($input["requested_by"] ?? 0);

if ($cash_id <= 0) {
    echo json_encode(["success" => false, "error" => "সঠিক ক্যাশ আইডি আবশ্যক"]);
    exit;
}

if ($new_amount <= 0) {
    echo json_encode(["success" => false, "error" => "সঠিক টাকার পরিমাণ দিন"]);
    exit;
}

if (empty($new_date)) {
    echo json_encode(["success" => false, "error" => "সঠিক তারিখ আবশ্যক"]);
    exit;
}

if (empty($request_reason)) {
    echo json_encode(["success" => false, "error" => "সংশোধনের কারণ লিখতে হবে"]);
    exit;
}

if ($requested_by <= 0) {
    echo json_encode(["success" => false, "error" => "অনুরোধকারী চিহ্নিত করা যায়নি"]);
    exit;
}

// 1. Fetch existing cash entry
$stmtCash = $mysqli->prepare("
    SELECT id, type, category, source, purpose, amount, date, remarks, approval_status
    FROM cash
    WHERE id = ?
    LIMIT 1
");

if (!$stmtCash) {
    echo json_encode(["success" => false, "error" => "DB error: " . $mysqli->error]);
    exit;
}

$stmtCash->bind_param("i", $cash_id);
$stmtCash->execute();
$current = $stmtCash->get_result()->fetch_assoc();
$stmtCash->close();

if (!$current) {
    echo json_encode(["success" => false, "error" => "ক্যাশ লেনদেন রেকর্ড পাওয়া যায়নি"]);
    exit;
}

$type         = $current['type']; // 'in' or 'out'
$old_amount   = (float)$current['amount'];
$old_date     = $current['date'];
$old_category = $current['category'] ?? '';
$old_source   = $current['source'] ?? '';
$old_purpose  = $current['purpose'] ?? '';
$old_remarks  = $current['remarks'] ?? '';

// Fallback for new category/source/purpose if empty
if (empty($new_category)) $new_category = $old_category;
if (empty($new_source))   $new_source   = $old_source;
if (empty($new_purpose))  $new_purpose  = $old_purpose;

// 2. Check for existing pending request
$stmtCheck = $mysqli->prepare("
    SELECT id 
    FROM cash_edits 
    WHERE cash_id = ? AND status = 'pending' 
    LIMIT 1
");
$stmtCheck->bind_param("i", $cash_id);
$stmtCheck->execute();
$existingPending = $stmtCheck->get_result()->fetch_assoc();
$stmtCheck->close();

$now = date("Y-m-d H:i:s");

if ($existingPending) {
    // Update existing pending request
    $edit_id = (int)$existingPending['id'];
    $stmtUpd = $mysqli->prepare("
        UPDATE cash_edits
        SET
            new_amount = ?,
            new_date = ?,
            new_category = ?,
            new_source = ?,
            new_purpose = ?,
            new_remarks = ?,
            request_reason = ?,
            requested_by = ?,
            updated_at = ?
        WHERE id = ?
    ");
    $stmtUpd->bind_param(
        "dssssssisi",
        $new_amount,
        $new_date,
        $new_category,
        $new_source,
        $new_purpose,
        $new_remarks,
        $request_reason,
        $requested_by,
        $now,
        $edit_id
    );
    if (!$stmtUpd->execute()) {
        echo json_encode(["success" => false, "error" => "Update failed: " . $stmtUpd->error]);
        exit;
    }
    $stmtUpd->close();

    echo json_encode([
        "success" => true,
        "message" => "পূর্ববর্তী পেন্ডিং অনুরোধটি সফলভাবে আপডেট করা হয়েছে। অ্যাডমিন বা ডেভেলপার অনুমোদন করলে ক্যাশ ব্যালেন্স আপডেট হবে।",
        "edit_id" => $edit_id
    ], JSON_UNESCAPED_UNICODE);
    exit;
} else {
    // Insert new pending request
    $stmtIns = $mysqli->prepare("
        INSERT INTO cash_edits (
            cash_id,
            type,
            old_amount,
            new_amount,
            old_date,
            new_date,
            old_category,
            new_category,
            old_source,
            new_source,
            old_purpose,
            new_purpose,
            old_remarks,
            new_remarks,
            request_reason,
            requested_by,
            status,
            created_at,
            updated_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?
        )
    ");
    
    if (!$stmtIns) {
        echo json_encode(["success" => false, "error" => "Insert prepare failed: " . $mysqli->error]);
        exit;
    }

    $stmtIns->bind_param(
        "isddssssssssssisss",
        $cash_id,
        $type,
        $old_amount,
        $new_amount,
        $old_date,
        $new_date,
        $old_category,
        $new_category,
        $old_source,
        $new_source,
        $old_purpose,
        $new_purpose,
        $old_remarks,
        $new_remarks,
        $request_reason,
        $requested_by,
        $now,
        $now
    );

    if (!$stmtIns->execute()) {
        echo json_encode(["success" => false, "error" => "Insert execution failed: " . $stmtIns->error]);
        exit;
    }

    $edit_id = $stmtIns->insert_id;
    $stmtIns->close();

    echo json_encode([
        "success" => true,
        "message" => "ক্যাশ সংশোধনের অনুরোধ সফলভাবে পাঠানো হয়েছে। অ্যাডমিন বা ডেভেলপার অনুমোদন করলে ক্যাশ ব্যালেন্স আপডেট হবে।",
        "edit_id" => $edit_id
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
