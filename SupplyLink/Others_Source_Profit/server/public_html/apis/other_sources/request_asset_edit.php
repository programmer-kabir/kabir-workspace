<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "error" => "Invalid request method"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);

$asset_id               = (int)($input["asset_id"] ?? 0);
$new_asset_name         = trim($input["new_asset_name"] ?? '');
$new_category           = trim($input["new_category"] ?? 'bike');
$new_purchase_price     = floatval($input["new_purchase_price"] ?? 0);
$new_purchase_date      = trim($input["new_purchase_date"] ?? '');
$new_vendor_info        = trim($input["new_vendor_info"] ?? '');
$new_reg_no             = trim($input["new_reg_no"] ?? '');
$new_contact_person     = trim($input["new_contact_person"] ?? '');
$new_business_type      = trim($input["new_business_type"] ?? '');
$new_share_percentage   = isset($input['new_share_percentage']) && $input['new_share_percentage'] !== '' ? floatval($input['new_share_percentage']) : null;
$new_share_units        = isset($input['new_share_units']) && $input['new_share_units'] !== '' ? intval($input['new_share_units']) : null;
$new_dividend_frequency = trim($input["new_dividend_frequency"] ?? 'on_demand');
$new_remarks            = trim($input["new_remarks"] ?? '');
$request_reason         = trim($input["request_reason"] ?? '');
$requested_by           = (int)($input["requested_by"] ?? 0);

if ($asset_id <= 0) {
    echo json_encode(["success" => false, "error" => "অ্যাসেট আইডি আবশ্যক"]);
    exit;
}

if (empty($new_asset_name)) {
    echo json_encode(["success" => false, "error" => "অ্যাসেটের নাম প্রদান করুন"]);
    exit;
}

if ($new_purchase_price <= 0) {
    echo json_encode(["success" => false, "error" => "সঠিক ক্রয়/বিনিয়োগ মূল্য দিন"]);
    exit;
}

if (empty($new_purchase_date)) {
    echo json_encode(["success" => false, "error" => "ক্রয়ের তারিখ প্রদান করুন"]);
    exit;
}

if (empty($request_reason)) {
    echo json_encode(["success" => false, "error" => "সংশোধনের কারণ লিখতে হবে"]);
    exit;
}

if ($requested_by <= 0) {
    echo json_encode(["success" => false, "error" => "অনুরোধকারী কর্মী চিহ্নিত করা যায়নি"]);
    exit;
}

