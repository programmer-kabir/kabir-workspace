<?php
// server/api/meetings/upload_chat_file.php
// Secure upload handler for Live In-Meeting Chat attachments (Images, PDFs, Documents, Archives)
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once 'MeetingDbHelper.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();
MeetingDbHelper::ensureSchema($db);

if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "No file uploaded or file upload error."]);
    exit;
}

$fileData     = $_FILES['file'];
$originalName = basename($fileData['name']);
$fileTmpPath  = $fileData['tmp_name'];
$fileSize     = (int)$fileData['size'];
$fileExt      = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

// Max file size: 25MB
if ($fileSize > 25 * 1024 * 1024) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "File size exceeds 25MB limit."]);
    exit;
}

// Disallow dangerous executable files
$blockedExts = ['php', 'phtml', 'php3', 'php4', 'php5', 'phps', 'phar', 'exe', 'bat', 'cmd', 'sh', 'vbs', 'scr', 'dll', 'com'];
if (in_array($fileExt, $blockedExts)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "File type not permitted for security reasons."]);
    exit;
}

// Allowed safe extensions
$allowedExts = [
    'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg',
    'pdf', 'doc', 'docx', 'txt', 'csv', 'xls', 'xlsx', 'ppt', 'pptx',
    'zip', 'rar', '7z', 'tar', 'gz',
    'json', 'sql', 'md', 'xml'
];
if (!in_array($fileExt, $allowedExts)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Unsupported file format. Please upload images, PDFs, documents, or ZIP archives."]);
    exit;
}

$isImage = in_array($fileExt, ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg']);
$uniqueName = 'meet_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $fileExt;
$uploadDir  = __DIR__ . '/../../uploads/meeting_files/';

if (!is_dir($uploadDir)) {
    @mkdir($uploadDir, 0755, true);
}

$targetPath = $uploadDir . $uniqueName;

if (move_uploaded_file($fileTmpPath, $targetPath)) {
    $relativeUrl = 'uploads/meeting_files/' . $uniqueName;
    echo json_encode([
        "status"          => "success",
        "file_url"        => $relativeUrl,
        "filename"        => $originalName,
        "file_size"       => $fileSize,
        "file_ext"        => $fileExt,
        "is_image"        => $isImage
    ]);
} else {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Failed to save uploaded file."]);
}
?>
