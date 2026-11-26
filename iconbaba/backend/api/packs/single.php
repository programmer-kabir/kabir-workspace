<?php
// backend/api/packs/single.php
// Public API: Returns single pack details with all its icons and multi-style variants

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/rate_limit.php';
require_once __DIR__ . '/../../helpers/vector_guard.php';

enforceRateLimit($pdo, 'packs_single_api', 120, 60);

try {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    $slug = isset($_GET['slug']) ? trim($_GET['slug']) : '';

    if ($id <= 0 && empty($slug)) {
        jsonResponse(false, null, 'Pack ID or slug is required.', 400);
    }

    if ($id > 0) {
        $stmt = $pdo->prepare("
            SELECT p.*, c.name AS category_name, c.slug AS category_slug
            FROM packs p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = :id AND p.status = 'published'
            LIMIT 1
        ");
        $stmt->execute([':id' => $id]);
    } else {
        $stmt = $pdo->prepare("
            SELECT p.*, c.name AS category_name, c.slug AS category_slug
            FROM packs p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.slug = :slug AND p.status = 'published'
            LIMIT 1
        ");
        $stmt->execute([':slug' => $slug]);
    }

    $pack = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$pack) {
        jsonResponse(false, null, 'Pack not found or unpublished.', 404);
    }

    $packId = (int)$pack['id'];

    // Fetch all icons in this pack
    $iconStmt = $pdo->prepare("
        SELECT id, name, slug, category_id, tags, is_premium, sort_order, default_style, downloads_count, favorites_count
        FROM icons
        WHERE pack_id = :pack_id AND status = 'published'
        ORDER BY sort_order ASC, id ASC
    ");
    $iconStmt->execute([':pack_id' => $packId]);
    $iconRows = $iconStmt->fetchAll(PDO::FETCH_ASSOC);

    // Fetch all variants for these icons
    $icons = [];
    $allStylesInPack = [];

    if (!empty($iconRows)) {
        $iconIds = array_column($iconRows, 'id');
        $inIds = implode(',', array_map('intval', $iconIds));

        $varStmt = $pdo->query("
            SELECT icon_id, style, is_multicolor, palette_json, svg_content
            FROM icon_variants
            WHERE icon_id IN ({$inIds})
        ");
        $variantsByIcon = [];
        while ($vRow = $varStmt->fetch(PDO::FETCH_ASSOC)) {
            $iid = (int)$vRow['icon_id'];
            $st = $vRow['style'];
            $allStylesInPack[$st] = true;

            if (!isset($variantsByIcon[$iid])) {
                $variantsByIcon[$iid] = [];
            }

            // Exclude empty or stroke-only mock filled variants if necessary
            $svg = $vRow['svg_content'] ?? '';
            $variantsByIcon[$iid][$st] = [
                'v_data' => obfuscateSvgPayload($svg),
                'is_multicolor' => (bool)$vRow['is_multicolor'],
                'palette' => !empty($vRow['palette_json']) ? json_decode($vRow['palette_json'], true) : []
            ];
        }

        foreach ($iconRows as $ico) {
            $iid = (int)$ico['id'];
            $vMap = $variantsByIcon[$iid] ?? [];

            // Simple map of style => v_data for fast consumption
            $vVariants = [];
            foreach ($vMap as $styleKey => $sData) {
                $vVariants[$styleKey] = $sData['v_data'];
            }

            $tagList = [];
            if (!empty($ico['tags'])) {
                $tagList = array_map('trim', explode(',', $ico['tags']));
            }

            $icons[] = [
                'id' => $iid,
                'name' => $ico['name'],
                'slug' => $ico['slug'],
                'tags' => $tagList,
                'is_premium' => (bool)$ico['is_premium'],
                'default_style' => $ico['default_style'] ?: 'outlined',
                'downloads_count' => (int)$ico['downloads_count'],
                'favorites_count' => (int)$ico['favorites_count'],
                'v_variants' => $vVariants
            ];
        }
    }

    // Fetch style metadata for available styles
    $availableStyles = [];
    if (!empty($allStylesInPack)) {
        $styleKeys = array_keys($allStylesInPack);
        $inStyles = "'" . implode("','", array_map('addslashes', $styleKeys)) . "'";
        $styleMetaStmt = $pdo->query("
            SELECT slug, name, is_multicolor, supports_stroke_edit, display_order
            FROM icon_styles
            WHERE slug IN ({$inStyles})
            ORDER BY display_order ASC
        ");
        while ($sm = $styleMetaStmt->fetch(PDO::FETCH_ASSOC)) {
            $availableStyles[] = [
                'slug' => $sm['slug'],
                'name' => $sm['name'],
                'is_multicolor' => (bool)$sm['is_multicolor'],
                'supports_stroke_edit' => (bool)$sm['supports_stroke_edit']
            ];
        }
    }

    if (empty($availableStyles)) {
        $availableStyles[] = [
            'slug' => 'outlined',
            'name' => 'Lineal / Outlined',
            'is_multicolor' => false,
            'supports_stroke_edit' => true
        ];
    }

    $packTags = [];
    if (!empty($pack['tags'])) {
        $packTags = array_map('trim', explode(',', $pack['tags']));
    }

    jsonResponse(true, [
        'id' => $packId,
        'name' => $pack['name'],
        'slug' => $pack['slug'],
        'description' => $pack['description'] ?? '',
        'tags' => $packTags,
        'category_id' => (int)$pack['category_id'],
        'category_name' => $pack['category_name'] ?? 'General',
        'category_slug' => $pack['category_slug'] ?? 'general',
        'family_slug' => $pack['family_slug'],
        'primary_style' => $pack['primary_style'] ?: 'outlined',
        'author_name' => $pack['author_name'] ?: 'IconBaba Studio',
        'is_premium' => (bool)$pack['is_premium'],
        'is_featured' => (bool)$pack['is_featured'],
        'icon_count' => count($icons),
        'downloads_count' => (int)$pack['downloads_count'],
        'favorites_count' => (int)$pack['favorites_count'],
        'created_at' => $pack['created_at'],
        'available_styles' => $availableStyles,
        'icons' => $icons
    ], 'Pack details retrieved successfully.');

} catch (Exception $e) {
    jsonResponse(false, null, 'Failed to fetch pack details: ' . $e->getMessage(), 500);
}
