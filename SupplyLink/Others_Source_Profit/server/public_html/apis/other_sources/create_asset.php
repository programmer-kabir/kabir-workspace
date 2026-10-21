<?php
require_once __DIR__ . '/../cors.php';
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

if ($asset_name === '' || $purchase_price <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "অ্যাসেটের নাম এবং সঠিক ক্রয়/বিনিয়োগ মূল্য প্রদান করুন"
    ]);
    exit;
}

$validCategories = ['bike', 'shop', 'house', 'equipment', 'project', 'other', 'company_share'];
if (!in_array($category, $validCategories)) {
    $category = 'other';
}

$cash_id = null;

// 💸 ১. স্বয়ংক্রিয় Cash Out এন্ট্রি (যদি ইউজার চান)
if ($create_cash_out) {
    $purpose = ($category === 'company_share')
        ? ("কোম্পানি শেয়ারে বিনিয়োগ: " . $asset_name . ($share_percentage ? " (" . $share_percentage . "%)" : ""))
        : ("অ্যাসেট ক্রয়: " . $asset_name . ($vendor_info ? " (" . $vendor_info . ")" : ""));

    $cashCategory = ($category === 'company_share') ? 'share_investment' : 'asset_purchase';

    $cashStmt = $mysqli->prepare("
        INSERT INTO cash (type, category, purpose, amount, date, source, createdAt)
        VALUES ('out', ?, ?, ?, ?, NULL, NOW())
    ");
    if ($cashStmt) {
        $cashStmt->bind_param("ssds", $cashCategory, $purpose, $purchase_price, $purchase_date);
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
        vendor_info, cash_id, status, remarks, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, NOW())
");

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => "Prepare failed: " . $mysqli->error
    ]);
    exit;
}

$stmt->bind_param(
    "ssdisssssssis",
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
    $cash_id,
    $remarks
);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "অ্যাসেট সফলভাবে যুক্ত হয়েছে এবং ক্যাশ আউট সম্পন্ন হয়েছে",
        "asset_id" => $stmt->insert_id,
        "cash_id" => $cash_id
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "অ্যাসেট সংরক্ষণ ব্যর্থ: " . $stmt->error
    ]);
}
$stmt->close();
