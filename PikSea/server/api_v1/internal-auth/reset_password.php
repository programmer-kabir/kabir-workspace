<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/CustomJWT.php';

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
    $newPassword = trim($data['new_password'] ?? '');

    if (empty($email) || empty($code) || empty($newPassword)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Email, OTP code, and new password are required"]);
        exit;
    }

    if (strlen($newPassword) < 6) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "New password must be at least 6 characters long"]);
        exit;
    }

    // 1. Verify OTP code
    $stmt = $mysqli->prepare("
        SELECT id FROM email_verification_codes 
        WHERE email = ? AND code = ? AND type = 'password_reset' AND expires_at > NOW()
        ORDER BY id DESC LIMIT 1
    ");
    $stmt->bind_param("ss", $email, $code);
    $stmt->execute();
    $otpResult = $stmt->get_result();

    if ($otpResult->num_rows === 0) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid or expired reset code"]);
        exit;
    }
    $stmt->close();

    // 2. Hash new password and update user
    $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);
    $updateStmt = $mysqli->prepare("UPDATE users SET password = ?, status = 'active', last_active = NOW() WHERE email = ?");
    $updateStmt->bind_param("ss", $hashedPassword, $email);
    $updateStmt->execute();
    $updateStmt->close();

    // 3. Delete OTP code
    $delStmt = $mysqli->prepare("DELETE FROM email_verification_codes WHERE email = ? AND type = 'password_reset'");
    $delStmt->bind_param("s", $email);
    $delStmt->execute();
    $delStmt->close();

    // 4. Fetch updated user and issue JWT
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

    $user['roles'] = $user['roles'] ? explode(',', $user['roles']) : ['user'];

    $token = CustomJWT::generateToken([
        'user_id' => (int)$user['id'],
        'email'   => $user['email'],
        'name'    => $user['name'],
        'roles'   => $user['roles']
    ], 2592000);

    echo json_encode([
        "success" => true,
        "message" => "Password has been successfully updated!",
        "token"   => $token,
        "user"    => $user
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Reset error: " . $e->getMessage()
    ]);
}
