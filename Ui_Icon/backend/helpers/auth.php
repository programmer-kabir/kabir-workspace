<?php
// backend/helpers/auth.php
// Custom Token/Session authentication helper

function getBearerToken() {
    $headers = null;
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER['HTTP_AUTHORIZATION']);
    } else if (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
    } else if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER['Authorization']);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        foreach ($requestHeaders as $key => $val) {
            if (strtolower($key) === 'authorization') {
                $headers = trim($val);
                break;
            }
        }
    }

    if (!empty($headers)) {
        if (preg_match('/Bearer\s+(\S+)/i', $headers, $matches)) {
            return $matches[1];
        }
        return $headers;
    }
    
    // Fallback: check session cookie or GET/POST token parameter
    if (isset($_COOKIE['iconbaba_token'])) {
        return $_COOKIE['iconbaba_token'];
    }
    if (isset($_GET['token'])) {
        return $_GET['token'];
    }
    if (isset($_POST['token'])) {
        return $_POST['token'];
    }

    return null;
}

function getAuthenticatedUser($pdo) {
    $token = getBearerToken();
    if (!$token) {
        return null;
    }

    $stmt = $pdo->prepare("
        SELECT u.id, u.username, u.email, u.full_name, u.avatar_url, u.status, u.created_at, s.expires_at,
               (SELECT GROUP_CONCAT(ur.role_slug SEPARATOR ',') FROM user_roles ur WHERE ur.user_id = u.id) AS db_roles
        FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = :token AND s.expires_at > NOW() AND (u.status = 'active' OR u.status IS NULL)
        LIMIT 1
    ");
    $stmt->execute([':token' => $token]);
    $user = $stmt->fetch();

    if ($user) {
        $rolesList = !empty($user['db_roles']) ? array_map('trim', explode(',', $user['db_roles'])) : ['user'];
        $user['roles_array'] = $rolesList;
        $user['roles'] = $rolesList;
        $user['role'] = in_array('admin', $rolesList) ? 'admin' : ($rolesList[0] ?? 'user');
    }

    return $user ?: null;
}

function getUserRolesFromDb($pdo, $userId) {
    if (!$userId) return ['user'];
    $stmt = $pdo->prepare("
        SELECT role_slug FROM user_roles WHERE user_id = :user_id ORDER BY id ASC
    ");
    $stmt->execute([':user_id' => $userId]);
    $roles = $stmt->fetchAll(PDO::FETCH_COLUMN);
    if (empty($roles)) {
        return ['user'];
    }
    if (in_array('admin', $roles) && !in_array('user', $roles)) {
        $roles[] = 'user';
    }
    return array_values(array_unique($roles));
}

function syncUserRoles($pdo, $userId, array $roleSlugs) {
    if (!$userId) return [];

    $cleaned = [];
    foreach ($roleSlugs as $slug) {
        $s = strtolower(trim((string)$slug));
        if (!empty($s) && preg_match('/^[a-z0-9_-]{2,50}$/', $s)) {
            $cleaned[] = $s;
        }
    }
    if (in_array('admin', $cleaned) && !in_array('user', $cleaned)) {
        $cleaned[] = 'user';
    }
    if (empty($cleaned)) {
        $cleaned = ['user'];
    }
    $cleaned = array_values(array_unique($cleaned));

    // Fetch existing roles in `roles` table
    $roleMap = $pdo->query("SELECT slug, id FROM roles")->fetchAll(PDO::FETCH_KEY_PAIR);
    $insertRoleStmt = $pdo->prepare("
        INSERT INTO roles (slug, name, description) 
        VALUES (:slug, :name, :description)
    ");

    foreach ($cleaned as $rSlug) {
        if (!isset($roleMap[$rSlug])) {
            $roleName = ucwords(str_replace(['_', '-'], ' ', $rSlug));
            $insertRoleStmt->execute([
                ':slug' => $rSlug,
                ':name' => $roleName,
                ':description' => "Role: {$roleName}"
            ]);
            $roleMap[$rSlug] = (int)$pdo->lastInsertId();
        }
    }

    // Replace in user_roles table
    $delStmt = $pdo->prepare("DELETE FROM user_roles WHERE user_id = :user_id");
    $delStmt->execute([':user_id' => $userId]);

    $insertUserRole = $pdo->prepare("
        INSERT INTO user_roles (user_id, role_id, role_slug) 
        VALUES (:user_id, :role_id, :role_slug)
    ");
    foreach ($cleaned as $rSlug) {
        $insertUserRole->execute([
            ':user_id' => $userId,
            ':role_id' => $roleMap[$rSlug],
            ':role_slug' => $rSlug
        ]);
    }

    // Update users timestamp without referencing non-existent role columns
    $pdo->prepare("UPDATE users SET updated_at = NOW() WHERE id = :id")->execute([':id' => $userId]);

    return $cleaned;
}

function getUserRoles($user) {
    if (!$user) return ['user'];
    if (!empty($user['roles_array']) && is_array($user['roles_array'])) {
        return $user['roles_array'];
    }
    $roles = [];
    if (!empty($user['db_roles'])) {
        $roles = array_map('trim', explode(',', $user['db_roles']));
    } elseif (!empty($user['roles'])) {
        $roles = array_map('trim', explode(',', $user['roles']));
    }
    if (!empty($user['role']) && !in_array($user['role'], $roles)) {
        $roles[] = $user['role'];
    }
    if (in_array('admin', $roles) && !in_array('user', $roles)) {
        $roles[] = 'user';
    }
    if (empty($roles)) {
        $roles = ['user'];
    }
    return array_values(array_unique($roles));
}

function userHasRole($user, $role) {
    $roles = getUserRoles($user);
    return in_array($role, $roles);
}

function requireAuth($pdo) {
    $user = getAuthenticatedUser($pdo);
    if (!$user) {
        jsonResponse(false, null, 'Unauthorized. Please log in to continue.', 401);
    }
    return $user;
}

function requireAdmin($pdo) {
    $user = requireAuth($pdo);
    if (!userHasRole($user, 'admin') && ($user['role'] ?? '') !== 'admin') {
        jsonResponse(false, null, 'Forbidden. Administrator access required.', 403);
    }
    return $user;
}

function generateSessionToken() {
    return bin2hex(random_bytes(32));
}

