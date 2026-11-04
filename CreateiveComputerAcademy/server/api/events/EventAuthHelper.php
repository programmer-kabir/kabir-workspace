<?php
// server/api/events/EventAuthHelper.php
// Centralized authentication and permission helper for CCA Team Events.

class EventAuthHelper {
    public static function getAuthenticatedUser($db) {
        if (!$db) return null;

        $token = null;

        // 1. Authorization Bearer Header
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
        if (!$authHeader && function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            $authHeader = $headers['Authorization'] ?? ($headers['authorization'] ?? '');
        }

        if ($authHeader && preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $token = trim($matches[1]);
        }

        // 2. Query string or POST body
        if (!$token && !empty($_GET['token'])) {
            $token = trim($_GET['token']);
        } elseif (!$token && !empty($_POST['token'])) {
            $token = trim($_POST['token']);
        }

        // 3. JSON body
        if (!$token) {
            $raw = @file_get_contents('php://input');
            if ($raw) {
                $parsed = @json_decode($raw, true);
                if (!empty($parsed['token'])) {
                    $token = trim($parsed['token']);
                }
            }
        }

        if (empty($token)) {
            return null;
        }

        try {
            $stmt = $db->prepare(
                "SELECT u.id, u.name, u.username, u.email, u.phone, u.status, u.profile_picture
                 FROM user_tokens ut
                 INNER JOIN users u ON ut.user_id = u.id
                 WHERE ut.token = :token AND ut.expires_at > NOW()
                 LIMIT 1"
            );
            $stmt->execute([':token' => $token]);

            if ($stmt->rowCount() === 0) {
                return null;
            }

            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($user['status'] !== 'active') {
                return null;
            }

            // Fetch roles
            $role_stmt = $db->prepare("SELECT role FROM user_roles WHERE user_id = :uid");
            $role_stmt->execute([':uid' => $user['id']]);
            $roles = $role_stmt->fetchAll(PDO::FETCH_COLUMN);
            $user['roles'] = $roles ?: [];

            return $user;
        } catch (Throwable $e) {
            return null;
        }
    }

    public static function canManage($user, $event = null) {
        if (!$user) return false;
        $roles = $user['roles'] ?? [];
        if (in_array('admin', $roles) || in_array('developer', $roles)) {
            return true;
        }
        if ($event && !empty($event['lead_user_id']) && (int)$event['lead_user_id'] === (int)$user['id']) {
            return true;
        }
        if ($event && !empty($event['created_by']) && (int)$event['created_by'] === (int)$user['id']) {
            return true;
        }
        return false;
    }
}
?>

