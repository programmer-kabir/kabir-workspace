<?php
// backend/api/admin/payments/list.php
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

$where = [];
$params = [];

if (!empty($search)) {
    $where[] = "(p.order_number LIKE :search OR p.lemonsqueezy_order_id LIKE :search OR p.card_last_four LIKE :search OR u.username LIKE :search OR u.email LIKE :search OR u.full_name LIKE :search)";
    $params[':search'] = '%' . $search . '%';
}

if (!empty($status) && $status !== 'all') {
    $where[] = "p.status = :status";
    $params[':status'] = $status;
}

$whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

// Count total
$countSql = "
    SELECT COUNT(*) 
    FROM payments p
    LEFT JOIN users u ON p.user_id = u.id
    {$whereClause}
";
$countStmt = $pdo->prepare($countSql);
$countStmt->execute($params);
$total = (int)$countStmt->fetchColumn();
$totalPages = ceil($total / $limit);

// Fetch items
$itemsSql = "
    SELECT 
        p.id,
        p.user_id,
        p.subscription_id,
        p.lemonsqueezy_order_id,
        p.order_number,
        p.amount,
        p.currency,
        p.status,
        p.payment_method,
        p.card_brand,
        p.card_last_four,
        p.receipt_url,
        p.created_at,
        u.username,
        u.email,
        u.full_name,
        u.avatar_url,
        s.plan_type,
        s.team_seats,
        s.status AS subscription_status
    FROM payments p
    LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN subscriptions s ON p.subscription_id = s.id
    {$whereClause}
    ORDER BY p.created_at DESC
    LIMIT {$limit} OFFSET {$offset}
";

$itemsStmt = $pdo->prepare($itemsSql);
$itemsStmt->execute($params);
$items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

jsonResponse(true, [
    'items' => $items,
    'pagination' => [
        'total' => $total,
        'page' => $page,
        'limit' => $limit,
        'total_pages' => $totalPages,
    ]
]);
