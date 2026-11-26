<?php
// backend/api/notifications/list.php
// Returns role-aware and personal notifications for the authenticated user

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

$user = requireAuth($pdo);
$userId = (int)$user['id'];
$roles = getUserRoles($user);

try {
    $targetRoles = array_values(array_unique(array_merge(['all'], $roles)));
    $placeholders = implode(',', array_fill(0, count($targetRoles), '?'));

    // 1. Fetch recent notifications (Personal + Role-based)
    $sql = "
        SELECT 
            n.id,
            n.user_id,
            n.target_role,
            n.type,
            n.title,
            n.message,
            n.link,
            n.action_data,
            n.icon,
            n.created_at,
            CASE 
                WHEN n.user_id = ? THEN n.is_read
                WHEN nr.id IS NOT NULL THEN 1
                ELSE 0
            END AS is_read
        FROM notifications n
        LEFT JOIN notification_reads nr 
            ON nr.notification_id = n.id AND nr.user_id = ?
        WHERE 
            (
                n.user_id = ? 
                OR (n.user_id IS NULL AND n.target_role IN ($placeholders))
            )
            AND (nr.is_dismissed IS NULL OR nr.is_dismissed = 0)
        ORDER BY n.created_at DESC
        LIMIT 40
    ";

    $params = array_merge([$userId, $userId, $userId], $targetRoles);
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. Fetch total unread count
    $countSql = "
        SELECT COUNT(*)
        FROM notifications n
        LEFT JOIN notification_reads nr 
            ON nr.notification_id = n.id AND nr.user_id = ?
        WHERE 
            (
                (n.user_id = ? AND n.is_read = 0)
                OR (n.user_id IS NULL AND n.target_role IN ($placeholders) AND nr.id IS NULL)
            )
            AND (nr.is_dismissed IS NULL OR nr.is_dismissed = 0)
    ";
    $countParams = array_merge([$userId, $userId], $targetRoles);
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($countParams);
    $totalUnread = (int)$countStmt->fetchColumn();

    $notifications = [];
    foreach ($rows as $r) {
        $actionData = null;
        if (!empty($r['action_data'])) {
            $actionData = json_decode($r['action_data'], true);
        }

        $notifications[] = [
            'id' => (int)$r['id'],
            'user_id' => $r['user_id'] !== null ? (int)$r['user_id'] : null,
            'target_role' => $r['target_role'],
            'type' => $r['type'],
            'title' => $r['title'],
            'message' => $r['message'],
            'link' => $r['link'],
            'action_data' => $actionData,
            'icon' => $r['icon'] ?: 'bell',
            'is_read' => (bool)$r['is_read'],
            'created_at' => $r['created_at']
        ];
    }

    jsonResponse(true, [
        'notifications' => $notifications,
        'unread_count' => $totalUnread,
        'user_roles' => $roles
    ]);

} catch (PDOException $e) {
    // Graceful fallback if tables are not yet created on remote Hostinger DB
    jsonResponse(true, [
        'notifications' => [],
        'unread_count' => 0,
        'user_roles' => $roles,
        'note' => 'Notification tables not yet initialized'
    ]);
}
