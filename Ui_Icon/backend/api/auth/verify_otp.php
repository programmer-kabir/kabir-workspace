<?php
// backend/api/auth/verify_otp.php
// Verifies a 6-digit OTP for registration or forgot_password.
// For registration: also completes account creation.
// For forgot_password: marks OTP as verified so reset_password.php can proceed.

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';
require_once __DIR__ . '/../../helpers/validator.php';
require_once __DIR__ . '/../../helpers/rate_limit.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, null, 'Method not allowed', 405);
}

// Rate limit: max 10 verify attempts per IP per 10 minutes (brute-force protection)
$clientIp  = getClientIpAddress();
$rateCheck = checkRateLimit($pdo, 'verify_otp', $clientIp, 10, 600);
if (!$rateCheck['allowed']) {
    jsonResponse(false, null, 'Too many verification attempts. Please wait before trying again.', 429);
}

$input   = getJsonInput();
$email   = strtolower(trim($input['email'] ?? ''));
$otp     = trim($input['otp'] ?? '');
$purpose = strtolower(trim($input['purpose'] ?? 'registration'));

if (empty($email) || empty($otp)) {
    jsonResponse(false, null, 'Email and OTP code are required.', 400);
}

if (!in_array($purpose, ['registration', 'forgot_password'])) {
    $purpose = 'registration';
}

