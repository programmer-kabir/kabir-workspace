<?php
// backend/api/collections/list.php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

$user = requireAuth($pdo);

$query = "
    SELECT 
        c.id,
        c.name,
        c.description,
        c.is_public,
        c.created_at,
        c.updated_at,
        COUNT(ci.id) AS items_count
    FROM collections c
    LEFT JOIN collection_items ci ON c.id = ci.collection_id
    WHERE c.user_id = :uid
    GROUP BY c.id
    ORDER BY c.updated_at DESC
";

$stmt = $pdo->prepare($query);
$stmt->execute([':uid' => $user['id']]);
$collections = $stmt->fetchAll();

$formatted = array_map(function($col) {
    return [
        'id' => (int)$col['id'],
        'name' => $col['name'],
        'description' => $col['description'],
        'is_public' => (bool)$col['is_public'],
        'items_count' => (int)$col['items_count'],
        'created_at' => $col['created_at'],
        'updated_at' => $col['updated_at']
    ];
}, $collections);

jsonResponse(true, ['collections' => $formatted]);
