<?php
// backend/api/icons/single.php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/rate_limit.php';
require_once __DIR__ . '/../../helpers/vector_guard.php';

// Rate limit: 120 req / min for single icon requests
enforceRateLimit($pdo, 'icons_single_api', 120, 60);

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$name = isset($_GET['name']) ? trim($_GET['name']) : '';

if ($id <= 0 && empty($name)) {
    jsonResponse(false, null, 'Icon ID or name is required', 400);
}

if ($id > 0) {
    $condition = 'i.id = :id';
    $params = [':id' => $id];
} else {
    $condition = 'i.slug = :slug OR i.name = :name';
    $params = [':slug' => $name, ':name' => $name];
}

$query = "
    SELECT 
        i.id,
        i.name,
        i.slug,
        i.is_premium,
        i.pack_id,
        i.default_style,
        p.name AS pack_name,
        p.slug AS pack_slug,
        p.icon_count AS pack_icon_count,
        c.name AS category_name,
        c.slug AS category_slug,
        i.tags,
        i.downloads_count,
        i.favorites_count,
        i.created_at
    FROM icons i
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN packs p ON i.pack_id = p.id
    WHERE {$condition}
    LIMIT 1
";

$stmt = $pdo->prepare($query);
$stmt->execute($params);
$icon = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$icon) {
    jsonResponse(false, null, 'Icon not found', 404);
}

// Fetch all style variants (outlined, filled, lineal-color, flat, gradient, etc.)
$varStmt = $pdo->prepare("SELECT style, is_multicolor, palette_json, svg_content FROM icon_variants WHERE icon_id = :id");
$varStmt->execute([':id' => $icon['id']]);
$variantsRows = $varStmt->fetchAll(PDO::FETCH_ASSOC);

$vVariants = [];
$stylesMeta = [];
foreach ($variantsRows as $row) {
    // Exclude dummy duplicate of outline SVG from filled style if fake
    if ($row['style'] === 'filled' && (strpos($row['svg_content'], 'fill="none"') !== false && strpos($row['svg_content'], 'stroke="currentColor"') !== false)) {
        continue;
    }
    $st = $row['style'];
    $vVariants[$st] = obfuscateSvgPayload($row['svg_content']);
    $stylesMeta[$st] = [
        'is_multicolor' => (bool)$row['is_multicolor'],
        'palette' => !empty($row['palette_json']) ? json_decode($row['palette_json'], true) : []
    ];
}

// Get other icons from this pack for "More from this pack" section
$packIcons = [];
if (!empty($icon['pack_id'])) {
    $moreStmt = $pdo->prepare("
        SELECT i.id, i.name, i.slug, iv.svg_content, iv.style
        FROM icons i
        LEFT JOIN icon_variants iv ON i.id = iv.icon_id AND iv.style = :style
        WHERE i.pack_id = :pack_id AND i.id != :cur_id AND i.status = 'published'
        ORDER BY i.sort_order ASC, i.id ASC
        LIMIT 12
    ");
    $moreStmt->execute([
        ':style' => $icon['default_style'] ?: 'outlined',
        ':pack_id' => $icon['pack_id'],
        ':cur_id' => $icon['id']
    ]);
    while ($mRow = $moreStmt->fetch(PDO::FETCH_ASSOC)) {
        $packIcons[] = [
            'id' => (int)$mRow['id'],
            'name' => $mRow['name'],
            'slug' => $mRow['slug'],
            'v_data' => obfuscateSvgPayload($mRow['svg_content'] ?? '')
        ];
    }
}

jsonResponse(true, [
    'id' => (int)$icon['id'],
    'name' => $icon['name'],
    'slug' => $icon['slug'],
    'category' => $icon['category_name'] ?: 'General',
    'category_slug' => $icon['category_slug'] ?: 'general',
    'pack_id' => $icon['pack_id'] ? (int)$icon['pack_id'] : null,
    'pack_name' => $icon['pack_name'] ?? null,
    'pack_slug' => $icon['pack_slug'] ?? null,
    'pack_icon_count' => $icon['pack_icon_count'] ? (int)$icon['pack_icon_count'] : 0,
    'default_style' => $icon['default_style'] ?: 'outlined',
    'tags' => !empty($icon['tags']) ? explode(',', $icon['tags']) : [],
    'downloads_count' => (int)$icon['downloads_count'],
    'favorites_count' => (int)$icon['favorites_count'],
    'is_premium' => (bool)$icon['is_premium'],
    'v_variants' => $vVariants,
    'styles_meta' => $stylesMeta,
    'pack_icons' => $packIcons
]);
