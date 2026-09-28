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
    $password = trim($data['password'] ?? '');

    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Email and password are required"]);
        exit;
    }

    // 0. Check Rate Limit (3 attempts / 30 mins)
    $rateCheck = AuthRateLimiter::check($mysqli, $email, 'login');
    if (!$rateCheck['allowed']) {
        http_response_code(429);
        echo json_encode([
            "success" => false,
            "message" => $rateCheck['message'],
            "remaining_minutes" => $rateCheck['remaining_minutes'] ?? 30
        ]);
        exit;
    }

    // 1. Fetch user by email
    $stmt = $mysqli->prepare("
        SELECT 
            u.id, 
            u.name, 
            u.username, 
            u.email, 
            u.password, 
            u.photo, 
            u.status,
            GROUP_CONCAT(ur.role SEPARATOR ',') AS roles
        FROM users u
        LEFT JOIN user_roles ur ON ur.user_id = u.id
        WHERE u.email = ?
        GROUP BY u.id
        LIMIT 1
    ");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        $failResult = AuthRateLimiter::recordFailure($mysqli, $email, 'login', 3, 30);
        http_response_code($failResult['locked'] ? 429 : 401);
        echo json_encode([
            "success" => false, 
            "message" => $failResult['locked'] ? $failResult['message'] : "Invalid email or password. " . $failResult['message']
        ]);
        exit;
    }

    $user = $result->fetch_assoc();
    $stmt->close();

    // 2. Verify password
    if (!password_verify($password, $user['password'])) {
        $failResult = AuthRateLimiter::recordFailure($mysqli, $email, 'login', 3, 30);
        http_response_code($failResult['locked'] ? 429 : 401);
        echo json_encode([
            "success" => false, 
            "message" => $failResult['locked'] ? $failResult['message'] : "Invalid email or password. " . $failResult['message']
        ]);
        exit;
    }

    // Clear failed attempts upon successful password verification
    AuthRateLimiter::clear($mysqli, $email, 'login');

    // 3. Status checks
    if ($user['status'] === 'suspended') {
        http_response_code(403);
        echo json_encode([
            "success" => false,
            "needs_verification" => true,
            "email" => $user['email'],
            "message" => "Your account is pending email verification. Please verify your OTP code."
        ]);
        exit;
    }

    if ($user['status'] === 'banned') {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Your account has been banned. Please contact support."]);
        exit;
    }

    if ($user['status'] === 'deactivated') {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Your account has been deactivated."]);
        exit;
    }

    // 4. Update last_active
    $updateStmt = $mysqli->prepare("UPDATE users SET last_active = NOW() WHERE id = ?");
    $updateStmt->bind_param("i", $user['id']);
    $updateStmt->execute();
    $updateStmt->close();

    // 5. Build response and JWT
    $user['roles'] = $user['roles'] ? explode(',', $user['roles']) : ['user'];
    unset($user['password']);

    $token = CustomJWT::generateToken([
        'user_id' => (int)$user['id'],
        'email'   => $user['email'],
        'name'    => $user['name'],
        'roles'   => $user['roles']
    ], 2592000); // 30 days

    echo json_encode([
        "success" => true,
        "message" => "Login successful",
        "token"   => $token,
        "user"    => $user
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Login error: " . $e->getMessage()
    ]);
}
