<?php
// backend/api/admin/contact-messages/list.php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';

$admin = requireAdmin($pdo);

$page = max(1, (int)($_GET['page'] ?? 1));
$limit = max(1, min(100, (int)($_GET['limit'] ?? 20)));
$offset = ($page - 1) * $limit;

$search = trim($_GET['q'] ?? '');
$status = trim($_GET['status'] ?? '');

$where = [];
$params = [];

if (!empty($search)) {
    $where[] = "(name LIKE :search OR email LIKE :search OR subject LIKE :search OR message LIKE :search)";
    $params[':search'] = '%' . $search . '%';
}

if (!empty($status) && in_array($status, ['unread', 'read', 'replied'])) {
    $where[] = "status = :status";
    $params[':status'] = $status;
}

$whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

$countSql = "SELECT COUNT(*) FROM contact_messages {$whereClause}";
$countStmt = $pdo->prepare($countSql);
$countStmt->execute($params);
$total = (int)$countStmt->fetchColumn();

$itemsSql = "
    SELECT id, name, email, subject, message, status, created_at
    FROM contact_messages
    {$whereClause}
    ORDER BY created_at DESC
    LIMIT {$limit} OFFSET {$offset}
";
$itemsStmt = $pdo->prepare($itemsSql);
$itemsStmt->execute($params);
$items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

// Summary counts
$unreadCount = (int)$pdo->query("SELECT COUNT(*) FROM contact_messages WHERE status = 'unread'")->fetchColumn();
$readCount = (int)$pdo->query("SELECT COUNT(*) FROM contact_messages WHERE status = 'read'")->fetchColumn();
$repliedCount = (int)$pdo->query("SELECT COUNT(*) FROM contact_messages WHERE status = 'replied'")->fetchColumn();

jsonResponse(true, [
    'counts' => [
        'total' => $total,
        'unread' => $unreadCount,
        'read' => $readCount,
        'replied' => $repliedCount,
    ],
    'items' => $items,
    'pagination' => [
        'page' => $page,
        'limit' => $limit,
        'total' => $total,
        'total_pages' => ceil($total / $limit)
    ]
], 'Contact messages retrieved successfully.');
