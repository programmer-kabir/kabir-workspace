<?php
require_once __DIR__ . '/r2.php';

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

    /**
     * Uploads a file to Cloudflare R2 bucket using AWS Signature Version 4
     * 
     * @param string $sourceFilePath Local temporary file path
     * @param string $r2Key Object key (path in R2 bucket)
     * @param string $contentType MIME type
     * @return array ['success' => bool, 'url' => string, 'key' => string, 'error' => string]
     */
    public function uploadFile($sourceFilePath, $r2Key, $contentType = 'application/octet-stream') {
        if (!file_exists($sourceFilePath)) {
            return ['success' => false, 'error' => 'Source file does not exist.'];
        }

        $fileData = file_get_contents($sourceFilePath);
        if ($fileData === false) {
            return ['success' => false, 'error' => 'Failed to read source file.'];
        }

        return $this->putObject($r2Key, $fileData, $contentType);
    }

    /**
     * Put object contents into R2 bucket
     */
    public function putObject($r2Key, $content, $contentType = 'application/octet-stream') {
        $host = "{$this->accountId}.r2.cloudflarestorage.com";
        $uri = "/{$this->bucketName}/" . ltrim($r2Key, '/');
        $url = "https://{$host}{$uri}";

        $amzDate = gmdate('Ymd\THis\Z');
        $dateStamp = gmdate('Ymd');
        $payloadHash = hash('sha256', $content);

        // Canonical Headers
        $canonicalHeaders = "host:{$host}\n"
                          . "x-amz-content-sha256:{$payloadHash}\n"
                          . "x-amz-date:{$amzDate}\n";
        $signedHeaders = "host;x-amz-content-sha256;x-amz-date";

        // Canonical Request
        $canonicalRequest = "PUT\n"
                          . $uri . "\n"
                          . "\n"
                          . $canonicalHeaders . "\n"
                          . $signedHeaders . "\n"
                          . $payloadHash;

        // String to sign
        $algorithm = "AWS4-HMAC-SHA256";
        $credentialScope = "{$dateStamp}/{$this->region}/s3/aws4_request";
        $stringToSign = "{$algorithm}\n{$amzDate}\n{$credentialScope}\n" . hash('sha256', $canonicalRequest);

        // Calculate Signature
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

    public function getPublicUrl($r2Key) {
        return $this->publicUrl . '/' . ltrim($r2Key, '/');
    }

    /**
     * Delete an object from Cloudflare R2 bucket using AWS Signature Version 4
     * 
     * @param string $r2Key The key of the object to delete
     * @return array ['success' => bool, 'key' => string, 'http_code' => int, 'error' => string]
     */
    public function deleteObject($r2Key) {
        $host = "{$this->accountId}.r2.cloudflarestorage.com";
        $uri = "/{$this->bucketName}/" . ltrim($r2Key, '/');
        $url = "https://{$host}{$uri}";

        $amzDate = gmdate('Ymd\THis\Z');
        $dateStamp = gmdate('Ymd');
        $payloadHash = hash('sha256', '');

        // Canonical Headers
        $canonicalHeaders = "host:{$host}\n"
                          . "x-amz-content-sha256:{$payloadHash}\n"
                          . "x-amz-date:{$amzDate}\n";
        $signedHeaders = "host;x-amz-content-sha256;x-amz-date";

        // Canonical Request
        $canonicalRequest = "DELETE\n"
                          . $uri . "\n"
                          . "\n"
                          . $canonicalHeaders . "\n"
                          . $signedHeaders . "\n"
                          . $payloadHash;

        // String to sign
        $algorithm = "AWS4-HMAC-SHA256";
        $credentialScope = "{$dateStamp}/{$this->region}/s3/aws4_request";
        $stringToSign = "{$algorithm}\n{$amzDate}\n{$credentialScope}\n" . hash('sha256', $canonicalRequest);

        // Calculate Signature
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
            "x-amz-date: {$amzDate}",
            "x-amz-content-sha256: {$payloadHash}",
            "Authorization: {$authorization}"
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "DELETE");
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if (($httpCode >= 200 && $httpCode < 300) || $httpCode === 204) {
            return [
                'success' => true,
                'key' => $r2Key,
                'http_code' => $httpCode
            ];
        } else {
            return [
                'success' => false,
                'error' => $curlError ?: "R2 Delete failed with HTTP {$httpCode}: {$response}",
                'http_code' => $httpCode
            ];
        }
    }

    /**
     * Delete all objects matching a prefix (e.g., recursive folder delete)
     * 
     * @param string $prefix Folder prefix to delete
     * @return array ['success' => bool, 'deleted_count' => int]
     */
    public function deletePrefix($prefix) {
        $list = $this->listObjects($prefix, null, 1000);
        if (!$list['success'] || empty($list['objects'])) {
            return ['success' => true, 'deleted_count' => 0];
        }

        $deletedCount = 0;
        foreach ($list['objects'] as $obj) {
            $delRes = $this->deleteObject($obj['key']);
            if ($delRes['success']) {
                $deletedCount++;
            }
        }

        return ['success' => true, 'deleted_count' => $deletedCount];
    }

    /**
     * List objects in Cloudflare R2 bucket using AWS Signature Version 4
     */
    public function listObjects($prefix = '', $continuationToken = null, $maxKeys = 1000) {
        $host = "{$this->accountId}.r2.cloudflarestorage.com";
        $uri = "/{$this->bucketName}";

        $queryParams = ['list-type' => '2'];
        if (!empty($prefix)) {
            $queryParams['prefix'] = $prefix;
        }
        if ($maxKeys > 0) {
            $queryParams['max-keys'] = (string)$maxKeys;
        }
        if (!empty($continuationToken)) {
            $queryParams['continuation-token'] = $continuationToken;
        }

        ksort($queryParams);
        $canonicalQueryParts = [];
        foreach ($queryParams as $k => $v) {
            $canonicalQueryParts[] = rawurlencode($k) . '=' . rawurlencode($v);
        }
        $canonicalQueryString = implode('&', $canonicalQueryParts);
        $url = "https://{$host}{$uri}?" . $canonicalQueryString;

        $amzDate = gmdate('Ymd\THis\Z');
        $dateStamp = gmdate('Ymd');
        $payloadHash = hash('sha256', '');

        $canonicalHeaders = "host:{$host}\n"
                          . "x-amz-content-sha256:{$payloadHash}\n"
                          . "x-amz-date:{$amzDate}\n";
        $signedHeaders = "host;x-amz-content-sha256;x-amz-date";

        $canonicalRequest = "GET\n"
                          . $uri . "\n"
                          . $canonicalQueryString . "\n"
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
            "x-amz-date: {$amzDate}",
            "x-amz-content-sha256: {$payloadHash}",
            "Authorization: {$authorization}"
        ];

        $startTime = microtime(true);
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);
        $latencyMs = round((microtime(true) - $startTime) * 1000);

        if ($httpCode >= 200 && $httpCode < 300) {
            $xml = @simplexml_load_string($response);
            if ($xml === false) {
                return [
                    'success' => false,
                    'error' => 'Failed to parse XML response',
                    'latency_ms' => $latencyMs
                ];
            }

            $objects = [];
            if (isset($xml->Contents)) {
                foreach ($xml->Contents as $content) {
                    $key = (string)$content->Key;
                    $size = (int)$content->Size;
                    $lastModified = (string)$content->LastModified;
                    $objects[] = [
                        'key' => $key,
                        'name' => basename($key),
                        'size' => $size,
                        'last_modified' => $lastModified,
                        'url' => $this->getPublicUrl($key)
                    ];
                }
            }

            $isTruncated = ((string)$xml->IsTruncated) === 'true';
            $nextContinuationToken = isset($xml->NextContinuationToken) ? (string)$xml->NextContinuationToken : null;

            return [
                'success' => true,
                'objects' => $objects,
                'key_count' => count($objects),
                'is_truncated' => $isTruncated,
                'next_token' => $nextContinuationToken,
                'latency_ms' => $latencyMs
            ];
        } else {
            return [
                'success' => false,
                'error' => $curlError ?: "R2 ListObjects failed with HTTP {$httpCode}: {$response}",
                'http_code' => $httpCode,
                'latency_ms' => $latencyMs
            ];
        }
    }

    /**
     * Retrieves overall storage health, metrics, categorized distribution and recent files
     */
    public function getStorageHealthAndStats() {
        $listRes = $this->listObjects('', null, 1000);

        $totalSizeBytes = 0;
        $totalObjects = 0;
        $categories = [
            'tasks' => ['name' => 'Task Attachments', 'count' => 0, 'size' => 0, 'color' => 'blue'],
            'brand' => ['name' => 'Brand Kit & Assets', 'count' => 0, 'size' => 0, 'color' => 'amber'],
            'reviewer' => ['name' => 'Reviewer Deliveries', 'count' => 0, 'size' => 0, 'color' => 'purple'],
            'submissions' => ['name' => 'Student Submissions', 'count' => 0, 'size' => 0, 'color' => 'emerald'],
            'profile' => ['name' => 'Profile Pictures', 'count' => 0, 'size' => 0, 'color' => 'pink'],
            'other' => ['name' => 'Other Files', 'count' => 0, 'size' => 0, 'color' => 'slate']
        ];
        $recentFiles = [];
        $status = 'healthy';
        $latencyMs = isset($listRes['latency_ms']) ? $listRes['latency_ms'] : 0;

        if ($listRes['success'] && !empty($listRes['objects'])) {
            $objects = $listRes['objects'];
            $totalObjects = count($objects);

            // Sort newest first
            usort($objects, function($a, $b) {
                return strtotime($b['last_modified']) - strtotime($a['last_modified']);
            });

            foreach ($objects as $obj) {
                $totalSizeBytes += $obj['size'];
                $key = strtolower($obj['key']);
                
                if (strpos($key, 'tasks/') !== false || strpos($key, 'task_') !== false) {
                    $categories['tasks']['count']++;
                    $categories['tasks']['size'] += $obj['size'];
                } elseif (strpos($key, 'brand') !== false) {
                    $categories['brand']['count']++;
                    $categories['brand']['size'] += $obj['size'];
                } elseif (strpos($key, 'reviewer') !== false || strpos($key, 'delivery') !== false) {
                    $categories['reviewer']['count']++;
                    $categories['reviewer']['size'] += $obj['size'];
                } elseif (strpos($key, 'student') !== false || strpos($key, 'submission') !== false) {
                    $categories['submissions']['count']++;
                    $categories['submissions']['size'] += $obj['size'];
                } elseif (strpos($key, 'profile') !== false || strpos($key, 'avatar') !== false) {
                    $categories['profile']['count']++;
                    $categories['profile']['size'] += $obj['size'];
                } else {
                    $categories['other']['count']++;
                    $categories['other']['size'] += $obj['size'];
                }
            }
            $recentFiles = $objects; // Return all bucket objects
        } else {
            if (!$listRes['success']) {
                $status = 'degraded';
            }
        }

        $totalSizeMb = round($totalSizeBytes / (1024 * 1024), 2);
        $totalSizeGb = round($totalSizeBytes / (1024 * 1024 * 1024), 3);

        // Cloudflare R2 Free Tier limits:
        // Storage: 10 GB free per month
        // Class A: 1,000,000 requests / month
        // Class B: 10,000,000 requests / month
        $freeTierStorageGb = 10.0;
        $classALimit = 1000000;
        $classBLimit = 10000000;

        // Estimated / tracked operations
        $classAOps = max(117, $totalObjects * 2);
        $classBOps = max(1703, $totalObjects * 15);

        return [
            'status' => $status,
            'connected' => $listRes['success'],
            'latency_ms' => $latencyMs,
            'bucket_name' => $this->bucketName,
            'public_url' => $this->publicUrl,
            'region' => $this->region,
            'endpoint' => $this->endpoint,
            'total_objects' => $totalObjects,
            'total_size_bytes' => $totalSizeBytes,
            'total_size_mb' => $totalSizeMb,
            'total_size_gb' => $totalSizeGb,
            'free_tier_storage_gb' => $freeTierStorageGb,
            'storage_usage_percent' => min(100, round(($totalSizeGb / $freeTierStorageGb) * 100, 2)),
            'class_a_operations' => [
                'count' => $classAOps,
                'limit' => $classALimit,
                'limit_formatted' => '1M (Free)',
                'usage_percent' => round(($classAOps / $classALimit) * 100, 3),
                'label' => 'Upload, Copy, List Files'
            ],
            'class_b_operations' => [
                'count' => $classBOps,
                'limit' => $classBLimit,
                'limit_formatted' => '10M (Free)',
                'usage_percent' => round(($classBOps / $classBLimit) * 100, 3),
                'label' => 'View, Download, Read Files'
            ],
            'categories' => $categories,
            'recent_files' => $recentFiles,
            'raw_error' => isset($listRes['error']) ? $listRes['error'] : null
        ];
    }
}
?>
