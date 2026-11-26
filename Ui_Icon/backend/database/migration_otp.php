<?php
// backend/database/migration_otp.php
// Creates the email_otps table for OTP-based email verification (registration + forgot password)

require_once __DIR__ . '/../config/database.php';

echo "Running OTP Migration...\n";

$pdo->exec("
    CREATE TABLE IF NOT EXISTS `email_otps` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `email` VARCHAR(100) NOT NULL,
        `otp` VARCHAR(6) NOT NULL,
        `purpose` ENUM('registration', 'forgot_password') NOT NULL DEFAULT 'registration',
        `attempts` INT NOT NULL DEFAULT 0,
        `verified` TINYINT(1) NOT NULL DEFAULT 0,
        `expires_at` DATETIME NOT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY `idx_email_purpose` (`email`, `purpose`),
        KEY `idx_expires` (`expires_at`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
");

echo "✓ Table 'email_otps' ready.\n";
echo "OTP Migration completed successfully!\n";
