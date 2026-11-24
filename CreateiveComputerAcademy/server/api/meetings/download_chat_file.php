<?php
// server/api/meetings/download_chat_file.php
// Forces direct file download with Content-Disposition header (avoids browser PDF viewer tab)
require_once '../../config/cors.php';

$fileParam = isset($_GET['file']) ? trim($_GET['file']) : '';
$nameParam = isset($_GET['name']) ? trim($_GET['name']) : '';

if (empty($fileParam)) {
    http_response_code(400);
    echo "File parameter is required.";
    exit;
}

// Prevent path traversal attacks - extract only the filename
$cleanFileName = basename($fileParam);
$uploadDir     = realpath(__DIR__ . '/../../uploads/meeting_files');

if (!$uploadDir) {
    http_response_code(404);
    echo "Storage directory not found.";
    exit;
}

$filePath = realpath($uploadDir . DIRECTORY_SEPARATOR . $cleanFileName);

// Ensure the resolved file path is within the designated upload directory
if (!$filePath || strpos($filePath, $uploadDir) !== 0 || !file_exists($filePath)) {
    http_response_code(404);
    echo "File not found or access denied.";
    exit;
}

// Determine safe download filename
$downloadName = !empty($nameParam) ? basename($nameParam) : $cleanFileName;

// Ensure download extension matches real file extension
$realExt = strtolower(pathinfo($cleanFileName, PATHINFO_EXTENSION));
$targetExt = strtolower(pathinfo($downloadName, PATHINFO_EXTENSION));
if ($realExt && $realExt !== $targetExt) {
    $downloadName .= '.' . $realExt;
}

// Clean output buffer to prevent corrupted downloads
if (ob_get_level()) {
    ob_end_clean();
}

$fileSize = filesize($filePath);
$encodedName = rawurlencode($downloadName);

// Force binary attachment download
header('Content-Description: File Transfer');
header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="' . addslashes($downloadName) . '"; filename*=UTF-8\'\'' . $encodedName);
header('Content-Transfer-Encoding: binary');
header('Expires: 0');
header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
header('Pragma: public');
header('Content-Length: ' . $fileSize);

readfile($filePath);
exit;
?>
