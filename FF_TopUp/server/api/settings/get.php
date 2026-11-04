<?php
require_once __DIR__ . '/../../helpers/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../config/db.php';

try {
    $stmt = $pdo->query("SELECT setting_key, setting_value FROM site_settings");
    $settingsRaw = $stmt->fetchAll();

    $settings = [
        'notice' => '',
        'payment_channels' => null
    ];

    foreach ($settingsRaw as $row) {
        if ($row['setting_key'] === 'notice') {
            $settings['notice'] = $row['setting_value'];
        } elseif ($row['setting_key'] === 'payment_channels') {
            $decoded = json_decode($row['setting_value'], true);
            $settings['payment_channels'] = is_array($decoded) ? $decoded : null;
        }
    }

    sendResponse(true, 'Settings loaded successfully', $settings);
} catch (Exception $e) {
    sendResponse(false, 'Failed to fetch settings: ' . $e->getMessage(), null, 500);
}

