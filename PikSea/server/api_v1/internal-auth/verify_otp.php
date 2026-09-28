<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/CustomJWT.php';
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
    $code = trim($data['code'] ?? '');
    $type = trim($data['type'] ?? 'registration');

    if (empty($email) || empty($code)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Email and verification code are required"]);
        exit;
    }

    // 0. Check Rate Limit (3 attempts / 30 mins)
    $rateCheck = AuthRateLimiter::check($mysqli, $email, 'otp_verify');
    if (!$rateCheck['allowed']) {
        http_response_code(429);
        echo json_encode([
            "success" => false,
            "message" => $rateCheck['message'],
            "remaining_minutes" => $rateCheck['remaining_minutes'] ?? 30
        ]);
        exit;
    }

    // 1. Verify OTP code
    $stmt = $mysqli->prepare("
        SELECT id FROM email_verification_codes 
        WHERE email = ? AND code = ? AND type = ? AND expires_at > NOW()
        ORDER BY id DESC LIMIT 1
    ");
    $stmt->bind_param("sss", $email, $code, $type);
    $stmt->execute();
    $otpResult = $stmt->get_result();

    if ($otpResult->num_rows === 0) {
        $failResult = AuthRateLimiter::recordFailure($mysqli, $email, 'otp_verify', 3, 30);
        http_response_code($failResult['locked'] ? 429 : 400);
        echo json_encode([
            "success" => false, 
            "message" => $failResult['locked'] ? $failResult['message'] : "Invalid or expired verification code. " . $failResult['message']
        ]);
        exit;
    }
    $otpRow = $otpResult->fetch_assoc();
    $stmt->close();

    // Clear failed attempts on valid OTP code
    AuthRateLimiter::clear($mysqli, $email, 'otp_verify');

    if ($type === 'registration') {
        // 2. Activate user
        $updateStmt = $mysqli->prepare("UPDATE users SET status = 'active', last_active = NOW() WHERE email = ?");
        $updateStmt->bind_param("s", $email);
        $updateStmt->execute();
        $updateStmt->close();

        // 3. Clean up OTP code
        $delStmt = $mysqli->prepare("DELETE FROM email_verification_codes WHERE email = ? AND type = 'registration'");
        $delStmt->bind_param("s", $email);
        $delStmt->execute();
        $delStmt->close();

        // 4. Fetch user profile and roles
        $userStmt = $mysqli->prepare("
            SELECT 
                u.id, 
                u.name, 
                u.username, 
                u.email, 
                u.photo, 
                u.status,
                GROUP_CONCAT(ur.role SEPARATOR ',') AS roles
            FROM users u
            LEFT JOIN user_roles ur ON ur.user_id = u.id
            WHERE u.email = ?
            GROUP BY u.id
            LIMIT 1
        ");
        $userStmt->bind_param("s", $email);
        $userStmt->execute();
        $user = $userStmt->get_result()->fetch_assoc();
        $userStmt->close();

        if (!$user) {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "User account not found"]);
            exit;
        }

        $user['roles'] = $user['roles'] ? explode(',', $user['roles']) : ['user'];

        // 5. Generate JWT Token
        $token = CustomJWT::generateToken([
            'user_id' => (int)$user['id'],
            'email'   => $user['email'],
            'name'    => $user['name'],
            'roles'   => $user['roles']
        ], 2592000); // 30 days

        echo json_encode([
            "success" => true,
            "message" => "Email verified and account activated successfully!",
            "token"   => $token,
            "user"    => $user
        ]);
    } else if ($type === 'password_reset') {
        // For password reset, don't delete yet or mark as verified token
        $resetToken = CustomJWT::generateToken([
            'email' => $email,
            'purpose' => 'password_reset'
        ], 900); // 15 mins

        echo json_encode([
            "success" => true,
            "message" => "Verification code verified successfully.",
            "reset_token" => $resetToken
        ]);
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Unsupported OTP type"]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Verification error: " . $e->getMessage()
    ]);
}
