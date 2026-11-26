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
    $tags = trim($data['tags'] ?? '');
    $status = in_array($data['status'] ?? '', ['published', 'draft', 'archived']) ? $data['status'] : 'published';
    $svgOutlined = $data['svg_outlined'] ?? '';
    $svgFilled = $data['svg_filled'] ?? '';
} else {
    $name = trim($_POST['name'] ?? '');
    $categoryId = (int)($_POST['category_id'] ?? 0);
    $tags = trim($_POST['tags'] ?? '');
    $status = in_array($_POST['status'] ?? '', ['published', 'draft', 'archived']) ? $_POST['status'] : 'published';
    
    // Check if raw strings were sent in POST
    $svgOutlined = $_POST['svg_outlined'] ?? '';
    $svgFilled = $_POST['svg_filled'] ?? '';

    // Check file uploads
    if (isset($_FILES['file_outlined']) && $_FILES['file_outlined']['error'] === UPLOAD_ERR_OK) {
        $svgOutlined = file_get_contents($_FILES['file_outlined']['tmp_name']);
    }
    if (isset($_FILES['file_filled']) && $_FILES['file_filled']['error'] === UPLOAD_ERR_OK) {
        $svgFilled = file_get_contents($_FILES['file_filled']['tmp_name']);
    }
    // Single file upload fallback
    if (empty($svgOutlined) && isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
        $style = trim($_POST['style'] ?? 'outlined');
        if ($style === 'filled') {
            $svgFilled = file_get_contents($_FILES['file']['tmp_name']);
        } else {
            $svgOutlined = file_get_contents($_FILES['file']['tmp_name']);
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
$category = $catStmt->fetch();
if (!$category) {
    jsonResponse(false, null, 'Category not found.', 404);
}

// At least one variant must be provided
if (empty($svgOutlined) && empty($svgFilled)) {
    jsonResponse(false, null, 'At least one SVG variant (outlined or filled) must be provided.', 400);
}

// Validate and sanitize SVGs
$cleanOutlined = null;
$cleanFilled = null;

if (!empty($svgOutlined)) {
    $errMsg = '';
    $cleanOutlined = validateAndSanitizeSvg($svgOutlined, $errMsg);
    if ($cleanOutlined === false) {
        jsonResponse(false, null, 'Invalid outlined SVG: ' . $errMsg, 422);
    }
}

if (!empty($svgFilled)) {
    $errMsg = '';
    $cleanFilled = validateAndSanitizeSvg($svgFilled, $errMsg);
    if ($cleanFilled === false) {
        jsonResponse(false, null, 'Invalid filled SVG: ' . $errMsg, 422);
    }
}

// If one variant is missing, fallback to the other so both outlined & filled always render
if ($cleanOutlined && !$cleanFilled) {
    $cleanFilled = $cleanOutlined;
} elseif ($cleanFilled && !$cleanOutlined) {
    $cleanOutlined = $cleanFilled;
}

// Generate unique slug
$slug = generateSafeSlug($pdo, $name);

try {
    $pdo->beginTransaction();

    // Insert icon
    $insertIconStmt = $pdo->prepare("
        INSERT INTO icons (name, slug, category_id, tags, status, downloads_count, favorites_count, created_by, created_at, updated_at)
        VALUES (:name, :slug, :category_id, :tags, :status, 0, 0, :created_by, NOW(), NOW())
    ");
    $insertIconStmt->execute([
        ':name' => $name,
        ':slug' => $slug,
        ':category_id' => $categoryId,
        ':tags' => $tags,
        ':status' => $status,
        ':created_by' => $admin['id']
    ]);
    $iconId = (int)$pdo->lastInsertId();

    // Insert variants
    $insertVarStmt = $pdo->prepare("
        INSERT INTO icon_variants (icon_id, style, svg_content)
        VALUES (:icon_id, :style, :svg_content)
    ");

    if ($cleanOutlined) {
        $insertVarStmt->execute([
            ':icon_id' => $iconId,
            ':style' => 'outlined',
            ':svg_content' => $cleanOutlined
        ]);
    }

    if ($cleanFilled) {
        $insertVarStmt->execute([
            ':icon_id' => $iconId,
            ':style' => 'filled',
            ':svg_content' => $cleanFilled
        ]);
    }


    // Update category icon count
    $updateCatStmt = $pdo->prepare("
        UPDATE categories 
        SET icon_count = (SELECT COUNT(*) FROM icons WHERE category_id = ? AND status = 'published')
        WHERE id = ?
    ");
    $updateCatStmt->execute([$categoryId, $categoryId]);

    // Audit log
    logAdminAction($pdo, $admin['id'], 'upload_icon', 'icon', $iconId, [
        'name' => $name,
        'slug' => $slug,
        'category_id' => $categoryId,
        'category_name' => $category['name'],
        'status' => $status
    ]);

    $pdo->commit();

    jsonResponse(true, [
        'id' => $iconId,
        'name' => $name,
        'slug' => $slug,
        'category_id' => $categoryId,
        'category_name' => $category['name'],
        'status' => $status,
        'tags' => $tags,
        'variants' => [
            'outlined' => $cleanOutlined,
            'filled' => $cleanFilled
        ]
    ], 'Icon uploaded and published successfully.', 201);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(false, null, 'Failed to save icon: ' . $e->getMessage(), 500);
}
