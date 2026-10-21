<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=UTF-8");
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

function fail($msg) {
    echo json_encode([
        "success" => false,
        "message" => $msg
    ]);
    exit;
}

try {
    // Browser-এ URL open করলে GET যায়
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        fail("Only POST request is allowed");
    }

    // FormData থেকে data আসবে
    $user_id = intval($_POST["user_id"] ?? 0);
    $current_password = trim($_POST["current_password"] ?? "");
    $new_password = trim($_POST["new_password"] ?? "");

    if (!$user_id || !$current_password || !$new_password) {
        fail("সব password field দেওয়া লাগবে");
    }

    if (strlen($new_password) < 6) {
        fail("নতুন password কমপক্ষে 6 character হতে হবে");
    }

    // বর্তমান password check
    $stmt = $mysqli->prepare("SELECT password FROM users WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();

    $dbUser = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$dbUser) {
        fail("User পাওয়া যায়নি");
    }

    // আগের মতো plain text password check
    if ($current_password !== $dbUser["password"]) {
        fail("বর্তমান password সঠিক নয়");
    }

    // MySQL-এ নতুন plain password update
    $update = $mysqli->prepare("UPDATE users SET password = ? WHERE id = ?");
    $update->bind_param("si", $new_password, $user_id);
    $update->execute();
    $update->close();

    echo json_encode([
        "success" => true,
        "message" => "Password successfully changed"
    ]);

} catch (Throwable $e) {
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}