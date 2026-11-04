<?php
/**
 * ============================================================================
 * SupplyLink - Product Purchases & Cash Out Synchronization API
 * File: server/apis/audit/sync_purchases_to_cash.php
 * ============================================================================
 */

ini_set('display_errors', 0);
error_reporting(E_ALL);

date_default_timezone_set('Asia/Dhaka');

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");

function sendResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

$rawInput = json_decode(file_get_contents('php://input'), true);
if (is_array($rawInput)) {
    $_REQUEST = array_merge($_REQUEST, $rawInput);
}

$action = trim($_REQUEST['action'] ?? 'audit');

// Preload all Cash Out (purchase) entries
$allCashOut = [];
$cRes = $mysqli->query("
    SELECT id, amount, date, source, purpose, refId, remarks 
    FROM cash 
    WHERE type = 'out' AND is_deleted = 0
");
while ($c = $cRes->fetch_assoc()) {
    $allCashOut[] = [
        'id' => (int)$c['id'],
        'amount' => (float)$c['amount'],
        'date' => $c['date'],
        'source' => strtolower($c['source'] ?? ''),
        'purpose' => strtolower($c['purpose'] ?? ''),
        'refId' => $c['refId'] ?? '',
        'remarks' => strtolower($c['remarks'] ?? '')
    ];
}

// Fetch all product records from installment_cards
$sql = "
    SELECT 
        ic.id AS item_id,
        ic.card_id,
        ic.product_name,
        ic.purchase_price,
        ic.cost_price,
        ic.delivery_date,
        u.name AS customer_name,
        s.name AS supplier_name
    FROM installment_cards ic
    LEFT JOIN users u ON u.user_id = ic.user_id
    LEFT JOIN users s ON s.id = ic.supplier_id
    WHERE ic.cost_price > 0 OR ic.purchase_price > 0
    ORDER BY ic.delivery_date DESC, ic.card_id DESC
";

$res = $mysqli->query($sql);
if (!$res) {
    sendResponse(['success' => false, 'message' => "কুয়েরি ত্রুটি: " . $mysqli->error], 500);
}

$stats = [
    'total_records' => 0,
    'total_amount' => 0,
    'synced_count' => 0,
    'synced_amount' => 0,
    'missing_count' => 0,
    'missing_amount' => 0,
];

$records = [];

while ($row = $res->fetch_assoc()) {
    $cardId = (int)$row['card_id'];
    $costPrice = (float)($row['cost_price'] > 0 ? $row['cost_price'] : $row['purchase_price']);
    $purchasePrice = (float)$row['purchase_price'];
    $delDate = $row['delivery_date'];
    $prodNameLower = strtolower($row['product_name'] ?? '');

    $stats['total_records']++;
    $stats['total_amount'] += $costPrice;

    $isSynced = false;
    $matchedCashId = null;
    $matchType = null;

    // Match 1: exact cost_price and date
    foreach ($allCashOut as $c) {
        if (abs($c['amount'] - $costPrice) < 0.01 && $c['date'] === $delDate) {
            $isSynced = true;
            $matchedCashId = $c['id'];
            $matchType = 'exact_date_and_cost';
            break;
        }
    }

    // Match 2: purchase_price and date
    if (!$isSynced && $purchasePrice > 0) {
        foreach ($allCashOut as $c) {
            if (abs($c['amount'] - $purchasePrice) < 0.01 && $c['date'] === $delDate) {
                $isSynced = true;
                $matchedCashId = $c['id'];
                $matchType = 'exact_date_and_purchase_price';
                break;
            }
        }
    }

    // Match 3: cost_price and product name match in purpose
    if (!$isSynced) {
        foreach ($allCashOut as $c) {
            if (abs($c['amount'] - $costPrice) < 0.01 || (abs($c['amount'] - $purchasePrice) < 0.01 && $purchasePrice > 0)) {
                $firstWord = explode(' ', trim($prodNameLower))[0] ?? '';
                if (strlen($firstWord) >= 3 && (strpos($c['purpose'], $firstWord) !== false || strpos($c['remarks'], $firstWord) !== false)) {
                    $isSynced = true;
                    $matchedCashId = $c['id'];
                    $matchType = 'price_and_product_match';
                    break;
                }
            }
        }
    }

    if ($isSynced) {
        $stats['synced_count']++;
        $stats['synced_amount'] += $costPrice;
    } else {
        $stats['missing_count']++;
        $stats['missing_amount'] += $costPrice;
    }

    $records[] = [
        'card_id' => $cardId,
        'product_name' => $row['product_name'],
        'customer_name' => $row['customer_name'] ?: 'N/A',
        'purchase_price' => $purchasePrice,
        'cost_price' => $costPrice,
        'delivery_date' => $delDate,
        'supplier_name' => $row['supplier_name'] ?: 'Local Supplier',
        'sync_status' => $isSynced ? 'synced' : 'missing',
        'match_type' => $matchType,
        'matched_cash_id' => $matchedCashId,
    ];
}

sendResponse([
    'success' => true,
    'stats' => $stats,
    'data' => $records
]);
