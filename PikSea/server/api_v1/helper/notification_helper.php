<?php
/**
 * Notification Helper
 * Table fields: id, user_id, sender_id, sender_type, target_role, type, title, message, icon, link, is_read, read_at, priority, is_deleted, created_at
 *
 * @param mysqli $mysqli
 * @param array $data [
 *   'user_id'     => int,    // recipient user id (admin notification হলে sender এর id)
 *   'sender_id'   => int,    // কে পাঠাচ্ছে তার id (system হলে NULL)
 *   'sender_type' => string, // 'user' | 'admin' | 'system'
 *   'target_role' => string, // 'admin' | 'user'
 *   'type'        => string, // 'new_application' | 'payment_success' | 'reply' | 'general' | 'alert'
 *   'title'       => string,
 *   'message'     => string,
 *   'icon'        => string|null,
 *   'link'        => string|null,
 *   'priority'    => string, // 'low' | 'normal' | 'high' | 'urgent'
 * ]
 * @return int|false inserted notification id
 */
function sendNotification($mysqli, array $data): int|false {
    $user_id     = isset($data['user_id'])     ? (int)$data['user_id']       : null;
    $sender_id   = isset($data['sender_id'])   ? (int)$data['sender_id']     : null;
    $sender_type = $data['sender_type'] ?? 'system';
    $target_role = $data['target_role'] ?? 'admin';
    $type        = $data['type']        ?? 'general';
    $title       = $data['title']       ?? '';
    $message     = $data['message']     ?? '';
    $icon        = $data['icon']        ?? null;
    $link        = $data['link']        ?? null;
    $priority    = $data['priority']    ?? 'normal';

    $sql = "INSERT INTO notifications 
                (user_id, sender_id, sender_type, target_role, type, title, message, icon, link, priority)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    $stmt = $mysqli->prepare($sql);
    if (!$stmt) return false;

    $stmt->bind_param(
        "iissssssss",
        $user_id,
        $sender_id,
        $sender_type,
        $target_role,
        $type,
        $title,
        $message,
        $icon,
        $link,
        $priority
    );

    if ($stmt->execute()) {
        $id = $stmt->insert_id;
        $stmt->close();
        return $id;
    }

    $stmt->close();
    return false;
}
?>
