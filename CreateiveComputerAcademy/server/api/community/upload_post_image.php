<?php
require_once __DIR__ . '/../../config/cors.php';

header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit;
}

$file = $_FILES['image'] ?? $_FILES['file'] ?? null;
if (!$file || !isset($file['tmp_name']) || empty($file['tmp_name'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "No image file provided."]);
    exit;
}

if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "File upload error code: " . $file['error']]);
    exit;
}

// 5MB max
if ($file['size'] > 5 * 1024 * 1024) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Image size exceeds 5MB limit."]);
    exit;
}

$allowed_exts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
$file_ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

if (!in_array($file_ext, $allowed_exts)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid image type. Allowed: JPG, PNG, WEBP, GIF."]);
    exit;
}

// Security: Verify MIME type
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

$allowed_mimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
if (!in_array($mime, $allowed_mimes)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Uploaded file is not a valid image."]);
    exit;
}

$upload_dir = __DIR__ . '/../../uploads/community/';
if (!is_dir($upload_dir)) {
    mkdir($upload_dir, 0777, true);
}

$filename = 'post_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $file_ext;
$target_path = $upload_dir . $filename;

if (move_uploaded_file($file['tmp_name'], $target_path)) {
    $rel_path = 'uploads/community/' . $filename;
    echo json_encode([
        "status" => "success",
        "message" => "Image uploaded successfully",
        "image_url" => $rel_path,
        "url" => $rel_path
    ]);
} else {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Failed to save uploaded image."]);
}
