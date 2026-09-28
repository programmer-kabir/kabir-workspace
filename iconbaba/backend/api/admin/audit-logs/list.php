<?php
// backend/api/admin/audit-logs/list.php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';

$admin = requireAdmin($pdo);

$page = max(1, (int)($_GET['page'] ?? 1));
$limit = max(1, min(100, (int)($_GET['limit'] ?? 25)));
$offset = ($page - 1) * $limit;

$action = trim($_GET['action'] ?? '');
$entityType = trim($_GET['entity_type'] ?? '');
$search = trim($_GET['q'] ?? '');

$where = [];
$params = [];

if (!empty($action)) {
    $where[] = "a.action = :action";
    $params[':action'] = $action;
}

if (!empty($entityType)) {
    $where[] = "a.entity_type = :entity_type";
    $params[':entity_type'] = $entityType;
}

if (!empty($search)) {
    $where[] = "(u.username LIKE :search OR a.action LIKE :search OR a.entity_type LIKE :search OR a.details LIKE :search)";
    $params[':search'] = '%' . $search . '%';
}

$whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

$countSql = "
    SELECT COUNT(*) 
    FROM admin_audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    {$whereClause}
";
$countStmt = $pdo->prepare($countSql);
$countStmt->execute($params);
$total = (int)$countStmt->fetchColumn();

$itemsSql = "
    SELECT 
        a.id, a.action, a.entity_type, a.entity_id, a.details, a.ip_address, a.created_at,
        u.id AS user_id, u.username, u.full_name
    FROM admin_audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    {$whereClause}
    ORDER BY a.created_at DESC
    LIMIT {$limit} OFFSET {$offset}
";
$itemsStmt = $pdo->prepare($itemsSql);
$itemsStmt->execute($params);
$logs = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($logs as &$log) {
    if (!empty($log['details'])) {
        $log['details'] = json_decode($log['details'], true);
    }
}

jsonResponse(true, [
    'items' => $logs,
    'pagination' => [
        'page' => $page,
        'limit' => $limit,
        'total' => $total,
        'total_pages' => ceil($total / $limit)
    ]
], 'Admin audit logs retrieved successfully.');
