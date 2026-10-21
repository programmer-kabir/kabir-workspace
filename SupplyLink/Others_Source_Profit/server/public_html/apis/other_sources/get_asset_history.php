<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");

$asset_id = intval($_GET['asset_id'] ?? 0);
if ($asset_id <= 0) {
    echo json_encode(["success" => false, "message" => "সঠিক অ্যাসেট আইডি প্রয়োজন"]);
    exit;
}

// 1. Fetch asset details
$stmt = $mysqli->prepare("
    SELECT * FROM other_assets WHERE id = ?
");
$stmt->bind_param("i", $asset_id);
$stmt->execute();
$asset = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$asset) {
    echo json_encode(["success" => false, "message" => "অ্যাসেট রেকর্ড পাওয়া যায়নি"]);
    exit;
}

// Format numbers
$price = floatval($asset['purchase_price']);
$asset['purchase_price']   = $price;
$asset['share_percentage'] = $asset['share_percentage'] !== null ? floatval($asset['share_percentage']) : null;
$asset['share_units']      = $asset['share_units'] !== null ? intval($asset['share_units']) : null;
$asset['selling_price']    = $asset['selling_price'] !== null ? floatval($asset['selling_price']) : null;
$asset['sale_profit']      = $asset['sale_profit'] !== null ? floatval($asset['sale_profit']) : null;

// 2. Fetch collection history
$collStmt = $mysqli->prepare("
    SELECT id, billing_month, amount, collection_date, payment_method, cash_id, status, remarks, created_at
    FROM other_asset_collections
    WHERE asset_id = ?
    ORDER BY collection_date DESC, id DESC
");
$collStmt->bind_param("i", $asset_id);
$collStmt->execute();
$collRes = $collStmt->get_result();

$collections = [];
$total_collected = 0;
while ($c = $collRes->fetch_assoc()) {
    $c['amount'] = floatval($c['amount']);
    $total_collected += $c['amount'];
    $collections[] = $c;
}
$collStmt->close();

$remaining_capital = max(0, $price - $total_collected);
$roi_pct = $price > 0 ? round(($total_collected / $price) * 100, 1) : 0;

echo json_encode([
    "success" => true,
    "asset"   => $asset,
    "summary" => [
        "total_investment"  => $price,
        "total_collected"   => $total_collected,
        "remaining_capital" => $remaining_capital,
        "roi_pct"           => $roi_pct,
        "payouts_count"     => count($collections)
    ],
    "collections" => $collections
], JSON_UNESCAPED_UNICODE);
