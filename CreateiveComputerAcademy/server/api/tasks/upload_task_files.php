<?php
// Standalone Bulletproof Cloudflare R2 File Uploader
// No external file dependencies - Works everywhere on all PHP versions

// 1. Error handling & output buffering
@ini_set('display_errors', '0');
error_reporting(0);

// Increase resource limits for large design files (PSD, AI, EPS, ZIP, MP4)
@ini_set('upload_max_filesize', '128M');
@ini_set('post_max_size', '128M');
@ini_set('max_execution_time', '300');
@ini_set('memory_limit', '256M');

// 2. Universal CORS headers
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header("Access-Control-Allow-Origin: " . $origin);
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
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

// Check if content length exceeded post_max_size
if (empty($_FILES) && empty($_POST) && isset($_SERVER['CONTENT_LENGTH']) && $_SERVER['CONTENT_LENGTH'] > 0) {
    echo json_encode([
        "status" => "error",
        "message" => "আপলোডকৃত ফাইলটি সার্ভার লিমিটের চেয়ে বড় (File size exceeds post_max_size limit)."
    ]);
    exit();
}

if (empty($_FILES)) {
    echo json_encode(["status" => "error", "message" => "No files received from client."]);
    exit();
}

// 3. Safe MIME type resolver
function getSafeMimeType($tmpPath, $fileName, $clientMime) {
    if (function_exists('finfo_open')) {
        try {
            $finfo = @finfo_open(FILEINFO_MIME_TYPE);
            if ($finfo) {
                $mime = @finfo_file($finfo, $tmpPath);
                @finfo_close($finfo);
                if (!empty($mime)) return $mime;
            }
        } catch (Throwable $t) {}
    }

    if (function_exists('mime_content_type')) {
        try {
            $mime = @mime_content_type($tmpPath);
            if (!empty($mime)) return $mime;
        } catch (Throwable $t) {}
    }

    $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    $map = [
        'psd'  => 'image/vnd.adobe.photoshop',
        'ai'   => 'application/postscript',
        'eps'  => 'application/postscript',
        'pdf'  => 'application/pdf',
        'jpg'  => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png'  => 'image/png',
        'webp' => 'image/webp',
        'svg'  => 'image/svg+xml',
        'zip'  => 'application/zip',
        'rar'  => 'application/x-rar-compressed',
        '7z'   => 'application/x-7z-compressed',
        'mp4'  => 'video/mp4',
        'mov'  => 'video/quicktime',
        'webm' => 'video/webm'
    ];

    return $map[$ext] ?? ($clientMime ?: 'application/octet-stream');
}

// 4. File category classifier
function classifyFileType($ext) {
    $ext = strtolower($ext);
    $previewExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
    $videoExts = ['mp4', 'mov', 'webm', 'avi', 'mkv'];
    $sourceExts = ['psd', 'eps', 'ai', 'indd', 'cdr', 'zip', 'rar', '7z', 'tar', 'gz', 'pdf', 'fig', 'xd', 'sketch', 'docx', 'xlsx', 'pptx'];

    if (in_array($ext, $previewExts)) return 'preview';
    if (in_array($ext, $videoExts)) return 'video';
    if (in_array($ext, $sourceExts)) return 'source';
    return 'other';
}

// 5. Direct AWS Signature V4 Cloudflare R2 Upload
function uploadDirectToR2($tmpFilePath, $r2Key, $contentType) {
    $accountId     = 'fa948485e5e2101ff9947aa131ca2a10';
    $accessKey     = '8388e6bdc9147b7a38c1c472bc7404eb';
    $secretKey     = 'a02487098fb85ff1ac74ca43773484a9dec89c5afb60a2736ca4cb4df3b6477e';
    $bucketName    = 'cca-task-attachments';
    $publicBaseUrl = 'https://pub-20551b894a524e97915e7c30fe97f682.r2.dev';
    $region        = 'auto';

    if (!file_exists($tmpFilePath)) {
        return ['success' => false, 'error' => 'Source temporary file not found.'];
    }

    $content = @file_get_contents($tmpFilePath);
    if ($content === false) {
        return ['success' => false, 'error' => 'Failed to read source file.'];
    }

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
        return [
            'success'   => true,
            'url'       => $finalUrl,
            'key'       => $r2Key,
            'http_code' => $httpCode
        ];
    } else {
        return [
            'success'   => false,
            'error'     => $curlError ?: "R2 Upload failed with HTTP {$httpCode}: {$response}",
            'http_code' => $httpCode
        ];
    }
}

// 6. Process uploaded files
$taskId = isset($_POST['task_id']) ? intval($_POST['task_id']) : 0;
$userId = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;

