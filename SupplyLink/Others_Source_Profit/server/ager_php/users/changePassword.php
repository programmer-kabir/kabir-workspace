<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);
if (!$data) {
    $data = $_POST;
}

$user_id          = intval($data["user_id"] ?? 0);
$current_password = trim((string)($data["current_password"] ?? ""));
$new_password     = trim((string)($data["new_password"] ?? ""));

if (!$user_id || $current_password === "" || $new_password === "") {
    echo json_encode([
        "success" => false,
        "message" => "সবগুলো পাসওয়ার্ড ফিল্ড পূরণ করুন"
    ]);
    exit;
}

if (strlen($new_password) < 6) {
    echo json_encode([
        "success" => false,
        "message" => "নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"
    ]);
    exit;
}

$stmt = $mysqli->prepare("SELECT password FROM users WHERE id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$dbUser = $result->fetch_assoc();
$stmt->close();

if (!$dbUser) {
    echo json_encode([
        "success" => false,
        "message" => "ইউজার পাওয়া যায়নি"
    ]);
    exit;
}

// Compare current password (support plain or hashed)
$dbPass = (string)($dbUser["password"] ?? "");
$isValid = ($current_password === $dbPass) || (password_verify($current_password, $dbPass));

if (!$isValid) {
    echo json_encode([
        "success" => false,
        "message" => "বর্তমান পাসওয়ার্ড সঠিক নয়"
    ]);
    exit;
}

// Update password in users table
$update = $mysqli->prepare("UPDATE users SET password = ? WHERE id = ?");
$update->bind_param("si", $new_password, $user_id);

if ($update->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে"
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে: " . $update->error
    ]);
}
$update->close();