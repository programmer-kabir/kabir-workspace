<?php
// High-Speed Direct Cloudflare R2 Presigned Upload URL Generator for Students
// Creative Computer Academy - Student Practice & Daily Work Log Submissions

@ini_set('display_errors', '0');
error_reporting(0);

date_default_timezone_set('Asia/Dhaka');

require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/r2.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(["status" => "success", "message" => "Preflight OK"]);
    exit();
}

$input = json_decode(file_get_contents("php://input"), true);
if (!$input) {
    $input = $_POST;
}

$userId    = isset($input['user_id']) ? intval($input['user_id']) : 0;
$fileName  = isset($input['file_name']) ? trim($input['file_name']) : '';
$fileType  = isset($input['file_type']) ? trim($input['file_type']) : 'application/octet-stream';
$fileSize  = isset($input['file_size']) ? intval($input['file_size']) : 0;
$customDate = isset($input['date']) ? trim($input['date']) : date('Y-m-d');

if (empty($fileName)) {
    echo json_encode(["status" => "error", "message" => "File name is required."]);
    exit();
}

if ($userId <= 0) {
    echo json_encode(["status" => "error", "message" => "Valid user_id is required."]);
    exit();
}

// Fetch student code if available
$studentCode = "STU-{$userId}";
try {
    $database = new Database();
    $db = $database->getConnection();
    if ($db) {
        $stStmt = $db->prepare("SELECT student_code FROM students WHERE user_id = :uid LIMIT 1");
        $stStmt->execute([':uid' => $userId]);
        $stRow = $stStmt->fetch(PDO::FETCH_ASSOC);
        if ($stRow && !empty($stRow['student_code'])) {
            $studentCode = $stRow['student_code'];
        }
    }
} catch (Throwable $e) {}

// Classify file extension & type
$fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
function classifyStudentFileType($ext) {
    $previewExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
    $sourceExts  = ['psd', 'eps', 'ai', 'indd', 'cdr', 'fig', 'xd', 'sketch', 'pdf', 'zip', 'rar', '7z'];
    $videoExts   = ['mp4', 'mov', 'webm', 'avi', 'mkv'];

    if (in_array($ext, $previewExts)) return 'preview';
    if (in_array($ext, $sourceExts)) return 'source';
    if (in_array($ext, $videoExts)) return 'video';
    return 'other';
}
$classifiedType = classifyStudentFileType($fileExt);

// Resolve Target R2 Path (Bangladesh Time YYYY-MM / user / YYYY-MM-DD)
$monthFolder   = date('Y-m', strtotime($customDate));
$dateFolder    = date('Y-m-d', strtotime($customDate));
$userFolder    = "user_{$userId}_{$studentCode}";
$timestamp     = time();
$cleanBaseName = preg_replace('/[^a-zA-Z0-9_\.-]/', '_', pathinfo($fileName, PATHINFO_FILENAME));
$targetFileName = "{$timestamp}_{$cleanBaseName}.{$fileExt}";

$r2Key = "daily-logs/{$monthFolder}/{$userFolder}/{$dateFolder}/{$targetFileName}";

// AWS Signature V4 Presigned URL for Cloudflare R2
$accountId     = defined('R2_ACCOUNT_ID') ? R2_ACCOUNT_ID : 'fa948485e5e2101ff9947aa131ca2a10';
$accessKey     = defined('R2_ACCESS_KEY_ID') ? R2_ACCESS_KEY_ID : '8388e6bdc9147b7a38c1c472bc7404eb';
$secretKey     = defined('R2_SECRET_ACCESS_KEY') ? R2_SECRET_ACCESS_KEY : 'a02487098fb85ff1ac74ca43773484a9dec89c5afb60a2736ca4cb4df3b6477e';
$bucketName    = defined('R2_STUDENT_BUCKET_NAME') ? R2_STUDENT_BUCKET_NAME : 'cca-student-submissions';
$publicBaseUrl = defined('R2_PUBLIC_URL') ? R2_PUBLIC_URL : 'https://pub-20551b894a524e97915e7c30fe97f682.r2.dev';
$region        = 'auto';
$expires       = 3600; // 1 hour

$host = "{$accountId}.r2.cloudflarestorage.com";
$uri  = "/{$bucketName}/" . ltrim($r2Key, '/');

$amzDate     = gmdate('Ymd\THis\Z');
$dateStamp   = gmdate('Ymd');
$credential  = "{$accessKey}/{$dateStamp}/{$region}/s3/aws4_request";

$queryParams = [
    'X-Amz-Algorithm'     => 'AWS4-HMAC-SHA256',
    'X-Amz-Credential'    => $credential,
    'X-Amz-Date'          => $amzDate,
    'X-Amz-Expires'       => (string)$expires,
    'X-Amz-SignedHeaders' => 'host',
];

ksort($queryParams);
$canonicalQueryString = http_build_query($queryParams, '', '&', PHP_QUERY_RFC3986);

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
