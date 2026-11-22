<?php
// MeetingDbHelper.php - Self-Healing Schema & Meeting Helper for CCA Live Meeting Hub

class MeetingDbHelper {

    /**
     * Ensure required tables exist in database (Self-Healing JIT Schema)
     */
    public static function ensureSchema($db) {
        if (!$db) return;

        try {
            // 1. Table: academy_meetings
            $db->exec("CREATE TABLE IF NOT EXISTS `academy_meetings` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `room_id` VARCHAR(64) NOT NULL UNIQUE,
                `title` VARCHAR(255) NOT NULL,
                `agenda` TEXT NULL,
                `meeting_type` ENUM('instant', 'scheduled') NOT NULL DEFAULT 'instant',
                `created_by` INT NOT NULL,
                `department_id` INT NULL,
                `scheduled_start` DATETIME NULL,
                `actual_start` DATETIME NULL,
                `actual_end` DATETIME NULL,
                `status` ENUM('scheduled', 'active', 'ended') NOT NULL DEFAULT 'active',
                `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
                `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX (`room_id`),
                INDEX (`created_by`),
                INDEX (`status`),
                INDEX (`scheduled_start`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

            // 2. Table: meeting_attendance_logs
            $db->exec("CREATE TABLE IF NOT EXISTS `meeting_attendance_logs` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `meeting_id` INT NOT NULL,
                `user_id` INT NOT NULL,
                `peer_id` VARCHAR(128) NULL,
                `joined_at` DATETIME NOT NULL,
                `left_at` DATETIME NULL,
                `duration_minutes` INT NOT NULL DEFAULT 0,
                `last_ping` DATETIME NULL,
                `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX (`meeting_id`),
                INDEX (`user_id`),
                INDEX (`peer_id`),
                INDEX (`joined_at`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

            // Ensure peer_id exists if table already existed
            try {
                $db->exec("ALTER TABLE `meeting_attendance_logs` ADD COLUMN `peer_id` VARCHAR(128) NULL AFTER `user_id`");
            } catch (Throwable $e) {}
            try {
                $db->exec("ALTER TABLE `meeting_attendance_logs` ADD COLUMN `last_ping` DATETIME NULL AFTER `duration_minutes`");
            } catch (Throwable $e) {}

            // 3. Table: meeting_messages (Live In-Meeting Chat)
            $db->exec("CREATE TABLE IF NOT EXISTS `meeting_messages` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `meeting_id` INT NOT NULL,
                `user_id` INT NOT NULL,
                `user_name` VARCHAR(150) NOT NULL,
                `user_role` VARCHAR(50) NULL DEFAULT 'Member',
                `message` TEXT NOT NULL,
                `is_pinned` TINYINT(1) NOT NULL DEFAULT 0,
                `pinned_by` INT NULL,
                `pinned_at` DATETIME NULL,
                `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX (`meeting_id`),
                INDEX (`user_id`),
                INDEX (`is_pinned`),
                INDEX (`created_at`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

            try {
                $db->exec("ALTER TABLE `meeting_messages` ADD COLUMN `is_pinned` TINYINT(1) NOT NULL DEFAULT 0 AFTER `message`");
            } catch (Throwable $e) {}
            try {
                $db->exec("ALTER TABLE `meeting_messages` ADD COLUMN `pinned_by` INT NULL AFTER `is_pinned`");
            } catch (Throwable $e) {}
            try {
                $db->exec("ALTER TABLE `meeting_messages` ADD COLUMN `pinned_at` DATETIME NULL AFTER `pinned_by`");
            } catch (Throwable $e) {}

        } catch (Throwable $e) {
            error_log("MeetingDbHelper::ensureSchema error: " . $e->getMessage());
        }
    }

    /**
     * Generate a collision-resistant clean room ID
     */
    public static function generateRoomId($prefix = 'cca_meet') {
        return $prefix . '_' . substr(md5(uniqid(mt_rand(), true)), 0, 10);
    }
}
?>
