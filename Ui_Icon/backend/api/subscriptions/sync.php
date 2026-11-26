<?php
// backend/api/subscriptions/sync.php
// Synchronizes current logged-in user's subscription and orders from Lemon Squeezy API

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

$user = requireAuth($pdo);
$userId = (int)$user['id'];
$userEmail = $user['email'];

$envFile = file_exists(__DIR__ . '/../../.env') ? file_get_contents(__DIR__ . '/../../.env') : '';
preg_match('/LEMON_SQUEEZY_API_KEY=(.*)/', $envFile, $m);
$apiKey = trim($m[1] ?? getenv('LEMON_SQUEEZY_API_KEY') ?: '');

preg_match('/LEMON_SQUEEZY_STORE_ID=(.*)/', $envFile, $mStore);
$storeId = trim($mStore[1] ?? getenv('LEMON_SQUEEZY_STORE_ID') ?: '481244');

if (!$apiKey) {
    jsonResponse(false, null, 'Lemon Squeezy API key not configured on server', 500);
}

function fetchLsEndpoint($endpoint, $apiKey) {
    $ch = curl_init($endpoint);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: application/vnd.api+json',
        'Content-Type: application/vnd.api+json',
        'Authorization: Bearer ' . $apiKey
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    $res = curl_exec($ch);
    return json_decode($res, true);
}

// 1. Fetch user's subscriptions from Lemon Squeezy API
$subsData = fetchLsEndpoint("https://api.lemonsqueezy.com/v1/subscriptions?filter[store_id]={$storeId}&filter[user_email]=" . urlencode($userEmail), $apiKey);
$subsList = $subsData['data'] ?? [];

// If filtered by email returned nothing (e.g. older API version), fallback to general store subscriptions
if (empty($subsList)) {
    $subsData = fetchLsEndpoint("https://api.lemonsqueezy.com/v1/subscriptions?filter[store_id]={$storeId}", $apiKey);
    $allSubs = $subsData['data'] ?? [];
    $subsList = array_filter($allSubs, function($s) use ($userEmail) {
        return strtolower($s['attributes']['user_email'] ?? '') === strtolower($userEmail);
    });
}

function toDhakaTime($dateStr) {
    if (empty($dateStr)) return null;
    try {
        $dt = new DateTime($dateStr);
        $dt->setTimezone(new DateTimeZone('Asia/Dhaka'));
        return $dt->format('Y-m-d H:i:s');
    } catch (Exception $e) {
        return date('Y-m-d H:i:s', strtotime($dateStr));
    }
}

$hasActivePro = false;
$syncedSubs = 0;

