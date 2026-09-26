<?php
ini_set("display_errors", 0);
error_reporting(0);

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/rate_limit.php';
applyRateLimit($mysqli, 'contents_download', 20, 60);
require_once __DIR__ . '/../middleware/FirebaseJWT.php';
require_once __DIR__ . '/../helper/download_permission.php';

$contentId = (int) ($_GET["content_id"] ?? 0);
if ($contentId <= 0) {
    http_response_code(400);
    exit("Content ID is required");
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
    exit("Unauthorized: User not found.");
}
$user_row   = $user_res->fetch_assoc();
$user_id    = (int) $user_row['id'];
$user_roles = $user_row['roles'] ? explode(',', $user_row['roles']) : ['user'];

// ── Permission check ─────────────────────────────────────────────────────────
$perm = getDownloadPermission($mysqli, $user_id, $contentId, $user_roles);
if (!$perm['allowed']) {
    http_response_code(403);
    exit($perm['message']);
}

// ── Resolve preview image URL from contents table ────────────────────────────
$meta_stmt = $mysqli->prepare("SELECT slug, preview_1200_url, preview_600_url, watermarked_preview_image, preview_image FROM contents WHERE id = ? LIMIT 1");
$meta_stmt->bind_param("i", $contentId);
$meta_stmt->execute();
$meta = $meta_stmt->get_result()->fetch_assoc();
if (!$meta) {
    http_response_code(404);
    exit("Content not found.");
}

// Prefer the watermarked JPG shown on screen; fall back to webp previews
$previewUrl = (!empty($meta['preview_image']) ? $meta['preview_image'] : null)
    ?? (!empty($meta['watermarked_preview_image'])             ? $meta['watermarked_preview_image']             : null)
    ?? (!empty($meta['preview_1200_url'])          ? $meta['preview_1200_url']          : null)
    ?? (!empty($meta['preview_600_url'])           ? $meta['preview_600_url']           : null)
    ?? '';

if (empty($previewUrl)) {
    http_response_code(404);
    exit("No preview image found for this content.");
}

// ── Record the download credit (deduplication handled inside) ────────────────
recordDownload($mysqli, $user_id, $contentId, $perm);

// ── Resolve local file path ──────────────────────────────────────────────────
$publicRoot = realpath(__DIR__ . "/../../");

$pos = strpos($previewUrl, 'uploads/contents/');
if ($pos !== false) {
    $relativePath = substr($previewUrl, $pos);
} else {
    $pos = strpos($previewUrl, 'images/contents/');
    if ($pos !== false) {
        $relativePath = substr($previewUrl, $pos);
    } else {
        if (strpos($previewUrl, 'http') === 0) {
            $parsed       = parse_url($previewUrl);
            $relativePath = ltrim($parsed['path'] ?? '', "/");
        } else {
            $relativePath = ltrim($previewUrl, "/");
        }
    }
}

$realFilePath = rtrim($publicRoot, "/") . "/" . $relativePath;
if (!file_exists($realFilePath)) {
    $fallbackPath = rtrim(dirname($publicRoot), "/") . "/" . $relativePath;
    if (file_exists($fallbackPath)) {
        $realFilePath = $fallbackPath;
    } else {
        // Last resort: stream from CDN
        $realFilePath = null;
    }
}

$slug     = $meta['slug'] ?? 'preview';
$ext      = pathinfo($relativePath, PATHINFO_EXTENSION) ?: 'jpg';
$fileName = $slug . '-preview.' . $ext;

header("Content-Type: application/octet-stream");
header("Content-Disposition: attachment; filename=\"" . $fileName . "\"");
header("Cache-Control: no-cache, must-revalidate");
header("Pragma: public");

if ($realFilePath && file_exists($realFilePath)) {
    header("Content-Length: " . filesize($realFilePath));
    readfile($realFilePath);
} else {
    // Stream from remote CDN as fallback
    $remoteUrl = "https://api.dayalstock.com/" . ltrim($relativePath, "/");
    readfile($remoteUrl);
}
exit;
