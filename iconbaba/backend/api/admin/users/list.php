<?php
// backend/api/admin/users/list.php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';

$admin = requireAdmin($pdo);

$page = max(1, (int)($_GET['page'] ?? 1));
$limit = max(1, min(100, (int)($_GET['limit'] ?? 20)));
$offset = ($page - 1) * $limit;

$search = trim($_GET['q'] ?? '');
$role = trim($_GET['role'] ?? '');
$status = trim($_GET['status'] ?? '');

$where = [];
$params = [];

if (!empty($search)) {
    $where[] = "(u.username LIKE :search OR u.email LIKE :search OR u.full_name LIKE :search)";
    $params[':search'] = '%' . $search . '%';
}

if (!empty($role)) {
    $where[] = "EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_slug = :role_slug)";
    $params[':role_slug'] = $role;
}

if (!empty($status) && in_array($status, ['active', 'suspended'])) {
    $where[] = "u.status = :status";
    $params[':status'] = $status;
}

$whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

// Count query
$countSql = "SELECT COUNT(*) FROM users u {$whereClause}";
$countStmt = $pdo->prepare($countSql);
$countStmt->execute($params);
$total = (int)$countStmt->fetchColumn();
$totalPages = ceil($total / $limit);

// Items query
$itemsSql = "
    SELECT 
        u.id, u.username, u.email, u.full_name, u.avatar_url, u.status, u.created_at, u.updated_at,
        (SELECT GROUP_CONCAT(ur.role_slug SEPARATOR ',') FROM user_roles ur WHERE ur.user_id = u.id) AS db_roles,
        (SELECT COUNT(*) FROM favorites f WHERE f.user_id = u.id) AS favorites_count,
        (SELECT COUNT(*) FROM collections c WHERE c.user_id = u.id) AS collections_count,
        (SELECT COUNT(*) FROM downloads d WHERE d.user_id = u.id) AS downloads_count
    FROM users u
    {$whereClause}
    ORDER BY u.created_at DESC
    LIMIT {$limit} OFFSET {$offset}
";

$itemsStmt = $pdo->prepare($itemsSql);
$itemsStmt->execute($params);
$users = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($users as &$user) {
    $user['id'] = (int)$user['id'];
    $user['favorites_count'] = (int)$user['favorites_count'];
    $user['collections_count'] = (int)$user['collections_count'];
    $user['downloads_count'] = (int)$user['downloads_count'];
    $userRoles = getUserRoles($user);
    $user['roles'] = $userRoles;
    $user['role'] = in_array('admin', $userRoles) ? 'admin' : ($userRoles[0] ?? 'user');
}

jsonResponse(true, [
    'items' => $users,
    'pagination' => [
        'page' => $page,
        'limit' => $limit,
        'total' => $total,
        'total_pages' => $totalPages,
        'has_next' => $page < $totalPages,
        'has_prev' => $page > 1
    ]
], 'Admin users retrieved successfully.');
