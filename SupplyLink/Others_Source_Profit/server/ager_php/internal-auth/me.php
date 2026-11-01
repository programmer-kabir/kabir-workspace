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

$sessionUser = $_SESSION['user'] ?? null;
if ($sessionUser && !empty($sessionUser['id'])) {
    $uid = (int)$sessionUser['id'];
    $stmt = $mysqli->prepare("SELECT name, photo, mobile FROM users WHERE id = ? LIMIT 1");
    if ($stmt) {
        $stmt->bind_param("i", $uid);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        if ($row) {
            $sessionUser['name'] = $row['name'];
            $sessionUser['photo'] = $row['photo'];
            $sessionUser['mobile'] = $row['mobile'];
            $_SESSION['user'] = $sessionUser;
        }
    }
}

echo json_encode([
    "user" => $sessionUser
]);
