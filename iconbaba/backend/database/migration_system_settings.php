<?php
// backend/database/migration_system_settings.php
// Clean migration: Stores only Gemini API Key in database

require_once __DIR__ . '/../config/database.php';

echo "=== Running Clean System Settings Database Migration ===\n\n";

$pdo->exec("
CREATE TABLE IF NOT EXISTS `system_settings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `setting_key` VARCHAR(100) NOT NULL UNIQUE,
    `setting_value` TEXT NULL,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
");

// Drop extra columns if they exist
$cols = $pdo->query("SHOW COLUMNS FROM `system_settings`")->fetchAll(PDO::FETCH_COLUMN);

if (in_array('setting_group', $cols)) {
    $pdo->exec("ALTER TABLE `system_settings` DROP COLUMN `setting_group`");
    echo "✓ Removed 'setting_group' column.\n";
}

if (in_array('description', $cols)) {
    $pdo->exec("ALTER TABLE `system_settings` DROP COLUMN `description`");
    echo "✓ Removed 'description' column.\n";
}

if (in_array('created_at', $cols)) {
    $pdo->exec("ALTER TABLE `system_settings` DROP COLUMN `created_at`");
    echo "✓ Removed 'created_at' column.\n";
}

// Clean up any extra rows, keeping ONLY gemini_api_key
$pdo->exec("DELETE FROM `system_settings` WHERE `setting_key` NOT IN ('gemini_api_key')");

// Ensure gemini_api_key row exists
$envGeminiKey = getenv('GEMINI_API_KEY') ?: ($_ENV['GEMINI_API_KEY'] ?? '');
$stmt = $pdo->prepare("
    INSERT INTO `system_settings` (`setting_key`, `setting_value`)
    VALUES ('gemini_api_key', :val)
    ON DUPLICATE KEY UPDATE `setting_key` = 'gemini_api_key'
");
$stmt->execute([':val' => $envGeminiKey]);

echo "✓ 'system_settings' table cleaned: now contains ONLY 'gemini_api_key'.\n";
echo "✓ Migration completed successfully!\n";
