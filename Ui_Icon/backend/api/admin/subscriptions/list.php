<?php
// backend/api/admin/subscriptions/list.php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';

$admin = requireAdmin($pdo);

$page = max(1, (int)($_GET['page'] ?? 1));
$limit = max(1, min(100, (int)($_GET['limit'] ?? 20)));
$offset = ($page - 1) * $limit;

$search = trim($_GET['q'] ?? '');
$status = trim($_GET['status'] ?? '');
$planType = trim($_GET['plan_type'] ?? '');

$where = [];
$params = [];

if (!empty($search)) {
    $where[] = "(u.username LIKE :search OR u.email LIKE :search OR u.full_name LIKE :search OR s.lemonsqueezy_subscription_id LIKE :search OR s.lemonsqueezy_customer_id LIKE :search)";
    $params[':search'] = '%' . $search . '%';
}

if (!empty($status) && $status !== 'all') {
    if ($status === 'active') {
        $where[] = "s.status = 'active' AND (s.ends_at IS NULL OR s.ends_at > NOW())";
    } elseif ($status === 'expired') {
        $where[] = "(s.status = 'expired' OR (s.ends_at IS NOT NULL AND s.ends_at <= NOW()))";
    } else {
        $where[] = "s.status = :status";
        $params[':status'] = $status;
    }
}

if (!empty($planType) && in_array($planType, ['solo', 'team'])) {
    $where[] = "s.plan_type = :plan_type";
    $params[':plan_type'] = $planType;
}

$whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

// Count total
$countSql = "
    SELECT COUNT(*) 
    FROM subscriptions s
    LEFT JOIN users u ON s.user_id = u.id
    {$whereClause}
";
$countStmt = $pdo->prepare($countSql);
$countStmt->execute($params);
$total = (int)$countStmt->fetchColumn();
$totalPages = ceil($total / $limit);

// Fetch items
$itemsSql = "
    SELECT 
        s.id,
        s.user_id,
        s.plan_type,
        s.team_seats,
        s.lemonsqueezy_customer_id,
        s.lemonsqueezy_subscription_id,
        s.status,
        s.created_at,
        s.updated_at,
        s.renews_at,
        s.ends_at,
        s.customer_portal_url,
        u.username,
        u.email,
        u.full_name,
        u.avatar_url,
        (
            SELECT p.amount 
            FROM payments p 
            WHERE p.subscription_id = s.id 
            ORDER BY p.id DESC 
            LIMIT 1
        ) AS last_payment_amount,
        (
            SELECT p.currency 
            FROM payments p 
            WHERE p.subscription_id = s.id 
            ORDER BY p.id DESC 
            LIMIT 1
        ) AS last_payment_currency,
        (
            SELECT p.order_number 
            FROM payments p 
            WHERE p.subscription_id = s.id 
            ORDER BY p.id DESC 
            LIMIT 1
        ) AS last_order_number
    FROM subscriptions s
    LEFT JOIN users u ON s.user_id = u.id
    {$whereClause}
    ORDER BY s.created_at DESC
    LIMIT {$limit} OFFSET {$offset}
";

$itemsStmt = $pdo->prepare($itemsSql);
$itemsStmt->execute($params);
$items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($items as &$item) {
    $now = time();
    $endsAtTime = !empty($item['ends_at']) ? strtotime($item['ends_at']) : null;
    $isActive = ($item['status'] === 'active') && ($endsAtTime === null || $endsAtTime > $now);
    $item['is_currently_active'] = $isActive;
}
unset($item);

jsonResponse(true, [
    'items' => $items,
    'pagination' => [
        'total' => $total,
        'page' => $page,
        'limit' => $limit,
        'total_pages' => $totalPages,
    ]
]);
