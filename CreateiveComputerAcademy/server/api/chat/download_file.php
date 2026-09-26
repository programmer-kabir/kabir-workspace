<?php
// download_file.php
if (!isset($_GET['file'])) {
    die("No file specified");
}

$file_path = $_GET['file']; // e.g., /uploads/chat/filename.jpg
$file_path = ltrim($file_path, '/');

// Validate that it's in the uploads directory
if (strpos($file_path, 'uploads/') !== 0) {
    die("Invalid file path");
}

// Map it to the actual absolute path on server
$absolute_path = realpath(__DIR__ . '/../../' . $file_path);

if (!$absolute_path || !file_exists($absolute_path)) {
    die("File not found");
}

$filename = basename($absolute_path);
$mime_type = mime_content_type($absolute_path);
if (!$mime_type) {
    $mime_type = 'application/octet-stream';
}

header('Content-Description: File Transfer');
header('Content-Type: ' . $mime_type);
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Expires: 0');
header('Cache-Control: must-revalidate');
header('Pragma: public');
header('Content-Length: ' . filesize($absolute_path));

readfile($absolute_path);
exit;
?>
