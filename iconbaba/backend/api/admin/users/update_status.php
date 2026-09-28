<?php
// backend/api/admin/users/update_status.php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';
require_once __DIR__ . '/../../../helpers/audit.php';

$admin = requireAdmin($pdo);

$data = getJsonInput();
$userId = (int)($data['id'] ?? 0);

if ($userId <= 0) {
    jsonResponse(false, null, 'Valid User ID is required.', 400);
}

// Fetch user
$stmt = $pdo->prepare("SELECT id, username, email, status FROM users WHERE id = :id");
$stmt->execute([':id' => $userId]);
$targetUser = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$targetUser) {
    jsonResponse(false, null, 'User not found.', 404);
}

// Current roles from database
$existingRoles = getUserRolesFromDb($pdo, $userId);

// Determine new roles
$newRoles = $existingRoles;
if (isset($data['roles'])) {
    $incoming = is_array($data['roles']) ? $data['roles'] : explode(',', (string)$data['roles']);
    $parsed = [];
    foreach ($incoming as $r) {
        $r = strtolower(trim((string)$r));
        if (preg_match('/^[a-z0-9_-]{2,50}$/', $r)) {
            $parsed[] = $r;
        }
    }
    if (in_array('admin', $parsed) && !in_array('user', $parsed)) {
        $parsed[] = 'user'; // Admins retain regular user capabilities
    }
    if (empty($parsed)) {
        $parsed = ['user'];
    }
    $newRoles = array_values(array_unique($parsed));
} elseif (isset($data['role']) && !empty($data['role'])) {
    $r = strtolower(trim((string)$data['role']));
    if ($r === 'admin') {
        $newRoles = ['admin', 'user'];
    } else {
        $newRoles = [$r];
    }
}

// Prevent self-demotion or self-suspension
if ((int)$targetUser['id'] === (int)$admin['id']) {
    if (isset($data['status']) && $data['status'] === 'suspended') {
        jsonResponse(false, null, 'You cannot suspend your own admin account.', 400);
    }
    if (!in_array('admin', $newRoles)) {
        jsonResponse(false, null, 'You cannot remove your own admin privileges.', 400);
    }
}

$newStatus = isset($data['status']) && in_array($data['status'], ['active', 'suspended']) 
    ? $data['status'] 
    : $targetUser['status'];

try {
    // 1. Sync roles into user_roles and roles tables
    $syncedRoles = syncUserRoles($pdo, $userId, $newRoles);
    $newRole = in_array('admin', $syncedRoles) ? 'admin' : 'user';

    // 2. Update status in users table
    if ($newStatus !== $targetUser['status']) {
        $updateStmt = $pdo->prepare("
            UPDATE users 
            SET status = :status, updated_at = NOW()
            WHERE id = :id
        ");
        $updateStmt->execute([
            ':status' => $newStatus,
            ':id' => $userId
        ]);
    }

    logAdminAction($pdo, $admin['id'], 'update_user_status', 'user', $userId, [
        'username' => $targetUser['username'],
        'old_status' => $targetUser['status'],
        'new_status' => $newStatus,
        'old_role' => in_array('admin', $existingRoles) ? 'admin' : ($existingRoles[0] ?? 'user'),
        'new_role' => $newRole,
        'old_roles' => $existingRoles,
        'new_roles' => $newRoles
    ]);

    jsonResponse(true, [
        'id' => $userId,
        'status' => $newStatus,
        'role' => $newRole,
        'roles' => $newRoles
    ], 'User updated successfully.');

} catch (Exception $e) {
    jsonResponse(false, null, 'Failed to update user: ' . $e->getMessage(), 500);
}
