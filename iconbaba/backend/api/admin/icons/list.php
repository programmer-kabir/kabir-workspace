<?php
// backend/api/admin/icons/list.php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';

$admin = requireAdmin($pdo);

// Query params
$page = max(1, (int)($_GET['page'] ?? 1));
$limit = max(1, min(100, (int)($_GET['limit'] ?? 24)));
$offset = ($page - 1) * $limit;

$search = trim($_GET['q'] ?? '');
$categoryId = isset($_GET['category_id']) && $_GET['category_id'] !== '' ? (int)$_GET['category_id'] : null;
$categorySlug = trim($_GET['category'] ?? '');
$status = trim($_GET['status'] ?? ''); // 'all', 'published', 'draft', 'archived'
$style = trim($_GET['style'] ?? ''); // 'outlined', 'filled'
$sortBy = trim($_GET['sort'] ?? 'newest'); // 'newest', 'oldest', 'name_asc', 'name_desc', 'downloads', 'favorites'

// Build WHERE clause
$where = [];
$params = [];

if (!empty($search)) {
    $where[] = "(i.name LIKE :search OR i.tags LIKE :search OR i.slug LIKE :search)";
    $params[':search'] = '%' . $search . '%';
}

if ($categoryId !== null && $categoryId > 0) {
    $where[] = "i.category_id = :category_id";
    $params[':category_id'] = $categoryId;
} elseif (!empty($categorySlug) && $categorySlug !== 'all') {
    $where[] = "c.slug = :category_slug";
    $params[':category_slug'] = $categorySlug;
}

if (!empty($status) && in_array($status, ['published', 'draft', 'archived'])) {
    $where[] = "i.status = :status";
    $params[':status'] = $status;
}

$tier = trim($_GET['tier'] ?? '');
if ($tier === 'free') {
    $where[] = "i.is_premium = 0";
} elseif ($tier === 'pro' || $tier === 'premium') {
    $where[] = "i.is_premium = 1";
}

$whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

// Sort order
$orderClause = 'ORDER BY i.created_at DESC, i.id DESC';
switch ($sortBy) {
    case 'oldest':
        $orderClause = 'ORDER BY i.created_at ASC, i.id ASC';
        break;
    case 'name_asc':
        $orderClause = 'ORDER BY i.name ASC';
        break;
    case 'name_desc':
        $orderClause = 'ORDER BY i.name DESC';
        break;
    case 'downloads':
        $orderClause = 'ORDER BY i.downloads_count DESC, i.id DESC';
        break;
    case 'favorites':
        $orderClause = 'ORDER BY i.favorites_count DESC, i.id DESC';
        break;
    default:
        $orderClause = 'ORDER BY i.created_at DESC, i.id DESC';
        break;
}

// Total count query
$countSql = "
    SELECT COUNT(DISTINCT i.id) 
    FROM icons i
    LEFT JOIN categories c ON i.category_id = c.id
    {$whereClause}
";
$countStmt = $pdo->prepare($countSql);
$countStmt->execute($params);
$total = (int)$countStmt->fetchColumn();
$totalPages = ceil($total / $limit);

// Main items query
$itemsSql = "
    SELECT 
        i.id, i.name, i.slug, i.category_id, i.tags, i.status, i.is_premium,
        i.downloads_count, i.favorites_count, i.created_at, i.updated_at, i.created_by,
        c.name AS category_name, c.slug AS category_slug,
        u.username AS creator_username
    FROM icons i
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN users u ON i.created_by = u.id
    {$whereClause}
    {$orderClause}
    LIMIT {$limit} OFFSET {$offset}
";

$itemsStmt = $pdo->prepare($itemsSql);
$itemsStmt->execute($params);
$icons = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

if (!empty($icons)) {
    $iconIds = array_column($icons, 'id');
    $placeholders = implode(',', array_fill(0, count($iconIds), '?'));
    
    // Fetch variants
    $varStmt = $pdo->prepare("
        SELECT icon_id, style, svg_content 
        FROM icon_variants 
        WHERE icon_id IN ({$placeholders})
    ");
    $varStmt->execute($iconIds);
    $variantsRaw = $varStmt->fetchAll(PDO::FETCH_ASSOC);
    
    $variantsMap = [];
    foreach ($variantsRaw as $v) {
        $variantsMap[$v['icon_id']][$v['style']] = $v['svg_content'];
    }
    
    foreach ($icons as &$icon) {
        $icon['is_premium'] = (bool)($icon['is_premium'] ?? false);
        $icon['variants'] = $variantsMap[$icon['id']] ?? [];
        $icon['tags_array'] = !empty($icon['tags']) ? array_filter(array_map('trim', explode(',', $icon['tags']))) : [];
    }
}

jsonResponse(true, [
    'items' => $icons,
    'pagination' => [
        'page' => $page,
        'limit' => $limit,
        'total' => $total,
        'total_pages' => $totalPages,
        'has_next' => $page < $totalPages,
        'has_prev' => $page > 1,
    ]
], 'Admin icons retrieved successfully.');
