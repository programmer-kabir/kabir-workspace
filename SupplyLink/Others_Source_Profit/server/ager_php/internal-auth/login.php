<?php

$host = $_SERVER['HTTP_HOST'] ?? '';
$isLocal = (strpos($host, 'localhost') !== false) || (strpos($host, '127.0.0.1') !== false);

session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => $isLocal ? '' : '.supplylinkbd.com',
    'secure' => $isLocal ? false : true,
    'httponly' => true,
    'samesite' => $isLocal ? 'Lax' : 'None',
]);

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

/* 🔥 STEP 1: USER + ALL ROLES FETCH (BY ID OR MOBILE) */
$stmt = $mysqli->prepare("
    SELECT u.id, u.name, u.photo, u.mobile, u.password, r.role
    FROM users u
    LEFT JOIN user_roles r ON r.user_id = u.id
    WHERE u.id = ? OR u.mobile = ?
");
$idStr = trim((string)$id);
$stmt->bind_param("ss", $idStr, $idStr);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) {
    http_response_code(401);
    echo json_encode(["message" => "Invalid credentials"]);
    exit;
}

/* 🔥 STEP 2: ALL ROLE COLLECT */
$roles = [];
$userData = null;

while ($row = $res->fetch_assoc()) {
    if (!$userData) {
        $userData = $row; // প্রথম row থেকে password নিবো
    }
    $roles[] = $row['role'];
}

/* 🔥 STEP 3: PASSWORD CHECK */
if ($password !== $userData['password']) {
    http_response_code(401);
    echo json_encode(["message" => "Invalid credentials"]);
    exit;
}

/* 🔥 STEP 4: SESSION SAVE (ARRAY ROLE) */
$_SESSION['user'] = [
    "id" => (int)$userData['id'],
    "name" => $userData['name'] ?? null,
    "photo" => $userData['photo'] ?? null,
    "mobile" => $userData['mobile'] ?? null,
    "role" => $roles // ✅ multiple role array
];

/* 🔥 ACTIVITY LOG */
try {
    require_once __DIR__ . "/../helpers/log_activity.php";

    logActivity(
        "auth",
        "login",
        "User logged in",
        "user",
        (int)$userData['id'],
        null,
        [
            "login_id" => (int)$id,
            "roles" => $roles
        ]
    );
} catch (Throwable $e) {
    error_log("Login activity logging failed: " . $e->getMessage());
}

/* 🔥 RESPONSE */
echo json_encode([
    "user" => $_SESSION['user']
], JSON_UNESCAPED_UNICODE);