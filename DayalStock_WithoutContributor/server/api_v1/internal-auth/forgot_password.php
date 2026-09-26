<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helper/email_helper.php';
require_once __DIR__ . '/../helper/auth_rate_limiter.php';

header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

try {
    $data = json_decode(file_get_contents("php://input"), true);
    $email = strtolower(trim($data['email'] ?? ''));

    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Please provide a valid email address"]);
        exit;
    }

    // 0. Check Rate Limit (3 attempts / 30 mins)
    $rateCheck = AuthRateLimiter::check($mysqli, $email, 'otp_request');
    if (!$rateCheck['allowed']) {
        http_response_code(429);
        echo json_encode([
            "success" => false,
            "message" => $rateCheck['message'],
            "remaining_minutes" => $rateCheck['remaining_minutes'] ?? 30
        ]);
        exit;
    }

    // 1. Check if user exists
    $stmt = $mysqli->prepare("SELECT id, name, status FROM users WHERE email = ? LIMIT 1");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$user) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "No account found with this email address"]);
        exit;
    }

    if ($user['status'] === 'banned') {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "This account is banned. Password reset not available."]);
        exit;
    }

    // 2. Generate 6-digit OTP code
    $otpCode = str_pad((string)random_int(100000, 999999), 6, '0', STR_PAD_LEFT);

    // 3. Clear old reset codes and save new one
    $delStmt = $mysqli->prepare("DELETE FROM email_verification_codes WHERE email = ? AND type = 'password_reset'");
    $delStmt->bind_param("s", $email);
    $delStmt->execute();
    $delStmt->close();

    $insertStmt = $mysqli->prepare("
        INSERT INTO email_verification_codes (email, code, type, expires_at)
        VALUES (?, ?, 'password_reset', DATE_ADD(NOW(), INTERVAL 15 MINUTE))
    ");
    $insertStmt->bind_param("ss", $email, $otpCode);
    $insertStmt->execute();
    $insertStmt->close();

    // 4. Send email
    $emailSent = sendEmail($mysqli, $email, $user['name'] ?? 'User', 'password_reset_otp', [
        'otp_code' => $otpCode
    ], $user['id']);

    // Track OTP request attempt
    AuthRateLimiter::recordFailure($mysqli, $email, 'otp_request', 3, 30);

    echo json_encode([
        "success" => true,
        "message" => "Password reset code sent to " . htmlspecialchars($email),
        "email_sent" => $emailSent
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error sending reset code: " . $e->getMessage()
    ]);
}
