<?php
// backend/api/admin/categories/list.php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';

$admin = requireAdmin($pdo);

// Admin sees all categories, along with total icons and published icons count
$stmt = $pdo->query("
    SELECT 
        c.id, c.name, c.slug, c.display_order, c.status, c.description, c.created_at, c.updated_at,
        COUNT(i.id) AS total_icons,
        COUNT(CASE WHEN i.status = 'published' THEN 1 END) AS published_icons,
        COUNT(CASE WHEN i.status = 'draft' THEN 1 END) AS draft_icons
    FROM categories c
    LEFT JOIN icons i ON c.id = i.category_id
    GROUP BY c.id
    ORDER BY c.display_order ASC, c.name ASC
");

$categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($categories as &$cat) {
    $cat['id'] = (int)$cat['id'];
    $cat['display_order'] = (int)$cat['display_order'];
    $cat['total_icons'] = (int)$cat['total_icons'];
    $cat['published_icons'] = (int)$cat['published_icons'];
    $cat['draft_icons'] = (int)$cat['draft_icons'];
    $cat['icon_count'] = (int)$cat['published_icons']; // synchronize with public view
}

jsonResponse(true, $categories, 'Admin categories retrieved successfully.');
