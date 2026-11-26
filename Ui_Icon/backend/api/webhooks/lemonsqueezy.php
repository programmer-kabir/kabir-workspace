<?php
// backend/api/webhooks/lemonsqueezy.php

header('Content-Type: application/json');

// Include DB and Config
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/auth.php';

// Verify the webhook signature
$secret = getenv('LEMON_SQUEEZY_WEBHOOK_SECRET');
if (!$secret) {
    http_response_code(500);
    echo json_encode(['error' => 'Webhook secret not configured']);
    exit;
}

$payload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_SIGNATURE'] ?? '';

if (empty($signature)) {
    http_response_code(401);
    echo json_encode(['error' => 'Missing signature']);
    exit;
}

// Calculate HMAC hex digest
$hash = hash_hmac('sha256', $payload, $secret);

// Compare signatures securely
if (!hash_equals($hash, $signature)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid signature']);
    exit;
}

// Parse the payload
$data = json_decode($payload, true);
if (!$data || !isset($data['meta']['event_name'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid payload']);
    exit;
}

$eventName = $data['meta']['event_name'];
$customData = $data['meta']['custom_data'] ?? [];
$attributes = $data['data']['attributes'] ?? [];

// In Lemon Squeezy, we can pass custom data in the checkout link like:
// ?checkout[custom][user_id]=123
// Let's assume user_id is passed in custom_data.
$userId = $customData['user_id'] ?? null;

if (!$userId) {
    // If no user_id is found, we might need to look it up by email,
    // but typically we pass user_id in the checkout URL.
    $userEmail = $attributes['user_email'] ?? '';
    if ($userEmail) {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$userEmail]);
        $userId = $stmt->fetchColumn();
    }
}

if (!$userId) {
    http_response_code(400);
    echo json_encode(['error' => 'User not found in payload or DB']);
    exit;
}

$customerId = $attributes['customer_id'] ?? null;

date_default_timezone_set('Asia/Dhaka');

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

// Handle different events
switch ($eventName) {
    case 'subscription_created':
    case 'subscription_updated':
        $variantId = $attributes['variant_id'] ?? null;
        
        $quantity = 1;
        if (!empty($attributes['first_subscription_item']['quantity'])) {
            $quantity = (int)$attributes['first_subscription_item']['quantity'];
        } elseif (!empty($attributes['quantity'])) {
            $quantity = (int)$attributes['quantity'];
        } elseif (!empty($customData['seats'])) {
            $quantity = (int)$customData['seats'];
        }
        
        $productName = strtolower($attributes['product_name'] ?? '');
        $variantName = strtolower($attributes['variant_name'] ?? '');
        
        $isTeam = (
            strpos($variantName, 'team') !== false ||
            strpos($productName, 'team') !== false ||
            (!empty($customData['plan_type']) && $customData['plan_type'] === 'team') ||
            $quantity > 1
        );
        $planType = $isTeam ? 'team' : 'solo';
        $teamSeats = $isTeam ? max(5, $quantity) : 1;
        
        $subId = $data['data']['id'] ?? null;
        $createdAt = !empty($attributes['created_at']) ? toDhakaTime($attributes['created_at']) : date('Y-m-d H:i:s');
        $updatedAt = !empty($attributes['updated_at']) ? toDhakaTime($attributes['updated_at']) : date('Y-m-d H:i:s');
        $renewsAt = !empty($attributes['renews_at']) ? toDhakaTime($attributes['renews_at']) : date('Y-m-d H:i:s', strtotime('+1 year'));
        $endsAt = !empty($attributes['ends_at']) ? toDhakaTime($attributes['ends_at']) : $renewsAt;
        $customerPortalUrl = $attributes['urls']['customer_portal'] ?? null;
        
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
                    status = 'active',
                    renews_at = ?,
                    ends_at = ?,
                    customer_portal_url = ?,
                    created_at = ?,
                    updated_at = ?
                WHERE id = ?
            ");
            $stmtUpdateSub->execute([
                $userId, $planType, $teamSeats, $customerId, $subId, 
                $renewsAt, $endsAt, $customerPortalUrl, $createdAt, $updatedAt,
                $existingSubId
            ]);
        } else {
            $stmtInsertSub = $pdo->prepare("
                INSERT INTO subscriptions (
                    user_id, plan_type, team_seats, lemonsqueezy_customer_id, lemonsqueezy_subscription_id, 
                    status, renews_at, ends_at, customer_portal_url, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)
            ");
            $stmtInsertSub->execute([
                $userId, $planType, $teamSeats, $customerId, $subId, 
                $renewsAt, $endsAt, $customerPortalUrl, $createdAt, $updatedAt
            ]);
        }
        break;

    case 'order_created':
        $orderId = $data['data']['id'] ?? null;
        $orderNumber = !empty($attributes['order_number']) ? '#' . $attributes['order_number'] : ($attributes['identifier'] ?? null);
        $total = ($attributes['total'] ?? 0) / 100; // Total is usually in cents
        $currency = $attributes['currency'] ?? 'USD';
        $status = $attributes['status'] ?? 'paid';
        $receiptUrl = $attributes['urls']['receipt'] ?? null;
        $orderCreatedAt = !empty($attributes['created_at']) ? toDhakaTime($attributes['created_at']) : date('Y-m-d H:i:s');
        $subId = $attributes['first_subscription_item']['subscription_id'] ?? null;
        
        // Find subscription_id internal ID from table if subId exists
        $internalSubId = null;
        if ($subId) {
            $stmt = $pdo->prepare("SELECT id FROM subscriptions WHERE lemonsqueezy_subscription_id = ?");
            $stmt->execute([$subId]);
            $internalSubId = $stmt->fetchColumn();
        }

        $cardBrand = $attributes['card_brand'] ?? null;
        $cardLastFour = $attributes['card_last_four'] ?? null;
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
        break;

    case 'subscription_cancelled':
    case 'subscription_expired':
        $stmt = $pdo->prepare("UPDATE subscriptions SET status = 'cancelled' WHERE user_id = ?");
        $stmt->execute([$userId]);
        break;
}

http_response_code(200);
echo json_encode(['success' => true]);
