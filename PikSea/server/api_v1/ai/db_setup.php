<?php

require_once __DIR__ . '/../config/db.php';

function ensureAiKeysTable($mysqli) {
    $createSql = "
        CREATE TABLE IF NOT EXISTS `ai_api_keys` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `provider` VARCHAR(50) NOT NULL DEFAULT 'gemini',
            `api_key` VARCHAR(255) NOT NULL UNIQUE,
            `label` VARCHAR(100) DEFAULT 'Gemini Key',
            `status` ENUM('active', 'inactive', 'rate_limited') NOT NULL DEFAULT 'active',
            `usage_count` INT UNSIGNED NOT NULL DEFAULT 0,
            `last_used_at` DATETIME DEFAULT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    $mysqli->query($createSql);

    // Seed the primary key provided by user if table is empty or key doesn't exist
    $defaultKey = 'AIzaSyB48jliTWQy7oGgMbN8Hkmi3uSkMMZrSS4';
    $checkStmt = $mysqli->prepare("SELECT id FROM ai_api_keys WHERE api_key = ? LIMIT 1");
    if ($checkStmt) {
        $checkStmt->bind_param("s", $defaultKey);
        $checkStmt->execute();
        $res = $checkStmt->get_result();
        if ($res->num_rows === 0) {
            $insertStmt = $mysqli->prepare("INSERT INTO ai_api_keys (provider, api_key, label, status) VALUES ('gemini', ?, 'Primary Gemini Key', 'active')");
            if ($insertStmt) {
                $insertStmt->bind_param("s", $defaultKey);
                $insertStmt->execute();
                $insertStmt->close();
            }
        }
        $checkStmt->close();
    }
}
