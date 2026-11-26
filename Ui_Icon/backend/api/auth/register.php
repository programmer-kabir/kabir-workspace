<?php
// backend/api/auth/register.php
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
$rateCheck = checkRateLimit($pdo, 'register', $clientIp, 8, 3600);
if (!$rateCheck['allowed']) {
    jsonResponse(false, null, "Too many registration attempts from this IP. Please try again later.", 429);
}

$input = getJsonInput();
$username = sanitizeString($input['username'] ?? '');
$email = sanitizeString($input['email'] ?? '');
$password = $input['password'] ?? '';
$fullName = sanitizeString($input['full_name'] ?? '');

if (empty($username) || empty($email) || empty($password)) {
    jsonResponse(false, null, 'Username, email, and password are required', 400);
}

if (!isValidUsername($username)) {
    jsonResponse(false, null, 'Username must be 3-30 characters (letters, numbers, underscore, dash)', 400);
}

if (!isValidEmail($email)) {
    jsonResponse(false, null, 'Invalid email address format', 400);
}

if (strlen($password) < 8 || !preg_match('/[a-zA-Z]/', $password) || !preg_match('/\d/', $password)) {
    jsonResponse(false, null, 'Password must be at least 8 characters long and contain both letters and numbers.', 400);
}

// Check if username or email already exists
$stmt = $pdo->prepare("SELECT id, username, email FROM users WHERE username = :u OR email = :e LIMIT 1");
$stmt->execute([':u' => $username, ':e' => $email]);
$existing = $stmt->fetch();

if ($existing) {
    if (strtolower($existing['username']) === strtolower($username)) {
        jsonResponse(false, null, 'Username is already taken', 409);
    }
    if (strtolower($existing['email']) === strtolower($email)) {
        jsonResponse(false, null, 'Email address is already registered', 409);
    }
}

// Securely hash password using bcrypt
$passwordHash = password_hash($password, PASSWORD_BCRYPT);

try {
    $pdo->beginTransaction();

    $insertStmt = $pdo->prepare("
        INSERT INTO users (username, email, password_hash, full_name)
        VALUES (:username, :email, :password_hash, :full_name)
    ");
    $insertStmt->execute([
        ':username' => $username,
        ':email' => $email,
        ':password_hash' => $passwordHash,
        ':full_name' => $fullName ?: $username
    ]);
    $userId = $pdo->lastInsertId();

    // Create session token
    $token = generateSessionToken();
    $expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';

    $sessionStmt = $pdo->prepare("
        INSERT INTO user_sessions (user_id, token, ip_address, user_agent, expires_at)
        VALUES (:user_id, :token, :ip, :ua, :expires_at)
    ");
    $sessionStmt->execute([
        ':user_id' => $userId,
        ':token' => $token,
        ':ip' => $ip,
        ':ua' => $ua,
        ':expires_at' => $expiresAt
    ]);

    // Assign default role in user_roles table
    syncUserRoles($pdo, $userId, ['user']);

    $pdo->commit();

    // Notify admins about new user registration
    require_once __DIR__ . '/../../helpers/notifications.php';
    createNotification(
        $pdo,
        'New User Registration',
        "{$username} ({$email}) just created an account on IconBaba.",
        'admin_new_user',
        null,
        'admin',
        null,
        ['user_id' => (int)$userId, 'username' => $username, 'email' => $email],
        'shield'
    );

    jsonResponse(true, [
        'token' => $token,
        'user' => [
            'id' => (int)$userId,
            'username' => $username,
            'email' => $email,
            'full_name' => $fullName ?: $username,
            'role' => 'user',
            'roles' => ['user']
        ]
    ], 'Registration successful', 201);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(false, null, 'Registration failed. Please try again.', 500);
}
