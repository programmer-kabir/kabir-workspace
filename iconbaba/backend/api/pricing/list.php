<?php
// backend/api/pricing/list.php
// Get active pricing plans

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

$stmt = $pdo->query("
    SELECT id, name, price, billing_period, user_count, extra_seat_price, features, cta_text, cta_url, is_popular, display_order
    FROM pricing_plans
    WHERE is_active = 1
    ORDER BY display_order ASC, id ASC
");

$plans = $stmt->fetchAll();

foreach ($plans as &$plan) {
    if (is_string($plan['features'])) {
        $decoded = json_decode($plan['features'], true);
        $plan['features'] = is_array($decoded) ? $decoded : [];
    }
    $plan['price'] = (float)$plan['price'];
    $plan['user_count'] = (int)$plan['user_count'];
    $plan['extra_seat_price'] = (float)$plan['extra_seat_price'];
    $plan['is_popular'] = (bool)$plan['is_popular'];
}


jsonResponse(true, ['plans' => $plans], 'Pricing plans retrieved successfully.');
