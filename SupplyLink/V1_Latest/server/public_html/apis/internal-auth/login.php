<?php
// CORS must always be loaded first to handle OPTIONS preflight immediately
require_once __DIR__ . "/../cors.php";
require_once __DIR__ . "/../db.php";

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
    "role" => $roles
];

/* 🔥 ACTIVITY LOG */
try {
    require_once __DIR__ . "/../helpers/log_activity.php";

    $roleStr = is_array($roles) ? implode(',', array_filter($roles)) : (string)$roles;
    logStaffActivity(
        "LOGIN",
        "auth",
        "user",
        (int)$userData['id'],
        0.00,
        "সিস্টেমে সফলভাবে লগইন করেছেন",
        [
            "login_id" => (int)$id,
            "roles" => $roles,
            "mobile" => $userData['mobile'] ?? null
        ],
        (int)$userData['id'],
        $userData['name'],
        $roleStr
    );
} catch (Throwable $e) {
    error_log("Login activity logging failed: " . $e->getMessage());
}

/* 🔥 RESPONSE */
echo json_encode([
    "user" => $_SESSION['user']
], JSON_UNESCAPED_UNICODE);
