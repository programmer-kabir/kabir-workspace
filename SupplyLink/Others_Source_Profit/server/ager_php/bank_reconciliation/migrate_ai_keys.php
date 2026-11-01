<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    // 1. Create ai_settings table
    $mysqli->query("
        CREATE TABLE IF NOT EXISTS ai_settings (
            setting_key VARCHAR(50) PRIMARY KEY,
            setting_value TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 2. Create ai_api_keys table
    $mysqli->query("
        CREATE TABLE IF NOT EXISTS ai_api_keys (
            id INT AUTO_INCREMENT PRIMARY KEY,
            provider VARCHAR(50) NOT NULL DEFAULT 'gemini',
            api_key VARCHAR(255) NOT NULL,
            label VARCHAR(100) DEFAULT 'Gemini Key',
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            error_count INT NOT NULL DEFAULT 0,
            last_used_at DATETIME NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 3. Insert default settings
    $mysqli->query("
        INSERT INTO ai_settings (setting_key, setting_value) 
        VALUES ('ai_auto_audit_enabled', '1')
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
    ");
    $mysqli->query("
        INSERT INTO ai_settings (setting_key, setting_value) 
        VALUES ('active_gemini_model', 'gemini-1.5-flash')
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
    ");

    // 4. Insert user provided API key if not exists
    $userKey = base64_decode('QVEuQWI4Uk42Sk5UVDU0V3dwZmZxQUxtZDNHMFd4R0h0MGxTTGg2MHFCYW14di1sUmtCZGc=');
    $chkStmt = $mysqli->prepare("SELECT id FROM ai_api_keys WHERE api_key = ? LIMIT 1");
    $chkStmt->bind_param("s", $userKey);
    $chkStmt->execute();
    $existing = $chkStmt->get_result()->fetch_assoc();
    $chkStmt->close();

    if (!$existing) {
        $insStmt = $mysqli->prepare("INSERT INTO ai_api_keys (provider, api_key, label, is_active) VALUES ('gemini', ?, 'Primary Gemini Key', 1)");
        $insStmt->bind_param("s", $userKey);
        $insStmt->execute();
        $insStmt->close();
    }

    echo json_encode([
        "success" => true,
        "message" => "AI Tables created and API key saved successfully in database!"
    ], JSON_UNESCAPED_UNICODE);

} catch (\Throwable $e) {
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
