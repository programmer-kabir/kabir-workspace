<?php
// backend/api/admin/icons/batch_upload.php
// Production-grade Bulk / Batch Icon Upload API for IconBaba

require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';
require_once __DIR__ . '/../../../helpers/svg.php';
require_once __DIR__ . '/../../../helpers/audit.php';

// 1. Require Admin Authentication
$admin = requireAdmin($pdo);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, null, 'Method not allowed. Only POST requests are accepted.', 405);
}

// 2. Parse JSON Input
$data = getJsonInput();
$iconsList = $data['icons'] ?? [];

if (!is_array($iconsList) || empty($iconsList)) {
    jsonResponse(false, null, 'No icons provided. Expected a non-empty array of icons.', 400);
}

// Max 100 icons per single HTTP batch request for stability
if (count($iconsList) > 100) {
    jsonResponse(false, null, 'Maximum 100 icons allowed per batch request. Please chunk your uploads.', 400);
}

// Fallback Global Settings
$globalCategoryId = isset($data['category_id']) ? (int)$data['category_id'] : 0;
$globalStatus = isset($data['status']) && in_array($data['status'], ['published', 'draft', 'archived']) 
    ? $data['status'] 
    : 'published';
$globalIsPremium = isset($data['is_premium']) ? ((int)(bool)$data['is_premium']) : 0;
$globalTags = isset($data['tags']) ? trim($data['tags']) : '';

// 3. Cache valid categories
$validCategories = $pdo->query("SELECT id, name FROM categories")->fetchAll(PDO::FETCH_KEY_PAIR);
if (empty($validCategories)) {
    jsonResponse(false, null, 'No categories found in the database. Please create a category first.', 400);
}

$defaultCategoryId = $globalCategoryId > 0 && isset($validCategories[$globalCategoryId]) 
    ? $globalCategoryId 
    : (int)array_key_first($validCategories);


// Helper: In-batch Collision-Safe Slug Generator
function generateBatchSafeSlug($pdo, $name, &$usedSlugs) {
    $baseSlug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $name), '-'));
    if (empty($baseSlug)) {
        $baseSlug = 'icon-' . time();
    }

    $candidate = $baseSlug;
    $counter = 1;

    while (true) {
        if (!in_array($candidate, $usedSlugs)) {
            $stmt = $pdo->prepare("SELECT id FROM icons WHERE slug = :slug LIMIT 1");
            $stmt->execute([':slug' => $candidate]);
            if (!$stmt->fetch()) {
                $usedSlugs[] = $candidate;
                return $candidate;
            }
        }
        $candidate = "{$baseSlug}-{$counter}";
        $counter++;
    }
}

// 5. Execute Batch Transaction
$usedSlugs = [];
$uploadedItems = [];
$failedItems = [];
$affectedCategoryIds = [];

