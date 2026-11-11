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

if (!empty($_SESSION['user']['id'])) {
    require_once __DIR__ . "/../helpers/log_activity.php";
    logActivity("auth", "logout", "User logged out", "user", (int)$_SESSION['user']['id']);
}

session_destroy();

echo json_encode(["success" => true], JSON_UNESCAPED_UNICODE);
