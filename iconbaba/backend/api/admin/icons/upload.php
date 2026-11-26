<?php
// backend/api/admin/icons/upload.php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';
require_once __DIR__ . '/../../../helpers/svg.php';
require_once __DIR__ . '/../../../helpers/audit.php';

$admin = requireAdmin($pdo);

// Support both JSON input and multipart/form-data
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
$isJson = stripos($contentType, 'application/json') !== false;

if ($isJson) {
    $data = getJsonInput();
    $name = trim($data['name'] ?? '');
    $categoryId = (int)($data['category_id'] ?? 0);
    $packId = !empty($data['pack_id']) ? (int)$data['pack_id'] : null;
    $tags = trim($data['tags'] ?? '');
    $status = in_array($data['status'] ?? '', ['published', 'draft', 'archived']) ? $data['status'] : 'published';
    $isPremium = !empty($data['is_premium']) ? 1 : 0;
    $defaultStyle = trim($data['default_style'] ?? 'outlined');
    
    // Dynamic variants array: [{ style: 'outlined', svg: '...' }, ...] or individual keys
    $variantsInput = $data['variants'] ?? [];
    $svgOutlined = $data['svg_outlined'] ?? '';
    $svgFilled = $data['svg_filled'] ?? '';
    $svgLinealColor = $data['svg_lineal_color'] ?? '';
    $svgFlat = $data['svg_flat'] ?? '';
} else {
    $name = trim($_POST['name'] ?? '');
    $categoryId = (int)($_POST['category_id'] ?? 0);
    $packId = !empty($_POST['pack_id']) ? (int)$_POST['pack_id'] : null;
    $tags = trim($_POST['tags'] ?? '');
    $status = in_array($_POST['status'] ?? '', ['published', 'draft', 'archived']) ? $_POST['status'] : 'published';
    $isPremium = !empty($_POST['is_premium']) ? 1 : 0;
    $defaultStyle = trim($_POST['default_style'] ?? 'outlined');
    
    $variantsInput = [];
    $svgOutlined = $_POST['svg_outlined'] ?? '';
    $svgFilled = $_POST['svg_filled'] ?? '';
    $svgLinealColor = $_POST['svg_lineal_color'] ?? '';
    $svgFlat = $_POST['svg_flat'] ?? '';

    // File uploads
    if (isset($_FILES['file_outlined']) && $_FILES['file_outlined']['error'] === UPLOAD_ERR_OK) {
        $svgOutlined = file_get_contents($_FILES['file_outlined']['tmp_name']);
    }
    if (isset($_FILES['file_filled']) && $_FILES['file_filled']['error'] === UPLOAD_ERR_OK) {
        $svgFilled = file_get_contents($_FILES['file_filled']['tmp_name']);
    }
    if (isset($_FILES['file_lineal_color']) && $_FILES['file_lineal_color']['error'] === UPLOAD_ERR_OK) {
        $svgLinealColor = file_get_contents($_FILES['file_lineal_color']['tmp_name']);
    }
    if (isset($_FILES['file_flat']) && $_FILES['file_flat']['error'] === UPLOAD_ERR_OK) {
        $svgFlat = file_get_contents($_FILES['file_flat']['tmp_name']);
    }
    // Single file upload fallback
    if (empty($svgOutlined) && isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
        $style = trim($_POST['style'] ?? 'outlined');
        $fileSvg = file_get_contents($_FILES['file']['tmp_name']);
        if ($style === 'filled') {
            $svgFilled = $fileSvg;
        } elseif ($style === 'lineal-color') {
            $svgLinealColor = $fileSvg;
        } elseif ($style === 'flat') {
            $svgFlat = $fileSvg;
        } else {
            $svgOutlined = $fileSvg;
        }
    }
}

// Validation
if (empty($name)) {
    jsonResponse(false, null, 'Icon name is required.', 400);
}

if ($categoryId <= 0) {
    jsonResponse(false, null, 'Please select a valid category.', 400);
}

// Verify category exists
$catStmt = $pdo->prepare("SELECT id, name FROM categories WHERE id = :id");
$catStmt->execute([':id' => $categoryId]);
$category = $catStmt->fetch(PDO::FETCH_ASSOC);
if (!$category) {
    jsonResponse(false, null, 'Category not found.', 404);
}

// Verify pack exists if provided
if ($packId) {
    $packStmt = $pdo->prepare("SELECT id, name FROM packs WHERE id = ?");
    $packStmt->execute([$packId]);
    if (!$packStmt->fetch()) {
        $packId = null;
    }
}