try {
    $pdo->beginTransaction();

    $insertIconStmt = $pdo->prepare("
        INSERT INTO icons (name, slug, category_id, tags, status, is_premium, downloads_count, favorites_count, created_by, created_at, updated_at)
        VALUES (:name, :slug, :category_id, :tags, :status, :is_premium, 0, 0, :created_by, NOW(), NOW())
    ");

    $insertVarStmt = $pdo->prepare("
        INSERT INTO icon_variants (icon_id, style, svg_content)
        VALUES (:icon_id, :style, :svg_content)
    ");

    foreach ($iconsList as $idx => $item) {
        $rawName = trim($item['name'] ?? '');
        if (empty($rawName)) {
            $failedItems[] = [
                'index' => $idx,
                'name' => 'Unnamed Icon',
                'error' => 'Icon name is required.'
            ];
            continue;
        }

        // Determine Category
        $catId = isset($item['category_id']) ? (int)$item['category_id'] : 0;
        if ($catId <= 0 || !isset($validCategories[$catId])) {
            $catId = $defaultCategoryId;
        }

        $itemStatus = isset($item['status']) && in_array($item['status'], ['published', 'draft', 'archived'])
            ? $item['status']
            : $globalStatus;

        $itemIsPremium = isset($item['is_premium'])
            ? ((int)(bool)$item['is_premium'])
            : $globalIsPremium;

        $tags = isset($item['tags']) ? trim($item['tags']) : '';
        if (empty($tags)) {
            $tags = $globalTags;
        }
        if (empty($tags)) {
            $nameTokens = array_filter(preg_split('/[^a-zA-Z0-9]+/', strtolower($rawName)), function($w) {
                return strlen($w) > 2 && !is_numeric($w);
            });
            $tags = implode(', ', array_unique($nameTokens));
        }

        // Extract SVGs
        $rawOutlined = isset($item['svg_outlined']) ? trim((string)$item['svg_outlined']) : '';
        $rawFilled = isset($item['svg_filled']) ? trim((string)$item['svg_filled']) : '';

        if (empty($rawOutlined) && empty($rawFilled)) {
            $failedItems[] = [
                'index' => $idx,
                'name' => $rawName,
                'error' => 'At least one SVG variant (outlined or filled) must be provided.'
            ];
            continue;
        }

        // Sanitize SVGs
        $cleanOutlined = null;
        $cleanFilled = null;

        if (!empty($rawOutlined)) {
            $errMsg = '';
            $cleanOutlined = validateAndSanitizeSvg($rawOutlined, $errMsg);
            if ($cleanOutlined === false) {
                $failedItems[] = [
                    'index' => $idx,
                    'name' => $rawName,
                    'error' => 'Invalid outlined SVG: ' . $errMsg
                ];
                continue;
            }
        }

        if (!empty($rawFilled)) {
            $errMsg = '';
            $cleanFilled = validateAndSanitizeSvg($rawFilled, $errMsg);
            if ($cleanFilled === false) {
                $failedItems[] = [
                    'index' => $idx,
                    'name' => $rawName,
                    'error' => 'Invalid filled SVG: ' . $errMsg
                ];
                continue;
            }
        }

        // Bidirectional Fallback to ensure both variants always exist
        if ($cleanOutlined && !$cleanFilled) {
            $cleanFilled = $cleanOutlined;
        } elseif ($cleanFilled && !$cleanOutlined) {
            $cleanOutlined = $cleanFilled;
        }

        // Generate Slug
        $slug = generateBatchSafeSlug($pdo, $rawName, $usedSlugs);

        // Insert Icon Record
        $insertIconStmt->execute([
            ':name' => $rawName,
            ':slug' => $slug,
            ':category_id' => $catId,
            ':tags' => $tags,
            ':status' => $itemStatus,
            ':is_premium' => $itemIsPremium,
            ':created_by' => $admin['id']
        ]);
        $iconId = (int)$pdo->lastInsertId();

        // Insert Outlined Variant
        $insertVarStmt->execute([
            ':icon_id' => $iconId,
            ':style' => 'outlined',
            ':svg_content' => $cleanOutlined
        ]);

        // Insert Filled Variant
        $insertVarStmt->execute([
            ':icon_id' => $iconId,
            ':style' => 'filled',
            ':svg_content' => $cleanFilled
        ]);


        $affectedCategoryIds[] = $catId;

        $uploadedItems[] = [
            'id' => $iconId,
            'name' => $rawName,
            'slug' => $slug,
            'category_id' => $catId,
            'category_name' => $validCategories[$catId] ?? 'General',
            'status' => $itemStatus,
            'is_premium' => (bool)$itemIsPremium,
            'tags' => $tags
        ];
    }

    // 6. Recalculate icon_count for all affected categories
    $affectedCategoryIds = array_values(array_unique($affectedCategoryIds));
    if (!empty($affectedCategoryIds)) {
        $updateCatStmt = $pdo->prepare("
            UPDATE categories 
            SET icon_count = (SELECT COUNT(*) FROM icons WHERE category_id = ? AND status = 'published')
            WHERE id = ?
        ");
        foreach ($affectedCategoryIds as $affectedId) {
            $updateCatStmt->execute([(int)$affectedId, (int)$affectedId]);
        }
    }

    // 7. Record Admin Audit Action
    if (!empty($uploadedItems)) {
        logAdminAction($pdo, $admin['id'], 'bulk_upload_icons', 'icons', null, [
            'total_received' => count($iconsList),
            'uploaded_count' => count($uploadedItems),
            'failed_count' => count($failedItems),
            'affected_categories' => $affectedCategoryIds
        ]);
    }

    $pdo->commit();

    jsonResponse(true, [
        'total_received' => count($iconsList),
        'uploaded_count' => count($uploadedItems),
        'failed_count' => count($failedItems),
        'items' => $uploadedItems,
        'errors' => $failedItems
    ], count($uploadedItems) . ' icons uploaded successfully.', 201);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(false, null, 'Bulk upload failed: ' . $e->getMessage(), 500);
}
