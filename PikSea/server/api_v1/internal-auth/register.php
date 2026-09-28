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
    $name = trim($data['name'] ?? '');
    $email = strtolower(trim($data['email'] ?? ''));
    $password = trim($data['password'] ?? '');

    if (empty($name) || strlen($name) < 2) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Name must be at least 2 characters long"]);
        exit;
    }

    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Please enter a valid email address"]);
        exit;
    }

    if (empty($password) || strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Password must be at least 6 characters long"]);
        exit;
    }

    // 0. Check Rate Limit (Max 3 OTP requests / 30 mins)
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

    // 1. Check if user already exists
    $stmt = $mysqli->prepare("SELECT id, status FROM users WHERE email = ? LIMIT 1");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $existing = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
    $userId = null;

    if ($existing) {
        if ($existing['status'] === 'active') {
            http_response_code(409);
            echo json_encode(["success" => false, "message" => "An account with this email already exists. Please log in."]);
            exit;
        } else if ($existing['status'] === 'banned') {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "This account is permanently banned."]);
            exit;
        } else {
            // Unverified / suspended account re-registering -> update name and password
            $userId = $existing['id'];
            $updateStmt = $mysqli->prepare("UPDATE users SET name = ?, password = ? WHERE id = ?");
            $updateStmt->bind_param("ssi", $name, $hashedPassword, $userId);
            $updateStmt->execute();
            $updateStmt->close();
        }
    } else {
        // Generate unique base username
        $baseUsername = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $name));
        if (empty($baseUsername)) {
            $baseUsername = 'user';
        }
        $username = $baseUsername;
        $isUnique = false;
        while (!$isUnique) {
            $checkUsernameStmt = $mysqli->prepare("SELECT id FROM users WHERE username = ? LIMIT 1");
            $checkUsernameStmt->bind_param("s", $username);
            $checkUsernameStmt->execute();
            if ($checkUsernameStmt->get_result()->num_rows == 0) {
                $isUnique = true;
            } else {
                $username = $baseUsername . rand(100, 9999);
            }
            $checkUsernameStmt->close();
        }

        // Insert new user with 'suspended' status until OTP is verified
        $insertStmt = $mysqli->prepare("
            INSERT INTO users (name, username, email, password, status) 
            VALUES (?, ?, ?, ?, 'suspended')
        ");
        $insertStmt->bind_param("ssss", $name, $username, $email, $hashedPassword);
        $insertStmt->execute();
        $userId = $insertStmt->insert_id;
        $insertStmt->close();

        // Assign default 'user' role
        $roleStmt = $mysqli->prepare("INSERT INTO user_roles (user_id, role) VALUES (?, 'user')");
        $roleStmt->bind_param("i", $userId);
        $roleStmt->execute();
        $roleStmt->close();
    }

    // 2. Generate 6-digit numeric OTP code
    $otpCode = str_pad((string)random_int(100000, 999999), 6, '0', STR_PAD_LEFT);

    // 3. Clear old registration OTPs for this email and save new one
    $delStmt = $mysqli->prepare("DELETE FROM email_verification_codes WHERE email = ? AND type = 'registration'");
    $delStmt->bind_param("s", $email);
    $delStmt->execute();
    $delStmt->close();

    $otpStmt = $mysqli->prepare("
        INSERT INTO email_verification_codes (email, code, type, expires_at)
        VALUES (?, ?, 'registration', DATE_ADD(NOW(), INTERVAL 10 MINUTE))
    ");
    $otpStmt->bind_param("ss", $email, $otpCode);
    $otpStmt->execute();
    $otpStmt->close();

    // 4. Send branded OTP email
    $emailSent = sendEmail($mysqli, $email, $name, 'registration_otp', [
        'otp_code' => $otpCode
    ], $userId);

    // Track OTP request attempt
    AuthRateLimiter::recordFailure($mysqli, $email, 'otp_request', 3, 30);

    echo json_encode([
        "success" => true,
        "message" => "Verification code sent to " . htmlspecialchars($email),
        "email" => $email,
        "email_sent" => $emailSent
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Registration error: " . $e->getMessage()
    ]);
}
