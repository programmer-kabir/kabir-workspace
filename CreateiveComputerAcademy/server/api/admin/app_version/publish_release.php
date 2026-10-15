<?php
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/r2.php';
require_once __DIR__ . '/../../../config/AppVersionHelper.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    AppVersionHelper::ensureSchema($db);

    $input = $_POST;
    if (empty($input)) {
        $raw = file_get_contents("php://input");
        $input = @json_decode($raw, true) ?: [];
    }

    $version      = isset($input['version']) ? trim($input['version']) : '';
    $title        = isset($input['release_title']) ? trim($input['release_title']) : '';
    $notes        = isset($input['release_notes']) ? trim($input['release_notes']) : '';
    $category     = isset($input['category']) ? trim($input['category']) : 'feature';
    $isMandatory  = !empty($input['is_mandatory']) ? 1 : 0;
    $minSupported = !empty($input['min_supported_version']) ? trim($input['min_supported_version']) : $version;
    $downloadUrl  = isset($input['download_url']) ? trim($input['download_url']) : '';
    $fileSize     = isset($input['file_size']) ? intval($input['file_size']) : 0;
    $publishedBy  = isset($input['admin_id']) ? intval($input['admin_id']) : null;

    if (empty($version)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Version number is required (e.g. 1.0.1)."]);
        exit();
    }
    if (empty($title)) {
        $title = "CCA Desktop Attendance v{$version}";
    }

    // Handle optional direct .exe file upload to Cloudflare R2
    if (isset($_FILES['release_file']) && $_FILES['release_file']['error'] === UPLOAD_ERR_OK) {
        $tmpFile = $_FILES['release_file']['tmp_name'];
        $origName = $_FILES['release_file']['name'];
        $fileSize = $_FILES['release_file']['size'];

        $accountId     = defined('R2_ACCOUNT_ID') ? R2_ACCOUNT_ID : 'fa948485e5e2101ff9947aa131ca2a10';
        $accessKey     = defined('R2_ACCESS_KEY_ID') ? R2_ACCESS_KEY_ID : '8388e6bdc9147b7a38c1c472bc7404eb';
        $secretKey     = defined('R2_SECRET_ACCESS_KEY') ? R2_SECRET_ACCESS_KEY : 'a02487098fb85ff1ac74ca43773484a9dec89c5afb60a2736ca4cb4df3b6477e';
        $bucketName    = defined('R2_BUCKET_NAME') ? R2_BUCKET_NAME : 'cca-task-attachments';
        $publicBaseUrl = defined('R2_PUBLIC_URL') ? R2_PUBLIC_URL : 'https://pub-20551b894a524e97915e7c30fe97f682.r2.dev';

        $r2Key = "releases/v{$version}/CCA-Attendance-Setup.exe";
        $content = file_get_contents($tmpFile);

        // Upload to Cloudflare R2
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
                          . $uri . "\n\n"
                          . $canonicalHeaders . "\n"
                          . $signedHeaders . "\n"
                          . $payloadHash;

        $credentialScope = "{$dateStamp}/auto/s3/aws4_request";
        $stringToSign = "AWS4-HMAC-SHA256\n{$amzDate}\n{$credentialScope}\n" . hash('sha256', $canonicalRequest);

        $kSecret  = "AWS4" . $secretKey;
        $kDate    = hash_hmac('sha256', $dateStamp, $kSecret, true);
        $kRegion  = hash_hmac('sha256', 'auto', $kDate, true);
        $kService = hash_hmac('sha256', 's3', $kRegion, true);
        $kSigning = hash_hmac('sha256', 'aws4_request', $kService, true);
        $signature = hash_hmac('sha256', $stringToSign, $kSigning);

        $authorization = "AWS4-HMAC-SHA256 "
                       . "Credential={$accessKey}/{$credentialScope}, "
                       . "SignedHeaders={$signedHeaders}, "
                       . "Signature={$signature}";

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        curl_setopt($ch, CURLOPT_POSTFIELDS, $content);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Host: {$host}",
            "x-amz-date: {$amzDate}",
            "x-amz-content-sha256: {$payloadHash}",
            "Authorization: {$authorization}",
            "Content-Type: application/vnd.microsoft.portable-executable",
            "Content-Length: " . strlen($content)
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 300);
        $res = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode >= 200 && $httpCode < 300) {
            $downloadUrl = rtrim($publicBaseUrl, '/') . '/' . $r2Key;
        }
    }

    if (empty($downloadUrl)) {
        // Default R2 release URL pattern
        $publicBase = defined('R2_PUBLIC_URL') ? rtrim(R2_PUBLIC_URL, '/') : 'https://pub-20551b894a524e97915e7c30fe97f682.r2.dev';
        $downloadUrl = "{$publicBase}/releases/v{$version}/CCA-Attendance-Setup.exe";
    }

    // Insert or update release
    $sql = "INSERT INTO app_releases 
        (version, release_title, release_notes, category, is_mandatory, min_supported_version, download_url, file_size, published_by) 
        VALUES (:ver, :title, :notes, :cat, :mand, :min_ver, :url, :size, :pub_by)
        ON DUPLICATE KEY UPDATE 
            release_title = VALUES(release_title),
            release_notes = VALUES(release_notes),
            category = VALUES(category),
            is_mandatory = VALUES(is_mandatory),
            min_supported_version = VALUES(min_supported_version),
            download_url = VALUES(download_url),
            file_size = VALUES(file_size),
            published_by = VALUES(published_by)";

    $stmt = $db->prepare($sql);
    $stmt->execute([
        ':ver'     => $version,
        ':title'   => $title,
        ':notes'   => $notes,
        ':cat'     => $category,
        ':mand'    => $isMandatory,
        ':min_ver' => $minSupported,
        ':url'     => $downloadUrl,
        ':size'    => $fileSize,
        ':pub_by'  => $publishedBy
    ]);

    // Dispatch Notifications & Realtime Pusher Broadcast to all staff
    try {
        require_once __DIR__ . '/../../notifications/notification_helper.php';
        require_once __DIR__ . '/../../../config/PusherHelper.php';

        $notifTitle = "🚀 New Desktop App v{$version} Released!";
        $notifMsg   = "Admin has released Desktop Attendance v{$version}" . (!empty($notes) ? ": " . substr($notes, 0, 100) : ".");
        $priority   = $isMandatory ? 'urgent' : 'high';

        NotificationHelper::sendToRole(
            $db, 
            'staff', 
            $publishedBy, 
            $notifTitle, 
            $notifMsg, 
            'app_update', 
            'staff', 
            '/attendance', 
            $priority, 
            [
                'version'      => $version,
                'download_url' => $downloadUrl,
                'is_mandatory' => $isMandatory,
                'title'        => $title
            ]
        );

        // Also broadcast instant event to all listening desktop clients
        $pusher = new PusherHelper();
        $pusher->trigger('app-releases-channel', 'new-release', [
            'version'               => $version,
            'release_title'         => $title,
            'release_notes'         => $notes,
            'category'              => $category,
            'is_mandatory'          => $isMandatory,
            'min_supported_version' => $minSupported,
            'download_url'          => $downloadUrl,
            'published_at'          => date('Y-m-d H:i:s')
        ]);
    } catch (Exception $notifErr) {
        error_log("Failed to dispatch release notification: " . $notifErr->getMessage());
    }

    echo json_encode([
        "status"       => "success",
        "message"      => "Version v{$version} published successfully! Staff notified.",
        "version"      => $version,
        "download_url" => $downloadUrl,
        "is_mandatory" => $isMandatory
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Failed to publish release: " . $e->getMessage()
    ]);
}
