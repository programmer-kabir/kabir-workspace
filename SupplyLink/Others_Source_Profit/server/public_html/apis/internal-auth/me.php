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

echo json_encode([
    "user" => $_SESSION['user'] ?? null
]);
