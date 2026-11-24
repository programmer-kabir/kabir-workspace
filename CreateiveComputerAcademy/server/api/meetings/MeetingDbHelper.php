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

            // Ensure is_chat_locked and hosts_json exist in academy_meetings
            try {
                $db->exec("ALTER TABLE `academy_meetings` ADD COLUMN `is_chat_locked` TINYINT(1) NOT NULL DEFAULT 1 AFTER `status`");
            } catch (Throwable $e) {}
            try {
                $db->exec("ALTER TABLE `academy_meetings` ADD COLUMN `hosts_json` TEXT NULL AFTER `is_chat_locked`");
            } catch (Throwable $e) {}
            try {
                $db->exec("ALTER TABLE `academy_meetings` ADD COLUMN `recording_url` TEXT NULL AFTER `hosts_json`");
            } catch (Throwable $e) {}
            try {
                $db->exec("ALTER TABLE `academy_meetings` ADD COLUMN `recording_drive_id` VARCHAR(255) NULL AFTER `recording_url`");
            } catch (Throwable $e) {}
            try {
                $db->exec("ALTER TABLE `academy_meetings` ADD COLUMN `recording_duration` INT NULL DEFAULT 0 AFTER `recording_drive_id`");
            } catch (Throwable $e) {}
            try {
                $db->exec("ALTER TABLE `academy_meetings` ADD COLUMN `recording_size` BIGINT NULL DEFAULT 0 AFTER `recording_duration`");
            } catch (Throwable $e) {}
            try {
                $db->exec("ALTER TABLE `academy_meetings` ADD COLUMN `recorded_at` DATETIME NULL AFTER `recording_size`");
            } catch (Throwable $e) {}

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
                `message_type` VARCHAR(32) NOT NULL DEFAULT 'text',
                `attachment_url` TEXT NULL,
                `attachment_name` VARCHAR(255) NULL,
                `attachment_size` INT NULL,
                `code_language` VARCHAR(50) NULL,
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
                $db->exec("ALTER TABLE `meeting_messages` ADD COLUMN `message_type` VARCHAR(32) NOT NULL DEFAULT 'text' AFTER `message`");
            } catch (Throwable $e) {}
            try {
                $db->exec("ALTER TABLE `meeting_messages` ADD COLUMN `attachment_url` TEXT NULL AFTER `message_type`");
            } catch (Throwable $e) {}
            try {
                $db->exec("ALTER TABLE `meeting_messages` ADD COLUMN `attachment_name` VARCHAR(255) NULL AFTER `attachment_url`");
            } catch (Throwable $e) {}
            try {
                $db->exec("ALTER TABLE `meeting_messages` ADD COLUMN `attachment_size` INT NULL AFTER `attachment_name`");
            } catch (Throwable $e) {}
            try {
                $db->exec("ALTER TABLE `meeting_messages` ADD COLUMN `code_language` VARCHAR(50) NULL AFTER `attachment_size`");
            } catch (Throwable $e) {}
            try {
                $db->exec("ALTER TABLE `meeting_messages` ADD COLUMN `is_pinned` TINYINT(1) NOT NULL DEFAULT 0 AFTER `code_language`");
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

    /**
     * Verify if a user is a Host / Co-Host of a meeting
     */
    public static function isUserHost($db, $meeting, $userId, $userRole = null) {
        if (!$meeting || !$userId) return false;
        // 1. Creator is always host
        if (isset($meeting['created_by']) && (int)$meeting['created_by'] === (int)$userId) {
            return true;
        }
        // 2. Admin or Developer is always host
        if ($userRole && in_array(strtolower($userRole), ['admin', 'developer', 'superadmin', 'dev'])) {
            return true;
        }
        // Check user_roles table if role wasn't passed directly
        if (!$userRole && $db) {
            try {
                $rStmt = $db->prepare("SELECT role FROM user_roles WHERE user_id = :uid");
                $rStmt->execute([':uid' => $userId]);
                $rRows = $rStmt->fetchAll(PDO::FETCH_ASSOC);
                foreach ($rRows as $rRow) {
                    if (in_array(strtolower($rRow['role']), ['admin', 'developer', 'superadmin', 'dev'])) {
                        return true;
                    }
                }
            } catch (Throwable $e) {}
        }
        // 3. Check hosts_json
        if (!empty($meeting['hosts_json'])) {
            $hosts = is_array($meeting['hosts_json']) ? $meeting['hosts_json'] : json_decode($meeting['hosts_json'], true);
            if (is_array($hosts) && in_array((int)$userId, array_map('intval', $hosts))) {
                return true;
            }
        }
        return false;
    }
}
?>
