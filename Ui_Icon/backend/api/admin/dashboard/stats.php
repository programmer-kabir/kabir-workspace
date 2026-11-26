<?php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';

$admin = requireAdmin($pdo);

// Counts
$totalIcons = (int)$pdo->query("SELECT COUNT(*) FROM icons")->fetchColumn();
$publishedIcons = (int)$pdo->query("SELECT COUNT(*) FROM icons WHERE status = 'published'")->fetchColumn();
$draftIcons = (int)$pdo->query("SELECT COUNT(*) FROM icons WHERE status = 'draft'")->fetchColumn();
$totalCategories = (int)$pdo->query("SELECT COUNT(*) FROM categories")->fetchColumn();
$totalUsers = (int)$pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
$totalDownloads = (int)$pdo->query("SELECT COUNT(*) FROM downloads")->fetchColumn();
$totalFavorites = (int)$pdo->query("SELECT COUNT(*) FROM favorites")->fetchColumn();
$totalCollections = (int)$pdo->query("SELECT COUNT(*) FROM collections")->fetchColumn();
$unreadMessages = (int)$pdo->query("SELECT COUNT(*) FROM contact_messages WHERE status = 'unread'")->fetchColumn();

// Recent 6 uploaded icons
$recentIconsStmt = $pdo->query("
    SELECT i.id, i.name, i.slug, i.status, i.created_at, c.name AS category_name,
           iv.svg_content
    FROM icons i
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN icon_variants iv ON i.id = iv.icon_id AND iv.style = 'outlined'
    ORDER BY i.created_at DESC, i.id DESC
    LIMIT 6
");
$recentIcons = $recentIconsStmt->fetchAll();

// Recent 6 downloads
$recentDownloadsStmt = $pdo->query("
    SELECT d.id, d.format, d.size, d.created_at,
           i.name AS icon_name, i.slug AS icon_slug,
           u.username, u.email
    FROM downloads d
    LEFT JOIN icons i ON d.icon_id = i.id
    LEFT JOIN users u ON d.user_id = u.id
    ORDER BY d.created_at DESC
    LIMIT 6
");
$recentDownloads = $recentDownloadsStmt->fetchAll();

// Recent 5 users
$recentUsersStmt = $pdo->query("
    SELECT u.id, u.username, u.email, u.full_name, u.status, u.created_at,
           (SELECT GROUP_CONCAT(ur.role_slug SEPARATOR ',') FROM user_roles ur WHERE ur.user_id = u.id) AS db_roles
    FROM users u
    ORDER BY u.created_at DESC
    LIMIT 5
");
$recentUsers = $recentUsersStmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($recentUsers as &$ru) {
    $uRoles = getUserRoles($ru);
    $ru['roles'] = $uRoles;
    $ru['role'] = in_array('admin', $uRoles) ? 'admin' : ($uRoles[0] ?? 'user');
    unset($ru['db_roles']);
}
unset($ru);

// Recent 10 audit logs
$recentAuditStmt = $pdo->query("
    SELECT a.id, a.action, a.entity_type, a.entity_id, a.details, a.created_at,
           u.username, u.full_name
    FROM admin_audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    ORDER BY a.created_at DESC
    LIMIT 10
");
$recentAudit = $recentAuditStmt->fetchAll();
foreach ($recentAudit as &$log) {
    if (!empty($log['details'])) {
        $log['details'] = json_decode($log['details'], true);
    }
}

jsonResponse(true, [
    'counts' => [
        'total_icons' => $totalIcons,
        'published_icons' => $publishedIcons,
        'draft_icons' => $draftIcons,
        'total_categories' => $totalCategories,
        'total_users' => $totalUsers,
        'total_downloads' => $totalDownloads,
        'total_favorites' => $totalFavorites,
        'total_collections' => $totalCollections,
        'unread_messages' => $unreadMessages,
    ],
    'recent_icons' => $recentIcons,
    'recent_downloads' => $recentDownloads,
    'recent_users' => $recentUsers,
    'recent_audit' => $recentAudit
], 'Dashboard statistics retrieved successfully.');
