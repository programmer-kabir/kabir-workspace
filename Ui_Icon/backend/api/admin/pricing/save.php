<?php
// backend/api/admin/pricing/save.php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';
require_once __DIR__ . '/../../../helpers/audit.php';

$admin = requireAdmin($pdo);

$data = getJsonInput();
$id = (int)($data['id'] ?? 0);
$name = trim($data['name'] ?? '');
$price = isset($data['price']) ? (float)$data['price'] : 0.00;
$billingPeriod = trim($data['billing_period'] ?? 'year');
$features = $data['features'] ?? [];
$ctaText = trim($data['cta_text'] ?? ($data['button_text'] ?? 'Get Started'));
$ctaUrl = trim($data['cta_url'] ?? '/pricing');
$isPopular = !empty($data['is_popular']) ? 1 : 0;
$isActive = isset($data['is_active']) ? (!empty($data['is_active']) ? 1 : 0) : 1;
$displayOrder = isset($data['display_order']) ? (int)$data['display_order'] : (isset($data['sort_order']) ? (int)$data['sort_order'] : 0);
$userCount = isset($data['user_count']) ? (int)$data['user_count'] : 1;
$extraSeatPrice = isset($data['extra_seat_price']) ? (float)$data['extra_seat_price'] : 20.00;

if (empty($name)) {
    jsonResponse(false, null, 'Plan name is required.', 400);
}

$featuresJson = is_array($features) ? json_encode($features, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) : $features;

try {
    if ($id > 0) {
        $stmt = $pdo->prepare("
            UPDATE pricing_plans 
            SET name = :name, price = :price, billing_period = :billing_period,
                features = :features, cta_text = :cta_text, cta_url = :cta_url,
                is_popular = :is_popular, is_active = :is_active, display_order = :display_order,
                user_count = :user_count, extra_seat_price = :extra_seat_price, updated_at = NOW()
            WHERE id = :id
        ");
        $stmt->execute([
            ':name' => $name,
            ':price' => $price,
            ':billing_period' => $billingPeriod,
            ':features' => $featuresJson,
            ':cta_text' => $ctaText,
            ':cta_url' => $ctaUrl,
            ':is_popular' => $isPopular,
            ':is_active' => $isActive,
            ':display_order' => $displayOrder,
            ':user_count' => $userCount,
            ':extra_seat_price' => $extraSeatPrice,
            ':id' => $id
        ]);

        logAdminAction($pdo, $admin['id'], 'update_pricing_plan', 'pricing_plan', $id, [
            'name' => $name,
            'price' => $price,
            'user_count' => $userCount
        ]);

        jsonResponse(true, ['id' => $id], 'Pricing plan updated successfully.');
    } else {
        $stmt = $pdo->prepare("
            INSERT INTO pricing_plans 
            (name, price, billing_period, user_count, extra_seat_price, features, cta_text, cta_url, is_popular, display_order, is_active, created_at, updated_at)
            VALUES 
            (:name, :price, :billing_period, :user_count, :extra_seat_price, :features, :cta_text, :cta_url, :is_popular, :display_order, :is_active, NOW(), NOW())
        ");
        $stmt->execute([
            ':name' => $name,
            ':price' => $price,
            ':billing_period' => $billingPeriod,
            ':user_count' => $userCount,
            ':extra_seat_price' => $extraSeatPrice,
            ':features' => $featuresJson,
            ':cta_text' => $ctaText,
            ':cta_url' => $ctaUrl,
            ':is_popular' => $isPopular,
            ':display_order' => $displayOrder,
            ':is_active' => $isActive
        ]);
        $newId = (int)$pdo->lastInsertId();

        logAdminAction($pdo, $admin['id'], 'create_pricing_plan', 'pricing_plan', $newId, [
            'name' => $name,
            'price' => $price,
            'user_count' => $userCount
        ]);

        jsonResponse(true, ['id' => $newId], 'Pricing plan created successfully.', 201);
    }
} catch (Exception $e) {
    jsonResponse(false, null, 'Failed to save pricing plan: ' . $e->getMessage(), 500);
}