// --- Lookup active OTP ---
try {
    $stmt = $pdo->prepare("
        SELECT id, otp, attempts, verified, expires_at
        FROM email_otps
        WHERE LOWER(email) = ? AND purpose = ? AND verified = 0
        ORDER BY id DESC LIMIT 1
    ");
    $stmt->execute([$email, $purpose]);
    $record = $stmt->fetch(PDO::FETCH_ASSOC);
} catch (Exception $e) {
    error_log("verify_otp.php: DB error: " . $e->getMessage());
    jsonResponse(false, null, 'Verification failed. Please try again.', 500);
}

if (!$record) {
    jsonResponse(false, null, 'No active OTP found for this email. Please request a new code.', 400);
}

// --- Check expiry ---
if (strtotime($record['expires_at']) < time()) {
    $pdo->prepare("DELETE FROM email_otps WHERE id = ?")->execute([$record['id']]);
    jsonResponse(false, null, 'Your code has expired. Please request a new one.', 400);
}

// --- Check too many failed attempts (max 5 per OTP) ---
if ((int)$record['attempts'] >= 5) {
    $pdo->prepare("DELETE FROM email_otps WHERE id = ?")->execute([$record['id']]);
    jsonResponse(false, null, 'Too many incorrect attempts. Please request a new OTP.', 400);
}

// --- Verify OTP ---
if ($record['otp'] !== $otp) {
    $pdo->prepare("UPDATE email_otps SET attempts = attempts + 1 WHERE id = ?")->execute([$record['id']]);
    $remaining = 4 - (int)$record['attempts'];
    jsonResponse(false, null, "Incorrect code. {$remaining} attempt(s) remaining.", 400);
}

// --- OTP is correct ---
// Mark as verified
$pdo->prepare("UPDATE email_otps SET verified = 1 WHERE id = ?")->execute([$record['id']]);

// Clear rate limit on success
clearFailedAttempts($pdo, 'verify_otp', $clientIp);

// ============================================================
// FOR REGISTRATION: complete the account creation now
// ============================================================
if ($purpose === 'registration') {
    $username  = sanitizeString($input['username'] ?? '');
    $password  = $input['password'] ?? '';
    $fullName  = sanitizeString($input['full_name'] ?? '');

    if (empty($username) || empty($password)) {
        jsonResponse(false, null, 'Username and password are required to complete registration.', 400);
    }

    if (!isValidUsername($username)) {
        jsonResponse(false, null, 'Username must be 3-30 characters (letters, numbers, underscore, dash).', 400);
    }

    if (strlen($password) < 8 || !preg_match('/[a-zA-Z]/', $password) || !preg_match('/\d/', $password)) {
        jsonResponse(false, null, 'Password must be at least 8 characters with letters and numbers.', 400);
    }

    // Double-check uniqueness (race condition guard)
    $dupCheck = $pdo->prepare("SELECT id FROM users WHERE username = ? OR LOWER(email) = ? LIMIT 1");
    $dupCheck->execute([$username, $email]);
    $dup = $dupCheck->fetch();
    if ($dup) {
        jsonResponse(false, null, 'Username or email is already taken.', 409);
    }

    $passwordHash = password_hash($password, PASSWORD_BCRYPT);

    try {
        $pdo->beginTransaction();

        $insertStmt = $pdo->prepare("
            INSERT INTO users (username, email, password_hash, full_name)
            VALUES (:username, :email, :password_hash, :full_name)
        ");
        $insertStmt->execute([
            ':username'      => $username,
            ':email'         => $email,
            ':password_hash' => $passwordHash,
            ':full_name'     => $fullName ?: $username
        ]);
        $userId = $pdo->lastInsertId();

        // Create session token
        $token     = generateSessionToken();
        $expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));
        $ip        = $_SERVER['REMOTE_ADDR'] ?? '';
        $ua        = $_SERVER['HTTP_USER_AGENT'] ?? '';

        $sessionStmt = $pdo->prepare("
            INSERT INTO user_sessions (user_id, token, ip_address, user_agent, expires_at)
            VALUES (:user_id, :token, :ip, :ua, :expires_at)
        ");
        $sessionStmt->execute([
            ':user_id'    => $userId,
            ':token'      => $token,
            ':ip'         => $ip,
            ':ua'         => $ua,
            ':expires_at' => $expiresAt
        ]);

        // Assign default role
        syncUserRoles($pdo, $userId, ['user']);

        $pdo->commit();

        // Notify admins
        require_once __DIR__ . '/../../helpers/notifications.php';
        createNotification(
            $pdo,
            'New Verified User Registration',
            "{$username} ({$email}) just created a verified account on IconBaba.",
            'admin_new_user',
            null,
            'admin',
            null,
            ['user_id' => (int)$userId, 'username' => $username, 'email' => $email],
            'shield'
        );

        // Clean up verified OTP
        $pdo->prepare("DELETE FROM email_otps WHERE LOWER(email) = ? AND purpose = 'registration'")->execute([$email]);

        jsonResponse(true, [
            'token' => $token,
            'user'  => [
                'id'        => (int)$userId,
                'username'  => $username,
                'email'     => $email,
                'full_name' => $fullName ?: $username,
                'role'      => 'user',
                'roles'     => ['user']
            ]
        ], 'Registration successful! Welcome to IconBaba.', 201);

    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("verify_otp registration error: " . $e->getMessage());
        jsonResponse(false, null, 'Registration failed. Please try again.', 500);
    }
}

// ============================================================
// FOR FORGOT PASSWORD: return a short-lived reset token
// ============================================================
if ($purpose === 'forgot_password') {
    // Generate a one-time reset token (separate from session tokens)
    $resetToken = bin2hex(random_bytes(32));
    $resetExpiry = date('Y-m-d H:i:s', strtotime('+15 minutes'));

    // Store reset token in email_otps with special marker or use password_resets table
    // We'll use a simple approach: store in email_otps as a verified record with reset token in otp field
    // Better: use the password_resets table — auto-create it
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `password_resets` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `email` VARCHAR(100) NOT NULL,
                `token` VARCHAR(64) NOT NULL UNIQUE,
                `expires_at` DATETIME NOT NULL,
                `used` TINYINT(1) NOT NULL DEFAULT 0,
                `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                KEY `idx_email` (`email`),
                KEY `idx_token` (`token`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        // Invalidate old reset tokens for this email
        $pdo->prepare("DELETE FROM password_resets WHERE LOWER(email) = ?")->execute([$email]);

        $pdo->prepare("INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)")
            ->execute([$email, $resetToken, $resetExpiry]);

    } catch (Exception $e) {
        error_log("verify_otp forgot_password token save error: " . $e->getMessage());
        jsonResponse(false, null, 'Could not generate reset token. Please try again.', 500);
    }

    // Clean up the verified OTP
    $pdo->prepare("DELETE FROM email_otps WHERE LOWER(email) = ? AND purpose = 'forgot_password'")->execute([$email]);

    jsonResponse(true, [
        'reset_token'   => $resetToken,
        'expires_in'    => 900 // 15 minutes
    ], 'OTP verified! Use the reset token to set your new password.');
}
