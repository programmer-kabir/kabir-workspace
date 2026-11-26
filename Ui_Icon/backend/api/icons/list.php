<?php
// backend/api/icons/list.php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/rate_limit.php';
require_once __DIR__ . '/../../helpers/vector_guard.php';

// Layer 1 Security: IP-based Rate Limiter (90 req / min) to prevent bulk scrapers
enforceRateLimit($pdo, 'icons_list_api', 90, 60);

$categorySlug = isset($_GET['category']) ? trim($_GET['category']) : '';
$style = isset($_GET['style']) ? strtolower(trim($_GET['style'])) : 'outlined';
if ($style !== 'filled' && $style !== 'outlined') {
    $style = 'outlined';
}

$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
// Layer 1 Security: Strict pagination limit cap (maximum 48 icons per request)
$limit = isset($_GET['limit']) ? min(48, max(12, (int)$_GET['limit'])) : 48;
$offset = ($page - 1) * $limit;

$params = [':style' => $style];
$whereConditions = ["i.status = 'published'"];

// Category filter
if (!empty($categorySlug) && strtolower($categorySlug) !== 'all') {
    $whereConditions[] = "c.slug = :category";
    $params[':category'] = $categorySlug;
}


// Search filter
if (!empty($search)) {
    $whereConditions[] = "(i.name LIKE :search1 OR i.tags LIKE :search2 OR c.name LIKE :search3)";
    $searchTerm = '%' . $search . '%';
    $params[':search1'] = $searchTerm;
    $params[':search2'] = $searchTerm;
    $params[':search3'] = $searchTerm;
}

$tier = isset($_GET['tier']) ? strtolower(trim($_GET['tier'])) : (isset($_GET['pricing']) ? strtolower(trim($_GET['pricing'])) : 'all');
if ($tier === 'free') {
    $whereConditions[] = "i.is_premium = 0";
} elseif ($tier === 'pro' || $tier === 'premium') {
    $whereConditions[] = "i.is_premium = 1";
}

// Filled filter: only return authentic filled icons (exclude stroke-only fallbacks)
if ($style === 'filled') {
    $whereConditions[] = "iv.svg_content NOT LIKE '%fill=\"none\"%stroke=\"currentColor\"%'";
}

$whereSql = '';
if (!empty($whereConditions)) {
    $whereSql = 'WHERE ' . implode(' AND ', $whereConditions);
}

// Count total matching icons
$countQuery = "
    SELECT COUNT(DISTINCT i.id)
    FROM icons i
    LEFT JOIN categories c ON i.category_id = c.id
    INNER JOIN icon_variants iv ON i.id = iv.icon_id AND iv.style = :style
    {$whereSql}
";
$countStmt = $pdo->prepare($countQuery);
$countStmt->execute($params);
$total = (int)$countStmt->fetchColumn();

// Fetch paginated icons with SVG content for the requested style
$dataQuery = "
    SELECT 
        i.id,
        i.name,
        i.slug,
        i.is_premium,
        c.name AS category_name,
        c.slug AS category_slug,
        i.tags,
        i.downloads_count,
        i.favorites_count,
        iv.style,
        iv.svg_content
    FROM icons i
    LEFT JOIN categories c ON i.category_id = c.id
    INNER JOIN icon_variants iv ON i.id = iv.icon_id AND iv.style = :style
    {$whereSql}
    ORDER BY i.name ASC
    LIMIT {$limit} OFFSET {$offset}
";

$dataStmt = $pdo->prepare($dataQuery);
$dataStmt->execute($params);
$icons = $dataStmt->fetchAll();

$formatted = array_map(function($icon) {
    return [
        'id' => (int)$icon['id'],
        'name' => $icon['name'],
        'slug' => $icon['slug'],
        'category' => $icon['category_name'] ?: 'Misc',
        'category_slug' => $icon['category_slug'] ?: 'misc',
        'tags' => $icon['tags'] ? explode(',', $icon['tags']) : [],
        'downloads_count' => (int)$icon['downloads_count'],
        'favorites_count' => (int)$icon['favorites_count'],
        'style' => $icon['style'],
        'is_premium' => (bool)$icon['is_premium'],
        // Layer 2 Security: Obfuscated vector data (prevents raw SVG scraping from Network tab)
        'v_data' => obfuscateSvgPayload($icon['svg_content'])
    ];
}, $icons);

jsonResponse(true, [
    'icons' => $formatted,
    'pagination' => [
        'total' => $total,
        'page' => $page,
        'limit' => $limit,
        'total_pages' => ceil($total / $limit)
    ]
]);
