<?php
// backend/api/content-pages/single.php
// Get single content page by slug or id

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

$slug = isset($_GET['slug']) ? trim($_GET['slug']) : '';
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if (empty($slug) && $id <= 0) {
    jsonResponse(false, null, 'Page slug or ID is required.', 400);
}

// Check if requester is an admin
$user = getAuthenticatedUser($pdo);
$isAdmin = $user && (($user['role'] ?? '') === 'admin');

if (!empty($slug)) {
    $sql = "
        SELECT p.id, p.slug, p.title, p.content, p.meta_title, p.meta_description, p.status,
               p.created_at, p.updated_at, p.created_by, p.updated_by,
               u_creator.username AS creator_username, u_creator.full_name AS creator_name,
               u_updater.username AS updater_username, u_updater.full_name AS updater_name
        FROM content_pages p
        LEFT JOIN users u_creator ON p.created_by = u_creator.id
        LEFT JOIN users u_updater ON p.updated_by = u_updater.id
        WHERE p.slug = :slug " . (!$isAdmin ? "AND p.status = 'published'" : "") . "
        LIMIT 1
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':slug' => $slug]);
} else {
    $sql = "
        SELECT p.id, p.slug, p.title, p.content, p.meta_title, p.meta_description, p.status,
               p.created_at, p.updated_at, p.created_by, p.updated_by,
               u_creator.username AS creator_username, u_creator.full_name AS creator_name,
               u_updater.username AS updater_username, u_updater.full_name AS updater_name
        FROM content_pages p
        LEFT JOIN users u_creator ON p.created_by = u_creator.id
        LEFT JOIN users u_updater ON p.updated_by = u_updater.id
        WHERE p.id = :id " . (!$isAdmin ? "AND p.status = 'published'" : "") . "
        LIMIT 1
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $id]);
}

$page = $stmt->fetch();

if (!$page) {
    jsonResponse(false, null, 'Page not found or not published.', 404);
}

jsonResponse(true, $page, 'Page retrieved successfully.');
