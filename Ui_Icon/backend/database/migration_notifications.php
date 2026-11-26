<?php
// backend/database/migration_notifications.php
// Standalone migration for notifications and notification_reads tables

require_once __DIR__ . '/../config/database.php';

try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `notifications` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `user_id` INT NULL,
            `target_role` VARCHAR(50) NULL,
            `type` VARCHAR(50) NOT NULL,
            `title` VARCHAR(255) NOT NULL,
            `message` TEXT NOT NULL,
            `link` VARCHAR(255) DEFAULT NULL,
            `action_data` JSON DEFAULT NULL,
            `icon` VARCHAR(50) DEFAULT 'bell',
            `is_read` TINYINT(1) NOT NULL DEFAULT 0,
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX `idx_user_read` (`user_id`, `is_read`),
            INDEX `idx_role` (`target_role`),
            INDEX `idx_created` (`created_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `notification_reads` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `notification_id` INT NOT NULL,
            `user_id` INT NOT NULL,
            `read_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            `is_dismissed` TINYINT(1) NOT NULL DEFAULT 0,
            UNIQUE KEY `uniq_user_notif` (`user_id`, `notification_id`),
            FOREIGN KEY (`notification_id`) REFERENCES `notifications`(`id`) ON DELETE CASCADE,
            INDEX `idx_user` (`user_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    echo "✓ Tables 'notifications' and 'notification_reads' verified/created successfully.\n";
} catch (PDOException $e) {
    echo "Error creating notification tables: " . $e->getMessage() . "\n";
}
