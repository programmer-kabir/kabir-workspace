<?php
// High-Speed Single File Uploader (Parallel Worker Endpoint)
// Creative Computer Academy

@ini_set('display_errors', '0');
error_reporting(0);

@ini_set('upload_max_filesize', '256M');
@ini_set('post_max_size', '256M');
@ini_set('max_execution_time', '300');
@ini_set('memory_limit', '512M');

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header("Access-Control-Allow-Origin: " . $origin);
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(["status" => "success", "message" => "Preflight OK"]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(200);
    echo json_encode(["status" => "error", "message" => "Method not allowed. Use POST."]);
    exit();
}

$taskId = isset($_POST['task_id']) ? intval($_POST['task_id']) : 0;
$userId = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;
$index  = isset($_POST['index']) ? intval($_POST['index']) : 1;

if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["status" => "error", "message" => "No valid file received or file upload error."]);
    exit();
}

$fileData = $_FILES['file'];
$originalName = $fileData['name'];
$fileSize     = $fileData['size'];
$fileTmpPath  = $fileData['tmp_name'];
$fileExt      = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

require_once __DIR__ . '/../../config/storage.php';
require_once __DIR__ . '/../../config/GoogleDriveClient.php';

function classifyFileTypeSingle($ext) {
    $previewExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
    $videoExts = ['mp4', 'mov', 'webm', 'avi', 'mkv'];
    $sourceExts = ['psd', 'eps', 'ai', 'indd', 'cdr', 'zip', 'rar', '7z', 'tar', 'gz', 'pdf', 'fig', 'xd', 'sketch', 'docx', 'xlsx', 'pptx'];

    if (in_array($ext, $previewExts)) return 'preview';
    if (in_array($ext, $videoExts)) return 'video';
    if (in_array($ext, $sourceExts)) return 'source';
    return 'other';
}
$fileType = classifyFileTypeSingle($fileExt);

$targetProvider = determineUploadProvider($fileExt, $fileType);

if (!empty($taskId)) {
    $suffix = ($index > 1) ? "_{$index}" : "";
    $targetFileName = "{$taskId}{$suffix}.{$fileExt}";
    $r2Key = "task_submissions/task_{$taskId}/{$targetFileName}";
} else {
    $cleanName = preg_replace('/[^a-zA-Z0-9_\.-]/', '_', pathinfo($originalName, PATHINFO_FILENAME));
    $timestamp = time();
    $targetFileName = "{$timestamp}_{$cleanName}.{$fileExt}";
    $r2Key = "task_submissions/{$targetFileName}";
}

$mimeMap = [
    'psd' => 'image/vnd.adobe.photoshop',
    'ai' => 'application/postscript',
    'eps' => 'application/postscript',
    'pdf' => 'application/pdf',
    'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'png' => 'image/png',
    'webp' => 'image/webp',
    'svg' => 'image/svg+xml',
    'zip' => 'application/zip',
    'rar' => 'application/x-rar-compressed',
    '7z' => 'application/x-7z-compressed',
    'mp4' => 'video/mp4'
];
// ── Cloudflare R2 Credentials & Config ──
require_once __DIR__ . '/../../config/r2.php';

$accountId     = defined('R2_ACCOUNT_ID') ? R2_ACCOUNT_ID : 'fa948485e5e2101ff9947aa131ca2a10';
$accessKey     = defined('R2_ACCESS_KEY_ID') ? R2_ACCESS_KEY_ID : '8388e6bdc9147b7a38c1c472bc7404eb';
$secretKey     = defined('R2_SECRET_ACCESS_KEY') ? R2_SECRET_ACCESS_KEY : 'a02487098fb85ff1ac74ca43773484a9dec89c5afb60a2736ca4cb4df3b6477e';
$bucketName    = defined('R2_BUCKET_NAME') ? R2_BUCKET_NAME : 'cca-task-attachments';
$publicBaseUrl = defined('R2_PUBLIC_URL') ? R2_PUBLIC_URL : 'https://pub-20551b894a524e97915e7c30fe97f682.r2.dev';
$region        = defined('R2_REGION') ? R2_REGION : 'auto';

if (!file_exists($fileTmpPath)) {
    echo json_encode(["status" => "error", "message" => "Temporary source file not found."]);
    exit();
}

$content = @file_get_contents($fileTmpPath);
if ($content === false) {
    echo json_encode(["status" => "error", "message" => "Failed to read uploaded file contents."]);
    exit();
}

