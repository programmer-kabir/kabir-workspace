<?php
// backend/api/auth/login.php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';
require_once __DIR__ . '/../../helpers/validator.php';
require_once __DIR__ . '/../../helpers/rate_limit.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, null, 'Method not allowed', 405);
}

$clientIp = getClientIpAddress();
$rateCheck = checkRateLimit($pdo, 'login', $clientIp, 5, 300);
if (!$rateCheck['allowed']) {
    jsonResponse(false, null, "Too many failed login attempts. Please try again in {$rateCheck['remaining_seconds']} seconds.", 429);
}

$input = getJsonInput();
$login = sanitizeString($input['login'] ?? $input['email'] ?? $input['username'] ?? '');
$password = $input['password'] ?? '';

if (empty($login) || empty($password)) {
    jsonResponse(false, null, 'Login identifier (email or username) and password are required', 400);
}

// Find user by email or username
$stmt = $pdo->prepare("
    SELECT u.id, u.username, u.email, u.password_hash, u.full_name, u.avatar_url, u.status,
           (SELECT GROUP_CONCAT(ur.role_slug SEPARATOR ',') FROM user_roles ur WHERE ur.user_id = u.id) AS db_roles
    FROM users u 
    WHERE u.email = :email OR u.username = :username 
    LIMIT 1
");
$stmt->execute([':email' => $login, ':username' => $login]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    recordFailedAttempt($pdo, 'login', $clientIp);
    jsonResponse(false, null, 'Invalid credentials', 401);
}

if (($user['status'] ?? 'active') === 'suspended') {
    jsonResponse(false, null, 'Your account has been suspended by an administrator.', 403);
}

// Clear rate limit on successful authentication
clearFailedAttempts($pdo, 'login', $clientIp);

// Create new session token
$token = generateSessionToken();
$expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));
$ip = $_SERVER['REMOTE_ADDR'] ?? '';
$ua = $_SERVER['HTTP_USER_AGENT'] ?? '';

$sessionStmt = $pdo->prepare("
    INSERT INTO user_sessions (user_id, token, ip_address, user_agent, expires_at)
    VALUES (:user_id, :token, :ip, :ua, :expires_at)
");
$sessionStmt->execute([
    ':user_id' => $user['id'],
    ':token' => $token,
    ':ip' => $ip,
    ':ua' => $ua,
    ':expires_at' => $expiresAt
]);

$userRoles = getUserRoles($user);
$primaryRole = in_array('admin', $userRoles) ? 'admin' : ($userRoles[0] ?? 'user');

jsonResponse(true, [
    'token' => $token,
    'user' => [
        'id' => (int)$user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'full_name' => $user['full_name'] ?: $user['username'],
        'avatar_url' => $user['avatar_url'],
        'role' => $primaryRole,
        'roles' => $userRoles,
        'status' => $user['status'] ?? 'active'
    ]
], 'Login successful');
