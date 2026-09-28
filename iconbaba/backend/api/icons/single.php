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
        c.name AS category_name,
        c.slug AS category_slug,
        i.tags,
        i.downloads_count,
        i.favorites_count,
        i.created_at
    FROM icons i
    LEFT JOIN categories c ON i.category_id = c.id
    WHERE {$condition}
    LIMIT 1
";

$stmt = $pdo->prepare($query);
$stmt->execute($params);
$icon = $stmt->fetch();

if (!$icon) {
    jsonResponse(false, null, 'Icon not found', 404);
}

// Fetch all style variants (both outlined and filled)
$varStmt = $pdo->prepare("SELECT style, svg_content FROM icon_variants WHERE icon_id = :id");
$varStmt->execute([':id' => $icon['id']]);
$variantsRows = $varStmt->fetchAll();

$variants = [];
$vVariants = [];
foreach ($variantsRows as $row) {
    // Exclude dummy duplicate of outline SVG from filled style
    if ($row['style'] === 'filled' && (strpos($row['svg_content'], 'fill="none"') !== false && strpos($row['svg_content'], 'stroke="currentColor"') !== false)) {
        continue;
    }
    $vVariants[$row['style']] = obfuscateSvgPayload($row['svg_content']);
}

jsonResponse(true, [
    'id' => (int)$icon['id'],
    'name' => $icon['name'],
    'slug' => $icon['slug'],
    'category' => $icon['category_name'] ?: 'Misc',
    'category_slug' => $icon['category_slug'] ?: 'misc',
    'tags' => $icon['tags'] ? explode(',', $icon['tags']) : [],
    'downloads_count' => (int)$icon['downloads_count'],
    'favorites_count' => (int)$icon['favorites_count'],
    'is_premium' => (bool)$icon['is_premium'],
    'v_variants' => $vVariants
]);
