<?php
// backend/api/content-pages/update.php
// Update content page with automatic revision history snapshot and updated_at tracking (Admin only)

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
    jsonResponse(false, null, 'Method not allowed.', 405);
}

$admin = requireAdmin($pdo);
$input = getJsonInput();

$id = isset($input['id']) ? (int)$input['id'] : 0;
$slug = isset($input['slug']) ? trim(strtolower($input['slug'])) : '';

if ($id <= 0 && empty($slug)) {
    jsonResponse(false, null, 'Page ID or slug is required for update.', 400);
}

// 1. Fetch current existing page
if ($id > 0) {
    $stmt = $pdo->prepare("SELECT * FROM content_pages WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $id]);
} else {
    $stmt = $pdo->prepare("SELECT * FROM content_pages WHERE slug = :slug LIMIT 1");
    $stmt->execute([':slug' => $slug]);
}
$existingPage = $stmt->fetch();

if (!$existingPage) {
    jsonResponse(false, null, 'Page not found.', 404);
}

$pageId = (int)$existingPage['id'];

// New values (fallback to existing if not provided)
$newTitle = isset($input['title']) ? trim($input['title']) : $existingPage['title'];
$newContent = isset($input['content']) ? trim($input['content']) : $existingPage['content'];
$newMetaTitle = array_key_exists('meta_title', $input) ? (trim($input['meta_title']) ?: null) : $existingPage['meta_title'];
$newMetaDesc = array_key_exists('meta_description', $input) ? (trim($input['meta_description']) ?: null) : $existingPage['meta_description'];
$newStatus = isset($input['status']) && in_array($input['status'], ['draft', 'published']) ? $input['status'] : $existingPage['status'];

// If slug is being updated
$newSlug = isset($input['new_slug']) ? trim(strtolower($input['new_slug'])) : $existingPage['slug'];
if ($newSlug !== $existingPage['slug']) {
    if (!preg_match('/^[a-z0-9-]+$/', $newSlug)) {
        jsonResponse(false, null, 'Slug must contain only lowercase alphanumeric characters and hyphens.', 400);
    }
    $chkSlug = $pdo->prepare("SELECT id FROM content_pages WHERE slug = :slug AND id != :id LIMIT 1");
    $chkSlug->execute([':slug' => $newSlug, ':id' => $pageId]);
    if ($chkSlug->fetch()) {
        jsonResponse(false, null, "Slug '{$newSlug}' is already in use by another page.", 409);
    }
}

// 2. Snapshot current version into content_page_revisions before updating
$revStmt = $pdo->prepare("
    INSERT INTO content_page_revisions (page_id, title, content, meta_title, meta_description, updated_by, created_at)
    VALUES (:page_id, :title, :content, :meta_title, :meta_description, :updated_by, NOW())
");
$revStmt->execute([
    ':page_id' => $pageId,
    ':title' => $existingPage['title'],
    ':content' => $existingPage['content'],
    ':meta_title' => $existingPage['meta_title'],
    ':meta_description' => $existingPage['meta_description'],
    ':updated_by' => $existingPage['updated_by'] ?: $admin['id']
]);

// 3. Update current content in content_pages (updated_at updates automatically via MySQL ON UPDATE CURRENT_TIMESTAMP)
$updateStmt = $pdo->prepare("
    UPDATE content_pages
    SET slug = :slug,
        title = :title,
        content = :content,
        meta_title = :meta_title,
        meta_description = :meta_description,
        status = :status,
        updated_by = :updated_by,
        updated_at = NOW()
    WHERE id = :id
");
$updateStmt->execute([
    ':slug' => $newSlug,
    ':title' => $newTitle,
    ':content' => $newContent,
    ':meta_title' => $newMetaTitle,
    ':meta_description' => $newMetaDesc,
    ':status' => $newStatus,
    ':updated_by' => $admin['id'],
    ':id' => $pageId
]);

// 4. Fetch updated page with author info
$fetchUpdated = $pdo->prepare("
    SELECT p.id, p.slug, p.title, p.content, p.meta_title, p.meta_description, p.status,
           p.created_at, p.updated_at, p.created_by, p.updated_by,
           u_updater.username AS updater_username, u_updater.full_name AS updater_name,
           (SELECT COUNT(*) FROM content_page_revisions r WHERE r.page_id = p.id) AS revisions_count
    FROM content_pages p
    LEFT JOIN users u_updater ON p.updated_by = u_updater.id
    WHERE p.id = :id
    LIMIT 1
");
$fetchUpdated->execute([':id' => $pageId]);
$updatedPage = $fetchUpdated->fetch();

jsonResponse(true, $updatedPage, 'Page updated and revision snapshot created successfully.');
