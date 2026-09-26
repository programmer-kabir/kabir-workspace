<?php
// High-Speed Direct Cloudflare R2 Presigned Upload URL Generator
// Creative Computer Academy - Fast Task File Upload Pipeline

@ini_set('display_errors', '0');
error_reporting(0);

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

$input = json_decode(file_get_contents("php://input"), true);
if (!$input) {
    $input = $_POST;
}

$taskId    = isset($input['task_id']) ? intval($input['task_id']) : 0;
$userId    = isset($input['user_id']) ? intval($input['user_id']) : 0;
$fileName  = isset($input['file_name']) ? trim($input['file_name']) : '';
$fileType  = isset($input['file_type']) ? trim($input['file_type']) : 'application/octet-stream';
$fileSize  = isset($input['file_size']) ? intval($input['file_size']) : 0;
$index     = isset($input['index']) ? intval($input['index']) : 1;

if (empty($fileName)) {
    echo json_encode(["status" => "error", "message" => "File name is required."]);
    exit();
}

// 1. Check Minimum Work Time Rule (1 min)
if (!empty($taskId)) {
    require_once __DIR__ . '/../../config/database.php';
    try {
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
                $min_required_secs = 60; // 1 minute
                if ($elapsed_secs < $min_required_secs) {
                    $rem_secs = $min_required_secs - $elapsed_secs;
                    echo json_encode([
                        "status" => "error",
                        "message" => "Please wait {$rem_secs} second(s) before uploading files."
                    ]);
                    exit();
                }
            }
        }
    } catch (Throwable $e) {}
}

// 2. Classify file extension & type
$fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
function classifyFileTypeFast($ext) {
    $previewExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
    $videoExts = ['mp4', 'mov', 'webm', 'avi', 'mkv'];
    $sourceExts = ['psd', 'eps', 'ai', 'indd', 'cdr', 'zip', 'rar', '7z', 'tar', 'gz', 'pdf', 'fig', 'xd', 'sketch', 'docx', 'xlsx', 'pptx'];

    if (in_array($ext, $previewExts)) return 'preview';
    if (in_array($ext, $videoExts)) return 'video';
    if (in_array($ext, $sourceExts)) return 'source';
    return 'other';
}
$classifiedType = classifyFileTypeFast($fileExt);

// 3. Resolve Target Path
if (!empty($taskId)) {
    $suffix = ($index > 1) ? "_{$index}" : "";
    $targetFileName = "{$taskId}{$suffix}.{$fileExt}";
    $r2Key = "task_submissions/task_{$taskId}/{$targetFileName}";
} else {
    $cleanName = preg_replace('/[^a-zA-Z0-9_\.-]/', '_', pathinfo($fileName, PATHINFO_FILENAME));
    $timestamp = time();
    $targetFileName = "{$timestamp}_{$cleanName}.{$fileExt}";
    $r2Key = "task_submissions/{$targetFileName}";
}

// 4. Generate AWS Signature V4 Presigned URL for Cloudflare R2
$accountId     = 'fa948485e5e2101ff9947aa131ca2a10';
$accessKey     = '8388e6bdc9147b7a38c1c472bc7404eb';
$secretKey     = 'a02487098fb85ff1ac74ca43773484a9dec89c5afb60a2736ca4cb4df3b6477e';
$bucketName    = 'cca-task-attachments';
$publicBaseUrl = 'https://pub-20551b894a524e97915e7c30fe97f682.r2.dev';
$region        = 'auto';
$expires       = 3600; // 1 hour validity

$host = "{$accountId}.r2.cloudflarestorage.com";
$uri  = "/{$bucketName}/" . ltrim($r2Key, '/');

$amzDate     = gmdate('Ymd\THis\Z');
$dateStamp   = gmdate('Ymd');
$credential  = "{$accessKey}/{$dateStamp}/{$region}/s3/aws4_request";

// Query params for presigned URL (sorted alphabetically)
$queryParams = [
    'X-Amz-Algorithm'     => 'AWS4-HMAC-SHA256',
    'X-Amz-Credential'    => $credential,
    'X-Amz-Date'          => $amzDate,
    'X-Amz-Expires'       => (string)$expires,
    'X-Amz-SignedHeaders' => 'host',
];

ksort($queryParams);
$canonicalQueryString = http_build_query($queryParams, '', '&', PHP_QUERY_RFC3986);

// Canonical Request
$canonicalHeaders = "host:{$host}\n";
$signedHeaders    = "host";
$payloadHash      = "UNSIGNED-PAYLOAD";

$canonicalRequest = "PUT\n"
                  . $uri . "\n"
                  . $canonicalQueryString . "\n"
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

$presignedUrl = "https://{$host}{$uri}?{$canonicalQueryString}&X-Amz-Signature={$signature}";
$finalPublicUrl = rtrim($publicBaseUrl, '/') . '/' . ltrim($r2Key, '/');

echo json_encode([
    "status"         => "success",
    "presigned_url"  => $presignedUrl,
    "public_url"     => $finalPublicUrl,
    "r2_key"         => $r2Key,
    "file_name"      => $fileName,
    "ext"            => $fileExt,
    "file_type"      => $classifiedType,
    "target_name"    => $targetFileName,
    "expires_in"     => $expires
]);
?>
