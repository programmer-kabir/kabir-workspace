<?php
// backend/api/admin/packs/single.php
// Admin API: Get single pack with its icons and categories list

require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';

$admin = requireAdmin($pdo);

try {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if ($id <= 0) {
        jsonResponse(false, null, 'Invalid pack ID.', 400);
    }

    $stmt = $pdo->prepare("
        SELECT p.*, c.name AS category_name
        FROM packs p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = :id
        LIMIT 1
    ");
    $stmt->execute([':id' => $id]);
    $pack = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$pack) {
        jsonResponse(false, null, 'Pack not found.', 404);
    }

    // Fetch icons in pack
    $iconStmt = $pdo->prepare("
        SELECT id, name, slug, status, is_premium, sort_order, default_style,
               (SELECT svg_content FROM icon_variants WHERE icon_id = icons.id LIMIT 1) AS preview_svg
        FROM icons
        WHERE pack_id = :pack_id
        ORDER BY sort_order ASC, id ASC
    ");
    $iconStmt->execute([':pack_id' => $id]);
    $icons = $iconStmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse(true, [
        'pack' => [
            'id' => (int)$pack['id'],
            'name' => $pack['name'],
            'slug' => $pack['slug'],
            'description' => $pack['description'] ?? '',
            'tags' => $pack['tags'] ?? '',
            'category_id' => (int)$pack['category_id'],
            'category_name' => $pack['category_name'] ?: 'General',
            'family_slug' => $pack['family_slug'] ?? '',
            'primary_style' => $pack['primary_style'] ?: 'outlined',
            'author_name' => $pack['author_name'] ?: 'IconBaba Studio',
            'is_premium' => (bool)$pack['is_premium'],
            'is_featured' => (bool)$pack['is_featured'],
            'status' => $pack['status'],
            'icon_count' => count($icons),
            'downloads_count' => (int)$pack['downloads_count'],
            'created_at' => $pack['created_at'],
            'updated_at' => $pack['updated_at']
        ],
        'icons' => array_map(function($ico) {
            return [
                'id' => (int)$ico['id'],
                'name' => $ico['name'],
                'slug' => $ico['slug'],
                'status' => $ico['status'],
                'is_premium' => (bool)$ico['is_premium'],
                'sort_order' => (int)$ico['sort_order'],
                'default_style' => $ico['default_style'] ?: 'outlined',
                'svg' => $ico['preview_svg'] ?: ''
            ];
        }, $icons)
    ], 'Pack details retrieved successfully.');

} catch (Exception $e) {
    jsonResponse(false, null, 'Failed to fetch pack details: ' . $e->getMessage(), 500);
}
