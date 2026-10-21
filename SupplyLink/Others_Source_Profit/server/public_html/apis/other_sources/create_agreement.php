<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");

$raw = file_get_contents("php://input");
$data = json_decode($raw, true) ?? $_POST;

$asset_id        = intval($data['asset_id'] ?? 0);
$lessee_name     = trim($data['lessee_name'] ?? '');
$lessee_mobile   = trim($data['lessee_mobile'] ?? '');
$lessee_nid      = trim($data['lessee_nid'] ?? '');
$lessee_address  = trim($data['lessee_address'] ?? '');
$agreement_type  = trim($data['agreement_type'] ?? 'rental');
$monthly_rent    = floatval($data['monthly_rent'] ?? 0);
$due_day         = intval($data['due_day'] ?? 5);
$start_date      = trim($data['start_date'] ?? date('Y-m-d'));
$end_date        = !empty($data['end_date']) ? trim($data['end_date']) : null;
$security_deposit= floatval($data['security_deposit'] ?? 0);
$record_deposit_cash = isset($data['record_deposit_cash']) ? (bool)$data['record_deposit_cash'] : false;

if ($asset_id <= 0 || $lessee_name === '' || $monthly_rent <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "অ্যাসেট আইডি, গ্রহীতার নাম এবং মাসিক ভাড়ার পরিমাণ আবশ্যক"
    ]);
    exit;
}

// 1. পূর্বের কোনো active চুক্তি থাকলে তা বন্ধ করা
$deactivate = $mysqli->prepare("UPDATE other_asset_agreements SET status = 'completed' WHERE asset_id = ? AND status = 'active'");
if ($deactivate) {
    $deactivate->bind_param("i", $asset_id);
    $deactivate->execute();
    $deactivate->close();
}

// 2. জামানতের টাকা থাকলে ক্যাশ ইন রেকর্ড করা
if ($security_deposit > 0 && $record_deposit_cash) {
    $depositSource = "জামানত গ্রহণ: " . $lessee_name . " (অ্যাসেট #" . $asset_id . ")";
    $depStmt = $mysqli->prepare("
        INSERT INTO cash (type, category, purpose, amount, date, source, createdAt)
        VALUES ('in', 'security_deposit', NULL, ?, ?, ?, NOW())
    ");
    if ($depStmt) {
        $depStmt->bind_param("dss", $security_deposit, $start_date, $depositSource);
        $depStmt->execute();
        $depStmt->close();
    }
}

// 3. নতুন চুক্তি তৈরি
$stmt = $mysqli->prepare("
    INSERT INTO other_asset_agreements 
    (asset_id, lessee_name, lessee_mobile, lessee_nid, lessee_address, agreement_type, monthly_rent, due_day, start_date, end_date, security_deposit, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())
");

if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Prepare failed: " . $mysqli->error]);
    exit;
}

$stmt->bind_param(
    "isssssdisds",
    $asset_id,
    $lessee_name,
    $lessee_mobile,
    $lessee_nid,
    $lessee_address,
    $agreement_type,
    $monthly_rent,
    $due_day,
    $start_date,
    $end_date,
    $security_deposit
);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "লিজ/ভাড়া চুক্তি সফলভাবে সম্পন্ন হয়েছে",
        "agreement_id" => $stmt->insert_id
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "চুক্তি সংরক্ষণ ব্যর্থ: " . $stmt->error
    ]);
}
$stmt->close();
