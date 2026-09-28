<?php
// backend/api/admin/icons/single.php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';

$admin = requireAdmin($pdo);

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$slug = trim($_GET['slug'] ?? '');

if ($id <= 0 && empty($slug)) {
    jsonResponse(false, null, 'Icon ID or slug is required.', 400);
}

if ($id > 0) {
    $stmt = $pdo->prepare("
        SELECT i.*, c.name AS category_name, c.slug AS category_slug, u.username AS creator_username
        FROM icons i
        LEFT JOIN categories c ON i.category_id = c.id
        LEFT JOIN users u ON i.created_by = u.id
        WHERE i.id = :id
        LIMIT 1
    ");
    $stmt->execute([':id' => $id]);
} else {
    $stmt = $pdo->prepare("
        SELECT i.*, c.name AS category_name, c.slug AS category_slug, u.username AS creator_username
        FROM icons i
        LEFT JOIN categories c ON i.category_id = c.id
        LEFT JOIN users u ON i.created_by = u.id
        WHERE i.slug = :slug
        LIMIT 1
    ");
    $stmt->execute([':slug' => $slug]);
}

$icon = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$icon) {
    jsonResponse(false, null, 'Icon not found.', 404);
}

// Fetch variants
$varStmt = $pdo->prepare("
    SELECT style, svg_content 
    FROM icon_variants 
    WHERE icon_id = :icon_id
");
$varStmt->execute([':icon_id' => $icon['id']]);
$variants = $varStmt->fetchAll(PDO::FETCH_ASSOC);

$variantsMap = [];
foreach ($variants as $v) {
    $variantsMap[$v['style']] = $v['svg_content'];
}

$icon['variants'] = $variantsMap;
$icon['is_premium'] = (bool)($icon['is_premium'] ?? false);
$icon['tags_array'] = !empty($icon['tags']) ? array_filter(array_map('trim', explode(',', $icon['tags']))) : [];

jsonResponse(true, $icon, 'Icon retrieved successfully.');
