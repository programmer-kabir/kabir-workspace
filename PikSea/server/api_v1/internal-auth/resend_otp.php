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
    $type = trim($data['type'] ?? 'registration');

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

    // Lookup user name
    $stmt = $mysqli->prepare("SELECT id, name FROM users WHERE email = ? LIMIT 1");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $userRow = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    $userName = $userRow['name'] ?? 'User';
    $userId = $userRow['id'] ?? null;

    // Check last sent code for 60-second cooldown
    $checkStmt = $mysqli->prepare("
        SELECT created_at, TIMESTAMPDIFF(SECOND, created_at, NOW()) as seconds_ago 
        FROM email_verification_codes 
        WHERE email = ? AND type = ? 
        ORDER BY id DESC LIMIT 1
    ");
    $checkStmt->bind_param("ss", $email, $type);
    $checkStmt->execute();
    $lastOtp = $checkStmt->get_result()->fetch_assoc();
    $checkStmt->close();

    if ($lastOtp && (int)$lastOtp['seconds_ago'] < 60) {
        $remaining = 60 - (int)$lastOtp['seconds_ago'];
        http_response_code(429);
        echo json_encode([
            "success" => false, 
            "message" => "Please wait {$remaining} seconds before requesting a new code.",
            "remaining_seconds" => $remaining
        ]);
        exit;
    }

    // Generate new 6-digit OTP code
    $otpCode = str_pad((string)random_int(100000, 999999), 6, '0', STR_PAD_LEFT);

    // Delete old OTPs for this email and type
    $delStmt = $mysqli->prepare("DELETE FROM email_verification_codes WHERE email = ? AND type = ?");
    $delStmt->bind_param("ss", $email, $type);
    $delStmt->execute();
    $delStmt->close();

    // Insert new OTP
    $insertStmt = $mysqli->prepare("
        INSERT INTO email_verification_codes (email, code, type, expires_at)
        VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))
    ");
    $insertStmt->bind_param("sss", $email, $otpCode, $type);
    $insertStmt->execute();
    $insertStmt->close();

    // Template selection
    $templateType = ($type === 'password_reset') ? 'password_reset_otp' : 'registration_otp';

    $emailSent = sendEmail($mysqli, $email, $userName, $templateType, [
        'otp_code' => $otpCode
    ], $userId);

    // Track OTP request attempt
    AuthRateLimiter::recordFailure($mysqli, $email, 'otp_request', 3, 30);

    echo json_encode([
        "success" => true,
        "message" => "A new verification code has been sent to " . htmlspecialchars($email),
        "email_sent" => $emailSent
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error resending code: " . $e->getMessage()
    ]);
}
