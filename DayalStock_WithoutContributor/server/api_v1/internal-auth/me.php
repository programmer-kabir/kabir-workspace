<?php

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

header("Content-Type: application/json; charset=utf-8");

try {
    $email = $GLOBALS['user']['email'] ?? '';

    if (!$email) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Unauthorized: Invalid or missing token"
        ]);
        exit;
    }

    $stmt = $mysqli->prepare("
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
        WHERE u.email = ?
        GROUP BY u.id, u.name, u.username, u.email, u.photo, u.status
        LIMIT 1
    ");

    $stmt->bind_param("s", $email);
    $stmt->execute();

    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "User not found"
        ]);
        exit;
    }

    $user = $result->fetch_assoc();
    $stmt->close();

    $user['roles'] = $user['roles'] ? explode(',', $user['roles']) : ['user'];

    echo json_encode([
        "success" => true,
        "user" => $user
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
