<?php
// backend/api/notifications/delete.php
// Deletes or dismisses a notification for the current user

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

$user = requireAuth($pdo);
$userId = (int)$user['id'];

$body = json_decode(file_get_contents('php://input'), true);
$notificationId = !empty($body['id']) ? (int)$body['id'] : null;
$clearAllRead = !empty($body['clear_all_read']);

try {
    if ($clearAllRead) {
        // Delete all personal read notifications
        $stmtDel = $pdo->prepare("DELETE FROM notifications WHERE user_id = ? AND is_read = 1");
        $stmtDel->execute([$userId]);

        // Dismiss all read broadcast/role notifications
        $stmtDismiss = $pdo->prepare("UPDATE notification_reads SET is_dismissed = 1 WHERE user_id = ?");
        $stmtDismiss->execute([$userId]);

        jsonResponse(true, null, 'All read notifications cleared.');
    }

    if ($notificationId) {
        $stmtCheck = $pdo->prepare("SELECT id, user_id FROM notifications WHERE id = ? LIMIT 1");
        $stmtCheck->execute([$notificationId]);
        $notif = $stmtCheck->fetch(PDO::FETCH_ASSOC);

        if (!$notif) {
            jsonResponse(false, null, 'Notification not found.', 404);
        }

        if ((int)$notif['user_id'] === $userId) {
            // Personal notification: delete directly
            $stmtDel = $pdo->prepare("DELETE FROM notifications WHERE id = ? AND user_id = ?");
            $stmtDel->execute([$notificationId, $userId]);
        } else {
            // Broadcast/Role notification: dismiss for this user only
            $stmtDismiss = $pdo->prepare("
                INSERT INTO notification_reads (notification_id, user_id, is_dismissed, read_at)
                VALUES (?, ?, 1, NOW())
                ON DUPLICATE KEY UPDATE is_dismissed = 1, read_at = NOW()
            ");
            $stmtDismiss->execute([$notificationId, $userId]);
        }

        jsonResponse(true, null, 'Notification dismissed.');
    }

    jsonResponse(false, null, 'Invalid notification ID.', 400);

} catch (PDOException $e) {
    jsonResponse(false, null, 'Database error or table not yet migrated.', 500);
}
