<?php

require_once __DIR__ . '/../middleware/auth.php';

require_once __DIR__ . '/../middleware/rate_limit.php';
applyRateLimit($mysqli, 'contents_download', 20, 60);

ini_set("display_errors", 1);
error_reporting(E_ALL);

$file = $_GET['file'] ?? '';

if (empty($file)) {
    exit("No file specified");
}

// Ensure no path traversal
if (strpos($file, '..') !== false) {
    exit("Invalid file path");
}

$filename = basename($file);
$publicRoot = realpath(__DIR__ . "/../../");

// Extract the robust relative path (uploads/contents/... or images/contents/...)
$pos = strpos($file, 'uploads/contents/');
if ($pos !== false) {
    $relativePath = substr($file, $pos);
} else {
    $pos = strpos($file, 'images/contents/');
    if ($pos !== false) {
        $relativePath = substr($file, $pos);
    } else {
        // Fallback for older formats if any
        if (strpos($file, 'http') === 0) {
            $parsed = parse_url($file);
            $relativePath = ltrim($parsed['path'] ?? '', "/");
        } else {
            $relativePath = ltrim($file, "/");
        }
    }
}

$realFilePath = rtrim($publicRoot, "/") . "/" . $relativePath;
if (!file_exists($realFilePath)) {
    // Try one more level up if publicRoot is api_v1 instead of public_html
    $fallbackPath = rtrim(dirname($publicRoot), "/") . "/" . $relativePath;
    if (file_exists($fallbackPath)) {
        $realFilePath = $fallbackPath;
    }
}

header("Content-Type: application/octet-stream");
header("Content-Disposition: attachment; filename=\"" . $filename . "\"");
header("Cache-Control: no-cache, must-revalidate");
header("Pragma: public");

// If file exists locally (production server), read it
if (file_exists($realFilePath)) {
    header("Content-Length: " . filesize($realFilePath));
    readfile($realFilePath);
} else {
    // If running locally but files are on production
    // Attempt to stream from production server
    $remoteUrl = "https://api.piksea.com/" . ltrim($relativePath, "/");
    readfile($remoteUrl);
}
exit;