// Strict 20-Minute Minimum Work Rule for Uploads
if (!empty($taskId)) {
    require_once __DIR__ . '/../../config/database.php';
    $database = new Database();
    $db = $database->getConnection();
    if ($db) {
        $find_log = $db->prepare("SELECT created_at FROM task_logs WHERE task_id = :task_id AND status_to = 'In Progress' ORDER BY id DESC LIMIT 1");
        $find_log->execute([':task_id' => $taskId]);
        $in_prog_log = $find_log->fetch(PDO::FETCH_ASSOC);

        $in_prog_time = null;
        if ($in_prog_log && !empty($in_prog_log['created_at'])) {
            $in_prog_time = strtotime($in_prog_log['created_at']);
        } else {
            $tStmt = $db->prepare("SELECT session_start_time, status FROM tasks WHERE id = :task_id LIMIT 1");
            $tStmt->execute([':task_id' => $taskId]);
            $tRow = $tStmt->fetch(PDO::FETCH_ASSOC);
            if ($tRow && $tRow['status'] === 'In Progress' && !empty($tRow['session_start_time'])) {
                $in_prog_time = strtotime($tRow['session_start_time']);
            }
        }

        if ($in_prog_time) {
            $elapsed_secs = time() - $in_prog_time;
            $min_required_secs = 60; 
            if ($elapsed_secs < $min_required_secs) {
                $rem_mins = ceil(($min_required_secs - $elapsed_secs) / 60);
                echo json_encode([
                    "status" => "error",
                    "message" => "To maintain work quality, you must work at least 20 minutes before uploading files. File upload will unlock in approximately {$rem_mins} minute(s)."
                ]);
                exit();
            }
        }
    }
}

$fileItems = [];
foreach ($_FILES as $inputKey => $fileData) {
    if (is_array($fileData['name'])) {
        for ($i = 0; $i < count($fileData['name']); $i++) {
            if ($fileData['error'][$i] === UPLOAD_ERR_OK && !empty($fileData['tmp_name'][$i])) {
                $fileItems[] = [
                    'name'     => $fileData['name'][$i],
                    'type'     => $fileData['type'][$i] ?? '',
                    'tmp_name' => $fileData['tmp_name'][$i],
                    'size'     => $fileData['size'][$i] ?? 0,
                ];
            }
        }
    } else {
        if ($fileData['error'] === UPLOAD_ERR_OK && !empty($fileData['tmp_name'])) {
            $fileItems[] = [
                'name'     => $fileData['name'],
                'type'     => $fileData['type'] ?? '',
                'tmp_name' => $fileData['tmp_name'],
                'size'     => $fileData['size'] ?? 0,
            ];
        }
    }
}

if (empty($fileItems)) {
    echo json_encode(["status" => "error", "message" => "No valid files received."]);
    exit();
}

$uploadedFiles = [];
$errors = [];
$usedNames = [];

foreach ($fileItems as $file) {
    $originalName = $file['name'];
    $fileSize     = $file['size'];
    $fileTmpPath  = $file['tmp_name'];
    $fileExt      = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $mimeType     = getSafeMimeType($fileTmpPath, $originalName, $file['type']);
    $fileType     = classifyFileType($fileExt);

    // Exact Clean Name based on Task ID
    if (!empty($taskId)) {
        if (!isset($usedNames[$fileExt])) {
            $usedNames[$fileExt] = 1;
            $targetFileName = "{$taskId}.{$fileExt}";
        } else {
            $usedNames[$fileExt]++;
            $targetFileName = "{$taskId}_{$usedNames[$fileExt]}.{$fileExt}";
        }
        $r2Key = "task_submissions/task_{$taskId}/{$targetFileName}";
    } else {
        $cleanName = preg_replace('/[^a-zA-Z0-9_\.-]/', '_', pathinfo($originalName, PATHINFO_FILENAME));
        $timestamp = time();
        $targetFileName = "{$timestamp}_{$cleanName}.{$fileExt}";
        $r2Key = "task_submissions/{$targetFileName}";
    }

    // Direct Cloudflare R2 Upload
    $uploadRes = uploadDirectToR2($fileTmpPath, $r2Key, $mimeType);
    if (!empty($uploadRes['success'])) {
        $uploadedFiles[] = [
            'name'      => $originalName,
            'url'       => $uploadRes['url'],
            'key'       => $r2Key,
            'size'      => $fileSize,
            'ext'       => $fileExt,
            'mime'      => $mimeType,
            'file_type' => $fileType
        ];
    } else {
        $errors[] = "R2 upload failed for '{$originalName}': " . ($uploadRes['error'] ?? 'Unknown error');
    }
}

if (!empty($uploadedFiles)) {
    echo json_encode([
        "status"  => "success",
        "message" => count($uploadedFiles) . " file(s) uploaded successfully to Cloudflare R2.",
        "files"   => $uploadedFiles,
        "errors"  => $errors
    ]);
} else {
    echo json_encode([
        "status"  => "error",
        "message" => "All file uploads to Cloudflare R2 failed. " . implode(" | ", $errors),
        "errors"  => $errors
    ]);
}
?>
