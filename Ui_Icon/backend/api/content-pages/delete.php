<?php
// backend/api/content-pages/delete.php
// Delete content page (Admin only)

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    jsonResponse(false, null, 'Method not allowed.', 405);
}

$admin = requireAdmin($pdo);
$input = getJsonInput();

$id = isset($input['id']) ? (int)$input['id'] : 0;
$slug = isset($input['slug']) ? trim(strtolower($input['slug'])) : '';

if ($id <= 0 && empty($slug)) {
    jsonResponse(false, null, 'Page ID or slug is required for deletion.', 400);
}

// Find page
if ($id > 0) {
    $stmt = $pdo->prepare("SELECT id, slug, title FROM content_pages WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $id]);
} else {
    $stmt = $pdo->prepare("SELECT id, slug, title FROM content_pages WHERE slug = :slug LIMIT 1");
    $stmt->execute([':slug' => $slug]);
}
$page = $stmt->fetch();

if (!$page) {
    jsonResponse(false, null, 'Page not found.', 404);
}

// Delete page
$del = $pdo->prepare("DELETE FROM content_pages WHERE id = :id");
$del->execute([':id' => $page['id']]);

jsonResponse(true, ['id' => (int)$page['id'], 'slug' => $page['slug']], 'Page deleted successfully.');
