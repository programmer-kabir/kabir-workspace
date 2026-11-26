<?php
// backend/api/downloads/history.php
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
        d.id AS download_id,
        d.format,
        d.size,
        d.created_at AS downloaded_at,
        i.id,
        i.name,
        i.slug,
        i.is_premium,
        c.name AS category_name,
        c.slug AS category_slug,
        iv.style,
        iv.svg_content
    FROM downloads d
    JOIN icons i ON d.icon_id = i.id
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN icon_variants iv ON i.id = iv.icon_id AND iv.style = :style
    WHERE d.user_id = :uid
    ORDER BY d.created_at DESC
    LIMIT 100
";

$stmt = $pdo->prepare($query);
$stmt->execute([':uid' => $user['id'], ':style' => $style]);
$downloads = $stmt->fetchAll();

$formatted = array_map(function($d) {
    return [
        'download_id' => (int)$d['download_id'],
        'format' => $d['format'],
        'size' => (int)$d['size'],
        'downloaded_at' => $d['downloaded_at'],
        'icon' => [
            'id' => (int)$d['id'],
            'name' => $d['name'],
            'slug' => $d['slug'],
            'category' => $d['category_name'] ?: 'Misc',
            'category_slug' => $d['category_slug'] ?: 'misc',
            'is_premium' => (bool)$d['is_premium'],
            'style' => $d['style'] ?: 'outlined',
            'svg' => $d['svg_content']
        ]
    ];
}, $downloads);

jsonResponse(true, ['downloads' => $formatted]);
