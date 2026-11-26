<?php
// backend/api/admin/settings/get.php
// Get Gemini AI Key Setting for Admin Panel

require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';
require_once __DIR__ . '/../../../helpers/gemini.php';

$admin = requireAdmin($pdo);

try {
    $stmt = $pdo->prepare("SELECT `setting_value`, `updated_at` FROM `system_settings` WHERE `setting_key` = 'gemini_api_key' LIMIT 1");
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    $dbKey = $row['setting_value'] ?? '';
    $resolvedKey = getActiveGeminiApiKey($pdo);

    jsonResponse(true, [
        'gemini' => [
            'api_key' => $resolvedKey,
            'has_key' => !empty($resolvedKey),
            'is_from_db' => !empty($dbKey),
            'updated_at' => $row['updated_at'] ?? null
        ]
    ], 'Settings retrieved successfully.');

} catch (PDOException $e) {
    jsonResponse(false, null, 'Database query failed: ' . $e->getMessage(), 500);
}
