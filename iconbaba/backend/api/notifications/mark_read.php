<?php
// backend/api/notifications/mark_read.php
// Marks a specific notification or all notifications as read for the current user

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

$user = requireAuth($pdo);
$userId = (int)$user['id'];
$roles = getUserRoles($user);

$body = json_decode(file_get_contents('php://input'), true);
$markAll = !empty($body['all']) || (($body['id'] ?? '') === 'all');
$notificationId = !empty($body['id']) && $body['id'] !== 'all' ? (int)$body['id'] : null;

try {
    if ($markAll) {
        // 1. Mark all personal notifications as read
        $stmtDirect = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0");
        $stmtDirect->execute([$userId]);

        // 2. Mark all role-based notifications as read in notification_reads
        $targetRoles = array_values(array_unique(array_merge(['all'], $roles)));
        $placeholders = implode(',', array_fill(0, count($targetRoles), '?'));

        $insertReadsSql = "
            INSERT INTO notification_reads (notification_id, user_id, read_at)
            SELECT n.id, ?, NOW()
            FROM notifications n
            LEFT JOIN notification_reads nr ON nr.notification_id = n.id AND nr.user_id = ?
            WHERE n.user_id IS NULL AND n.target_role IN ($placeholders) AND nr.id IS NULL
            ON DUPLICATE KEY UPDATE read_at = NOW()
        ";
        $insertParams = array_merge([$userId, $userId], $targetRoles);
        $stmtInsertReads = $pdo->prepare($insertReadsSql);
        $stmtInsertReads->execute($insertParams);

        jsonResponse(true, null, 'All notifications marked as read.');
    }

    if ($notificationId) {
        // Check if this notification is personal
        $stmtCheck = $pdo->prepare("SELECT id, user_id FROM notifications WHERE id = ? LIMIT 1");
        $stmtCheck->execute([$notificationId]);
        $notif = $stmtCheck->fetch(PDO::FETCH_ASSOC);

        if ($notif) {
            if ((int)$notif['user_id'] === $userId) {
                $stmtUpdate = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?");
                $stmtUpdate->execute([$notificationId, $userId]);
            } else {
                $stmtRead = $pdo->prepare("
                    INSERT INTO notification_reads (notification_id, user_id, read_at)
                    VALUES (?, ?, NOW())
                    ON DUPLICATE KEY UPDATE read_at = NOW()
                ");
                $stmtRead->execute([$notificationId, $userId]);
            }
        }

        jsonResponse(true, null, 'Notification marked as read.');
    }

    jsonResponse(false, null, 'Invalid notification ID or parameter.', 400);

} catch (PDOException $e) {
    jsonResponse(false, null, 'Database error or table not yet migrated.', 500);
}
