<?php

// Make sure the AWS SDK autoloader is included.
// We downloaded the AWS SDK via ZIP directly into vendor/aws.
require_once __DIR__ . '/../../vendor/aws/aws-autoloader.php';

use Aws\S3\S3Client;
use Aws\Exception\AwsException;

class R2Helper {
    private static $client = null;
    
    // Cloudflare R2 Credentials
    private static $accessKey = '2175bbae53407e97d810658747b1b66f';
    private static $secretKey = '552e680269af1bb2aec41574b0ec61a857452e8a18cc4a2b336aa4a024f75285';
    private static $endpoint = 'https://b88add0e4d3eae3a5a32ad34b2cc0096.r2.cloudflarestorage.com';
    private static $bucket = 'dayalstock-assets';
    private static $publicUrl = 'https://pub-8d3e60db04cc4bf9bd592995b23acefe.r2.dev';
    
    public static function getClient() {
        if (self::$client === null) {
            self::$client = new S3Client([
                'version' => 'latest',
                'region'  => 'auto',
                'endpoint' => self::$endpoint,
                'credentials' => [
                    'key'    => self::$accessKey,
                    'secret' => self::$secretKey,
                ]
            ]);
        }
        return self::$client;
    }
    
    /**
     * Upload a file to Cloudflare R2.
     * 
     * @param string $sourceFile The absolute path to the local temporary file (e.g., $_FILES['file']['tmp_name'])
     * @param string $r2Key The destination path inside the R2 bucket (e.g., 'uploads/contents/123/main.zip')
     * @param string $contentType The MIME type of the file (e.g., 'image/jpeg')
     * @return bool True if upload succeeded, false otherwise
     */
    public static function uploadFile($sourceFile, $r2Key, $contentType = null) {
        try {
            $client = self::getClient();
            $params = [
                'Bucket' => self::$bucket,
                'Key'    => $r2Key,
                'SourceFile' => $sourceFile,
            ];
            
            if ($contentType) {
                $params['ContentType'] = $contentType;
            }
            
            $client->putObject($params);
            return true;
        } catch (AwsException $e) {
            error_log("R2 Upload Error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Generate a Presigned URL for Direct Frontend Upload
     * 
     * @param string $r2Key The destination path inside the R2 bucket
     * @param string $contentType The MIME type of the file
     * @return string The presigned URL
     */
    public static function generatePresignedUrl($r2Key, $contentType) {
        try {
            $client = self::getClient();
            $cmd = $client->getCommand('PutObject', [
                'Bucket' => self::$bucket,
                'Key' => $r2Key,
                'ContentType' => $contentType
            ]);
            
            $request = $client->createPresignedRequest($cmd, '+60 minutes');
            return (string)$request->getUri();
        } catch (AwsException $e) {
            error_log("R2 Presigned URL Error: " . $e->getMessage());
            return null;
        }
    }
    
    public static function getPublicUrl($r2Key) {
        return self::$publicUrl . '/' . ltrim($r2Key, '/');
    }

    /**
     * Get bucket statistics (total size and object count)
     */
    public static function getBucketStats() {
        try {
            $client = self::getClient();
            $isTruncated = true;
            $continuationToken = null;
            $totalSize = 0;
            $objectCount = 0;

            while ($isTruncated) {
                $params = ['Bucket' => self::$bucket];
                if ($continuationToken) {
                    $params['ContinuationToken'] = $continuationToken;
                }
                
                $result = $client->listObjectsV2($params);
                
                if (isset($result['Contents'])) {
                    foreach ($result['Contents'] as $object) {
                        $totalSize += $object['Size'];
                        $objectCount++;
                    }
                }
                
                $isTruncated = $result['IsTruncated'];
                $continuationToken = $result['NextContinuationToken'] ?? null;
            }
            
            return [
                'totalSize' => $totalSize,
                'objectCount' => $objectCount
            ];
        } catch (AwsException $e) {
            error_log("R2 Stats Error: " . $e->getMessage());
            return ['totalSize' => 0, 'objectCount' => 0];
        }
    }
}
