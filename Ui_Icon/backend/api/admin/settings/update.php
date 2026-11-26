<?php
// backend/api/admin/settings/update.php
// Update Gemini AI Key in Database

require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';

$admin = requireAdmin($pdo);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, null, 'Method not allowed. Only POST is supported.', 405);
}

$data = getJsonInput();
$apiKey = isset($data['gemini_api_key']) 
    ? trim((string)$data['gemini_api_key']) 
    : (isset($data['settings']['gemini_api_key']) ? trim((string)$data['settings']['gemini_api_key']) : null);

if ($apiKey === null) {
    jsonResponse(false, null, 'No gemini_api_key provided to update.', 400);
}

try {
    $stmt = $pdo->prepare("
        INSERT INTO `system_settings` (`setting_key`, `setting_value`)
        VALUES ('gemini_api_key', :value)
        ON DUPLICATE KEY UPDATE 
            `setting_value` = VALUES(`setting_value`),
            `updated_at` = CURRENT_TIMESTAMP
    ");

    $stmt->execute([':value' => $apiKey]);

    // Log admin audit action
    try {
        $auditStmt = $pdo->prepare("
            INSERT INTO `admin_audit_logs` (`user_id`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`)
            VALUES (:user_id, 'update_gemini_api_key', 'system_settings', NULL, :details, :ip)
        ");
        $auditStmt->execute([
            ':user_id' => $admin['id'] ?? null,
            ':details' => json_encode(['updated_key' => 'gemini_api_key']),
            ':ip' => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
        ]);
    } catch (Exception $ex) {
        // Continue
    }

    jsonResponse(true, [
        'saved' => true
    ], 'Gemini API key saved in database successfully.');

} catch (PDOException $e) {
    jsonResponse(false, null, 'Database update error: ' . $e->getMessage(), 500);
}
