<?php
// server/api/events/EventDbHelper.php
// Ensures the database tables for CCA Team Events, Feasts & Tours are created automatically.

class EventDbHelper {
    public static function ensureSchema($db) {
        if (!$db) return;
        try {
            // 1. team_events table
            $db->exec("CREATE TABLE IF NOT EXISTS `team_events` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `title` VARCHAR(255) NOT NULL,
                `event_type` ENUM('feast', 'tour', 'sports', 'celebration', 'other') DEFAULT 'feast',
                `event_date` DATE NOT NULL,
                `location` VARCHAR(255) NULL,
                `description` TEXT NULL,
                `estimated_budget` DECIMAL(10,2) DEFAULT 0.00,
                `target_per_head` DECIMAL(10,2) DEFAULT 0.00,
                `collection_number` VARCHAR(100) NULL,
                `collection_note` VARCHAR(255) NULL,
                `status` ENUM('draft', 'active', 'ongoing', 'settling', 'completed', 'cancelled') DEFAULT 'active',
                `created_by` INT NOT NULL,
                `lead_user_id` INT NULL,
                `allow_guest` TINYINT(1) DEFAULT 1,
                `guest_fee` DECIMAL(10,2) DEFAULT 0.00,
                `total_collected` DECIMAL(10,2) DEFAULT 0.00,
                `total_spent` DECIMAL(10,2) DEFAULT 0.00,
                `settled_per_head` DECIMAL(10,2) DEFAULT 0.00,
                `settled_at` DATETIME NULL,
                `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX (`status`),
                INDEX (`event_date`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

            // 2. event_participants table
            $db->exec("CREATE TABLE IF NOT EXISTS `event_participants` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `event_id` INT NOT NULL,
                `user_id` INT NOT NULL,
                `rsvp_status` ENUM('invited', 'going', 'not_going', 'tentative') DEFAULT 'invited',
                `guest_count` INT DEFAULT 0,
                `guest_names` VARCHAR(255) NULL,
                `total_paid` DECIMAL(10,2) DEFAULT 0.00,
                `final_share` DECIMAL(10,2) DEFAULT 0.00,
                `balance` DECIMAL(10,2) DEFAULT 0.00,
                `settlement_status` ENUM('pending', 'cleared', 'refunded') DEFAULT 'pending',
                `settled_at` DATETIME NULL,
                `notes` TEXT NULL,
                `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX (`event_id`),
                INDEX (`user_id`),
                UNIQUE KEY `unique_event_participant` (`event_id`, `user_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

            // 3. event_contributions table (Cash / Mobile Wallet)
            $db->exec("CREATE TABLE IF NOT EXISTS `event_contributions` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `event_id` INT NOT NULL,
                `user_id` INT NOT NULL,
                `amount` DECIMAL(10,2) NOT NULL,
                `payment_method` ENUM('cash', 'bkash', 'nagad', 'rocket', 'other') DEFAULT 'cash',
                `sender_number` VARCHAR(50) NULL,
                `transaction_id` VARCHAR(100) NULL,
                `receipt_url` TEXT NULL,
                `status` ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
                `verified_by` INT NULL,
                `verified_at` DATETIME NULL,
                `notes` TEXT NULL,
                `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX (`event_id`),
                INDEX (`user_id`),
                INDEX (`status`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

            // 4. event_expenses table (Food / Transport / Vouchers)
            $db->exec("CREATE TABLE IF NOT EXISTS `event_expenses` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `event_id` INT NOT NULL,
                `paid_by` INT NOT NULL,
                `item_name` VARCHAR(255) NOT NULL,
                `category` ENUM('food', 'transport', 'accommodation', 'snacks', 'misc') DEFAULT 'food',
                `amount` DECIMAL(10,2) NOT NULL,
                `receipt_url` TEXT NULL,
                `is_self_vouched` TINYINT(1) DEFAULT 0,
                `status` ENUM('submitted', 'approved', 'rejected') DEFAULT 'approved',
                `approved_by` INT NULL,
                `notes` TEXT NULL,
                `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX (`event_id`),
                INDEX (`category`),
                INDEX (`status`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

            // 5. event_media table (Memories & Tour Photos)
            $db->exec("CREATE TABLE IF NOT EXISTS `event_media` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `event_id` INT NOT NULL,
                `user_id` INT NOT NULL,
                `file_url` TEXT NOT NULL,
                `media_type` ENUM('image', 'video') DEFAULT 'image',
                `caption` VARCHAR(255) NULL,
                `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX (`event_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

        } catch (Throwable $t) {
            error_log("EventDbHelper error: " . $t->getMessage());
        }
    }
}
?>

