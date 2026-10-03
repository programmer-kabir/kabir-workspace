<?php

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "GET method only"
    ]);
    exit;
}

$shop_name = trim($_GET["shop_name"] ?? "");
$shop_id = intval($_GET["shop_id"] ?? 0);

if (empty($shop_name) && $shop_id <= 0) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Shop name or ID required"
    ]);
    exit;
}

// 1. Fetch shop profile
if ($shop_id > 0) {
    $shopResult = $mysqli->query("SELECT * FROM supplier_shops WHERE id = {$shop_id} LIMIT 1");
} else {
    $safeName = $mysqli->real_escape_string($shop_name);
    $shopResult = $mysqli->query("SELECT * FROM supplier_shops WHERE LOWER(TRIM(shop_name)) = LOWER(TRIM('{$safeName}')) LIMIT 1");
}

$shopProfile = $shopResult ? $shopResult->fetch_assoc() : null;
$actualShopName = $shopProfile ? $shopProfile['shop_name'] : $shop_name;
$safeShopName = $mysqli->real_escape_string($actualShopName);

// 2. Fetch all transactions / memos for this shop
$txSql = "SELECT * FROM supplier_payment 
WHERE LOWER(TRIM(shop_name)) = LOWER(TRIM('{$safeShopName}'))
ORDER BY date ASC, id ASC";

$txResult = $mysqli->query($txSql);

$transactions = [];
$runningDue = 0;
$totalBought = 0;
$totalPaid = 0;

if ($txResult) {
    while ($row = $txResult->fetch_assoc()) {
        $billAmount = (float)$row["total_amount"];
        $paidAmount = (float)$row["paid"];
        $netChange = $billAmount - $paidAmount;
        $runningDue += $netChange;

        $totalBought += $billAmount;
        $totalPaid += $paidAmount;

        $isPayment = ($billAmount <= 0 && $paidAmount > 0) || strpos(($row["memo_no"] ?? ""), "PAY-") === 0;

        $transactions[] = [
            "id" => (int)$row["id"],
            "memo_no" => $row["memo_no"] ?: "-",
            "date" => $row["date"],
            "type" => $isPayment ? "Payment" : "Purchase",
            "brand" => $row["brand"] ?: "-",
            "total_amount" => $billAmount,
            "paid" => $paidAmount,
            "due" => (float)$row["due"],
            "running_due" => max(0, $runningDue),
            "image" => $row["image"],
            "remarks" => $row["remarks"] ?: "",
            "created_at" => $row["created_at"] ?? null
        ];
    }
}

// Reverse array for display so newest appears first if desired, or send ascending
$currentDue = max(0, $totalBought - $totalPaid);

// 3. Fetch any products in stock linked to this supplier
$stockSql = "SELECT id, category, brand, model, variant, color, purchase_price, mrp, status, date FROM Stock_Inventory 
WHERE LOWER(TRIM(supplier)) = LOWER(TRIM('{$safeShopName}')) OR LOWER(TRIM(supplier)) = LOWER(TRIM('" . $mysqli->real_escape_string($shopProfile['owner_name'] ?? '') . "'))
ORDER BY id DESC LIMIT 50";

$stockResult = $mysqli->query($stockSql);
$linkedStock = [];
if ($stockResult) {
    while ($s = $stockResult->fetch_assoc()) {
        $linkedStock[] = [
            "id" => (int)$s["id"],
            "category" => $s["category"],
            "brand" => $s["brand"],
            "model" => $s["model"],
            "variant" => $s["variant"],
            "color" => $s["color"],
            "purchase_price" => (float)$s["purchase_price"],
            "mrp" => (float)$s["mrp"],
            "status" => $s["status"],
            "date" => $s["date"]
        ];
    }
}

echo json_encode([
    "success" => true,
    "shop" => [
        "id" => (int)($shopProfile['id'] ?? 0),
        "shop_name" => $actualShopName,
        "category" => $shopProfile['category'] ?? "General Supplier",
        "owner_name" => $shopProfile['owner_name'] ?? "-",
        "phone" => $shopProfile['phone'] ?? "-",
        "address" => $shopProfile['address'] ?? "-",
        "created_at" => $shopProfile['created_at'] ?? null,
    ],
    "summary" => [
        "total_bought" => $totalBought,
        "total_paid" => $totalPaid,
        "current_due" => $currentDue,
        "total_transactions" => count($transactions)
    ],
    "transactions" => array_reverse($transactions),
    "linked_stock" => $linkedStock
], JSON_UNESCAPED_UNICODE);
