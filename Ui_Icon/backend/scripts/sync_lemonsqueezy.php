<?php
// backend/scripts/sync_lemonsqueezy.php
// Synchronizes subscriptions and orders directly from Lemon Squeezy API into local MySQL DB

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/auth.php';

$envFile = file_get_contents(__DIR__ . '/../.env');
preg_match('/LEMON_SQUEEZY_API_KEY=(.*)/', $envFile, $m);
$apiKey = trim($m[1] ?? '');

preg_match('/LEMON_SQUEEZY_STORE_ID=(.*)/', $envFile, $mStore);
$storeId = trim($mStore[1] ?? '481244');

if (!$apiKey) {
    die("Missing LEMON_SQUEEZY_API_KEY in backend/.env\n");
}

function fetchLs($endpoint, $apiKey) {
    $ch = curl_init($endpoint);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: application/vnd.api+json',
        'Content-Type: application/vnd.api+json',
        'Authorization: Bearer ' . $apiKey
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $res = curl_exec($ch);
    return json_decode($res, true);
}

echo "=== Fetching Subscriptions from Lemon Squeezy ===\n";
$subsData = fetchLs("https://api.lemonsqueezy.com/v1/subscriptions?filter[store_id]={$storeId}", $apiKey);
$subsList = $subsData['data'] ?? [];

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

$subInserted = 0;
foreach ($subsList as $sub) {
    $subId = $sub['id'];
    $attrs = $sub['attributes'] ?? [];
    $userEmail = $attrs['user_email'] ?? '';
    
    // Find user by email
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$userEmail]);
    $userId = $stmt->fetchColumn();

    if (!$userId) {
        echo "Skipping subscription {$subId}: No user found for email {$userEmail}\n";
        continue;
    }

    $productName = strtolower($attrs['product_name'] ?? '');
    $variantName = strtolower($attrs['variant_name'] ?? '');
    
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
    // If ends_at is not set on active recurring subscription, set it to the same date as renews_at
    $endsAt = !empty($attrs['ends_at']) ? toDhakaTime($attrs['ends_at']) : $renewsAt;
    $customerPortalUrl = $attrs['urls']['customer_portal'] ?? null;

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

    echo "Synced Subscription ID: {$subId} for User ID: {$userId} ({$userEmail})\n";
    $subInserted++;
}

echo "\n=== Fetching Orders from Lemon Squeezy ===\n";
$ordersData = fetchLs("https://api.lemonsqueezy.com/v1/orders?filter[store_id]={$storeId}", $apiKey);
$ordersList = $ordersData['data'] ?? [];

$ordInserted = 0;
foreach ($ordersList as $ord) {
    $orderId = $ord['id'];
    $attrs = $ord['attributes'] ?? [];
    $userEmail = $attrs['user_email'] ?? '';
    
    // Find user by email
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$userEmail]);
    $userId = $stmt->fetchColumn();

    if (!$userId) {
        echo "Skipping order {$orderId}: No user found for email {$userEmail}\n";
        continue;
    }

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

    echo "Synced Order ID: {$orderId} ($" . number_format($total, 2) . ") for User ID: {$userId} ({$userEmail})\n";
    $ordInserted++;
}

echo "\nCompleted sync: {$subInserted} subscriptions, {$ordInserted} payments synced!\n";
