<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");

$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput, true);

if (!$data) {
    $data = $_POST;
}

$user_id = intval($data['user_id'] ?? 0);
$name    = trim($data['name'] ?? '');
$mobile  = trim($data['mobile'] ?? '');
$address = trim($data['address'] ?? '');
$photo   = trim($data['photo'] ?? '');

if (!$user_id || $name === '' || $mobile === '') {
    echo json_encode([
        "success" => false,
        "message" => "Name, mobile, and user ID are required"
    ]);
    exit;
}

if ($photo !== '') {
    $stmt = $mysqli->prepare("UPDATE users SET name = ?, mobile = ?, address = ?, photo = ? WHERE id = ?");
    $stmt->bind_param("ssssi", $name, $mobile, $address, $photo, $user_id);
} else {
    $stmt = $mysqli->prepare("UPDATE users SET name = ?, mobile = ?, address = ? WHERE id = ?");
    $stmt->bind_param("sssi", $name, $mobile, $address, $user_id);
}

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Profile successfully updated"
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Failed to update profile: " . $stmt->error
    ]);
}
$stmt->close();
