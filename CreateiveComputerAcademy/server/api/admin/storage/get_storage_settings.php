<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/storage.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    // Auto-create table if not exists (fail-safe for live server)
    $db->exec("CREATE TABLE IF NOT EXISTS system_storage_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) NOT NULL UNIQUE,
        setting_value TEXT NULL,
        description VARCHAR(255) NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    // 1. Fetch settings from system_storage_settings
    $stmt = $db->query("SELECT setting_key, setting_value, description FROM system_storage_settings");
    $settingsRaw = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $settings = [];
    foreach ($settingsRaw as $row) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }

    // 2. Health & Diagnostic Overview
    $credentialsPath = __DIR__ . '/../../../config/google_drive_credentials.json';
    $gdriveConfigured = file_exists($credentialsPath);

    $r2Configured = defined('R2_ACCOUNT_ID') && !empty(R2_ACCOUNT_ID);

    $localUploadDir = realpath(__DIR__ . '/../../../../');
    $freeSpaceGb = $localUploadDir ? round(disk_free_space($localUploadDir) / (1024 * 1024 * 1024), 2) : 0;

    $health = [
        'r2' => [
            'configured' => $r2Configured,
            'bucket' => defined('R2_BUCKET_NAME') ? R2_BUCKET_NAME : 'cca-task-attachments',
            'public_url' => defined('R2_PUBLIC_URL') ? R2_PUBLIC_URL : '',
            'status' => 'online'
        ],
        'gdrive' => [
            'configured' => $gdriveConfigured,
            'has_credentials' => $gdriveConfigured,
            'enabled' => ($settings['gdrive_enabled'] ?? '0') === '1',
            'root_folder_id' => $settings['gdrive_root_folder_id'] ?? '',
            'status' => $gdriveConfigured ? 'ready' : 'awaiting_credentials'
        ],
        'local' => [
            'free_space_gb' => $freeSpaceGb,
            'is_writable' => is_writable(__DIR__ . '/../../../'),
            'status' => 'online'
        ]
    ];

    echo json_encode([
        'status' => 'success',
        'settings' => $settings,
        'health' => $health
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to fetch storage settings: ' . $e->getMessage()
    ]);
}
