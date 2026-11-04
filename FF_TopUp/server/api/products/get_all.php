<?php
require_once __DIR__ . '/../../helpers/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../config/db.php';

try {
    // 1. Fetch active products
    $stmt = $pdo->query("SELECT * FROM products WHERE is_active = 1 ORDER BY sort_order ASC");
    $products = $stmt->fetchAll();

    // 2. Fetch active packages
    $pkgStmt = $pdo->query("SELECT * FROM packages WHERE is_active = 1 ORDER BY sort_order ASC");
    $allPackages = $pkgStmt->fetchAll();

    // Group packages by product_id
    $packagesByProduct = [];
    foreach ($allPackages as $pkg) {
        $pId = $pkg['product_id'];
        if (!isset($packagesByProduct[$pId])) {
            $packagesByProduct[$pId] = [];
        }
        $packagesByProduct[$pId][] = [
            'id' => $pkg['id'],
            'name' => $pkg['name'],
            'diamonds' => (int)$pkg['diamonds'],
            'price' => (float)$pkg['price'],
            'costPrice' => (float)$pkg['cost_price'],
            'popular' => (bool)$pkg['popular'],
            'tag' => $pkg['tag'],
            'desc' => $pkg['description']
        ];
    }

    // Combine
    $result = [];
    foreach ($products as $prod) {
        $servers = [];
        if (!empty($prod['servers_json'])) {
            $decoded = json_decode($prod['servers_json'], true);
            if (is_array($decoded)) {
                $servers = $decoded;
            }
        }

        $result[] = [
            'id' => $prod['id'],
            'title' => $prod['title'],
            'subtitle' => $prod['subtitle'],
            'badge' => $prod['badge'],
            'category' => $prod['category'],
            'image' => $prod['image'],
            'servers' => $servers,
            'packages' => $packagesByProduct[$prod['id']] ?? []
        ];
    }

    sendResponse(true, 'Products loaded successfully', $result);
} catch (Exception $e) {
    sendResponse(false, 'Failed to fetch products: ' . $e->getMessage(), null, 500);
}

