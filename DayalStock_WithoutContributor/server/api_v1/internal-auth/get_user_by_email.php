<?php

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

header("Content-Type: application/json");

try {

    // SECURE: Use the cryptographically verified email from the token
    $email = $GLOBALS['user']['email'];

    if (!$email) {
        echo json_encode([
            "success" => false,
            "message" => "Email is required"
        ]);
        exit;
    }

    $stmt = $mysqli->prepare("
        SELECT
            u.id,
            u.name,
            u.email,
            u.photo,
            GROUP_CONCAT(ur.role ORDER BY ur.role SEPARATOR ',') AS roles
        FROM users u
        LEFT JOIN user_roles ur ON ur.user_id = u.id
        WHERE u.email = ?
        GROUP BY u.id, u.name, u.email, u.photo
        LIMIT 1
    ");

    $stmt->bind_param("s", $email);
    $stmt->execute();

    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode([
            "success" => false,
            "message" => "User not found"
        ]);
        exit;
    }

    $user = $result->fetch_assoc();

    // roles → array e convert
    $user['roles'] = $user['roles'] ? explode(',', $user['roles']) : [];

    echo json_encode([
        "success" => true,
        "user" => $user
    ]);

} catch (Exception $e) {

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}