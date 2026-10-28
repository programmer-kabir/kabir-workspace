<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");

$raw = file_get_contents("php://input");
$data = json_decode($raw, true) ?? $_POST;

$asset_id        = intval($data['asset_id'] ?? 0);
$billing_month   = trim($data['billing_month'] ?? date('Y-m'));
$amount          = floatval($data['amount'] ?? 0);
$collection_date = trim($data['collection_date'] ?? date('Y-m-d'));
$payment_method  = trim($data['payment_method'] ?? 'Bank Transfer');
$remarks         = trim($data['remarks'] ?? '');
$create_cash_in  = true; // সর্বদা অফিসে সরাসরি ক্যাশ ইন রেকর্ড হবে

if ($asset_id <= 0 || $amount <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "সঠিক কোম্পানি/শেয়ার আইডি এবং প্রাপ্ত লভ্যাংশের পরিমাণ আবশ্যক"
    ]);
    exit;
}

// 🏢 অ্যাসেট তথ্য যাচাই
$assetStmt = $mysqli->prepare("SELECT id, asset_name, category, share_percentage FROM other_assets WHERE id = ?");
$assetStmt->bind_param("i", $asset_id);
$assetStmt->execute();
$asset = $assetStmt->get_result()->fetch_assoc();
$assetStmt->close();

if (!$asset) {
    echo json_encode([
        "success" => false,
        "message" => "কোম্পানি/অ্যাসেট রেকর্ড পাওয়া যায়নি"
    ]);
    exit;
}

$cash_id = null;

// 💰 ১. ক্যাশ ম্যানেজমেন্টে সরাসরি Cash In রেকর্ড করা
if ($create_cash_in) {
    $shareTag = $asset['share_percentage'] ? " (" . $asset['share_percentage'] . "%)" : "";
    $sourceText = "কোম্পানি শেয়ার লভ্যাংশ: " . $asset['asset_name'] . $shareTag . " [" . $billing_month . "]";
    $refIdText  = "dividend_" . time();
    $approvedBy = isset($data['approved_by']) && intval($data['approved_by']) > 0 
        ? intval($data['approved_by']) 
        : (isset($data['user_id']) && intval($data['user_id']) > 0 ? intval($data['user_id']) : 290);
    
    $cashStmt = $mysqli->prepare("
        INSERT INTO cash (
            type, category, purpose, amount, date, source, refId, createdAt, 
            approval_status, approved_by, approved_at
        )
        VALUES ('in', 'share_dividend', 'কোম্পানি শেয়ার লভ্যাংশ', ?, ?, ?, ?, NOW(), 'approved', ?, NOW())
    ");
    if ($cashStmt) {
        $cashStmt->bind_param("dsssi", $amount, $collection_date, $sourceText, $refIdText, $approvedBy);
        if ($cashStmt->execute()) {
            $cash_id = $cashStmt->insert_id;
        }
        $cashStmt->close();
    }
}

// 📋 ২. other_asset_collections এ লভ্যাংশ রেকর্ড ইনসার্ট (agreement_id = NULL)
$stmt = $mysqli->prepare("
    INSERT INTO other_asset_collections 
    (asset_id, agreement_id, billing_month, amount, collection_date, payment_method, cash_id, status, remarks, created_at)
    VALUES (?, NULL, ?, ?, ?, ?, ?, 'Paid', ?, NOW())
");

if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Prepare failed: " . $mysqli->error]);
    exit;
}

$stmt->bind_param(
    "isdssis",
    $asset_id,
    $billing_month,
    $amount,
    $collection_date,
    $payment_method,
    $cash_id,
    $remarks
);

if ($stmt->execute()) {
    $colId = $stmt->insert_id;

    // 🚀 Send Automated Email to Admin
    try {
        require_once __DIR__ . '/../helpers/mailer.php';
        $mailData = [
            'collection_id'    => $colId,
            'asset_id'         => $asset_id,
            'asset_name'       => $asset['asset_name'] ?? 'Company Share',
            'share_percentage' => $asset['share_percentage'] ?? null,
            'billing_month'    => $billing_month,
            'amount'           => $amount,
            'collection_date'  => $collection_date,
            'payment_method'   => $payment_method,
            'remarks'          => $remarks,
            'cash_id'          => $cash_id,
        ];
        sendAssetEventNotification('share_dividend', $mailData);
    } catch (Throwable $e) {
        error_log("Share dividend email error: " . $e->getMessage());
    }

    echo json_encode([
        "success" => true,
        "message" => "লভ্যাংশ সফলভাবে গ্রহণ করা হয়েছে এবং ক্যাশ-ইন সম্পন্ন হয়েছে",
        "collection_id" => $colId,
        "cash_id" => $cash_id
    ]);
} else {
    echo json_encode(["success" => false, "message" => "লভ্যাংশ সংরক্ষণ ব্যর্থ: " . $stmt->error]);
}
$stmt->close();
