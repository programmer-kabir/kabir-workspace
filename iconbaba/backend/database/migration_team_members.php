<?php
// backend/database/migration_team_members.php
require_once __DIR__ . '/../config/database.php';

try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `team_members` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `subscription_id` INT NOT NULL,
            `owner_user_id` INT NOT NULL,
            `member_email` VARCHAR(255) NOT NULL,
            `member_user_id` INT DEFAULT NULL,
            `role` VARCHAR(50) NOT NULL DEFAULT 'member',
            `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE CASCADE,
            FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
            UNIQUE KEY `unique_sub_email` (`subscription_id`, `member_email`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // Add status column if table was previously created without it
    try {
        $colCheck = $pdo->query("SHOW COLUMNS FROM `team_members` LIKE 'status'")->fetch();
        if (!$colCheck) {
            $pdo->exec("ALTER TABLE `team_members` ADD COLUMN `status` VARCHAR(20) NOT NULL DEFAULT 'pending'");
        }
    } catch (Exception $e) {}

    echo "✓ Table 'team_members' with status column checked successfully.\n";
} catch (PDOException $e) {
    echo "Error creating table: " . $e->getMessage() . "\n";
}
