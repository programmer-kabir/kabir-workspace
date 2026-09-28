<?php
// backend/api/admin/roles/list.php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';

$admin = requireAdmin($pdo);

$stmt = $pdo->query("
    SELECT id, slug, name, description, created_at,
           (SELECT COUNT(DISTINCT user_id) FROM user_roles ur WHERE ur.role_id = r.id) AS users_count
    FROM roles r
    ORDER BY id ASC
");
$roles = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($roles as &$role) {
    $role['id'] = (int)$role['id'];
    $role['users_count'] = (int)$role['users_count'];
}

jsonResponse(true, [
    'items' => $roles
], 'Roles retrieved successfully.');
