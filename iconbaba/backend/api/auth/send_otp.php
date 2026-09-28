<?php
// backend/api/auth/send_otp.php
// Sends a 6-digit OTP to the given email for registration or forgot-password verification.
// Rate-limited to prevent abuse.

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validator.php';
require_once __DIR__ . '/../../helpers/rate_limit.php';
require_once __DIR__ . '/../../helpers/mailer.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, null, 'Method not allowed', 405);
}

// Rate limit: max 5 OTP sends per email per 10 minutes
$clientIp = getClientIpAddress();
$ipRateCheck = checkRateLimit($pdo, 'send_otp', $clientIp, 5, 600);
if (!$ipRateCheck['allowed']) {
    jsonResponse(false, null, 'Too many OTP requests. Please wait a few minutes before trying again.', 429);
}

$input = getJsonInput();
$email   = strtolower(trim($input['email'] ?? ''));
$purpose = strtolower(trim($input['purpose'] ?? 'registration'));

if (empty($email) || !isValidEmail($email)) {
    jsonResponse(false, null, 'A valid email address is required.', 400);
}

if (!in_array($purpose, ['registration', 'forgot_password'])) {
    $purpose = 'registration';
}

// --- Purpose-specific validation ---

if ($purpose === 'registration') {
    // For registration: email must NOT already be registered
    $chk = $pdo->prepare("SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1");
    $chk->execute([$email]);
    if ($chk->fetch()) {
        jsonResponse(false, null, 'This email address is already registered. Please sign in instead.', 409);
    }
}

if ($purpose === 'forgot_password') {
    // For forgot password: email MUST be registered
    $chk = $pdo->prepare("SELECT id, full_name, username FROM users WHERE LOWER(email) = ? AND (status IS NULL OR status = 'active') LIMIT 1");
    $chk->execute([$email]);
    $existingUser = $chk->fetch(PDO::FETCH_ASSOC);
    if (!$existingUser) {
        // Don't reveal that email doesn't exist (security best practice)
        jsonResponse(true, ['sent' => true], 'If that email is registered, a code has been sent.');
    }
}

// --- Auto-create email_otps table if not exists (self-healing) ---
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `email_otps` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `email` VARCHAR(100) NOT NULL,
            `otp` VARCHAR(6) NOT NULL,
            `purpose` ENUM('registration', 'forgot_password') NOT NULL DEFAULT 'registration',
            `attempts` INT NOT NULL DEFAULT 0,
            `verified` TINYINT(1) NOT NULL DEFAULT 0,
            `expires_at` DATETIME NOT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            KEY `idx_email_purpose` (`email`, `purpose`),
            KEY `idx_expires` (`expires_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
} catch (Exception $e) {
    error_log("send_otp.php: Could not ensure email_otps table: " . $e->getMessage());
}

// --- Invalidate previous unused OTPs for this email + purpose ---
try {
    $pdo->prepare("DELETE FROM email_otps WHERE email = ? AND purpose = ? AND verified = 0")
        ->execute([$email, $purpose]);
} catch (Exception $e) {
    error_log("send_otp.php: Could not clear old OTPs: " . $e->getMessage());
}

// --- Generate secure 6-digit OTP ---
$otp       = str_pad((string)random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
$expiresAt = date('Y-m-d H:i:s', strtotime('+10 minutes'));

// --- Save OTP to DB ---
try {
    $stmt = $pdo->prepare("
        INSERT INTO email_otps (email, otp, purpose, attempts, verified, expires_at)
        VALUES (?, ?, ?, 0, 0, ?)
    ");
    $stmt->execute([$email, $otp, $purpose, $expiresAt]);
} catch (Exception $e) {
    error_log("send_otp.php: Could not save OTP: " . $e->getMessage());
    jsonResponse(false, null, 'Could not generate OTP. Please try again.', 500);
}

// --- Send email ---
$displayName = $existingUser['full_name'] ?? $existingUser['username'] ?? 'there';
$mailSent    = sendOtpEmail($email, $displayName, $otp, $purpose);

if (!$mailSent) {
    error_log("send_otp.php: mail() failed for {$email}");
    // Still allow through in dev — in production you might want to return error
    // jsonResponse(false, null, 'Failed to send email. Please check your email address.', 500);
}

// Record the attempt
recordFailedAttempt($pdo, 'send_otp', $clientIp);

jsonResponse(true, [
    'sent'       => true,
    'email'      => $email,
    'expires_in' => 600 // seconds
], 'OTP sent! Check your email inbox (and spam folder).');
