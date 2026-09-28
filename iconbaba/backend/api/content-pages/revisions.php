<?php
// backend/api/content-pages/revisions.php
// Get revision history for a content page (Admin only)

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

$admin = requireAdmin($pdo);

$pageId = isset($_GET['page_id']) ? (int)$_GET['page_id'] : 0;
$slug = isset($_GET['slug']) ? trim($_GET['slug']) : '';
$revisionId = isset($_GET['revision_id']) ? (int)$_GET['revision_id'] : 0;

if ($revisionId > 0) {
    // Single revision detail
    $stmt = $pdo->prepare("
        SELECT r.id, r.page_id, r.title, r.content, r.meta_title, r.meta_description, r.created_at,
               u.username AS updater_username, u.full_name AS updater_name
        FROM content_page_revisions r
        LEFT JOIN users u ON r.updated_by = u.id
        WHERE r.id = :id
        LIMIT 1
    ");
    $stmt->execute([':id' => $revisionId]);
    $rev = $stmt->fetch();
    if (!$rev) {
        jsonResponse(false, null, 'Revision not found.', 404);
    }
    jsonResponse(true, $rev, 'Revision retrieved successfully.');
}

if ($pageId <= 0 && !empty($slug)) {
    $pStmt = $pdo->prepare("SELECT id FROM content_pages WHERE slug = :slug LIMIT 1");
    $pStmt->execute([':slug' => $slug]);
    $p = $pStmt->fetch();
    if ($p) {
        $pageId = (int)$p['id'];
    }
}

if ($pageId <= 0) {
    jsonResponse(false, null, 'Valid page_id or slug is required.', 400);
}

// Fetch all revisions for this page
$stmt = $pdo->prepare("
    SELECT r.id, r.page_id, r.title, r.content, r.meta_title, r.meta_description, r.created_at,
           u.username AS updater_username, u.full_name AS updater_name
    FROM content_page_revisions r
    LEFT JOIN users u ON r.updated_by = u.id
    WHERE r.page_id = :page_id
    ORDER BY r.created_at DESC, r.id DESC
");
$stmt->execute([':page_id' => $pageId]);
$revisions = $stmt->fetchAll();

jsonResponse(true, ['page_id' => $pageId, 'revisions' => $revisions], 'Revisions retrieved successfully.');
