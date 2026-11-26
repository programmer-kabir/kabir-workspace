<?php
// backend/api/admin/favorites/list.php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';

$admin = requireAdmin($pdo);

// 1. Most favorited icons (top 10)
$topIconsStmt = $pdo->query("
    SELECT i.id, i.name, i.slug, i.favorites_count, i.downloads_count, c.name AS category_name,
           iv.svg_content
    FROM icons i
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN icon_variants iv ON i.id = iv.icon_id AND iv.style = 'outlined'
    ORDER BY i.favorites_count DESC, i.id DESC
    LIMIT 10
");
$topIcons = $topIconsStmt->fetchAll(PDO::FETCH_ASSOC);

// 2. Recent favorite activity
$page = max(1, (int)($_GET['page'] ?? 1));
$limit = max(1, min(100, (int)($_GET['limit'] ?? 20)));
$offset = ($page - 1) * $limit;

$totalStmt = $pdo->query("SELECT COUNT(*) FROM favorites");
$total = (int)$totalStmt->fetchColumn();

$recentStmt = $pdo->prepare("
    SELECT 
        f.id, f.created_at,
        u.id AS user_id, u.username, u.email,
        i.id AS icon_id, i.name AS icon_name, i.slug AS icon_slug,
        c.name AS category_name,
        iv.svg_content
    FROM favorites f
    JOIN icons i ON f.icon_id = i.id
    JOIN users u ON f.user_id = u.id
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN icon_variants iv ON i.id = iv.icon_id AND iv.style = 'outlined'
    ORDER BY f.created_at DESC
    LIMIT {$limit} OFFSET {$offset}
");
$recentStmt->execute();
$recent = $recentStmt->fetchAll(PDO::FETCH_ASSOC);

jsonResponse(true, [
    'top_icons' => $topIcons,
    'recent' => $recent,
    'pagination' => [
        'page' => $page,
        'limit' => $limit,
        'total' => $total,
        'total_pages' => ceil($total / $limit)
    ]
], 'Admin favorites monitoring data retrieved successfully.');
