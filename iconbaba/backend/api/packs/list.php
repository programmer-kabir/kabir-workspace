<?php
// backend/api/packs/list.php
// Public API: Lists icon packs with rich preview grids and style indicators

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/rate_limit.php';
require_once __DIR__ . '/../../helpers/vector_guard.php';

enforceRateLimit($pdo, 'packs_list_api', 90, 60);

try {
    $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? min(48, max(6, (int)$_GET['limit'])) : 24;
    $offset = ($page - 1) * $limit;

    $category = isset($_GET['category']) ? trim($_GET['category']) : '';
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $tier = isset($_GET['tier']) ? strtolower(trim($_GET['tier'])) : (isset($_GET['pricing']) ? strtolower(trim($_GET['pricing'])) : 'all');
    $style = isset($_GET['style']) ? strtolower(trim($_GET['style'])) : '';
    $featured = isset($_GET['featured']) ? (trim($_GET['featured']) === '1' || strtolower(trim($_GET['featured'])) === 'true') : false;
    $sort = isset($_GET['sort']) ? strtolower(trim($_GET['sort'])) : 'popular';

    $where = ["p.status = 'published'"];
    $params = [];

    // Category filter (slug or id)
    if (!empty($category) && strtolower($category) !== 'all') {
        if (is_numeric($category)) {
            $where[] = "p.category_id = :category_id";
            $params[':category_id'] = (int)$category;
        } else {
            $where[] = "c.slug = :category_slug";
            $params[':category_slug'] = $category;
        }
    }

    // Search filter
    if (!empty($search)) {
        $where[] = "(p.name LIKE :search1 OR p.tags LIKE :search2 OR p.description LIKE :search3)";
        $sTerm = '%' . $search . '%';
        $params[':search1'] = $sTerm;
        $params[':search2'] = $sTerm;
        $params[':search3'] = $sTerm;
    }

    // Tier filter
    if ($tier === 'free') {
        $where[] = "p.is_premium = 0";
    } elseif ($tier === 'pro' || $tier === 'premium') {
        $where[] = "p.is_premium = 1";
    }

    // Style filter: packs having icons in this style
    if (!empty($style) && $style !== 'all') {
        $where[] = "EXISTS (
            SELECT 1 FROM icons i2
            INNER JOIN icon_variants iv2 ON i2.id = iv2.icon_id
            WHERE i2.pack_id = p.id AND iv2.style = :filter_style AND i2.status = 'published'
        )";
        $params[':filter_style'] = $style;
    }

    // Featured only
    if ($featured) {
        $where[] = "p.is_featured = 1";
    }

    $whereSql = implode(' AND ', $where);

    // Sorting
    $orderBy = "p.downloads_count DESC, p.id DESC";
    if ($sort === 'recent') {
        $orderBy = "p.id DESC";
    } elseif ($sort === 'name') {
        $orderBy = "p.name ASC";
    } elseif ($sort === 'icons') {
        $orderBy = "p.icon_count DESC, p.id DESC";
    }

    // Total count
    $countStmt = $pdo->prepare("
        SELECT COUNT(DISTINCT p.id) 
        FROM packs p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE {$whereSql}
    ");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    // Data query
    $dataStmt = $pdo->prepare("
        SELECT 
            p.id,
            p.category_id,
            c.name AS category_name,
            c.slug AS category_slug,
            p.family_slug,
            p.name,
            p.slug,
            p.description,
            p.tags,
            p.primary_style,
            p.author_name,
            p.is_premium,
            p.is_featured,
            p.icon_count,
            p.downloads_count,
            p.favorites_count,
            p.created_at
        FROM packs p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE {$whereSql}
        ORDER BY {$orderBy}
        LIMIT {$limit} OFFSET {$offset}
    ");
    $dataStmt->execute($params);
    $packRows = $dataStmt->fetchAll(PDO::FETCH_ASSOC);

    // Batch fetch 6 preview icons for each returned pack
    $packs = [];
    if (!empty($packRows)) {
        $packIds = array_column($packRows, 'id');
        $inPackIds = implode(',', array_map('intval', $packIds));

        // Get preview icons with SVG
        // We pick up to 6 published icons per pack
        $previewStmt = $pdo->query("
            SELECT 
                i.id,
                i.pack_id,
                i.name,
                i.slug,
                i.sort_order,
                COALESCE(iv.style, 'outlined') AS style,
                iv.svg_content
            FROM (
                SELECT id, pack_id, name, slug, sort_order,
                       ROW_NUMBER() OVER (PARTITION BY pack_id ORDER BY sort_order ASC, id ASC) as row_num
                FROM icons
                WHERE pack_id IN ({$inPackIds}) AND status = 'published'
            ) i
            LEFT JOIN icon_variants iv ON i.id = iv.icon_id AND iv.style = (
                SELECT primary_style FROM packs WHERE id = i.pack_id LIMIT 1
            )
            WHERE i.row_num <= 6
            ORDER BY i.pack_id, i.sort_order ASC, i.id ASC
        ");
        $previewsByPack = [];
        while ($pRow = $previewStmt->fetch(PDO::FETCH_ASSOC)) {
            $pid = (int)$pRow['pack_id'];
            if (!isset($previewsByPack[$pid])) {
                $previewsByPack[$pid] = [];
            }
            $previewsByPack[$pid][] = [
                'id' => (int)$pRow['id'],
                'name' => $pRow['name'],
                'slug' => $pRow['slug'],
                'style' => $pRow['style'],
                'v_data' => obfuscateSvgPayload($pRow['svg_content'] ?? '')
            ];
        }

        // Get distinct styles per pack
        $stylesStmt = $pdo->query("
            SELECT DISTINCT i.pack_id, iv.style
            FROM icons i
            INNER JOIN icon_variants iv ON i.id = iv.icon_id
            WHERE i.pack_id IN ({$inPackIds}) AND i.status = 'published'
        ");
        $stylesByPack = [];
        while ($sRow = $stylesStmt->fetch(PDO::FETCH_ASSOC)) {
            $pid = (int)$sRow['pack_id'];
            if (!isset($stylesByPack[$pid])) {
                $stylesByPack[$pid] = [];
            }
            $stylesByPack[$pid][] = $sRow['style'];
        }

        foreach ($packRows as $p) {
            $pid = (int)$p['id'];
            $tagList = [];
            if (!empty($p['tags'])) {
                $tagList = array_map('trim', explode(',', $p['tags']));
            }

            $packs[] = [
                'id' => $pid,
                'name' => $p['name'],
                'slug' => $p['slug'],
                'description' => $p['description'] ?? '',
                'tags' => $tagList,
                'category_id' => (int)$p['category_id'],
                'category_name' => $p['category_name'] ?? 'General',
                'category_slug' => $p['category_slug'] ?? 'general',
                'family_slug' => $p['family_slug'],
                'primary_style' => $p['primary_style'] ?: 'outlined',
                'author_name' => $p['author_name'] ?: 'IconBaba Studio',
                'is_premium' => (bool)$p['is_premium'],
                'is_featured' => (bool)$p['is_featured'],
                'icon_count' => (int)$p['icon_count'],
                'downloads_count' => (int)$p['downloads_count'],
                'favorites_count' => (int)$p['favorites_count'],
                'available_styles' => $stylesByPack[$pid] ?? [$p['primary_style'] ?: 'outlined'],
                'preview_icons' => $previewsByPack[$pid] ?? []
            ];
        }
    }

    jsonResponse(true, [
        'packs' => $packs,
        'pagination' => [
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'total_pages' => $limit > 0 ? (int)ceil($total / $limit) : 1
        ]
    ], 'Packs retrieved successfully.');

} catch (Exception $e) {
    jsonResponse(false, null, 'Failed to fetch packs: ' . $e->getMessage(), 500);
}
