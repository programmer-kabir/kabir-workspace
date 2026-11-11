<?php
// release_bondok.php
// Closes a mortgaged/bondok property when the owner refunds the capital, records Cash In for capital return
require_once __DIR__ . '/../cors.php';
guardManagerAdminOnly();
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);
if (!is_array($data) || empty($data)) {
    $data = $_POST;
}

$asset_id       = intval($data['asset_id'] ?? 0);
$refund_amount  = floatval($data['refund_amount'] ?? 0);
$release_date   = trim($data['release_date'] ?? date('Y-m-d'));
$payment_method = trim($data['payment_method'] ?? 'Cash');
$remarks        = trim($data['remarks'] ?? '');
$create_cash_in = true;

if ($asset_id <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "অ্যাসেট আইডি প্রদান করুন"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $release_date)) {
    $release_date = date('Y-m-d');
}

$mysqli->begin_transaction();

try {
    // 1. Fetch asset details
    $checkStmt = $mysqli->prepare("
        SELECT id, asset_name, category, purchase_price, owner_name, owner_mobile, status, remarks 
        FROM other_assets 
        WHERE id = ? FOR UPDATE
    ");
    $checkStmt->bind_param("i", $asset_id);
    $checkStmt->execute();
    $asset = $checkStmt->get_result()->fetch_assoc();
    $checkStmt->close();

    if (!$asset) {
        throw new Exception("অ্যাসেটটি পাওয়া যায়নি");
    }

    if ($asset['status'] === 'released') {
        throw new Exception("এই বন্ধকটি ইতিমধ্যে খালাস ও সমাপ্ত করা হয়েছে");
    }

    if ($refund_amount <= 0) {
        $refund_amount = floatval($asset['purchase_price']);
    }

    $ownerName = !empty($asset['owner_name']) ? $asset['owner_name'] : 'মালিক';
    $ownerMobile = !empty($asset['owner_mobile']) ? $asset['owner_mobile'] : '';

    // 2. Terminate any active agreement on this asset (set to completed)
    $termStmt = $mysqli->prepare("
        UPDATE other_asset_agreements 
        SET status = 'completed', end_date = ? 
        WHERE asset_id = ? AND status = 'active'
    ");
    $termStmt->bind_param("si", $release_date, $asset_id);
    $termStmt->execute();
    $termStmt->close();

    // 3. Update other_assets table status to 'released'
    $releaseRemarks = "[বন্ধক খালাস ও সমাপ্তি]: মালিক {$ownerName} থেকে মূলধন ফেরত ৳ " . number_format($refund_amount, 2) . " গ্রহণ করা হয়েছে ({$release_date}, মাধ্যম: {$payment_method})";
    if ($remarks) {
        $releaseRemarks .= " | " . $remarks;
    }

    $upStmt = $mysqli->prepare("
        UPDATE other_assets 
        SET status = 'released',
            selling_price = ?,
            sale_profit = 0.00,
            sale_date = ?,
            buyer_name = ?,
            buyer_mobile = ?,
            remarks = CONCAT(COALESCE(remarks, ''), '\n', ?)
        WHERE id = ?
    ");
    $upStmt->bind_param("dssssi", $refund_amount, $release_date, $ownerName, $ownerMobile, $releaseRemarks, $asset_id);
    $upStmt->execute();
    $upStmt->close();

    $cash_id = null;
    // 4. Record Cash In for full bondok principal return
    if ($create_cash_in && $refund_amount > 0) {
        $cashSource  = "বন্ধক খালাস বাবদ মূলধন ফেরত: " . $asset['asset_name'] . " (মালিক: " . $ownerName . ")";
        $cashRefId   = "bondok_rel_" . $asset_id . "_" . time();
        $cashPurpose = "বন্ধক খালাস ও মূলধন ফেরত গ্রহণ";
        $approvedBy  = isset($data['approved_by']) && intval($data['approved_by']) > 0 
            ? intval($data['approved_by']) 
            : (isset($data['user_id']) && intval($data['user_id']) > 0 ? intval($data['user_id']) : 290);

        $cashStmt = $mysqli->prepare("
            INSERT INTO cash (
                type, category, purpose, amount, date, source, refId, remarks, createdAt, 
                approval_status, approved_by, approved_at
            )
            VALUES ('in', 'bondok_capital_return', ?, ?, ?, ?, ?, ?, NOW(), 'approved', ?, NOW())
        ");
        if ($cashStmt) {
            $cashStmt->bind_param(
                "sdssssi", 
                $cashPurpose, 
                $refund_amount, 
                $release_date, 
                $cashSource, 
                $cashRefId, 
                $releaseRemarks, 
                $approvedBy
            );
            if ($cashStmt->execute()) {
                $cash_id = $cashStmt->insert_id;
            }
            $cashStmt->close();
        }
    }

    $mysqli->commit();

    // 🚀 Send Automated Notification
    try {
        require_once __DIR__ . '/../helpers/mailer.php';
        $mailData = [
            'asset_id'      => $asset_id,
            'asset_name'    => $asset['asset_name'],
            'owner_name'    => $ownerName,
            'refund_amount' => $refund_amount,
            'release_date'  => $release_date,
            'payment_method'=> $payment_method
        ];
        if (function_exists('sendAssetEventNotification')) {
            sendAssetEventNotification('bondok_released', $mailData);
        }
    } catch (Throwable $e) {
        error_log("Bondok release mail error: " . $e->getMessage());
    }

    echo json_encode([
        "success"       => true,
        "message"       => "বন্ধক সফলভাবে খালাস সম্পন্ন হয়েছে এবং মূলধন ৳ " . number_format($refund_amount, 2) . " অফিসে ক্যাশ ইন রেকর্ড হয়েছে 🎉",
        "asset_id"      => $asset_id,
        "cash_id"       => $cash_id,
        "refund_amount" => $refund_amount,
        "release_date"  => $release_date
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    $mysqli->rollback();
    echo json_encode([
        "success" => false,
        "message" => "বন্ধক খালাস ব্যর্থ: " . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