$gdriveFailError = null;
// ── OPTION A: Google Drive Provider ──
if ($targetProvider === 'gdrive') {
    try {
        $driveClient = new GoogleDriveClient();
        if ($driveClient->isConfigured()) {
            $cfg = getStorageRoutingConfig();
            $folderName = $cfg['gdrive_task_folder_name'] ?? 'Task_Submissions';
            $rootId = !empty($cfg['gdrive_root_folder_id']) ? $cfg['gdrive_root_folder_id'] : null;

            // 1. Get or create main Task_Submissions folder
            $mainFolderId = $driveClient->findOrCreateFolder($folderName, $rootId);
            if (empty($mainFolderId)) {
                $mainFolderId = $rootId;
            }

            // 2. Organize by Task: Create task_{taskId} subfolder inside Task_Submissions
            $targetFolderId = $mainFolderId;
            if (!empty($taskId)) {
                $taskSubfolderName = "task_{$taskId}";
                $taskSubfolderId = $driveClient->findOrCreateFolder($taskSubfolderName, $mainFolderId);
                if (!empty($taskSubfolderId)) {
                    $targetFolderId = $taskSubfolderId;
                }
            }

            // 3. Upload file inside task_{taskId} folder
            $driveRes = $driveClient->uploadFile($fileTmpPath, $targetFileName, $contentType, $targetFolderId);

            $displayKey = !empty($taskId) ? "task_submissions/task_{$taskId}/{$targetFileName}" : "task_submissions/{$targetFileName}";

            echo json_encode([
                "status"    => "success",
                "message"   => "Uploaded to Google Drive successfully",
                "provider"  => "gdrive",
                "file"      => [
                    'name'             => $originalName,
                    'url'              => $driveRes['view_url'],
                    'key'              => $displayKey,
                    'file_id'          => $driveRes['file_id'],
                    'storage_provider' => 'gdrive',
                    'size'             => $fileSize,
                    'ext'              => $fileExt,
                    'mime'             => $contentType,
                    'file_type'        => $fileType
                ]
            ]);
            exit();
        }
    } catch (Exception $e) {
        $gdriveFailError = $e->getMessage();
        error_log("Google Drive upload failed, auto-failover to R2: " . $gdriveFailError);
        // Failover continues to Cloudflare R2 safely below
    }
}

// ── OPTION B: Cloudflare R2 Provider (Default / Failover) ──

$host = "{$accountId}.r2.cloudflarestorage.com";
$uri  = "/{$bucketName}/" . ltrim($r2Key, '/');
$url  = "https://{$host}{$uri}";

$amzDate     = gmdate('Ymd\THis\Z');
$dateStamp   = gmdate('Ymd');
$payloadHash = hash('sha256', $content);

$canonicalHeaders = "host:{$host}\n"
                  . "x-amz-content-sha256:{$payloadHash}\n"
                  . "x-amz-date:{$amzDate}\n";
$signedHeaders = "host;x-amz-content-sha256;x-amz-date";

$canonicalRequest = "PUT\n"
                  . $uri . "\n"
                  . "\n"
                  . $canonicalHeaders . "\n"
                  . $signedHeaders . "\n"
                  . $payloadHash;

$algorithm = "AWS4-HMAC-SHA256";
$credentialScope = "{$dateStamp}/{$region}/s3/aws4_request";
$stringToSign = "{$algorithm}\n{$amzDate}\n{$credentialScope}\n" . hash('sha256', $canonicalRequest);

$kSecret  = "AWS4" . $secretKey;
$kDate    = hash_hmac('sha256', $dateStamp, $kSecret, true);
$kRegion  = hash_hmac('sha256', $region, $kDate, true);
$kService = hash_hmac('sha256', 's3', $kRegion, true);
$kSigning = hash_hmac('sha256', 'aws4_request', $kService, true);
$signature = hash_hmac('sha256', $stringToSign, $kSigning);

$authorization = "{$algorithm} "
               . "Credential={$accessKey}/{$credentialScope}, "
               . "SignedHeaders={$signedHeaders}, "
               . "Signature={$signature}";

$mimeMap = [
    'psd' => 'image/vnd.adobe.photoshop',
    'ai' => 'application/postscript',
    'eps' => 'application/postscript',
    'pdf' => 'application/pdf',
    'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'png' => 'image/png',
    'webp' => 'image/webp',
    'svg' => 'image/svg+xml',
    'zip' => 'application/zip',
    'rar' => 'application/x-rar-compressed',
    '7z' => 'application/x-7z-compressed',
    'mp4' => 'video/mp4'
];
$contentType = $mimeMap[$fileExt] ?? ($fileData['type'] ?: 'application/octet-stream');

$headers = [
    "Host: {$host}",
    "Content-Type: {$contentType}",
    "x-amz-date: {$amzDate}",
    "x-amz-content-sha256: {$payloadHash}",
    "Authorization: {$authorization}",
    "Content-Length: " . strlen($content)
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PUT");
curl_setopt($ch, CURLOPT_POSTFIELDS, $content);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 30);
curl_setopt($ch, CURLOPT_TIMEOUT, 300);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($httpCode >= 200 && $httpCode < 300) {
    $finalUrl = rtrim($publicBaseUrl, '/') . '/' . ltrim($r2Key, '/');
    $msg = !empty($gdriveFailError) ? "Fallback to R2: {$gdriveFailError}" : "Uploaded successfully";
    echo json_encode([
        "status"    => "success",
        "message"   => $msg,
        "failover"  => !empty($gdriveFailError),
        "failover_error" => $gdriveFailError,
        "file"      => [
            'name'             => $originalName,
            'url'              => $finalUrl,
            'key'              => $r2Key,
            'storage_provider' => 'r2',
            'size'             => $fileSize,
            'ext'              => $fileExt,
            'mime'             => $contentType,
            'file_type'        => $fileType
        ]
    ]);
} else {
    echo json_encode([
        "status"    => "error",
        "message"   => $curlError ?: "R2 Upload failed with HTTP {$httpCode}: {$response}"
    ]);
}
?>
