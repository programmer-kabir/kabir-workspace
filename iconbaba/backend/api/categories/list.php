<?php
// backend/api/categories/list.php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

$style = isset($_GET['style']) ? strtolower(trim($_GET['style'])) : 'outlined';
if ($style !== 'filled' && $style !== 'outlined') {
    $style = 'outlined';
}

// Fetch categories with live icon count based on style (only active categories & published icons)
$query = "
    SELECT 
        c.id, 
        c.name, 
        c.slug, 
        c.display_order,
        COUNT(CASE WHEN i.status = 'published' AND iv.id IS NOT NULL THEN i.id ELSE NULL END) AS icon_count
    FROM categories c
    LEFT JOIN icons i ON c.id = i.category_id AND i.status = 'published'
    LEFT JOIN icon_variants iv ON i.id = iv.icon_id AND iv.style = :style
    WHERE c.status = 'active'
    GROUP BY c.id, c.name, c.slug, c.display_order
    ORDER BY c.display_order ASC, c.name ASC
";

$stmt = $pdo->prepare($query);
$stmt->execute([':style' => $style]);
$categories = $stmt->fetchAll();

// Calculate total published icons for 'All' in the selected style
$totalStmt = $pdo->prepare("
    SELECT COUNT(DISTINCT i.id) 
    FROM icons i 
    INNER JOIN icon_variants iv ON i.id = iv.icon_id AND iv.style = :style 
    WHERE i.status = 'published'
");
$totalStmt->execute([':style' => $style]);
$totalIcons = (int)$totalStmt->fetchColumn();


// Format response
$formatted = array_map(function($cat) {
    return [
        'id' => (int)$cat['id'],
        'name' => $cat['name'],
        'slug' => $cat['slug'],
        'icon_count' => (int)$cat['icon_count']
    ];
}, $categories);

jsonResponse(true, [
    'total_icons' => $totalIcons,
    'categories' => $formatted
]);
