<?php
// CORS must always be loaded first to handle OPTIONS preflight immediately
require_once __DIR__ . "/../cors.php";
require_once __DIR__ . "/../db.php";

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
], JSON_UNESCAPED_UNICODE);
