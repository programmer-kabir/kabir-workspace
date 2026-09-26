<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/r2_config.php';
require_once __DIR__ . '/../middleware/CustomJWT.php';

header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

try {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $email = '';
    $name = '';
    $photo = '';

    // If Google ID Token credential was sent directly from Google One-Tap or Google Identity Services
    if (!empty($data['credential'])) {
        $parts = explode('.', $data['credential']);
        if (count($parts) === 3) {
            $googlePayload = json_decode(base64_decode(str_pad(strtr($parts[1], '-_', '+/'), strlen($parts[1]) % 4 === 0 ? strlen($parts[1]) : strlen($parts[1]) + 4 - (strlen($parts[1]) % 4), '=', STR_PAD_RIGHT)), true);
            if ($googlePayload && !empty($googlePayload['email'])) {
                $email = strtolower(trim($googlePayload['email']));
                $name  = trim($googlePayload['name'] ?? $googlePayload['given_name'] ?? '');
                $photo = trim($googlePayload['picture'] ?? '');
            }
        }
    }

    // Fallback to explicit fields if provided
    if (empty($email)) {
        $email = strtolower(trim($data['email'] ?? ''));
        $name  = trim($data['name'] ?? '');
        $photo = trim($data['photo'] ?? '');
    }

    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Valid email is required"]);
        exit;
    }

    if (empty($name)) {
        $name = explode('@', $email)[0];
    }

    // 1. Check if user already exists
    $checkStmt = $mysqli->prepare("SELECT id, status FROM users WHERE email = ? LIMIT 1");
    $checkStmt->bind_param("s", $email);
    $checkStmt->execute();
    $result = $checkStmt->get_result();

    $userId = null;

    if ($result->num_rows > 0) {
        $userRow = $result->fetch_assoc();
        $userId = $userRow['id'];

        if ($userRow['status'] === 'banned') {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Your account is banned."]);
            exit;
        }

        // If user was suspended (pending email verification), Google login auto-verifies them!
        $updateStmt = $mysqli->prepare("UPDATE users SET status = 'active', last_active = NOW() WHERE id = ?");
        $updateStmt->bind_param("i", $userId);
        $updateStmt->execute();
        $updateStmt->close();
    } else {
        // 2. First time user: Insert into users and user_roles
        $mysqli->begin_transaction();

        // Generate unique username
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

        $randomPassword = bin2hex(random_bytes(16));
        $hashedPassword = password_hash($randomPassword, PASSWORD_BCRYPT);

        $insertUserStmt = $mysqli->prepare("
            INSERT INTO users (name, username, email, password, photo, status, last_active)
            VALUES (?, ?, ?, ?, ?, 'active', NOW())
        ");
        $insertUserStmt->bind_param("sssss", $name, $username, $email, $hashedPassword, $photo);
        $insertUserStmt->execute();
        $userId = $insertUserStmt->insert_id;
        $insertUserStmt->close();

        // Assign default 'user' role
        $roleStmt = $mysqli->prepare("INSERT INTO user_roles (user_id, role) VALUES (?, 'user')");
        $roleStmt->bind_param("i", $userId);
        $roleStmt->execute();
        $roleStmt->close();

        $mysqli->commit();
    }

    // 3. Fetch user and roles
    $fetchStmt = $mysqli->prepare("
        SELECT
            u.id,
            u.name,
            u.username,
            u.email,
            u.photo,
            u.status,
            GROUP_CONCAT(ur.role ORDER BY ur.role SEPARATOR ',') AS roles
        FROM users u
        LEFT JOIN user_roles ur ON ur.user_id = u.id
        WHERE u.id = ?
        GROUP BY u.id
        LIMIT 1
    ");
    $fetchStmt->bind_param("i", $userId);
    $fetchStmt->execute();
    $userResult = $fetchStmt->get_result();
    $user = $userResult->fetch_assoc();
    $fetchStmt->close();

    $user['roles'] = $user['roles'] ? explode(',', $user['roles']) : ['user'];

    // 4. Generate DayalStock JWT Token
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
    if (isset($mysqli) && $mysqli->ping()) {
        $mysqli->rollback();
    }
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Google Login error: " . $e->getMessage()
    ]);
}
