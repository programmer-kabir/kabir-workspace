-- database/notifications.sql
-- Table definitions for Role-Aware and Personal Notifications in IconBaba

CREATE TABLE IF NOT EXISTS `notifications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NULL,                         -- Specific recipient user ID (NULL for role broadcast or global)
    `target_role` VARCHAR(50) NULL,             -- 'all', 'admin', 'user', etc. (NULL if direct to user)
    `type` VARCHAR(50) NOT NULL,                -- 'team_invite', 'team_approved', 'team_declined', 'payment_success', 'admin_new_order', 'admin_new_user', 'system'
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `link` VARCHAR(255) DEFAULT NULL,           -- Frontend route or URL (e.g. '/billing', '/history')
    `action_data` JSON DEFAULT NULL,            -- e.g. {"invite_id": 5, "owner_name": "Alex"}
    `icon` VARCHAR(50) DEFAULT 'bell',          -- 'bell', 'users', 'credit-card', 'sparkles', 'shield', 'alert-circle'
    `is_read` TINYINT(1) NOT NULL DEFAULT 0,    -- 0 = unread, 1 = read (for direct user_id)
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_user_read` (`user_id`, `is_read`),
    INDEX `idx_role` (`target_role`),
    INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
