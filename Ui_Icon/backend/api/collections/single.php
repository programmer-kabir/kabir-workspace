<?php
// backend/api/collections/single.php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

$collectionId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($collectionId <= 0) {
    jsonResponse(false, null, 'Valid collection ID is required', 400);
}

$user = getAuthenticatedUser($pdo);
$style = isset($_GET['style']) ? strtolower(trim($_GET['style'])) : 'outlined';
if ($style !== 'filled' && $style !== 'outlined') {
    $style = 'outlined';
}

// Check collection visibility
$stmt = $pdo->prepare("SELECT * FROM collections WHERE id = :id");
$stmt->execute([':id' => $collectionId]);
$collection = $stmt->fetch();

if (!$collection) {
    jsonResponse(false, null, 'Collection not found', 404);
}

// Check authorization: if not public, only owner can view
if (!$collection['is_public'] && (!$user || $user['id'] != $collection['user_id'])) {
    jsonResponse(false, null, 'Unauthorized access to this collection', 403);
}

// Fetch items
$itemsStmt = $pdo->prepare("
    SELECT 
        i.id,
        i.name,
        i.slug,
        i.is_premium,
        c.name AS category_name,
        c.slug AS category_slug,
        ci.created_at AS added_at,
        iv.style,
        iv.svg_content
    FROM collection_items ci
    JOIN icons i ON ci.icon_id = i.id
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN icon_variants iv ON i.id = iv.icon_id AND iv.style = :style
    WHERE ci.collection_id = :cid
    ORDER BY ci.created_at DESC
");
$itemsStmt->execute([':cid' => $collectionId, ':style' => $style]);
$items = $itemsStmt->fetchAll();

$formattedItems = array_map(function($item) {
    return [
        'id' => (int)$item['id'],
        'name' => $item['name'],
        'slug' => $item['slug'],
        'category' => $item['category_name'] ?: 'Misc',
        'category_slug' => $item['category_slug'] ?: 'misc',
        'is_premium' => (bool)$item['is_premium'],
        'added_at' => $item['added_at'],
        'style' => $item['style'] ?: 'outlined',
        'svg' => $item['svg_content']
    ];
}, $items);

jsonResponse(true, [
    'collection' => [
        'id' => (int)$collection['id'],
        'name' => $collection['name'],
        'description' => $collection['description'],
        'is_public' => (bool)$collection['is_public'],
        'is_owner' => $user && $user['id'] == $collection['user_id'],
        'items' => $formattedItems
    ]
]);