foreach ($subsList as $sub) {
    $subId = $sub['id'];
    $attrs = $sub['attributes'] ?? [];

    $productName = strtolower($attrs['product_name'] ?? '');
    $variantName = strtolower($attrs['variant_name'] ?? '');
    
    // Check quantity from first_subscription_item or attributes.quantity
    $quantity = 1;
    if (!empty($attrs['first_subscription_item']['quantity'])) {
        $quantity = (int)$attrs['first_subscription_item']['quantity'];
    } elseif (!empty($attrs['quantity'])) {
        $quantity = (int)$attrs['quantity'];
    }

    $isTeam = (strpos($variantName, 'team') !== false || strpos($productName, 'team') !== false || $quantity > 1);
    $planType = $isTeam ? 'team' : 'solo';
    $teamSeats = $isTeam ? max(5, $quantity) : 1;

    $status = $attrs['status'] ?? 'active';
    $customerId = $attrs['customer_id'] ?? null;
    $productId = $attrs['product_id'] ?? null;
    $variantId = $attrs['variant_id'] ?? null;

    $createdAt = !empty($attrs['created_at']) ? toDhakaTime($attrs['created_at']) : date('Y-m-d H:i:s');
    $updatedAt = !empty($attrs['updated_at']) ? toDhakaTime($attrs['updated_at']) : date('Y-m-d H:i:s');
    $renewsAt = !empty($attrs['renews_at']) ? toDhakaTime($attrs['renews_at']) : date('Y-m-d H:i:s', strtotime('+1 year'));
    // If ends_at is not set by Lemon Squeezy on active sub, set ends_at to the same date as renews_at
    $endsAt = !empty($attrs['ends_at']) ? toDhakaTime($attrs['ends_at']) : $renewsAt;
    $customerPortalUrl = $attrs['urls']['customer_portal'] ?? null;

    // Cache card details by subId to associate with payments
    if (!empty($attrs['card_brand']) || !empty($attrs['card_last_four'])) {
        $cardInfoBySub[$subId] = [
            'brand' => $attrs['card_brand'] ?? null,
            'last4' => $attrs['card_last_four'] ?? null
        ];
    }

    // Check if subscription already exists for this subId or userId
    $stmtCheckSub = $pdo->prepare("SELECT id FROM subscriptions WHERE lemonsqueezy_subscription_id = ? OR user_id = ? ORDER BY id ASC LIMIT 1");
    $stmtCheckSub->execute([$subId, $userId]);
    $existingSubId = $stmtCheckSub->fetchColumn();

    if ($existingSubId) {
        $stmtUpdateSub = $pdo->prepare("
            UPDATE subscriptions SET 
                user_id = ?,
                plan_type = ?,
                team_seats = ?,
                lemonsqueezy_customer_id = ?,
                lemonsqueezy_subscription_id = ?,
                status = ?,
                renews_at = ?,
                ends_at = ?,
                customer_portal_url = ?,
                created_at = ?,
                updated_at = ?
            WHERE id = ?
        ");
        $stmtUpdateSub->execute([
            $userId, $planType, $teamSeats, $customerId, $subId,
            $status, $renewsAt, $endsAt, $customerPortalUrl, $createdAt, $updatedAt,
            $existingSubId
        ]);
        $currentSubInternalId = $existingSubId;
    } else {
        $stmtInsertSub = $pdo->prepare("
            INSERT INTO subscriptions (
                user_id, plan_type, team_seats, lemonsqueezy_customer_id, lemonsqueezy_subscription_id, 
                status, renews_at, ends_at, customer_portal_url, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmtInsertSub->execute([
            $userId, $planType, $teamSeats, $customerId, $subId,
            $status, $renewsAt, $endsAt, $customerPortalUrl, $createdAt, $updatedAt
        ]);
        $currentSubInternalId = $pdo->lastInsertId();
    }

    $linkedOrderId = $attrs['order_id'] ?? null;
    if ($linkedOrderId) {
        $orderIdToSubId[$linkedOrderId] = $currentSubInternalId;
        $orderIdToCard[$linkedOrderId] = [
            'brand' => $attrs['card_brand'] ?? null,
            'last4' => $attrs['card_last_four'] ?? null
        ];
    }

    if ($status === 'active') {
        $hasActivePro = true;
    }
    $syncedSubs++;
}

// 2. Fetch and sync orders for this user
$ordersData = fetchLsEndpoint("https://api.lemonsqueezy.com/v1/orders?filter[store_id]={$storeId}&filter[user_email]=" . urlencode($userEmail), $apiKey);
$ordersList = $ordersData['data'] ?? [];

if (empty($ordersList)) {
    $ordersData = fetchLsEndpoint("https://api.lemonsqueezy.com/v1/orders?filter[store_id]={$storeId}", $apiKey);
    $allOrders = $ordersData['data'] ?? [];
    $ordersList = array_filter($allOrders, function($o) use ($userEmail) {
        return strtolower($o['attributes']['user_email'] ?? '') === strtolower($userEmail);
    });
}

$syncedOrders = 0;
foreach ($ordersList as $ord) {
    $orderId = $ord['id'];
    $attrs = $ord['attributes'] ?? [];

    $orderNumber = !empty($attrs['order_number']) ? '#' . $attrs['order_number'] : ($attrs['identifier'] ?? '');
    $total = ($attrs['total'] ?? 0) / 100;
    $currency = $attrs['currency'] ?? 'USD';
    $status = $attrs['status'] ?? 'paid';
    $receiptUrl = $attrs['urls']['receipt'] ?? null;
    $orderCreatedAt = !empty($attrs['created_at']) ? toDhakaTime($attrs['created_at']) : date('Y-m-d H:i:s');

    $internalSubId = $orderIdToSubId[$orderId] ?? null;
    if (!$internalSubId) {
        $stmtUserSub = $pdo->prepare("SELECT id FROM subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1");
        $stmtUserSub->execute([$userId]);
        $internalSubId = $stmtUserSub->fetchColumn() ?: null;
    }

    $cardBrand = $attrs['card_brand'] ?? ($orderIdToCard[$orderId]['brand'] ?? null);
    $cardLastFour = $attrs['card_last_four'] ?? ($orderIdToCard[$orderId]['last4'] ?? null);
    $paymentMethod = 'card';

    // Check if payment already exists for this lemonsqueezy_order_id
    $stmtCheckPay = $pdo->prepare("SELECT id FROM payments WHERE lemonsqueezy_order_id = ? LIMIT 1");
    $stmtCheckPay->execute([$orderId]);
    $existingPayId = $stmtCheckPay->fetchColumn();

    if ($existingPayId) {
        $stmtUpdatePay = $pdo->prepare("
            UPDATE payments SET 
                user_id = ?,
                subscription_id = ?,
                order_number = ?,
                amount = ?,
                currency = ?,
                status = ?,
                payment_method = ?,
                card_brand = ?,
                card_last_four = ?,
                receipt_url = ?,
                created_at = ?
            WHERE id = ?
        ");
        $stmtUpdatePay->execute([
            $userId, $internalSubId ?: null, $orderNumber, $total, $currency, $status,
            $paymentMethod, $cardBrand, $cardLastFour, $receiptUrl, $orderCreatedAt,
            $existingPayId
        ]);
    } else {
        $stmtInsertPay = $pdo->prepare("
            INSERT INTO payments (
                user_id, subscription_id, lemonsqueezy_order_id, order_number, amount, currency, status,
                payment_method, card_brand, card_last_four, receipt_url, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmtInsertPay->execute([
            $userId, $internalSubId ?: null, $orderId, $orderNumber, $total, $currency, $status,
            $paymentMethod, $cardBrand, $cardLastFour, $receiptUrl, $orderCreatedAt
        ]);
    }
    $syncedOrders++;
}

jsonResponse(true, [
    'synced_subscriptions' => $syncedSubs,
    'synced_orders' => $syncedOrders,
    'is_pro' => $hasActivePro
], 'Subscription synced successfully');
