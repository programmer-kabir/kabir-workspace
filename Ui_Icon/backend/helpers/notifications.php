<?php
// backend/helpers/notifications.php
require_once __DIR__ . '/pusher.php';

function createNotification(
    $pdo,
    string $title,
    string $message,
    string $type = 'system',
    ?int $userId = null,
    ?string $targetRole = null,
    ?string $link = null,
    $actionData = null,
    string $icon = 'bell'
) {
    if (!$pdo) {
        return false;
    }

    // Must have at least a specific recipient user OR a target role (or 'all')
    if ($userId === null && empty($targetRole)) {
        $targetRole = 'all';
    }

    $jsonActionData = null;
    $rawActionData = $actionData;
    if ($actionData !== null) {
        $jsonActionData = is_string($actionData) ? $actionData : json_encode($actionData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if (is_string($rawActionData)) {
            $rawActionData = json_decode($rawActionData, true);
        }
    }

    try {
        $stmt = $pdo->prepare("
            INSERT INTO notifications (user_id, target_role, type, title, message, link, action_data, icon, is_read, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())
        ");
        $stmt->execute([
            $userId,
            $targetRole,
            $type,
            $title,
            $message,
            $link,
            $jsonActionData,
            $icon
        ]);
        $notifId = (int)$pdo->lastInsertId();

        // Trigger Realtime Notification via Pusher
        $pusherPayload = [
            'id' => $notifId,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'link' => $link,
            'action_data' => $rawActionData,
            'icon' => $icon,
            'created_at' => date('Y-m-d H:i:s')
        ];

        if ($userId) {
            triggerPusherEvent("user-{$userId}", 'new_notification', $pusherPayload);
            if ($type === 'team_invite') {
                triggerPusherEvent("user-{$userId}", 'team_invite', $pusherPayload);
            }
        } elseif ($targetRole === 'admin') {
            triggerPusherEvent('admin-channel', 'new_notification', $pusherPayload);
        }

        return $notifId;
    } catch (Exception $e) {
        // Fail silently so callers (e.g. checkout webhooks or team invites) are never blocked
        error_log("Failed to create notification: " . $e->getMessage());
        return false;
    }
}
