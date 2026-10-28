<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");

$raw = file_get_contents("php://input");
$data = json_decode($raw, true) ?? $_POST;

$agreement_id    = intval($data['agreement_id'] ?? 0);
$asset_id        = intval($data['asset_id'] ?? 0);
$billing_month   = trim($data['billing_month'] ?? date('Y-m'));
$amount          = floatval($data['amount'] ?? 0);
$collection_date = trim($data['collection_date'] ?? date('Y-m-d'));
$payment_method  = trim($data['payment_method'] ?? 'Cash');
$remarks         = trim($data['remarks'] ?? '');
$create_cash_in  = isset($data['create_cash_in']) ? (bool)$data['create_cash_in'] : true;

if ($agreement_id <= 0 || $asset_id <= 0 || $amount <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "সঠিক চুক্তি আইডি, অ্যাসেট আইডি এবং আদায়ের পরিমাণ আবশ্যক"
    ]);
    exit;
}

// Check if already paid for this month
$check = $mysqli->prepare("SELECT id FROM other_asset_collections WHERE agreement_id = ? AND billing_month = ? AND status = 'Paid'");
$check->bind_param("is", $agreement_id, $billing_month);
$check->execute();
$existing = $check->get_result()->fetch_assoc();
$check->close();

if ($existing) {
    echo json_encode([
        "success" => false,
        "message" => "এই মাসের ($billing_month) জন্য ইতিমধ্যে টাকা আদায় করা হয়েছে"
    ]);
    exit;
}

// Get asset and lessee name for clear purpose label
$infoStmt = $mysqli->prepare("
    SELECT a.asset_name, ag.lessee_name 
    FROM other_asset_agreements ag
    JOIN other_assets a ON a.id = ag.asset_id
    WHERE ag.id = ?
");
$infoStmt->bind_param("i", $agreement_id);
$infoStmt->execute();
$info = $infoStmt->get_result()->fetch_assoc();
$infoStmt->close();

$asset_name = $info['asset_name'] ?? 'Asset';
$lessee_name = $info['lessee_name'] ?? 'Payer';

$cash_id = null;

// 💰 ১. ক্যাশ ম্যানেজমেন্টে সরাসরি Cash In রেকর্ড করা
if ($create_cash_in) {
    $sourceText = "মাসিক ভাড়া/লিজ আদায়: " . $asset_name . " (" . $lessee_name . " - " . $billing_month . ")";
    $refIdText  = "other_rent_" . $asset_id . "_" . time();
    $approvedBy = isset($data['approved_by']) && intval($data['approved_by']) > 0 
        ? intval($data['approved_by']) 
        : (isset($data['user_id']) && intval($data['user_id']) > 0 ? intval($data['user_id']) : 290);

    $cashStmt = $mysqli->prepare("
        INSERT INTO cash (type, category, purpose, amount, date, source, refId, createdAt, approval_status, approved_by, approved_at)
        VALUES ('in', 'rental_income', 'ভাড়া আদায়', ?, ?, ?, ?, NOW(), 'approved', ?, NOW())
    ");
    if ($cashStmt) {
        $cashStmt->bind_param("dsssi", $amount, $collection_date, $sourceText, $refIdText, $approvedBy);
        if ($cashStmt->execute()) {
            $cash_id = $cashStmt->insert_id;
        }
        $cashStmt->close();
    }
}

// 📋 ২. কালেকশন টেবিলে রেকর্ড ইনসার্ট
$stmt = $mysqli->prepare("
    INSERT INTO other_asset_collections 
    (asset_id, agreement_id, billing_month, amount, collection_date, payment_method, cash_id, status, remarks, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Paid', ?, NOW())
");

if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Prepare failed: " . $mysqli->error]);
    exit;
}

$stmt->bind_param(
    "iisdssis",
    $asset_id,
    $agreement_id,
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
            'collection_id'   => $colId,
            'asset_id'        => $asset_id,
            'asset_name'      => $asset_name,
            'lessee_name'     => $lessee_name,
            'billing_month'   => $billing_month,
            'amount'          => $amount,
            'collection_date' => $collection_date,
            'payment_method'  => $payment_method,
            'remarks'         => $remarks,
            'cash_id'         => $cash_id,
        ];
        sendAssetEventNotification('rental_collection', $mailData);
    } catch (Throwable $mailErr) {
        error_log("Rent collection email non-fatal error: " . $mailErr->getMessage());
    }

    echo json_encode([
        "success" => true,
        "message" => "টাকা সফলভাবে আদায় করা হয়েছে এবং ক্যাশ-ইন সম্পন্ন হয়েছে",
        "collection_id" => $colId,
        "cash_id" => $cash_id
    ]);
} else {
    echo json_encode(["success" => false, "message" => "কালেকশন সংরক্ষণ ব্যর্থ: " . $stmt->error]);
}
$stmt->close();
