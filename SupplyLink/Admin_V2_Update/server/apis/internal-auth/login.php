<?php
$isLocal = (!isset($_SERVER['HTTPS']) || $_SERVER['HTTPS'] !== 'on') && (
    ($_SERVER['HTTP_HOST'] ?? '') === 'localhost' || 
    strpos($_SERVER['HTTP_HOST'] ?? '', '127.0.0.1') !== false ||
    strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') !== false
);

if ($isLocal) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => false,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
} else {
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => '.supplylinkbd.com',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'None',
    ]);
}

session_start();

require_once "../cors.php";
require_once "../db.php";

$data = json_decode(file_get_contents("php://input"), true);

$id = $data['id'] ?? null;
$password = $data['password'] ?? null;

if (!$id || !$password) {
    http_response_code(400);
    echo json_encode(["message" => "ID and password required"]);
    exit;
}

/* 🔥 STEP 1: USER + ALL ROLES FETCH (Supports DB id, user_id, id_number, or mobile) */
$cleanId = trim($id);
$stmt = $mysqli->prepare("
    SELECT u.id, u.user_id, u.name, u.mobile, u.id_number, u.password, r.role
    FROM users u
    LEFT JOIN user_roles r ON r.user_id = u.user_id
    WHERE u.id = ? OR u.user_id = ? OR u.id_number = ? OR u.mobile = ?
");

if (!$stmt) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database prepare error: " . $mysqli->error]);
    exit;
}

$stmt->bind_param("ssss", $cleanId, $cleanId, $cleanId, $cleanId);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Invalid credentials"]);
    exit;
}

/* 🔥 STEP 2: ALL ROLE COLLECT */
$roles = [];
$userData = null;

while ($row = $res->fetch_assoc()) {
    if (!$userData) {
        $userData = $row;
    }
    if (!empty($row['role']) && !in_array($row['role'], $roles)) {
        $roles[] = $row['role'];
    }
}

// Fallback role if empty
if (empty($roles)) {
    $roles[] = "admin";
}

/* 🔥 STEP 3: PASSWORD CHECK (Supports plain text and password_hash) */
$enteredPass = trim($password);
$dbPass = trim($userData['password'] ?? '');

$isPasswordValid = ($enteredPass === $dbPass) || (password_verify($enteredPass, $dbPass));

if (!$isPasswordValid) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Invalid credentials"]);
    exit;
}

/* 🔥 STEP 4: SESSION SAVE (ARRAY ROLE) */
$_SESSION['user'] = [
    "id" => (int)($userData['id'] ?? $userData['user_id']),
    "user_id" => (int)($userData['user_id'] ?? $userData['id']),
    "name" => $userData['name'] ?? '',
    "mobile" => $userData['mobile'] ?? '',
    "role" => $roles // ✅ multiple role array
];

/* 🔥 ACTIVITY LOG (Safe execution) */
try {
    if (file_exists(__DIR__ . "/../helpers/log_activity.php")) {
        require_once __DIR__ . "/../helpers/log_activity.php";
        logActivity(
            "auth",
            "login",
            "User logged in",
            "user",
            (int)($_SESSION['user']['id']),
            null,
            [
                "login_id" => $cleanId,
                "roles" => $roles
            ]
        );
    }
} catch (Throwable $e) {
    // Activity log error won't block login
}

/* 🔥 RESPONSE */
echo json_encode([
    "success" => true,
    "user" => $_SESSION['user']
], JSON_UNESCAPED_UNICODE);