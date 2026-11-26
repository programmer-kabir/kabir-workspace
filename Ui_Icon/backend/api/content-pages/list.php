<?php
// backend/api/content-pages/list.php
// List content pages (admin gets all with stats; public gets published list)

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

$user = getAuthenticatedUser($pdo);
$isAdmin = $user && (($user['role'] ?? '') === 'admin');

if ($isAdmin) {
    // Admin list: all pages, status, timestamps, authors, revision count
    $stmt = $pdo->query("
        SELECT p.id, p.slug, p.title, p.status, p.created_at, p.updated_at,
               p.created_by, p.updated_by,
               u_creator.username AS creator_username, u_creator.full_name AS creator_name,
               u_updater.username AS updater_username, u_updater.full_name AS updater_name,
               (SELECT COUNT(*) FROM content_page_revisions r WHERE r.page_id = p.id) AS revisions_count
        FROM content_pages p
        LEFT JOIN users u_creator ON p.created_by = u_creator.id
        LEFT JOIN users u_updater ON p.updated_by = u_updater.id
        ORDER BY p.id ASC
    ");
    $pages = $stmt->fetchAll();
    jsonResponse(true, ['pages' => $pages, 'is_admin' => true], 'All pages retrieved successfully.');
} else {
    // Public list: only published pages with minimal info
    $stmt = $pdo->query("
        SELECT id, slug, title, updated_at
        FROM content_pages
        WHERE status = 'published'
        ORDER BY id ASC
    ");
    $pages = $stmt->fetchAll();
    jsonResponse(true, ['pages' => $pages, 'is_admin' => false], 'Published pages retrieved successfully.');
}
