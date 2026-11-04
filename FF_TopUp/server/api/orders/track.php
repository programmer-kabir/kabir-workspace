<?php
require_once __DIR__ . '/../../helpers/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../config/db.php';

$query = trim($_GET['q'] ?? '');

if (empty($query)) {
    sendResponse(false, 'অর্ডার আইডি অথবা প্লেয়ার UID লিখুন', null, 400);
}

try {
    $cleanQuery = strtoupper($query);

    // Search in normalized v_orders_full view by Order ID, Player UID, or TrxID
    $stmt = $pdo->prepare("
        SELECT * FROM v_orders_full 
        WHERE UPPER(id) = ? OR player_uid = ? OR UPPER(trx_id) = ?
        ORDER BY created_at DESC 
        LIMIT 10
    ");
    $stmt->execute([$cleanQuery, $query, $cleanQuery]);
    $orders = $stmt->fetchAll();

    if (empty($orders)) {
        sendResponse(false, 'কোনো অর্ডার খুঁজে পাওয়া যায়নি। সঠিক অর্ডার আইডি বা UID দিন।', [], 404);
    }

    $formatted = array_map(function($o) {
        return [
            'id' => $o['id'],
            'customerName' => $o['customer_name'],
            'uid' => $o['player_uid'],
            'playerNickname' => $o['player_nickname'],
            'packageId' => $o['package_id'],
            'packageName' => $o['package_name'],
            'productName' => $o['product_name'],
            'diamonds' => (int)$o['diamonds'],
            'amount' => (float)$o['amount'],
            'method' => $o['payment_method'],
            'trxId' => $o['trx_id'],
            'status' => $o['status'],
            'createdAt' => $o['created_at']
        ];
    }, $orders);

    sendResponse(true, count($formatted) . ' টি অর্ডার পাওয়া গেছে', $formatted);
} catch (Exception $e) {
    sendResponse(false, 'সার্ভার এরর: ' . $e->getMessage(), null, 500);
}
