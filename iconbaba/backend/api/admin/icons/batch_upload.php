<?php
// backend/api/admin/icons/batch_upload.php
// Production-grade Bulk / Batch Icon Upload API with Pack & Multi-variant Support

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

// Max 100 icons per single batch request
if (count($iconsList) > 100) {
    jsonResponse(false, null, 'Maximum 100 icons allowed per batch request. Please chunk your uploads.', 400);
}

// Fallback Global Settings
$globalCategoryId = isset($data['category_id']) ? (int)$data['category_id'] : 0;
$globalPackId = !empty($data['pack_id']) ? (int)$data['pack_id'] : null;
$globalStatus = isset($data['status']) && in_array($data['status'], ['published', 'draft', 'archived']) 
    ? $data['status'] 
    : 'published';
$globalIsPremium = isset($data['is_premium']) ? ((int)(bool)$data['is_premium']) : 0;
$globalTags = isset($data['tags']) ? trim($data['tags']) : '';
$globalDefaultStyle = trim($data['default_style'] ?? 'outlined');

// 3. Cache valid categories
$validCategories = $pdo->query("SELECT id, name FROM categories")->fetchAll(PDO::FETCH_KEY_PAIR);
if (empty($validCategories)) {
    jsonResponse(false, null, 'No categories found in the database. Please create a category first.', 400);
}

$defaultCategoryId = $globalCategoryId > 0 && isset($validCategories[$globalCategoryId]) 
    ? $globalCategoryId 
    : (int)array_key_first($validCategories);

// Cache valid packs
$validPacks = $pdo->query("SELECT id, name FROM packs")->fetchAll(PDO::FETCH_KEY_PAIR);

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
$affectedPackIds = [];

