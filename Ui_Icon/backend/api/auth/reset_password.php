<?php
// backend/api/auth/reset_password.php
// Resets a user's password using the reset_token received after OTP verification.

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';
require_once __DIR__ . '/../../helpers/validator.php';
require_once __DIR__ . '/../../helpers/rate_limit.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, null, 'Method not allowed', 405);
}

$clientIp  = getClientIpAddress();
$rateCheck = checkRateLimit($pdo, 'reset_password', $clientIp, 5, 600);
if (!$rateCheck['allowed']) {
    jsonResponse(false, null, 'Too many reset attempts. Please wait before trying again.', 429);
}

$input       = getJsonInput();
$resetToken  = trim($input['reset_token'] ?? '');
$newPassword = $input['password'] ?? '';

if (empty($resetToken) || empty($newPassword)) {
    jsonResponse(false, null, 'Reset token and new password are required.', 400);
}

if (strlen($newPassword) < 8 || !preg_match('/[a-zA-Z]/', $newPassword) || !preg_match('/\d/', $newPassword)) {
    jsonResponse(false, null, 'Password must be at least 8 characters with letters and numbers.', 400);
}

// --- Look up the reset token ---
try {
    $stmt = $pdo->prepare("
        SELECT id, email, expires_at, used
        FROM password_resets
        WHERE token = ? AND used = 0
        LIMIT 1
    ");
    $stmt->execute([$resetToken]);
    $reset = $stmt->fetch(PDO::FETCH_ASSOC);
} catch (Exception $e) {
    error_log("reset_password.php: DB error: " . $e->getMessage());
    jsonResponse(false, null, 'Reset failed. Please try again.', 500);
}

if (!$reset) {
    jsonResponse(false, null, 'Invalid or already-used reset link. Please request a new one.', 400);
}

if (strtotime($reset['expires_at']) < time()) {
    $pdo->prepare("DELETE FROM password_resets WHERE id = ?")->execute([$reset['id']]);
    jsonResponse(false, null, 'This reset link has expired. Please request a new one.', 400);
}

// --- Update password ---
$email        = $reset['email'];
$passwordHash = password_hash($newPassword, PASSWORD_BCRYPT);

try {
    $pdo->beginTransaction();

    // Update user password
    $upd = $pdo->prepare("UPDATE users SET password_hash = ?, updated_at = NOW() WHERE LOWER(email) = ?");
    $upd->execute([$passwordHash, strtolower($email)]);

    if ($upd->rowCount() === 0) {
        $pdo->rollBack();
        jsonResponse(false, null, 'User not found. Please register first.', 404);
    }

    // Mark token as used
    $pdo->prepare("UPDATE password_resets SET used = 1 WHERE id = ?")->execute([$reset['id']]);

    // Invalidate ALL existing sessions for this user (force re-login for security)
    $userRow = $pdo->prepare("SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1");
    $userRow->execute([strtolower($email)]);
    $userData = $userRow->fetch(PDO::FETCH_ASSOC);

    if ($userData) {
        $pdo->prepare("DELETE FROM user_sessions WHERE user_id = ?")->execute([$userData['id']]);

        // Auto-login: create a fresh session token
        $newToken  = generateSessionToken();
        $expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));
        $ip        = $_SERVER['REMOTE_ADDR'] ?? '';
        $ua        = $_SERVER['HTTP_USER_AGENT'] ?? '';

        $pdo->prepare("
            INSERT INTO user_sessions (user_id, token, ip_address, user_agent, expires_at)
            VALUES (?, ?, ?, ?, ?)
        ")->execute([$userData['id'], $newToken, $ip, $ua, $expiresAt]);
    }

    $pdo->commit();
    clearFailedAttempts($pdo, 'reset_password', $clientIp);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("reset_password.php: Error: " . $e->getMessage());
    jsonResponse(false, null, 'Password reset failed. Please try again.', 500);
}

// Fetch user info for auto-login response
try {
    $meStmt = $pdo->prepare("
        SELECT u.id, u.username, u.email, u.full_name, u.avatar_url,
               (SELECT GROUP_CONCAT(ur.role_slug SEPARATOR ',') FROM user_roles ur WHERE ur.user_id = u.id) AS db_roles
        FROM users u WHERE LOWER(u.email) = ? LIMIT 1
    ");
    $meStmt->execute([strtolower($email)]);
    $meUser = $meStmt->fetch(PDO::FETCH_ASSOC);
} catch (Exception $e) {
    $meUser = null;
}

$userRoles = $meUser ? (
    !empty($meUser['db_roles']) ? array_map('trim', explode(',', $meUser['db_roles'])) : ['user']
) : ['user'];

jsonResponse(true, [
    'token' => $newToken ?? null,
    'user'  => $meUser ? [
        'id'        => (int)$meUser['id'],
        'username'  => $meUser['username'],
        'email'     => $meUser['email'],
        'full_name' => $meUser['full_name'] ?: $meUser['username'],
        'avatar_url'=> $meUser['avatar_url'],
        'role'      => in_array('admin', $userRoles) ? 'admin' : ($userRoles[0] ?? 'user'),
        'roles'     => $userRoles
    ] : null
], 'Password reset successful! You are now signed in.');
