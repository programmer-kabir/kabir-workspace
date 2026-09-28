<?php
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/middleware/auth.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    $user = $GLOBALS['user'];
    $user_id = $user['id'];

    if ($user_id > 0) {
        $upd = $mysqli->prepare("UPDATE users SET last_active = NOW() WHERE id = ?");
        $upd->bind_param("i", $user_id);
        $upd->execute();
    }

    echo json_encode(["success" => true, "message" => "Pong"]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error"]);
}