try {
    $pdo->beginTransaction();

    $insertIconStmt = $pdo->prepare("
        INSERT INTO icons (name, slug, category_id, pack_id, default_style, tags, status, is_premium, downloads_count, favorites_count, created_by, created_at, updated_at)
        VALUES (:name, :slug, :category_id, :pack_id, :default_style, :tags, :status, :is_premium, 0, 0, :created_by, NOW(), NOW())
    ");

    $insertVarStmt = $pdo->prepare("
        INSERT INTO icon_variants (icon_id, style, is_multicolor, palette_json, svg_content)
        VALUES (:icon_id, :style, :is_multicolor, :palette_json, :svg_content)
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

        // Determine Pack
        $packId = !empty($item['pack_id']) ? (int)$item['pack_id'] : $globalPackId;
        if ($packId && !isset($validPacks[$packId])) {
            $packId = null;
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

        $defaultStyle = trim($item['default_style'] ?? $globalDefaultStyle);

        // Normalize Variants
        $rawVariants = [];
        if (!empty($item['variants']) && is_array($item['variants'])) {
            foreach ($item['variants'] as $v) {
                if (!empty($v['style']) && !empty($v['svg'])) {
                    $rawVariants[trim($v['style'])] = $v['svg'];
                }
            }
        }
        if (!empty($item['svg_outlined'])) $rawVariants['outlined'] = $item['svg_outlined'];
        if (!empty($item['svg_filled'])) $rawVariants['filled'] = $item['svg_filled'];
        if (!empty($item['svg_lineal_color'])) $rawVariants['lineal-color'] = $item['svg_lineal_color'];
        if (!empty($item['svg_flat'])) $rawVariants['flat'] = $item['svg_flat'];
        if (!empty($item['svg']) && empty($rawVariants)) $rawVariants['outlined'] = $item['svg'];

        if (empty($rawVariants)) {
            $failedItems[] = [
                'index' => $idx,
                'name' => $rawName,
                'error' => 'No SVG content provided.'
            ];
            continue;
        }

        // Sanitize Variants
        $cleanedVariants = [];
        $hasError = false;
        foreach ($rawVariants as $st => $rawSvg) {
            $isMulti = isMultiColorStyle($st);
            $errMsg = '';
            $cleanSvg = validateAndSanitizeSvg($rawSvg, $errMsg, $isMulti);
            if ($cleanSvg === false) {
                $failedItems[] = [
                    'index' => $idx,
                    'name' => $rawName,
                    'error' => "Invalid SVG for style [{$st}]: {$errMsg}"
                ];
                $hasError = true;
                break;
            }
            $palette = $isMulti ? extractSvgColors($cleanSvg) : [];
            $cleanedVariants[$st] = [
                'svg' => $cleanSvg,
                'is_multicolor' => $isMulti ? 1 : 0,
                'palette' => $palette
            ];
        }

        if ($hasError) {
            continue;
        }

        // Fallback for outlined & filled if only one is provided
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

        // Generate Slug
        $slug = generateBatchSafeSlug($pdo, $rawName, $usedSlugs);

        // Insert Icon Record
        $insertIconStmt->execute([
            ':name' => $rawName,
            ':slug' => $slug,
            ':category_id' => $catId,
            ':pack_id' => $packId,
            ':default_style' => $defaultStyle,
            ':tags' => $tags,
            ':status' => $itemStatus,
            ':is_premium' => $itemIsPremium,
            ':created_by' => $admin['id']
        ]);
        $iconId = (int)$pdo->lastInsertId();

        // Insert Variants
        foreach ($cleanedVariants as $st => $vData) {
            $insertVarStmt->execute([
                ':icon_id' => $iconId,
                ':style' => $st,
                ':is_multicolor' => $vData['is_multicolor'],
                ':palette_json' => !empty($vData['palette']) ? json_encode($vData['palette']) : null,
                ':svg_content' => $vData['svg']
            ]);
        }

        $affectedCategoryIds[$catId] = true;
        if ($packId) {
            $affectedPackIds[$packId] = true;
        }

        $uploadedItems[] = [
            'id' => $iconId,
            'name' => $rawName,
            'slug' => $slug,
            'category_id' => $catId,
            'pack_id' => $packId,
            'status' => $itemStatus,
            'styles' => array_keys($cleanedVariants)
        ];
    }

    // 6. Recalculate icon_count on affected categories
    if (!empty($affectedCategoryIds)) {
        $updateCatStmt = $pdo->prepare("
            UPDATE categories 
            SET icon_count = (SELECT COUNT(*) FROM icons WHERE category_id = ? AND status = 'published')
            WHERE id = ?
        ");
        foreach (array_keys($affectedCategoryIds) as $cId) {
            $updateCatStmt->execute([$cId, $cId]);
        }
    }

    // Recalculate icon_count on affected packs
    if (!empty($affectedPackIds)) {
        $updatePackStmt = $pdo->prepare("
            UPDATE packs 
            SET icon_count = (SELECT COUNT(*) FROM icons WHERE pack_id = ? AND status = 'published')
            WHERE id = ?
        ");
        foreach (array_keys($affectedPackIds) as $pId) {
            $updatePackStmt->execute([$pId, $pId]);
        }
    }

    // 7. Audit Logging
    if (!empty($uploadedItems)) {
        logAdminAction($pdo, $admin['id'], 'batch_upload_icons', 'icon', null, [
            'total_attempted' => count($iconsList),
            'total_success' => count($uploadedItems),
            'total_failed' => count($failedItems),
            'first_few_ids' => array_slice(array_column($uploadedItems, 'id'), 0, 5)
        ]);
    }

    $pdo->commit();

    jsonResponse(true, [
        'uploaded' => $uploadedItems,
        'failed' => $failedItems,
        'summary' => [
            'total' => count($iconsList),
            'success_count' => count($uploadedItems),
            'failed_count' => count($failedItems)
        ]
    ], count($uploadedItems) . ' icons processed successfully.', 200);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(false, null, 'Batch upload failed: ' . $e->getMessage(), 500);
}
