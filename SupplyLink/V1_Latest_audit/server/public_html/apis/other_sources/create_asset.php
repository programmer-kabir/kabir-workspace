<?php
require_once __DIR__ . '/../cors.php';
guardManagerAdminOnly();
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");

$raw = file_get_contents("php://input");
$data = json_decode($raw, true) ?? $_POST;

$asset_name     = trim($data['asset_name'] ?? '');
$category       = trim($data['category'] ?? 'bike');
$purchase_price = floatval($data['purchase_price'] ?? 0);
$purchase_date  = trim($data['purchase_date'] ?? date('Y-m-d'));
$vendor_info    = trim($data['vendor_info'] ?? '');
$remarks        = trim($data['remarks'] ?? '');
$create_cash_out= isset($data['create_cash_out']) ? (bool)$data['create_cash_out'] : true;

$share_percentage   = isset($data['share_percentage']) && $data['share_percentage'] !== '' ? floatval($data['share_percentage']) : null;
$share_units        = isset($data['share_units']) && $data['share_units'] !== '' ? intval($data['share_units']) : null;
$business_type      = trim($data['business_type'] ?? '');
$reg_no             = trim($data['reg_no'] ?? '');
$contact_person     = trim($data['contact_person'] ?? '');
$dividend_frequency = trim($data['dividend_frequency'] ?? 'on_demand');

// Bondok specific fields
$owner_name         = trim($data['owner_name'] ?? '');
$owner_mobile       = trim($data['owner_mobile'] ?? '');
$owner_nid          = trim($data['owner_nid'] ?? '');
$property_address   = trim($data['property_address'] ?? '');
$deed_no            = trim($data['deed_no'] ?? '');
$is_bondok          = ($category === 'bondok' || !empty($data['is_bondok'])) ? 1 : 0;

if ($asset_name === '' || $purchase_price <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "অ্যাসেটের নাম এবং সঠিক ক্রয়/বিনিয়োগ মূল্য প্রদান করুন"
    ]);
    exit;
}

$validCategories = ['bike', 'shop', 'house', 'equipment', 'project', 'other', 'company_share', 'bondok'];
if (!in_array($category, $validCategories)) {
    $category = 'other';
}

$cash_id = null;

// 💸 ১. স্বয়ংক্রিয় Cash Out এন্ট্রি (সরাসরি Approved হিসেবে ক্যাশে যুক্ত হবে)
if ($create_cash_out) {
    if ($category === 'company_share') {
        $purpose = "কোম্পানি শেয়ারে বিনিয়োগ: " . $asset_name . ($share_percentage ? " (" . $share_percentage . "%)" : "");
        $cashCategory = 'share_investment';
        $cashSource   = $vendor_info !== '' ? $vendor_info : 'কোম্পানি শেয়ার ক্রয়';
    } elseif ($category === 'bondok') {
        $purpose = "ঘর/সম্পদ বন্ধক গ্রহণ ও মূলধন প্রদান: " . $asset_name . ($owner_name ? " (মালিক: " . $owner_name . ")" : "");
        $cashCategory = 'bondok_capital_out';
        $cashSource   = $owner_name !== '' ? ("মালিক: " . $owner_name) : 'বন্ধক গ্রহীতা';
    } else {
        $purpose = "অ্যাসেট ক্রয়: " . $asset_name . ($vendor_info ? " (" . $vendor_info . ")" : "");
        $cashCategory = 'asset_purchase';
        $cashSource   = $vendor_info !== '' ? $vendor_info : 'অ্যাসেট ক্রয়';
    }

    $cashRefId    = 'asset_out_' . time();
    $cashRemarks  = $remarks !== '' ? $remarks : ($category === 'bondok' ? 'বন্ধকি মূলধন প্রদান (সরাসরি অনুমোদিত)' : 'স্বয়ংক্রিয় অ্যাসেট ক্রয় ক্যাশ আউট (সরাসরি অনুমোদিত)');
    $approvedBy   = isset($data['approved_by']) && intval($data['approved_by']) > 0 
        ? intval($data['approved_by']) 
        : (isset($data['user_id']) && intval($data['user_id']) > 0 ? intval($data['user_id']) : 290);

    $cashStmt = $mysqli->prepare("
        INSERT INTO cash (
            type, category, purpose, amount, date, source, refId, remarks, createdAt, 
            approval_status, approved_by, approved_at
        )
        VALUES ('out', ?, ?, ?, ?, ?, ?, ?, NOW(), 'approved', ?, NOW())
    ");
    if ($cashStmt) {
        $cashStmt->bind_param("ssdssssi", $cashCategory, $purpose, $purchase_price, $purchase_date, $cashSource, $cashRefId, $cashRemarks, $approvedBy);
        if ($cashStmt->execute()) {
            $cash_id = $cashStmt->insert_id;
        }
        $cashStmt->close();
    }
}

// 📦 ২. other_assets এ অ্যাসেট রেকর্ড তৈরি
$stmt = $mysqli->prepare("
    INSERT INTO other_assets (
        asset_name, category, share_percentage, share_units, business_type, 
        reg_no, contact_person, dividend_frequency, purchase_price, purchase_date, 
        vendor_info, owner_name, owner_mobile, owner_nid, property_address, deed_no, is_bondok,
        cash_id, status, remarks, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, NOW())
");

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => "Prepare failed: " . $mysqli->error
    ]);
    exit;
}

