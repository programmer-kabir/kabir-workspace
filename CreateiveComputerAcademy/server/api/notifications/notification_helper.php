<?php
class NotificationHelper {
    /**
     * Send notification to a specific user
     */
    public static function sendToUser($db, $user_id, $sender_id, $title, $message, $type, $portal, $action_url = null, $priority = 'normal', $metadata = null) {
        if (!$db || !$user_id) return false;

        try {
            $query = "INSERT INTO notifications (user_id, sender_id, title, message, type, priority, portal, action_url, metadata, is_read, created_at)
                      VALUES (:user_id, :sender_id, :title, :message, :type, :priority, :portal, :action_url, :metadata, 0, NOW())";
            
            $stmt = $db->prepare($query);
            
            $metadata_str = null;
            if ($metadata !== null) {
                $metadata_str = is_string($metadata) ? $metadata : json_encode($metadata);
            }

            $stmt->execute([
                ':user_id'    => $user_id,
                ':sender_id'  => $sender_id ?: null,
                ':title'      => $title,
                ':message'    => $message,
                ':type'       => $type,
                ':priority'   => $priority,
                ':portal'     => $portal,
                ':action_url' => $action_url,
                ':metadata'   => $metadata_str
            ]);

            $notif_id = $db->lastInsertId();

            require_once __DIR__ . '/../../config/PusherHelper.php';
            $pusher = new PusherHelper();
            $pusher->trigger('user-' . $user_id, 'new-notification', [
                'id' => $notif_id,
                'title' => $title,
                'message' => $message,
                'type' => $type,
                'priority' => $priority,
                'portal' => $portal,
                'action_url' => $action_url,
                'metadata' => $metadata_str ? json_decode($metadata_str) : null,
                'created_at' => date('Y-m-d H:i:s')
            ]);

            return true;
        } catch (Exception $e) {
            error_log("Notification Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send notification to all users having a specific role (e.g., 'admin', 'reviewer')
     */
    public static function sendToRole($db, $role, $sender_id, $title, $message, $type, $portal, $action_url = null, $priority = 'normal', $metadata = null) {
        if (!$db || !$role) return false;

        try {
            $stmt = $db->prepare("SELECT user_id FROM user_roles WHERE role = :role");
            $stmt->execute([':role' => $role]);
            $users = $stmt->fetchAll(PDO::FETCH_COLUMN);

            foreach ($users as $uid) {
                if ($sender_id && (int)$uid === (int)$sender_id) {
                    continue; // Don't notify the sender themselves
                }
                self::sendToUser($db, $uid, $sender_id, $title, $message, $type, $portal, $action_url, $priority, $metadata);
            }

            return true;
        } catch (Exception $e) {
            error_log("Notification Role Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send notification to participants of a task (Assignee & Creator)
     */
    public static function sendToTaskParticipants($db, $task_id, $exclude_user_id, $title, $message, $type, $portal, $action_url = null, $priority = 'normal', $metadata = null) {
        if (!$db || !$task_id) return false;

        try {
            $stmt = $db->prepare("SELECT created_by, assigned_to FROM tasks WHERE id = :task_id LIMIT 1");
            $stmt->execute([':task_id' => $task_id]);
            $task = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$task) return false;

            $recipient_users = [];

            // Task creator (user_id)
            if (!empty($task['created_by'])) {
                $recipient_users[] = (int)$task['created_by'];
            }

            // Task assigned_to is employees.id, lookup user_id
            if (!empty($task['assigned_to'])) {
                $emp_stmt = $db->prepare("SELECT user_id FROM employees WHERE id = :emp_id LIMIT 1");
                $emp_stmt->execute([':emp_id' => $task['assigned_to']]);
                $emp_user_id = $emp_stmt->fetchColumn();
                if ($emp_user_id) {
                    $recipient_users[] = (int)$emp_user_id;
                }
            }

            $recipient_users = array_unique($recipient_users);

            foreach ($recipient_users as $uid) {
                if ($exclude_user_id && (int)$uid === (int)$exclude_user_id) {
                    continue;
                }
                self::sendToUser($db, $uid, $exclude_user_id, $title, $message, $type, $portal, $action_url, $priority, $metadata);
            }

            return true;
        } catch (Exception $e) {
            error_log("Notification Participants Error: " . $e->getMessage());
            return false;
        }
    }
}
?>
