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
$packParam = isset($_GET['pack']) ? trim($_GET['pack']) : '';
$style = isset($_GET['style']) ? strtolower(trim($_GET['style'])) : 'outlined';
if (empty($style)) {
    $style = 'outlined';
}

$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$limit = isset($_GET['limit']) ? min(48, max(12, (int)$_GET['limit'])) : 48;
$offset = ($page - 1) * $limit;

$params = [':style' => $style];
$whereConditions = ["i.status = 'published'"];

// Category filter
if (!empty($categorySlug) && strtolower($categorySlug) !== 'all') {
    $whereConditions[] = "c.slug = :category";
    $params[':category'] = $categorySlug;
}

// Pack filter (slug or id)
if (!empty($packParam) && strtolower($packParam) !== 'all') {
    if (is_numeric($packParam)) {
        $whereConditions[] = "i.pack_id = :pack_id";
        $params[':pack_id'] = (int)$packParam;
    } else {
        $whereConditions[] = "p.slug = :pack_slug";
        $params[':pack_slug'] = $packParam;
    }
}

// Search filter
if (!empty($search)) {
    $whereConditions[] = "(i.name LIKE :search1 OR i.tags LIKE :search2 OR c.name LIKE :search3 OR p.name LIKE :search4)";
    $searchTerm = '%' . $search . '%';
    $params[':search1'] = $searchTerm;
    $params[':search2'] = $searchTerm;
    $params[':search3'] = $searchTerm;
    $params[':search4'] = $searchTerm;
}

// Tier filter
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

$whereSql = 'WHERE ' . implode(' AND ', $whereConditions);

// Count total matching icons
$countQuery = "
    SELECT COUNT(DISTINCT i.id)
    FROM icons i
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN packs p ON i.pack_id = p.id
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
        i.pack_id,
        p.name AS pack_name,
        p.slug AS pack_slug,
        c.name AS category_name,
        c.slug AS category_slug,
        i.tags,
        i.downloads_count,
        i.favorites_count,
        iv.style,
        iv.svg_content,
        iv.is_multicolor
    FROM icons i
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN packs p ON i.pack_id = p.id
    INNER JOIN icon_variants iv ON i.id = iv.icon_id AND iv.style = :style
    {$whereSql}
    ORDER BY i.sort_order ASC, i.name ASC
    LIMIT {$limit} OFFSET {$offset}
";

$dataStmt = $pdo->prepare($dataQuery);
$dataStmt->execute($params);
$icons = $dataStmt->fetchAll(PDO::FETCH_ASSOC);

$formatted = array_map(function($icon) {
    return [
        'id' => (int)$icon['id'],
        'name' => $icon['name'],
        'slug' => $icon['slug'],
        'category' => $icon['category_name'] ?: 'General',
        'category_slug' => $icon['category_slug'] ?: 'general',
        'pack_id' => $icon['pack_id'] ? (int)$icon['pack_id'] : null,
        'pack_name' => $icon['pack_name'] ?? null,
        'pack_slug' => $icon['pack_slug'] ?? null,
        'tags' => !empty($icon['tags']) ? explode(',', $icon['tags']) : [],
        'downloads_count' => (int)$icon['downloads_count'],
        'favorites_count' => (int)$icon['favorites_count'],
        'style' => $icon['style'],
        'is_premium' => (bool)$icon['is_premium'],
        'is_multicolor' => (bool)$icon['is_multicolor'],
        'v_data' => obfuscateSvgPayload($icon['svg_content'])
    ];
}, $icons);

$totalPages = $limit > 0 ? (int)ceil($total / $limit) : 1;

jsonResponse(true, [
    'icons' => $formatted,
    'pagination' => [
        'total' => $total,
        'page' => $page,
        'limit' => $limit,
        'total_pages' => $totalPages
    ]
]);
