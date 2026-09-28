<?php
// backend/api/admin/collections/list.php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';

$admin = requireAdmin($pdo);

$page = max(1, (int)($_GET['page'] ?? 1));
$limit = max(1, min(100, (int)($_GET['limit'] ?? 20)));
$offset = ($page - 1) * $limit;

$totalStmt = $pdo->query("SELECT COUNT(*) FROM collections");
$total = (int)$totalStmt->fetchColumn();

// Fetch collections with user info and item count
$stmt = $pdo->prepare("
    SELECT 
        c.id, c.name, c.description, c.is_public, c.created_at, c.updated_at,
        u.id AS user_id, u.username, u.email,
        (SELECT COUNT(*) FROM collection_items ci WHERE ci.collection_id = c.id) AS item_count
    FROM collections c
    JOIN users u ON c.user_id = u.id
    ORDER BY c.created_at DESC
    LIMIT {$limit} OFFSET {$offset}
");
$stmt->execute();
$collections = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($collections as &$col) {
    $col['id'] = (int)$col['id'];
    $col['item_count'] = (int)$col['item_count'];
    $col['is_public'] = (bool)$col['is_public'];
}

jsonResponse(true, [
    'items' => $collections,
    'pagination' => [
        'page' => $page,
        'limit' => $limit,
        'total' => $total,
        'total_pages' => ceil($total / $limit)
    ]
], 'Admin collections retrieved successfully.');
