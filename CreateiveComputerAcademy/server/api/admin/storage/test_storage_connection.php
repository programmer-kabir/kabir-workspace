<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../../config/r2.php';

$provider = isset($_GET['provider']) ? strtolower(trim($_GET['provider'])) : 'r2';

$startTime = microtime(true);

if ($provider === 'r2') {
    try {
        $publicUrl = defined('R2_PUBLIC_URL') ? rtrim(R2_PUBLIC_URL, '/') : 'https://pub-20551b894a524e97915e7c30fe97f682.r2.dev';
        $bucket = defined('R2_BUCKET_NAME') ? R2_BUCKET_NAME : 'cca-task-attachments';

        $ch = curl_init($publicUrl);
        curl_setopt($ch, CURLOPT_NOBODY, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 6);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $latency = round((microtime(true) - $startTime) * 1000);

        if ($httpCode > 0) {
            echo json_encode([
                "status" => "success",
                "provider" => "r2",
                "latency_ms" => $latency,
                "bucket" => $bucket,
                "message" => "Cloudflare R2 Bucket is active and responding smoothly ({$latency}ms)!"
            ]);
        } else {
            echo json_encode([
                "status" => "warning",
                "provider" => "r2",
                "latency_ms" => $latency,
                "message" => "R2 reachable but returned code {$httpCode}."
            ]);
        }
    } catch (Exception $e) {
        echo json_encode([
            "status" => "error",
            "provider" => "r2",
            "message" => "R2 Ping failed: " . $e->getMessage()
        ]);
    }
    exit();
}

if ($provider === 'gdrive') {
    require_once __DIR__ . '/../../../config/GoogleDriveClient.php';
    try {
        $client = new GoogleDriveClient();
        if (!$client->isConfigured()) {
            echo json_encode([
                "status" => "pending",
                "provider" => "gdrive",
                "configured" => false,
                "message" => "Google Drive credentials not placed yet."
            ]);
            exit();
        }

        $token = $client->getAccessToken();
        $latency = round((microtime(true) - $startTime) * 1000);

        $creds = @json_decode(@file_get_contents(__DIR__ . '/../../../config/google_drive_credentials.json'), true);
        $email = $creds['user_email'] ?? ($creds['client_email'] ?? 'Google Drive Vault');

        echo json_encode([
            "status" => "success",
            "provider" => "gdrive",
            "configured" => true,
            "client_email" => $email,
            "project_id" => "CCA 5TB Vault",
            "latency_ms" => $latency,
            "message" => "Google Drive 5TB Vault ({$email}) is verified and ready! ({$latency}ms)"
        ]);
        exit();
    } catch (Exception $e) {
        echo json_encode([
            "status" => "error",
            "provider" => "gdrive",
            "configured" => false,
            "message" => "Google Drive Connection Error: " . $e->getMessage()
        ]);
        exit();
    }
}

echo json_encode([
    "status" => "error",
    "message" => "Unknown provider specified."
]);
