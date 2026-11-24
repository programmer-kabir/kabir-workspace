<?php
// server/api/meetings/sync_drive_vault.php
// Secure endpoint to synchronize Google Drive OAuth credentials into Hostinger production
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../developer/developer_guard.php';

header('Content-Type: application/json');

$database = new Database();
$db = $database->getConnection();

// Auth check: Support Bearer token OR POST secret
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
$token = '';
if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
$secretKey = $input['sync_secret'] ?? '';

$authorized = false;
if ($secretKey === 'cca_drive_vault_sync_2026') {
    $authorized = true;
} else if (!empty($token)) {
    $dev = verifyDeveloperAccess($db, $token);
    if ($dev) {
        $authorized = true;
    }
}

if (!$authorized) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized. Admin or developer access required.']);
    exit;
}

$clientId        = trim($input['client_id'] ?? '');
$clientSecret    = trim($input['client_secret'] ?? '');
$refreshToken    = trim($input['refresh_token'] ?? '');
$vaultId         = trim($input['vault_id'] ?? '18HFbN429toI-WJ1NUMTXcK3bVY69Kcno');
$meetingFolderId = trim($input['meeting_folder_id'] ?? '1ylVVos5JaUoi4PBnewR2Danbd3AR5P4D');

if (empty($clientId) || empty($refreshToken)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'client_id and refresh_token are required.']);
    exit;
}

try {
    // 1. Ensure table exists
    $db->exec("CREATE TABLE IF NOT EXISTS `system_storage_settings` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `setting_key` VARCHAR(64) NOT NULL UNIQUE,
        `setting_value` TEXT NULL,
        `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    // 2. Save settings to database
    $stmt = $db->prepare("INSERT INTO `system_storage_settings` (`setting_key`, `setting_value`) VALUES
        ('gdrive_client_id', :cid),
        ('gdrive_client_secret', :csecret),
        ('gdrive_refresh_token', :rtoken),
        ('gdrive_vault_id', :vid),
        ('gdrive_meeting_folder_id', :mid)
    ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`)");

    $stmt->execute([
        ':cid'     => $clientId,
        ':csecret' => $clientSecret,
        ':rtoken'  => $refreshToken,
        ':vid'     => $vaultId,
        ':mid'     => $meetingFolderId
    ]);

    // 3. Also update local google_drive_credentials.json on server filesystem
    $credsPath = realpath(__DIR__ . '/../../config') . '/google_drive_credentials.json';
    $credsData = [
        'client_id'     => $clientId,
        'client_secret' => $clientSecret,
        'refresh_token' => $refreshToken,
        'type'          => 'authorized_user',
        'user_email'    => 'creativecomputeracademybd@gmail.com'
    ];
    @file_put_contents($credsPath, json_encode($credsData, JSON_PRETTY_PRINT));

    // 4. Remove cached access token so fresh token is fetched
    $cachePath = realpath(__DIR__ . '/../../config') . '/google_drive_token_cache.json';
    if (file_exists($cachePath)) {
        @unlink($cachePath);
    }

    echo json_encode([
        'status'  => 'success',
        'message' => 'Google Drive credentials and folder IDs synchronized successfully to Hostinger production!'
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