$stmt->bind_param(
    "ssdissssssssssssiis",
    $asset_name,
    $category,
    $share_percentage,
    $share_units,
    $business_type,
    $reg_no,
    $contact_person,
    $dividend_frequency,
    $purchase_price,
    $purchase_date,
    $vendor_info,
    $owner_name,
    $owner_mobile,
    $owner_nid,
    $property_address,
    $deed_no,
    $is_bondok,
    $cash_id,
    $remarks
);

if ($stmt->execute()) {
    $assetId = $stmt->insert_id;

    // 🚀 Send Automated Email to Admin
    try {
        require_once __DIR__ . '/../helpers/mailer.php';
        $eventType = ($category === 'company_share') ? 'share_investment' : 'asset_purchase';
        $categoryLabels = [
            'bike' => 'বাইক লিজ',
            'shop' => 'দোকান ভাড়া',
            'house' => 'বাসা/ঘর ভাড়া',
            'equipment' => 'যন্ত্রপাতি',
            'project' => 'প্রজেক্ট ইনভেস্টমেন্ট',
            'company_share' => 'কোম্পানি শেয়ার (Equity)',
            'other' => 'অন্যান্য'
        ];
        $mailData = [
            'asset_id'           => $assetId,
            'asset_name'         => $asset_name,
            'category'           => $category,
            'category_label'     => $categoryLabels[$category] ?? $category,
            'purchase_price'     => $purchase_price,
            'purchase_date'      => $purchase_date,
            'vendor_info'        => $vendor_info,
            'reg_no'             => $reg_no,
            'contact_person'     => $contact_person,
            'share_percentage'   => $share_percentage,
            'share_units'        => $share_units,
            'business_type'      => $business_type,
            'dividend_frequency' => $dividend_frequency,
            'cash_id'            => $cash_id,
            'remarks'            => $remarks,
        ];
        sendAssetEventNotification($eventType, $mailData);
    } catch (Throwable $e) {
        error_log("Asset purchase email notification error: " . $e->getMessage());
    }

    echo json_encode([
        "success" => true,
        "message" => "অ্যাসেট সফলভাবে যুক্ত হয়েছে এবং ক্যাশ আউট সম্পন্ন হয়েছে",
        "asset_id" => $assetId,
        "cash_id" => $cash_id
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "অ্যাসেট সংরক্ষণ ব্যর্থ: " . $stmt->error
    ]);
}
$stmt->close();
