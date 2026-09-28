<?php
// backend/api/admin/downloads/list.php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';

$admin = requireAdmin($pdo);

// 1. Statistics
$totalDownloads = (int)$pdo->query("SELECT COUNT(*) FROM downloads")->fetchColumn();
$svgDownloads = (int)$pdo->query("SELECT COUNT(*) FROM downloads WHERE format = 'svg'")->fetchColumn();
$pngDownloads = (int)$pdo->query("SELECT COUNT(*) FROM downloads WHERE format = 'png'")->fetchColumn();
$todayDownloads = (int)$pdo->query("SELECT COUNT(*) FROM downloads WHERE DATE(created_at) = CURDATE()")->fetchColumn();

// Top 5 downloaded icons
$topStmt = $pdo->query("
    SELECT i.id, i.name, i.slug, i.downloads_count, c.name AS category_name,
           iv.svg_content
    FROM icons i
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN icon_variants iv ON i.id = iv.icon_id AND iv.style = 'outlined'
    ORDER BY i.downloads_count DESC, i.id DESC
    LIMIT 5
");
$topIcons = $topStmt->fetchAll(PDO::FETCH_ASSOC);

// 2. Paginated download log
$page = max(1, (int)($_GET['page'] ?? 1));
$limit = max(1, min(100, (int)($_GET['limit'] ?? 20)));
$offset = ($page - 1) * $limit;

$totalStmt = $pdo->query("SELECT COUNT(*) FROM downloads");
$total = (int)$totalStmt->fetchColumn();

$logStmt = $pdo->prepare("
    SELECT 
        d.id, d.format, d.size, d.created_at,
        i.id AS icon_id, i.name AS icon_name, i.slug AS icon_slug,
        u.id AS user_id, u.username, u.email,
        iv.svg_content
    FROM downloads d
    JOIN icons i ON d.icon_id = i.id
    LEFT JOIN users u ON d.user_id = u.id
    LEFT JOIN icon_variants iv ON i.id = iv.icon_id AND iv.style = 'outlined'
    ORDER BY d.created_at DESC
    LIMIT {$limit} OFFSET {$offset}
");
$logStmt->execute();
$logs = $logStmt->fetchAll(PDO::FETCH_ASSOC);

jsonResponse(true, [
    'stats' => [
        'total' => $totalDownloads,
        'svg' => $svgDownloads,
        'png' => $pngDownloads,
        'today' => $todayDownloads,
    ],
    'top_icons' => $topIcons,
    'items' => $logs,
    'pagination' => [
        'page' => $page,
        'limit' => $limit,
        'total' => $total,
        'total_pages' => ceil($total / $limit)
    ]
], 'Admin download logs retrieved successfully.');
