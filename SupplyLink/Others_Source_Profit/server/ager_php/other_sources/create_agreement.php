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
$record_deposit_cash = true; // জামানতের টাকা থাকলে সর্বদাই সরাসরি অফিসে অনুমোদিত ক্যাশ ইন হবে

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
    $depositRefId  = "security_dep_" . time();
    $approvedBy    = isset($data['approved_by']) && intval($data['approved_by']) > 0 
        ? intval($data['approved_by']) 
        : (isset($data['user_id']) && intval($data['user_id']) > 0 ? intval($data['user_id']) : 290);

    $depStmt = $mysqli->prepare("
        INSERT INTO cash (
            type, category, purpose, amount, date, source, refId, createdAt, 
            approval_status, approved_by, approved_at
        )
        VALUES ('in', 'security_deposit', 'জামানত গ্রহণ', ?, ?, ?, ?, NOW(), 'approved', ?, NOW())
    ");
    if ($depStmt) {
        $depStmt->bind_param("dsssi", $security_deposit, $start_date, $depositSource, $depositRefId, $approvedBy);
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
    $agreementId = $stmt->insert_id;

    // 🚀 Send Automated Email to Admin
    try {
        require_once __DIR__ . '/../helpers/mailer.php';
        $astStmt = $mysqli->prepare("SELECT asset_name, category FROM other_assets WHERE id = ? LIMIT 1");
        $astName = "Asset #" . $asset_id;
        if ($astStmt) {
            $astStmt->bind_param("i", $asset_id);
            $astStmt->execute();
            $astRow = $astStmt->get_result()->fetch_assoc();
            if ($astRow) $astName = $astRow['asset_name'];
            $astStmt->close();
        }

        $mailData = [
            'agreement_id'     => $agreementId,
            'asset_id'         => $asset_id,
            'asset_name'       => $astName,
            'lessee_name'      => $lessee_name,
            'lessee_mobile'    => $lessee_mobile,
            'lessee_nid'       => $lessee_nid,
            'lessee_address'   => $lessee_address,
            'agreement_type'   => $agreement_type,
            'monthly_rent'     => $monthly_rent,
            'due_day'          => $due_day,
            'start_date'       => $start_date,
            'end_date'         => $end_date,
            'security_deposit' => $security_deposit,
        ];
        sendAssetEventNotification('rental_agreement', $mailData);
    } catch (Throwable $e) {
        error_log("Rental agreement email error: " . $e->getMessage());
    }

    echo json_encode([
        "success" => true,
        "message" => "লিজ/ভাড়া চুক্তি সফলভাবে সম্পন্ন হয়েছে",
        "agreement_id" => $agreementId
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "চুক্তি সংরক্ষণ ব্যর্থ: " . $stmt->error
    ]);
}
$stmt->close();
