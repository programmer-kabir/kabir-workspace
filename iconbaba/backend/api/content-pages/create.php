<?php
// backend/api/content-pages/create.php
// Create a new content page (Admin only)

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, null, 'Method not allowed.', 405);
}

$admin = requireAdmin($pdo);
$input = getJsonInput();

$slug = isset($input['slug']) ? trim(strtolower($input['slug'])) : '';
$title = isset($input['title']) ? trim($input['title']) : '';
$content = isset($input['content']) ? trim($input['content']) : '';
$metaTitle = isset($input['meta_title']) ? trim($input['meta_title']) : null;
$metaDesc = isset($input['meta_description']) ? trim($input['meta_description']) : null;
$status = isset($input['status']) && in_array($input['status'], ['draft', 'published']) ? $input['status'] : 'published';

if (empty($slug)) {
    jsonResponse(false, null, 'Slug is required.', 400);
}
if (!preg_match('/^[a-z0-9-]+$/', $slug)) {
    jsonResponse(false, null, 'Slug must contain only lowercase alphanumeric characters and hyphens.', 400);
}
if (empty($title)) {
    jsonResponse(false, null, 'Title is required.', 400);
}
if (empty($content)) {
    jsonResponse(false, null, 'Content is required.', 400);
}

// Check uniqueness
$chk = $pdo->prepare("SELECT id FROM content_pages WHERE slug = :slug LIMIT 1");
$chk->execute([':slug' => $slug]);
if ($chk->fetch()) {
    jsonResponse(false, null, "A page with slug '{$slug}' already exists.", 409);
}

// Insert
$stmt = $pdo->prepare("
    INSERT INTO content_pages (slug, title, content, meta_title, meta_description, status, created_by, updated_by)
    VALUES (:slug, :title, :content, :meta_title, :meta_description, :status, :created_by, :updated_by)
");
$stmt->execute([
    ':slug' => $slug,
    ':title' => $title,
    ':content' => $content,
    ':meta_title' => $metaTitle,
    ':meta_description' => $metaDesc,
    ':status' => $status,
    ':created_by' => $admin['id'],
    ':updated_by' => $admin['id']
]);

$newId = $pdo->lastInsertId();

$fetch = $pdo->prepare("SELECT * FROM content_pages WHERE id = :id");
$fetch->execute([':id' => $newId]);
$page = $fetch->fetch();

jsonResponse(true, $page, 'Content page created successfully.', 201);
