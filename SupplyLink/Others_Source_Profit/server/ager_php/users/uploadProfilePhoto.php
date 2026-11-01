<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Only POST method allowed"]);
    exit;
}

$user_id = intval($_POST["user_id"] ?? 0);
if (!$user_id) {
    echo json_encode(["success" => false, "message" => "User ID missing"]);
    exit;
}

if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["success" => false, "message" => "Photo upload error or no file provided"]);
    exit;
}

$file = $_FILES['photo'];
$maxSize = 5 * 1024 * 1024; // 5MB
if ($file['size'] > $maxSize) {
    echo json_encode(["success" => false, "message" => "File size cannot exceed 5MB"]);
    exit;
}

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

$allowed = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
];

if (!isset($allowed[$mime])) {
    echo json_encode(["success" => false, "message" => "Only JPG, PNG, and WEBP images are supported"]);
    exit;
}

$ext = $allowed[$mime];
$uploadDir = __DIR__ . '/../../uploads';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$filename = "user_" . $user_id . "_" . time() . "." . $ext;
$targetPath = $uploadDir . "/" . $filename;

if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    echo json_encode(["success" => false, "message" => "Failed to save uploaded file"]);
    exit;
}

$dbPhotoPath = "uploads/" . $filename;

$stmt = $mysqli->prepare("UPDATE users SET photo = ? WHERE id = ?");
$stmt->bind_param("si", $dbPhotoPath, $user_id);
if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Photo uploaded successfully",
        "photo"   => $dbPhotoPath
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Failed to update profile photo in database"
    ]);
}
$stmt->close();
