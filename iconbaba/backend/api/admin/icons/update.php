<?php
// backend/api/admin/icons/update.php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';
require_once __DIR__ . '/../../../helpers/svg.php';
require_once __DIR__ . '/../../../helpers/audit.php';

$admin = requireAdmin($pdo);

$data = getJsonInput();
$id = (int)($data['id'] ?? 0);

if ($id <= 0) {
    jsonResponse(false, null, 'Valid Icon ID is required.', 400);
}

// Fetch existing icon
$stmt = $pdo->prepare("SELECT * FROM icons WHERE id = :id");
$stmt->execute([':id' => $id]);
$existing = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$existing) {
    jsonResponse(false, null, 'Icon not found.', 404);
}

$oldCategoryId = (int)$existing['category_id'];
$name = isset($data['name']) ? trim($data['name']) : $existing['name'];
$tags = isset($data['tags']) ? trim($data['tags']) : $existing['tags'];
$newCategoryId = isset($data['category_id']) ? (int)$data['category_id'] : $oldCategoryId;
$status = isset($data['status']) && in_array($data['status'], ['published', 'draft', 'archived']) 
    ? $data['status'] 
    : $existing['status'];
$isPremium = isset($data['is_premium']) 
    ? ((int)(bool)$data['is_premium']) 
    : (int)($existing['is_premium'] ?? 0);

// Slug validation or regeneration
if (!empty($data['slug'])) {
    $slugCandidate = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $data['slug']), '-'));
    $slug = generateSafeSlug($pdo, $slugCandidate, $id);
} else {
    $slug = $existing['slug'];
}

// Check category exists
if ($newCategoryId !== $oldCategoryId) {
    $catCheck = $pdo->prepare("SELECT id FROM categories WHERE id = :id");
    $catCheck->execute([':id' => $newCategoryId]);
    if (!$catCheck->fetch()) {
        jsonResponse(false, null, 'Selected category does not exist.', 400);
    }
}

// Variants
$updateOutlined = isset($data['svg_outlined']) && is_string($data['svg_outlined']);
$updateFilled = isset($data['svg_filled']) && is_string($data['svg_filled']);

$cleanOutlined = null;
$cleanFilled = null;

if ($updateOutlined) {
    $errMsg = '';
    $cleanOutlined = validateAndSanitizeSvg($data['svg_outlined'], $errMsg);
    if ($cleanOutlined === false) {
        jsonResponse(false, null, 'Invalid outlined SVG: ' . $errMsg, 422);
    }
}

if ($updateFilled) {
    $errMsg = '';
    $cleanFilled = validateAndSanitizeSvg($data['svg_filled'], $errMsg);
    if ($cleanFilled === false) {
        jsonResponse(false, null, 'Invalid filled SVG: ' . $errMsg, 422);
    }
}

try {
    $pdo->beginTransaction();

    // Update icon record
    $updateStmt = $pdo->prepare("
        UPDATE icons 
        SET name = :name, slug = :slug, category_id = :category_id, tags = :tags, status = :status, is_premium = :is_premium, updated_at = NOW()
        WHERE id = :id
    ");
    $updateStmt->execute([
        ':name' => $name,
        ':slug' => $slug,
        ':category_id' => $newCategoryId,
        ':tags' => $tags,
        ':status' => $status,
        ':is_premium' => $isPremium,
        ':id' => $id
    ]);

    // Update variants if provided
    if ($updateOutlined && $cleanOutlined !== null) {
        $checkVar = $pdo->prepare("SELECT id FROM icon_variants WHERE icon_id = :icon_id AND style = 'outlined'");
        $checkVar->execute([':icon_id' => $id]);
        if ($checkVar->fetch()) {
            $pdo->prepare("UPDATE icon_variants SET svg_content = :svg WHERE icon_id = :icon_id AND style = 'outlined'")
                ->execute([':svg' => $cleanOutlined, ':icon_id' => $id]);
        } else {
            $pdo->prepare("INSERT INTO icon_variants (icon_id, style, svg_content) VALUES (:icon_id, 'outlined', :svg)")
                ->execute([':icon_id' => $id, ':svg' => $cleanOutlined]);
        }
    }

    if ($updateFilled && $cleanFilled !== null) {
        $checkVar = $pdo->prepare("SELECT id FROM icon_variants WHERE icon_id = :icon_id AND style = 'filled'");
        $checkVar->execute([':icon_id' => $id]);
        if ($checkVar->fetch()) {
            $pdo->prepare("UPDATE icon_variants SET svg_content = :svg WHERE icon_id = :icon_id AND style = 'filled'")
                ->execute([':svg' => $cleanFilled, ':icon_id' => $id]);
        } else {
            $pdo->prepare("INSERT INTO icon_variants (icon_id, style, svg_content) VALUES (:icon_id, 'filled', :svg)")
                ->execute([':icon_id' => $id, ':svg' => $cleanFilled]);
        }
    }

    // Update category counts
    $recountStmt = $pdo->prepare("
        UPDATE categories 
        SET icon_count = (SELECT COUNT(*) FROM icons WHERE category_id = ? AND status = 'published')
        WHERE id = ?
    ");
    $recountStmt->execute([$newCategoryId, $newCategoryId]);
    if ($newCategoryId !== $oldCategoryId) {
        $recountStmt->execute([$oldCategoryId, $oldCategoryId]);
    }


    // Audit log
    logAdminAction($pdo, $admin['id'], 'update_icon', 'icon', $id, [
        'name' => $name,
        'slug' => $slug,
        'status' => $status,
        'category_id' => $newCategoryId
    ]);

    $pdo->commit();

    jsonResponse(true, [
        'id' => $id,
        'name' => $name,
        'slug' => $slug,
        'category_id' => $newCategoryId,
        'status' => $status,
        'is_premium' => (bool)$isPremium,
        'tags' => $tags
    ], 'Icon updated successfully.');

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(false, null, 'Failed to update icon: ' . $e->getMessage(), 500);
}
