<?php
ini_set("display_errors", 0);
error_reporting(0);

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../middleware/rate_limit.php';
applyRateLimit($mysqli, 'contents_download', 20, 60);
require_once __DIR__ . '/../middleware/FirebaseJWT.php';
require_once __DIR__ . '/../helper/download_permission.php';

$contentId = (int) ($_GET["content_id"] ?? 0);
$fileId    = (int) ($_GET["file_id"]    ?? 0);
$fileName  = $_GET["file_name"] ?? '';

if ($contentId <= 0 || $fileId <= 0) {
    http_response_code(400);
    exit("Content ID and File ID are required");
}

// ── Auth ────────────────────────────────────────────────────────────────────
$headers    = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
$token = '';
if (!empty($authHeader) && str_starts_with($authHeader, 'Bearer ')) {
    $token = trim(str_replace('Bearer ', '', $authHeader));
} elseif (!empty($_GET['token'])) {
    $token = trim($_GET['token']);
}
if (empty($token)) {
    http_response_code(401);
    exit("Unauthorized: Missing token. Please login.");
}
try {
    $payload = FirebaseJWT::verifyIdToken($token);
    $email   = $payload['email'] ?? null;
    if (!$email) throw new Exception("Email not found in token");
} catch (Exception $e) {
    http_response_code(401);
    exit("Unauthorized: " . $e->getMessage());
}

$user_stmt = $mysqli->prepare("SELECT u.id, GROUP_CONCAT(ur.role SEPARATOR ',') as roles FROM users u LEFT JOIN user_roles ur ON u.id = ur.user_id WHERE u.email = ? GROUP BY u.id LIMIT 1");
$user_stmt->bind_param("s", $email);
$user_stmt->execute();
$user_res = $user_stmt->get_result();
if ($user_res->num_rows === 0) {
    http_response_code(401);
    exit("Unauthorized: User not found in database.");
}
$user_row   = $user_res->fetch_assoc();
$user_id    = (int) $user_row['id'];
$user_roles = $user_row['roles'] ? explode(',', $user_row['roles']) : ['user'];

// ── Verify file belongs to this content ─────────────────────────────────────
$file_stmt = $mysqli->prepare("SELECT file_url, file_name FROM content_files WHERE id = ? AND content_id = ?");
$file_stmt->bind_param("ii", $fileId, $contentId);
$file_stmt->execute();
$file_res = $file_stmt->get_result();
if ($file_res->num_rows === 0) {
    http_response_code(404);
    exit("File not found or does not belong to this content.");
}
$file_row = $file_res->fetch_assoc();
$fileUrl  = $file_row['file_url'];
if (empty($fileName)) { $fileName = $file_row['file_name']; }

// ── Permission check ─────────────────────────────────────────────────────────
$perm = getDownloadPermission($mysqli, $user_id, $contentId, $user_roles);
if (!$perm['allowed']) {
    http_response_code(403);
    exit($perm['message']);
}

// ── Record the download credit ───────────────────────────────────────────────
recordDownload($mysqli, $user_id, $contentId, $perm);

// ── Serve the file ───────────────────────────────────────────────────────────
$publicRoot = realpath(__DIR__ . "/../../");
if (!$publicRoot) {
    http_response_code(500);
    exit("Public root path not found");
}

$pos = strpos($fileUrl, 'uploads/contents/');
if ($pos !== false) {
    $relativePath = substr($fileUrl, $pos);
} else {
    $pos = strpos($fileUrl, 'images/contents/');
    if ($pos !== false) {
        $relativePath = substr($fileUrl, $pos);
    } else {
        if (strpos($fileUrl, 'http') === 0) {
            $parsed       = parse_url($fileUrl);
            $relativePath = ltrim($parsed['path'] ?? '', "/");
        } else {
            $relativePath = ltrim($fileUrl, "/");
        }
    }
}

$realFilePath = realpath(rtrim($publicRoot, "/") . "/" . $relativePath);
$isRemote = false;

if ($realFilePath === false || strpos($realFilePath, $publicRoot) !== 0) {
    $fallbackPath = realpath(rtrim(dirname($publicRoot), "/") . "/" . $relativePath);
    if ($fallbackPath !== false && strpos($fallbackPath, dirname($publicRoot)) === 0) {
        $realFilePath = $fallbackPath;
    } else {
        // Fallback to CDN URL
        $cdnUrl = (strpos($fileUrl, 'http') === 0) ? $fileUrl : "https://pub-8d3e60db04cc4bf9bd592995b23acefe.r2.dev/" . ltrim($relativePath, "/");
        $isRemote = true;
        $realFilePath = $cdnUrl;
    }
}

if (!$isRemote && !file_exists($realFilePath)) {
    // If not found locally, try CDN as final fallback
    $cdnUrl = (strpos($fileUrl, 'http') === 0) ? $fileUrl : "https://pub-8d3e60db04cc4bf9bd592995b23acefe.r2.dev/" . ltrim($relativePath, "/");
    $isRemote = true;
    $realFilePath = $cdnUrl;
}
if (!$isRemote && !file_exists($realFilePath)) {
    http_response_code(404);
    exit("File does not exist.");
}
if (empty($fileName)) { $fileName = basename($realFilePath); }

header('Content-Description: File Transfer');
header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="' . $fileName . '"');
header('Expires: 0');
header('Cache-Control: must-revalidate');
header('Pragma: public');

if (!$isRemote) {
    header('Content-Length: ' . filesize($realFilePath));
}

readfile($realFilePath);
exit;
