<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);
if (!is_array($data) || empty($data)) {
    $data = $_POST;
}

$asset_id        = intval($data['asset_id'] ?? 0);
$selling_price   = floatval($data['selling_price'] ?? 0);
$sale_date       = trim($data['sale_date'] ?? date('Y-m-d'));
$buyer_name      = trim($data['buyer_name'] ?? '');
$buyer_mobile    = trim($data['buyer_mobile'] ?? '');
$payment_method  = trim($data['payment_method'] ?? 'Cash');
$remarks         = trim($data['remarks'] ?? '');
$create_cash_in  = isset($data['create_cash_in']) ? (bool)$data['create_cash_in'] : true;

if ($asset_id <= 0 || $selling_price <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "অ্যাসেট এবং সঠিক বিক্রয়মূল্য প্রদান করুন"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $sale_date)) {
    $sale_date = date('Y-m-d');
}

$mysqli->begin_transaction();

try {
    // 1. Fetch asset
    $checkStmt = $mysqli->prepare("SELECT id, asset_name, purchase_price, status FROM other_assets WHERE id = ? FOR UPDATE");
    $checkStmt->bind_param("i", $asset_id);
    $checkStmt->execute();
    $asset = $checkStmt->get_result()->fetch_assoc();
    $checkStmt->close();

    if (!$asset) {
        throw new Exception("অ্যাসেটটি পাওয়া যায়নি");
    }

    if ($asset['status'] === 'sold') {
        throw new Exception("অ্যাসেটটি ইতিমধ্যে বিক্রয় করা হয়েছে");
    }

    $purchase_price = floatval($asset['purchase_price']);
    $sale_profit    = max(0, $selling_price - $purchase_price);
    $billing_month  = substr($sale_date, 0, 7); // 'YYYY-MM'

    // 2. Terminate any active agreement on this asset (since it's now sold)
    $termStmt = $mysqli->prepare("UPDATE other_asset_agreements SET status = 'completed', end_date = ? WHERE asset_id = ? AND status = 'active'");
    $termStmt->bind_param("si", $sale_date, $asset_id);
    $termStmt->execute();
    $termStmt->close();

    // 3. Update other_assets
    $sellRemarks = "এককালীন বিক্রয়: ৳ " . number_format($selling_price, 2) . " (ক্রেতা: " . $buyer_name . " " . $buyer_mobile . ")";
    if ($remarks) {
        $sellRemarks .= " | " . $remarks;
    }
    
    $upStmt = $mysqli->prepare("
        UPDATE other_assets 
        SET status = 'sold',
            selling_price = ?,
            sale_profit = ?,
            sale_date = ?,
            buyer_name = ?,
            buyer_mobile = ?,
            remarks = CONCAT(COALESCE(remarks, ''), '\n', ?)
        WHERE id = ?
    ");
    $upStmt->bind_param("ddssssi", $selling_price, $sale_profit, $sale_date, $buyer_name, $buyer_mobile, $sellRemarks, $asset_id);
    $upStmt->execute();
    $upStmt->close();

    $cash_id = null;
    // 4. Record Cash In for full selling price (Return of capital + profit)
    if ($create_cash_in) {
        $cashSource = "অ্যাসেট বিক্রয় বাবদ ক্যাশ গ্রহণ: " . $asset['asset_name'] . ($buyer_name ? " (ক্রেতা: " . $buyer_name . ")" : "");
        $cashStmt = $mysqli->prepare("
            INSERT INTO cash (type, category, purpose, amount, date, source, createdAt)
            VALUES ('in', 'asset_sale', NULL, ?, ?, ?, NOW())
        ");
        if ($cashStmt) {
            $cashStmt->bind_param("dss", $selling_price, $sale_date, $cashSource);
            $cashStmt->execute();
            $cash_id = $cashStmt->insert_id;
            $cashStmt->close();
        }
    }

    // 5. If pure profit > 0, insert profit into other_asset_collections for that month
    // So it automatically gets included in Monthly Profit Distribution!
    $collection_id = null;
    if ($sale_profit > 0) {
        $profitRemarks = "অ্যাসেট বিক্রয় নিট মুনাফা: " . $asset['asset_name'] . " (ক্রয়: ৳" . number_format($purchase_price, 2) . ", বিক্রয়: ৳" . number_format($selling_price, 2) . ")";
        $colStmt = $mysqli->prepare("
            INSERT INTO other_asset_collections (asset_id, agreement_id, billing_month, amount, collection_date, payment_method, cash_id, status, remarks, created_at)
            VALUES (?, NULL, ?, ?, ?, ?, ?, 'Paid', ?, NOW())
        ");
        $colStmt->bind_param("isdssis", $asset_id, $billing_month, $sale_profit, $sale_date, $payment_method, $cash_id, $profitRemarks);
        $colStmt->execute();
        $collection_id = $colStmt->insert_id;
        $colStmt->close();
    }

    $mysqli->commit();

    echo json_encode([
        "success"        => true,
        "message"        => "অ্যাসেট সফলভাবে বিক্রয় সম্পন্ন হয়েছে! নিট মুনাফা ৳ " . number_format($sale_profit, 2) . " টাকা যা " . $billing_month . " মাসের প্রফিট পুলে যুক্ত হয়েছে।",
        "asset_id"       => $asset_id,
        "purchase_price" => $purchase_price,
        "selling_price"  => $selling_price,
        "sale_profit"    => $sale_profit,
        "billing_month"  => $billing_month,
        "cash_id"        => $cash_id,
        "collection_id"  => $collection_id
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    $mysqli->rollback();
    echo json_encode([
        "success" => false,
        "message" => "বিক্রয় ব্যর্থ হয়েছে: " . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
