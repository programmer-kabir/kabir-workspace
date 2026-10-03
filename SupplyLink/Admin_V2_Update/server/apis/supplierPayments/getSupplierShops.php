<?php

ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "GET method only"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 1. Create table safely if not exists
@$mysqli->query("CREATE TABLE IF NOT EXISTS supplier_shops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shop_name VARCHAR(100) NOT NULL,
    category VARCHAR(100) DEFAULT 'Distributor / Dealer',
    owner_name VARCHAR(100) NULL,
    phone VARCHAR(50) NULL,
    address VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX (shop_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

@$mysqli->query("CREATE TABLE IF NOT EXISTS supplier_payment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    memo_no VARCHAR(100) NULL,
    date DATE NULL,
    shop_name VARCHAR(150) NOT NULL,
    supplier VARCHAR(100) NULL,
    brand VARCHAR(100) NULL,
    total_amount DECIMAL(12,2) DEFAULT 0,
    paid DECIMAL(12,2) DEFAULT 0,
    due DECIMAL(12,2) DEFAULT 0,
    image VARCHAR(255) NULL,
    remarks TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX (shop_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

// Map to hold aggregated shops
$shopsMap = [];

// 2. Fetch standalone registered shops from supplier_shops
$shopRows = @$mysqli->query("SELECT * FROM supplier_shops ORDER BY id DESC");
if ($shopRows) {
    while ($r = $shopRows->fetch_assoc()) {
        $nameKey = strtolower(trim($r['shop_name']));
        if (!empty($nameKey)) {
            $shopsMap[$nameKey] = [
                "id" => (int)$r["id"],
                "shop_name" => $r["shop_name"],
                "category" => $r["category"] ?: "Distributor / Dealer",
                "owner_name" => $r["owner_name"] ?: "-",
                "phone" => $r["phone"] ?: "-",
                "address" => $r["address"] ?: "-",
                "total_bought" => 0,
                "total_paid" => 0,
                "current_due" => 0,
                "total_memos" => 0,
                "created_at" => $r["created_at"]
            ];
        }
    }
}

// 3. Aggregate totals from supplier_payment table
$txRows = @$mysqli->query("SELECT * FROM supplier_payment ORDER BY id ASC");
if ($txRows) {
    $autoId = 1000;
    while ($tx = $txRows->fetch_assoc()) {
        $rawName = trim($tx['shop_name'] ?? '');
        if (empty($rawName)) {
            $rawName = trim($tx['supplier'] ?? 'Unknown Supplier');
        }
        $nameKey = strtolower($rawName);

        if (!isset($shopsMap[$nameKey])) {
            $autoId++;
            $shopsMap[$nameKey] = [
                "id" => $autoId,
                "shop_name" => $rawName,
                "category" => "Distributor / Dealer",
                "owner_name" => $tx["supplier"] ?: "-",
                "phone" => "-",
                "address" => "-",
                "total_bought" => 0,
                "total_paid" => 0,
                "current_due" => 0,
                "total_memos" => 0,
                "created_at" => $tx["created_at"] ?? date("Y-m-d H:i:s")
            ];
        }

        $bought = (float)($tx['total_amount'] ?? 0);
        $paid = (float)($tx['paid'] ?? 0);
        $due = (float)($tx['due'] ?? 0);

        $shopsMap[$nameKey]["total_bought"] += $bought;
        $shopsMap[$nameKey]["total_paid"] += $paid;
        $shopsMap[$nameKey]["current_due"] += $due;
        $shopsMap[$nameKey]["total_memos"] += 1;

        if ($shopsMap[$nameKey]["owner_name"] === "-" && !empty($tx["supplier"])) {
            $shopsMap[$nameKey]["owner_name"] = $tx["supplier"];
        }
    }
}

// Convert map to indexed array and sort by current_due desc
$shopsList = array_values($shopsMap);
usort($shopsList, function ($a, $b) {
    return $b['current_due'] <=> $a['current_due'];
});

echo json_encode([
    "success" => true,
    "data" => $shopsList
], JSON_UNESCAPED_UNICODE);
