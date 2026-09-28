<?php
// backend/api/favorites/list.php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

$user = requireAuth($pdo);
$style = isset($_GET['style']) ? strtolower(trim($_GET['style'])) : 'outlined';
if ($style !== 'filled' && $style !== 'outlined') {
    $style = 'outlined';
}

$query = "
    SELECT 
        i.id,
        i.name,
        i.slug,
        i.is_premium,
        c.name AS category_name,
        c.slug AS category_slug,
        f.created_at AS favorited_at,
        iv.style,
        iv.svg_content
    FROM favorites f
    JOIN icons i ON f.icon_id = i.id
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN icon_variants iv ON i.id = iv.icon_id AND iv.style = :style
    WHERE f.user_id = :uid
    ORDER BY f.created_at DESC
";

$stmt = $pdo->prepare($query);
$stmt->execute([':uid' => $user['id'], ':style' => $style]);
$favorites = $stmt->fetchAll();

$formatted = array_map(function($fav) {
    return [
        'id' => (int)$fav['id'],
        'name' => $fav['name'],
        'slug' => $fav['slug'],
        'category' => $fav['category_name'] ?: 'Misc',
        'category_slug' => $fav['category_slug'] ?: 'misc',
        'is_premium' => (bool)$fav['is_premium'],
        'favorited_at' => $fav['favorited_at'],
        'style' => $fav['style'] ?: 'outlined',
        'svg' => $fav['svg_content']
    ];
}, $favorites);

jsonResponse(true, ['favorites' => $formatted]);
