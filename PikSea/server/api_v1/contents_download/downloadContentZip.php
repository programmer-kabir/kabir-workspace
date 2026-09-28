<?php
ini_set("display_errors", 0);
error_reporting(0);

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../middleware/rate_limit.php';
applyRateLimit($mysqli, 'contents_download', 20, 60);
require_once __DIR__ . '/../middleware/FirebaseJWT.php';
require_once __DIR__ . '/generate_license_pdf.php';
require_once __DIR__ . '/../helper/notification_helper.php';
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
    exit("Unauthorized: User not found in database.");
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

// ── Record the download credit ───────────────────────────────────────────────
recordDownload($mysqli, $user_id, $contentId, $perm);

// ── Fetch files ──────────────────────────────────────────────────────────────
$filesSql = "
    SELECT file_url, file_name, file_type, is_main_file
    FROM content_files
    WHERE content_id = ?
    ORDER BY is_main_file DESC, id ASC
";
$stmt = $mysqli->prepare($filesSql);
if (!$stmt) { exit("Database prepare error: " . $mysqli->error); }
$stmt->bind_param("i", $contentId);
$stmt->execute();
$result = $stmt->get_result();
$files  = [];
while ($row = $result->fetch_assoc()) { $files[] = $row; }
if (count($files) === 0) { exit("No files found for this content"); }

// ── Fetch content meta for ZIP naming & notification ────────────────────────
$contentSql = "
    SELECT c.slug, c.title, c.license_type, a.user_id as author_user_id
    FROM contents c
    LEFT JOIN authors a ON c.author_id = a.id
    WHERE c.id = ? LIMIT 1
";
$contentStmt = $mysqli->prepare($contentSql);
$contentStmt->bind_param("i", $contentId);
$contentStmt->execute();
$content        = $contentStmt->get_result()->fetch_assoc();
$slug           = $content["slug"]           ?? "dayalstock-content";
$title          = $content["title"]          ?? "DayalStock Asset";
$author_user_id = $content["author_user_id"] ?? null;

if ($author_user_id && $author_user_id != $user_id) {
    sendNotification($mysqli, [
        'user_id'     => $author_user_id,
        'sender_id'   => $user_id,
        'sender_type' => 'user',
        'target_role' => 'user',
        'type'        => 'general',
        'title'       => 'New Download!',
        'message'     => 'Your content "' . $title . '" has just been downloaded.',
        'icon'        => 'download',
        'link'        => '/content/' . $slug,
        'priority'    => 'low'
    ]);
}

// ── Build ZIP ────────────────────────────────────────────────────────────────
$publicRoot   = realpath(__DIR__ . "/../../");
if (!$publicRoot) exit("Public root path not found");
$zipDirectory = __DIR__ . "/../temp-zips/";
if (!is_dir($zipDirectory)) mkdir($zipDirectory, 0777, true);
$zipFileName  = $slug . "-" . time() . ".zip";
$zipPath      = $zipDirectory . $zipFileName;
$zip = new ZipArchive();
if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
    exit("Could not create ZIP file");
}
$tempFiles = [];
foreach ($files as $file) {
    $fileUrl = $file["file_url"];
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
    
    $added = false;
    $realFilePath = rtrim($publicRoot, "/") . "/" . $relativePath;
    if (file_exists($realFilePath)) {
        if ($zip->addFile($realFilePath, $file["file_name"])) { 
            $addedFiles++; 
            $added = true;
        }
    } elseif (file_exists(rtrim(dirname($publicRoot), "/") . "/" . $relativePath)) {
        if ($zip->addFile(rtrim(dirname($publicRoot), "/") . "/" . $relativePath, $file["file_name"])) { 
            $addedFiles++; 
            $added = true;
        }
    }
    
    // Fallback to CDN if local file not found
    if (!$added) {
        $cdnUrl = (strpos($fileUrl, 'http') === 0) ? $fileUrl : "https://pub-8d3e60db04cc4bf9bd592995b23acefe.r2.dev/" . ltrim($relativePath, "/");
        $tempFile = tempnam(sys_get_temp_dir(), 'zipdl_');
        $fp = @fopen($cdnUrl, 'rb');
        if ($fp) {
            $dest = fopen($tempFile, 'wb');
            stream_copy_to_stream($fp, $dest);
            fclose($fp);
            fclose($dest);
            if ($zip->addFile($tempFile, $file["file_name"])) {
                $addedFiles++;
                $tempFiles[] = $tempFile;
            } else {
                unlink($tempFile);
            }
        }
    }
}

$licenseId       = 'DS-' . strtoupper(substr(md5($email . $contentId . time()), 0, 12));
$downloadDate    = date('F j, Y');
$licenseIsPrem   = $perm['is_premium'];
$licensePdfBytes = generateDayalStockLicensePDF($title, $email, $licenseId, $downloadDate, $licenseIsPrem);
$zip->addFromString('LICENSE.pdf', $licensePdfBytes);
$zip->close();

if (isset($tempFiles) && is_array($tempFiles)) {
    foreach ($tempFiles as $t) {
        if (file_exists($t)) @unlink($t);
    }
}

if ($addedFiles === 0) {
    if (file_exists($zipPath)) unlink($zipPath);
    http_response_code(404);
    exit("No real files could be added to ZIP. The actual files might be missing on the server.");
}

header("Content-Type: application/zip");
header("Content-Disposition: attachment; filename=\"" . $zipFileName . "\"");
header("Content-Length: " . filesize($zipPath));
header("Cache-Control: no-cache, must-revalidate");
header("Pragma: public");
readfile($zipPath);
unlink($zipPath);
$stmt->close();
$contentStmt->close();
exit;
