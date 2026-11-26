<?php
// backend/database/migration_daily_quota.php
require_once __DIR__ . '/../config/database.php';

echo "Running Daily Quota Migration...\n";

// 1. Create daily_export_usage table
$pdo->exec("
    CREATE TABLE IF NOT EXISTS daily_export_usage (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usage_date DATE NOT NULL,
        identifier VARCHAR(64) NOT NULL,
        user_id INT NULL,
        ip_address VARCHAR(45) NOT NULL,
        count INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_date_identifier (usage_date, identifier),
        KEY idx_user_date (user_id, usage_date),
        KEY idx_ip_date (ip_address, usage_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
");
echo "✓ Table `daily_export_usage` ready.\n";

// 2. Ensure 'pro' role exists in roles table
$proCheck = $pdo->prepare("SELECT id FROM roles WHERE slug = 'pro' LIMIT 1");
$proCheck->execute();
if (!$proCheck->fetch()) {
    $pdo->prepare("
        INSERT INTO roles (slug, name, description) 
        VALUES ('pro', 'Pro Member', 'Pro subscription with unlimited icon exports and downloads')
    ")->execute();
    echo "✓ Created 'pro' role in roles table.\n";
} else {
    echo "✓ 'pro' role already exists.\n";
}

echo "Daily Quota Migration completed successfully!\n";
