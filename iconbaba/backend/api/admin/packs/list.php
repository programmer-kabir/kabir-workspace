<?php
// backend/api/admin/packs/list.php
// Admin API: List packs with category names, icon counts, status, and search

require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';

$admin = requireAdmin($pdo);

try {
    $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? min(100, max(10, (int)$_GET['limit'])) : 25;
    $offset = ($page - 1) * $limit;

    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $categoryId = isset($_GET['category_id']) ? (int)$_GET['category_id'] : 0;
    $status = isset($_GET['status']) ? trim($_GET['status']) : '';

    $where = ["1=1"];
    $params = [];

    if (!empty($search)) {
        $where[] = "(p.name LIKE :s1 OR p.tags LIKE :s2 OR p.slug LIKE :s3)";
        $searchTerm = '%' . $search . '%';
        $params[':s1'] = $searchTerm;
        $params[':s2'] = $searchTerm;
        $params[':s3'] = $searchTerm;
    }

    if ($categoryId > 0) {
        $where[] = "p.category_id = :cat_id";
        $params[':cat_id'] = $categoryId;
    }

    if (!empty($status) && in_array($status, ['published', 'draft', 'archived'])) {
        $where[] = "p.status = :status";
        $params[':status'] = $status;
    }

    $whereSql = implode(' AND ', $where);

    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM packs p WHERE {$whereSql}");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    $stmt = $pdo->prepare("
        SELECT 
            p.*,
            c.name AS category_name,
            c.slug AS category_slug,
            (SELECT COUNT(*) FROM icons i WHERE i.pack_id = p.id) AS live_icon_count
        FROM packs p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE {$whereSql}
        ORDER BY p.id DESC
        LIMIT {$limit} OFFSET {$offset}
    ");
    $stmt->execute($params);
    $packs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $formatted = array_map(function($p) {
        return [
            'id' => (int)$p['id'],
            'name' => $p['name'],
            'slug' => $p['slug'],
            'description' => $p['description'],
            'tags' => $p['tags'],
            'category_id' => (int)$p['category_id'],
            'category_name' => $p['category_name'] ?: 'General',
            'family_slug' => $p['family_slug'],
            'primary_style' => $p['primary_style'] ?: 'outlined',
            'author_name' => $p['author_name'] ?: 'IconBaba Studio',
            'is_premium' => (bool)$p['is_premium'],
            'is_featured' => (bool)$p['is_featured'],
            'status' => $p['status'],
            'icon_count' => (int)$p['live_icon_count'],
            'downloads_count' => (int)$p['downloads_count'],
            'favorites_count' => (int)$p['favorites_count'],
            'created_at' => $p['created_at'],
            'updated_at' => $p['updated_at']
        ];
    }, $packs);

    jsonResponse(true, [
        'packs' => $formatted,
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
