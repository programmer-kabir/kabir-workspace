<?php
require_once '../../config/cors.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed", "error" => "Method not allowed"]);
    exit;
}

// Support both 'image' (single) and 'files' (Jodit array/single)
$target_files = null;
if (isset($_FILES['files'])) {
    $target_files = $_FILES['files'];
} elseif (isset($_FILES['image'])) {
    $target_files = $_FILES['image'];
}

if (!$target_files) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "No valid image file provided.",
        "error" => "No valid image file provided."
    ]);
    exit;
}

// Ensure target directory exists
$upload_dir = __DIR__ . '/../../uploads/blog_images/';
if (!is_dir($upload_dir)) {
    mkdir($upload_dir, 0777, true);
}

$allowed_exts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
$uploaded_urls = [];

// Normalize single vs multiple files
$names = is_array($target_files['name']) ? $target_files['name'] : [$target_files['name']];
$tmp_names = is_array($target_files['tmp_name']) ? $target_files['tmp_name'] : [$target_files['tmp_name']];
$errors = is_array($target_files['error']) ? $target_files['error'] : [$target_files['error']];

for ($i = 0; $i < count($names); $i++) {
    if (empty($names[$i]) || $errors[$i] !== UPLOAD_ERR_OK) {
        continue;
    }

    $file_ext = strtolower(pathinfo($names[$i], PATHINFO_EXTENSION));
    if (!in_array($file_ext, $allowed_exts)) {
        continue;
    }

    $filename = 'blog_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $file_ext;
    $target_path = $upload_dir . $filename;

    if (move_uploaded_file($tmp_names[$i], $target_path)) {
        $uploaded_urls[] = 'uploads/blog_images/' . $filename;
    }
}

if (count($uploaded_urls) === 0) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Failed to upload image. Ensure it is JPG, PNG, WEBP, GIF, or SVG.",
        "error" => "Failed to upload image."
    ]);
    exit;
}

// Return formats compatible with Jodit and custom callers
echo json_encode([
    "status" => "success",
    "success" => true,
    "url" => $uploaded_urls[0],
    "files" => $uploaded_urls,
    "data" => [
        "files" => $uploaded_urls,
        "baseurl" => ""
    ]
]);
?>
