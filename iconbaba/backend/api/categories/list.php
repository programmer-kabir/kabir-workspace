<?php
// backend/api/categories/list.php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

$style = isset($_GET['style']) ? strtolower(trim($_GET['style'])) : 'outlined';

// Fetch categories with live icon count and pack count
$query = "
    SELECT 
        c.id, 
        c.name, 
        c.slug, 
        c.display_order,
        c.pack_count,
        COUNT(CASE WHEN i.status = 'published' AND iv.id IS NOT NULL THEN i.id ELSE NULL END) AS live_icon_count
    FROM categories c
    LEFT JOIN icons i ON c.id = i.category_id AND i.status = 'published'
    LEFT JOIN icon_variants iv ON i.id = iv.icon_id AND iv.style = :style
    WHERE c.status = 'active'
    GROUP BY c.id, c.name, c.slug, c.display_order, c.pack_count
    ORDER BY c.display_order ASC, c.name ASC
";

$stmt = $pdo->prepare($query);
$stmt->execute([':style' => $style]);
$categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Calculate total published icons for 'All' in the selected style
$totalStmt = $pdo->prepare("
    SELECT COUNT(DISTINCT i.id) 
    FROM icons i 
    INNER JOIN icon_variants iv ON i.id = iv.icon_id AND iv.style = :style 
    WHERE i.status = 'published'
");
$totalStmt->execute([':style' => $style]);
$totalIcons = (int)$totalStmt->fetchColumn();

// Calculate total published packs
$totalPacksStmt = $pdo->query("SELECT COUNT(*) FROM packs WHERE status = 'published'");
$totalPacks = (int)$totalPacksStmt->fetchColumn();

// Format response
$formatted = array_map(function($cat) {
    return [
        'id' => (int)$cat['id'],
        'name' => $cat['name'],
        'slug' => $cat['slug'],
        'icon_count' => (int)$cat['live_icon_count'],
        'pack_count' => (int)$cat['pack_count']
    ];
}, $categories);

jsonResponse(true, [
    'total_icons' => $totalIcons,
    'total_packs' => $totalPacks,
    'categories' => $formatted
]);
