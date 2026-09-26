<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Content-Type: application/json; charset=UTF-8");

function findConfigFile($filename) {
    $dir = __DIR__;
    for ($i = 0; $i < 6; $i++) {
        if (file_exists($dir . '/config/' . $filename)) {
            return $dir . '/config/' . $filename;
        }
        $parent = dirname($dir);
        if ($parent === $dir) break;
        $dir = $parent;
    }
    if (!empty($_SERVER['DOCUMENT_ROOT'])) {
        if (file_exists($_SERVER['DOCUMENT_ROOT'] . '/config/' . $filename)) {
            return $_SERVER['DOCUMENT_ROOT'] . '/config/' . $filename;
        }
        if (file_exists($_SERVER['DOCUMENT_ROOT'] . '/server/config/' . $filename)) {
            return $_SERVER['DOCUMENT_ROOT'] . '/server/config/' . $filename;
        }
    }
    return null;
}

try {
    $corsFile = findConfigFile('cors.php');
    if ($corsFile) {
        require_once $corsFile;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(["status" => "error", "message" => "Only POST method is allowed."]);
        exit();
    }

    // Include r2 configuration
    $r2ConfigFile = findConfigFile('r2.php');
    if ($r2ConfigFile) {
        require_once $r2ConfigFile;
    }

    // Try including R2Client.php
    $r2File = findConfigFile('R2Client.php');
    if ($r2File) {
        require_once $r2File;
    }

    // Fallback R2Client definition if R2Client.php on server was corrupted
    if (!class_exists('R2Client')) {
        class R2Client {
            private $accountId;
            private $accessKey;
            private $secretKey;
            private $bucketName;
            private $endpoint;
            private $publicUrl;
            private $region;

            public function __construct() {
                $this->accountId  = defined('R2_ACCOUNT_ID') ? R2_ACCOUNT_ID : 'fa948485e5e2101ff9947aa131ca2a10';
                $this->accessKey  = defined('R2_ACCESS_KEY_ID') ? R2_ACCESS_KEY_ID : '8388e6bdc9147b7a38c1c472bc7404eb';
                $this->secretKey  = defined('R2_SECRET_ACCESS_KEY') ? R2_SECRET_ACCESS_KEY : 'a02487098fb85ff1ac74ca43773484a9dec89c5afb60a2736ca4cb4df3b6477e';
                $this->bucketName = defined('R2_BUCKET_NAME') ? R2_BUCKET_NAME : 'cca-task-attachments';
                $this->endpoint   = defined('R2_ENDPOINT') ? rtrim(R2_ENDPOINT, '/') : 'https://fa948485e5e2101ff9947aa131ca2a10.r2.cloudflarestorage.com';
                $this->publicUrl  = defined('R2_PUBLIC_URL') ? rtrim(R2_PUBLIC_URL, '/') : 'https://pub-20551b894a524e97915e7c30fe97f682.r2.dev';
                $this->region     = defined('R2_REGION') ? R2_REGION : 'auto';
            }

            public function putObject($r2Key, $content, $contentType = 'application/octet-stream') {
                $host = "{$this->accountId}.r2.cloudflarestorage.com";
                $uri = "/{$this->bucketName}/" . ltrim($r2Key, '/');
                $url = "https://{$host}{$uri}";

                $amzDate = gmdate('Ymd\THis\Z');
                $dateStamp = gmdate('Ymd');
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
                $credentialScope = "{$dateStamp}/{$this->region}/s3/aws4_request";
                $stringToSign = "{$algorithm}\n{$amzDate}\n{$credentialScope}\n" . hash('sha256', $canonicalRequest);

                $kSecret = "AWS4" . $this->secretKey;
                $kDate = hash_hmac('sha256', $dateStamp, $kSecret, true);
                $kRegion = hash_hmac('sha256', $this->region, $kDate, true);
                $kService = hash_hmac('sha256', 's3', $kRegion, true);
                $kSigning = hash_hmac('sha256', 'aws4_request', $kService, true);
                $signature = hash_hmac('sha256', $stringToSign, $kSigning);

                $authorization = "{$algorithm} "
                               . "Credential={$this->accessKey}/{$credentialScope}, "
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
                    $publicUrl = $this->publicUrl . '/' . ltrim($r2Key, '/');
                    return [
                        'success' => true,
                        'url' => $publicUrl,
                        'key' => $r2Key,
                        'http_code' => $httpCode
                    ];
                } else {
                    return [
                        'success' => false,
                        'error' => $curlError ?: "R2 Upload failed with HTTP {$httpCode}: {$response}",
                        'http_code' => $httpCode,
                        'raw_response' => $response
                    ];
                }
            }
        }
    }

    $fileField = isset($_FILES['image']) ? 'image' : (isset($_FILES['file']) ? 'file' : null);

    if (!$fileField || empty($_FILES[$fileField]['tmp_name'])) {
        echo json_encode(["status" => "error", "message" => "No image file provided."]);
        exit();
    }

    $file = $_FILES[$fileField];

    if ($file['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(["status" => "error", "message" => "File upload error code: " . $file['error']]);
        exit();
    }

    $fileTmpPath = $file['tmp_name'];
    $fileSize = $file['size'];

    if ($fileSize > 10 * 1024 * 1024) {
        echo json_encode(["status" => "error", "message" => "Image size exceeds 10MB limit."]);
        exit();
    }

    $type = isset($_POST['type']) ? strtolower(trim($_POST['type'])) : 'cover';
    if ($type !== 'banner') {
        $type = 'cover';
    }

    $courseTitle = isset($_POST['course_title']) ? trim($_POST['course_title']) : '';
    $courseCode = isset($_POST['course_code']) ? trim($_POST['course_code']) : '';

    function generateSlug($string) {
        if (empty($string)) return '';
        $slug = preg_replace('~[^\pL\d]+~u', '-', $string);
        $slug = trim($slug, '-');
        $slug = preg_replace('~-+~', '-', $slug);
        if (function_exists('mb_strtolower')) {
            $slug = mb_strtolower($slug, 'UTF-8');
        } else {
            $slug = strtolower($slug);
        }
        return $slug;
    }

    $slug = generateSlug($courseTitle);

    if (empty($slug)) {
        if (!empty($courseCode)) {
            $slug = generateSlug($courseCode);
        }
    }
    if (empty($slug)) {
        $slug = 'course-' . time() . '-' . rand(100, 999);
    }

    $fileContents = file_get_contents($fileTmpPath);
    if ($fileContents === false) {
        echo json_encode(["status" => "error", "message" => "Failed to read uploaded file."]);
        exit();
    }

    $webpData = null;
    $contentType = 'image/webp';

    if (function_exists('imagecreatefromstring') && function_exists('imagewebp')) {
        $imageResource = @imagecreatefromstring($fileContents);
        if ($imageResource !== false) {
            imagealphablending($imageResource, false);
            imagesavealpha($imageResource, true);

            ob_start();
            $success = @imagewebp($imageResource, null, 85);
            $buffer = ob_get_clean();
            imagedestroy($imageResource);

            if ($success && !empty($buffer)) {
                $webpData = $buffer;
            }
        }
    }

    if (!$webpData) {
        $webpData = $fileContents;
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $detectedMime = $finfo ? finfo_buffer($finfo, $fileContents) : null;
        if ($finfo) finfo_close($finfo);
        $contentType = $detectedMime ?: ($file['type'] ?: 'image/jpeg');
    }

    $r2Folder = ($type === 'banner') ? 'banner' : 'cover';
    $r2Key = "cca-student/course/{$r2Folder}/{$slug}.webp";

    $r2 = new R2Client();
    $uploadResult = $r2->putObject($r2Key, $webpData, $contentType);

    if (!empty($uploadResult['success']) && !empty($uploadResult['url'])) {
        echo json_encode([
            "status" => "success",
            "message" => "Image successfully converted to WebP and uploaded to Cloudflare R2.",
            "url" => $uploadResult['url'],
            "key" => $r2Key,
            "type" => $type,
            "format" => "WEBP",
            "slug" => $slug,
            "file_size" => strlen($webpData)
        ]);
    } else {
        $errorMsg = isset($uploadResult['error']) ? $uploadResult['error'] : 'Unknown R2 upload error.';
        echo json_encode([
            "status" => "error",
            "message" => "Cloudflare R2 upload failed: " . $errorMsg
        ]);
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Server Error: " . $e->getMessage(),
        "line" => $e->getLine(),
        "file" => basename($e->getFile())
    ]);
}
?>
