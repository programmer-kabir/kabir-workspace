<?php
// server/api/events/upload_event_file.php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../config/storage.php';
require_once 'EventDbHelper.php';
require_once 'EventAuthHelper.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();
EventDbHelper::ensureSchema($db);

$user = EventAuthHelper::getAuthenticatedUser($db);
if (!$user) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Authentication required."]);
    exit;
}

if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["status" => "error", "message" => "No file uploaded or file upload error."]);
    exit;
}

$fileData     = $_FILES['file'];
$originalName = $fileData['name'];
$fileTmpPath  = $fileData['tmp_name'];
$fileSize     = $fileData['size'];
$fileExt      = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

// Disallow dangerous executable files
$blockedExts = ['php', 'phtml', 'exe', 'bat', 'cmd', 'sh', 'js', 'vbs', 'scr'];
if (in_array($fileExt, $blockedExts)) {
    echo json_encode(["status" => "error", "message" => "Invalid file extension."]);
    exit;
}

$uniqueName = 'event_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $fileExt;
$uploadDir  = __DIR__ . '/../../uploads/events/';

if (!is_dir($uploadDir)) {
    @mkdir($uploadDir, 0755, true);
}

$targetPath = $uploadDir . $uniqueName;

if (move_uploaded_file($fileTmpPath, $targetPath)) {
    // Relative URL that resolves cleanly via base API url
    $relativeUrl = 'uploads/events/' . $uniqueName;
    echo json_encode([
        "status"   => "success",
        "file_url" => $relativeUrl,
        "filename" => $uniqueName
    ]);
} else {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Failed to save uploaded file."]);
}
?>