// 1. Fetch current asset row
$stmtAsset = $mysqli->prepare("
    SELECT * 
    FROM other_assets 
    WHERE id = ? 
    LIMIT 1
");

if (!$stmtAsset) {
    echo json_encode(["success" => false, "error" => "DB error: " . $mysqli->error]);
    exit;
}

$stmtAsset->bind_param("i", $asset_id);
$stmtAsset->execute();
$current = $stmtAsset->get_result()->fetch_assoc();
$stmtAsset->close();

if (!$current) {
    echo json_encode(["success" => false, "error" => "অ্যাসেটটি পাওয়া যায়নি"]);
    exit;
}

$cash_id                = !empty($current['cash_id']) ? (int)$current['cash_id'] : null;
$old_asset_name         = $current['asset_name'];
$old_category           = $current['category'];
$old_purchase_price     = (float)$current['purchase_price'];
$old_purchase_date      = $current['purchase_date'];
$old_vendor_info        = $current['vendor_info'];
$old_reg_no             = $current['reg_no'];
$old_contact_person     = $current['contact_person'];
$old_business_type      = $current['business_type'];
$old_share_percentage   = $current['share_percentage'] !== null ? (float)$current['share_percentage'] : null;
$old_share_units        = $current['share_units'] !== null ? (int)$current['share_units'] : null;
$old_dividend_frequency = $current['dividend_frequency'];
$old_remarks            = $current['remarks'];

// 2. Check for existing pending request
$stmtCheck = $mysqli->prepare("
    SELECT id 
    FROM other_asset_edits 
    WHERE asset_id = ? AND status = 'pending' 
    LIMIT 1
");
$stmtCheck->bind_param("i", $asset_id);
$stmtCheck->execute();
$existingPending = $stmtCheck->get_result()->fetch_assoc();
$stmtCheck->close();

$now = date("Y-m-d H:i:s");

if ($existingPending) {
    // Update existing pending request
    $edit_id = (int)$existingPending['id'];
    $stmtUpd = $mysqli->prepare("
        UPDATE other_asset_edits
        SET
            new_asset_name = ?,
            new_category = ?,
            new_purchase_price = ?,
            new_purchase_date = ?,
            new_vendor_info = ?,
            new_reg_no = ?,
            new_contact_person = ?,
            new_business_type = ?,
            new_share_percentage = ?,
            new_share_units = ?,
            new_dividend_frequency = ?,
            new_remarks = ?,
            request_reason = ?,
            requested_by = ?,
            updated_at = ?
        WHERE id = ?
    ");
    $stmtUpd->bind_param(
        "ssdsssssdisssisi",
        $new_asset_name,
        $new_category,
        $new_purchase_price,
        $new_purchase_date,
        $new_vendor_info,
        $new_reg_no,
        $new_contact_person,
        $new_business_type,
        $new_share_percentage,
        $new_share_units,
        $new_dividend_frequency,
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
        "message" => "অ্যাসেটের পূর্ববর্তী পেন্ডিং অনুরোধটি সফলভাবে আপডেট করা হয়েছে। অ্যাডমিন বা ডেভেলপার অনুমোদন করলে তথ্য ও ব্যালেন্স আপডেট হবে।",
        "edit_id" => $edit_id
    ], JSON_UNESCAPED_UNICODE);
    exit;
} else {
    // Insert new pending request
    $stmtIns = $mysqli->prepare("
        INSERT INTO other_asset_edits (
            asset_id,
            cash_id,
            old_asset_name,
            new_asset_name,
            old_category,
            new_category,
            old_purchase_price,
            new_purchase_price,
            old_purchase_date,
            new_purchase_date,
            old_vendor_info,
            new_vendor_info,
            old_reg_no,
            new_reg_no,
            old_contact_person,
            new_contact_person,
            old_business_type,
            new_business_type,
            old_share_percentage,
            new_share_percentage,
            old_share_units,
            new_share_units,
            old_dividend_frequency,
            new_dividend_frequency,
            old_remarks,
            new_remarks,
            request_reason,
            requested_by,
            status,
            created_at,
            updated_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?
        )
    ");

    if (!$stmtIns) {
        echo json_encode(["success" => false, "error" => "Prepare failed: " . $mysqli->error]);
        exit;
    }

    $stmtIns->bind_param(
        "iissssddssssssssssddiisssssiss",
        $asset_id,
        $cash_id,
        $old_asset_name,
        $new_asset_name,
        $old_category,
        $new_category,
        $old_purchase_price,
        $new_purchase_price,
        $old_purchase_date,
        $new_purchase_date,
        $old_vendor_info,
        $new_vendor_info,
        $old_reg_no,
        $new_reg_no,
        $old_contact_person,
        $new_contact_person,
        $old_business_type,
        $new_business_type,
        $old_share_percentage,
        $new_share_percentage,
        $old_share_units,
        $new_share_units,
        $old_dividend_frequency,
        $new_dividend_frequency,
        $old_remarks,
        $new_remarks,
        $request_reason,
        $requested_by,
        $now,
        $now
    );

    if (!$stmtIns->execute()) {
        echo json_encode(["success" => false, "error" => "Execute failed: " . $stmtIns->error]);
        exit;
    }

    $edit_id = $stmtIns->insert_id;
    $stmtIns->close();

    echo json_encode([
        "success" => true,
        "message" => "অ্যাসেট সংশোধনের অনুরোধ সফলভাবে পাঠানো হয়েছে। অ্যাডমিন বা ডেভেলপার অনুমোদন করলে তথ্য ও ক্যাশ ব্যালেন্স আপডেট হবে।",
        "edit_id" => $edit_id
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