// Normalize incoming variants map
$rawVariants = [];
if (!empty($variantsInput) && is_array($variantsInput)) {
    foreach ($variantsInput as $v) {
        if (!empty($v['style']) && !empty($v['svg'])) {
            $rawVariants[trim($v['style'])] = $v['svg'];
        }
    }
}
if (!empty($svgOutlined)) $rawVariants['outlined'] = $svgOutlined;
if (!empty($svgFilled)) $rawVariants['filled'] = $svgFilled;
if (!empty($svgLinealColor)) $rawVariants['lineal-color'] = $svgLinealColor;
if (!empty($svgFlat)) $rawVariants['flat'] = $svgFlat;

if (empty($rawVariants)) {
    jsonResponse(false, null, 'At least one SVG variant must be provided.', 400);
}

// Sanitize each variant according to style
$cleanedVariants = [];
foreach ($rawVariants as $st => $rawSvg) {
    $isMulti = isMultiColorStyle($st);
    $errMsg = '';
    $cleanSvg = validateAndSanitizeSvg($rawSvg, $errMsg, $isMulti);
    if ($cleanSvg === false) {
        jsonResponse(false, null, "Invalid SVG for style [{$st}]: {$errMsg}", 422);
    }
    $palette = $isMulti ? extractSvgColors($cleanSvg) : [];
    $cleanedVariants[$st] = [
        'svg' => $cleanSvg,
        'is_multicolor' => $isMulti ? 1 : 0,
        'palette' => $palette
    ];
}

// Fallback: If only outlined provided and not filled, or vice versa, fallback for monochrome
if (isset($cleanedVariants['outlined']) && !isset($cleanedVariants['filled'])) {
    $cleanedVariants['filled'] = [
        'svg' => $cleanedVariants['outlined']['svg'],
        'is_multicolor' => 0,
        'palette' => []
    ];
} elseif (isset($cleanedVariants['filled']) && !isset($cleanedVariants['outlined'])) {
    $cleanedVariants['outlined'] = [
        'svg' => $cleanedVariants['filled']['svg'],
        'is_multicolor' => 0,
        'palette' => []
    ];
}

// Generate unique slug
$slug = generateSafeSlug($pdo, $name);

try {
    $pdo->beginTransaction();

    // Insert icon
    $insertIconStmt = $pdo->prepare("
        INSERT INTO icons (name, slug, category_id, pack_id, default_style, tags, status, is_premium, downloads_count, favorites_count, created_by, created_at, updated_at)
        VALUES (:name, :slug, :category_id, :pack_id, :default_style, :tags, :status, :is_premium, 0, 0, :created_by, NOW(), NOW())
    ");
    $insertIconStmt->execute([
        ':name' => $name,
        ':slug' => $slug,
        ':category_id' => $categoryId,
        ':pack_id' => $packId,
        ':default_style' => $defaultStyle,
        ':tags' => $tags,
        ':status' => $status,
        ':is_premium' => $isPremium,
        ':created_by' => $admin['id']
    ]);
    $iconId = (int)$pdo->lastInsertId();

    // Insert variants
    $insertVarStmt = $pdo->prepare("
        INSERT INTO icon_variants (icon_id, style, is_multicolor, palette_json, svg_content)
        VALUES (:icon_id, :style, :is_multicolor, :palette_json, :svg_content)
    ");

    foreach ($cleanedVariants as $st => $vData) {
        $insertVarStmt->execute([
            ':icon_id' => $iconId,
            ':style' => $st,
            ':is_multicolor' => $vData['is_multicolor'],
            ':palette_json' => !empty($vData['palette']) ? json_encode($vData['palette']) : null,
            ':svg_content' => $vData['svg']
        ]);
    }

    // Update category icon count
    $pdo->prepare("
        UPDATE categories 
        SET icon_count = (SELECT COUNT(*) FROM icons WHERE category_id = ? AND status = 'published')
        WHERE id = ?
    ")->execute([$categoryId, $categoryId]);

    // Update pack icon count if pack is linked
    if ($packId) {
        $pdo->prepare("
            UPDATE packs 
            SET icon_count = (SELECT COUNT(*) FROM icons WHERE pack_id = ? AND status = 'published')
            WHERE id = ?
        ")->execute([$packId, $packId]);
    }

    // Audit log
    logAdminAction($pdo, $admin['id'], 'upload_icon', 'icon', $iconId, [
        'name' => $name,
        'slug' => $slug,
        'category_id' => $categoryId,
        'pack_id' => $packId,
        'status' => $status
    ]);

    $pdo->commit();

    jsonResponse(true, [
        'id' => $iconId,
        'name' => $name,
        'slug' => $slug,
        'category_id' => $categoryId,
        'category_name' => $category['name'],
        'pack_id' => $packId,
        'status' => $status,
        'tags' => $tags,
        'styles' => array_keys($cleanedVariants)
    ], 'Icon uploaded and published successfully.', 201);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(false, null, 'Failed to save icon: ' . $e->getMessage(), 500);
}
