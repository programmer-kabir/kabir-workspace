<?php
// ContentStudioHelper.php - Dedicated Helper for CCA Content Studio & Video Pipeline

class ContentStudioHelper {

    public static function ensureSchema($db) {
        if (!$db) return;
        try {
            $db->exec("
                CREATE TABLE IF NOT EXISTS `content_studio_projects` (
                  `id` INT AUTO_INCREMENT PRIMARY KEY,
                  `title` VARCHAR(255) NOT NULL,
                  `content_type` ENUM('youtube_long', 'shorts_reel', 'course_promo', 'tutorial') DEFAULT 'youtube_long',
                  `current_stage` ENUM('scripting', 'voiceover', 'footage', 'editing', 'review', 'published') DEFAULT 'scripting',
                  
                  `created_by` INT NOT NULL,
                  `scriptwriter_id` INT NULL,
                  `voice_artist_id` INT NULL,
                  `footage_collector_id` INT NULL,
                  `video_editor_id` INT NULL,
                  `thumbnail_designer_id` INT NULL,
                  `publisher_id` INT NULL,
                  `reviewer_id` INT NULL,
                  
                  `script_text` LONGTEXT NULL,
                  `voiceover_audio_url` TEXT NULL,
                  `assets_drive_url` TEXT NULL,
                  `draft_video_url` TEXT NULL,
                  `project_source_url` TEXT NULL,
                  `thumbnail_url` TEXT NULL,
                  
                  `yt_title` VARCHAR(255) NULL,
                  `yt_description` LONGTEXT NULL,
                  `yt_tags` TEXT NULL,
                  `yt_live_url` VARCHAR(255) NULL,
                  `scheduled_at` DATETIME NULL,
                  `published_at` DATETIME NULL,
                  
                  `status` ENUM('active', 'revision', 'completed', 'cancelled') DEFAULT 'active',
                  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  
                  INDEX `idx_stage` (`current_stage`),
                  INDEX `idx_status` (`status`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");

            $db->exec("
                CREATE TABLE IF NOT EXISTS `content_studio_reviews` (
                  `id` INT AUTO_INCREMENT PRIMARY KEY,
                  `project_id` INT NOT NULL,
                  `reviewer_id` INT NOT NULL,
                  `timestamp_seconds` INT NOT NULL,
                  `timestamp_formatted` VARCHAR(10) NOT NULL,
                  `feedback_text` TEXT NOT NULL,
                  `status` ENUM('open', 'resolved') DEFAULT 'open',
                  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  INDEX `idx_project_rev` (`project_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");

            $db->exec("
                CREATE TABLE IF NOT EXISTS `content_studio_stage_logs` (
                  `id` INT AUTO_INCREMENT PRIMARY KEY,
                  `project_id` INT NOT NULL,
                  `stage` VARCHAR(50) NOT NULL,
                  `completed_by` INT NOT NULL,
                  `credits_awarded` INT DEFAULT 0,
                  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  INDEX `idx_proj_stage` (`project_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");
        } catch (Throwable $e) {
            error_log("ContentStudioHelper::ensureSchema error: " . $e->getMessage());
        }
    }

    /**
     * Map stage name to assigned user ID
     */
    public static function getAssigneeForStage($project, $stage) {
        switch ($stage) {
            case 'scripting':
                return $project['scriptwriter_id'] ?: $project['created_by'];
            case 'voiceover':
                return $project['voice_artist_id'] ?: $project['created_by'];
            case 'footage':
                return $project['footage_collector_id'] ?: $project['created_by'];
            case 'editing':
                return $project['video_editor_id'] ?: $project['created_by'];
            case 'review':
                return $project['reviewer_id'];
            case 'published':
                return $project['publisher_id'] ?: $project['created_by'];
            default:
                return null;
        }
    }

    /**
     * Award credits for a specific stage completion with idempotency
     */
    public static function awardStageCredit($db, $projectId, $stageName, $userId, $amount, $description, $senderId = null) {
        if (!$db || !$userId || $amount <= 0) return false;

        try {
            $eventKey = "content_studio_stage_{$projectId}_{$stageName}_{$userId}";

            // Check if already awarded
            $chkStmt = $db->prepare("SELECT id FROM credit_transactions WHERE event_key = :k LIMIT 1");
            $chkStmt->execute([':k' => $eventKey]);
            if ($chkStmt->fetchColumn()) {
                return false; // Already credited
            }

            // Insert into credit_transactions
            $tx = $db->prepare("
                INSERT INTO credit_transactions 
                (user_id, sender_id, receiver_id, amount, type, reference_id, event_key, description, meta_data, created_at)
                VALUES 
                (:user_id, :sender_id, :receiver_id, :amount, 'content_stage_reward', :ref_id, :event_key, :description, :meta, NOW())
            ");
            $tx->execute([
                ':user_id'     => $userId,
                ':sender_id'   => $senderId ?: null,
                ':receiver_id' => $userId,
                ':amount'      => $amount,
                ':ref_id'      => $projectId,
                ':event_key'   => $eventKey,
                ':description' => $description,
                ':meta'        => json_encode([
                    'project_id' => $projectId,
                    'stage' => $stageName,
                    'reward' => $amount
                ])
            ]);

            // Update user wallet
            $upd = $db->prepare("
                INSERT INTO user_credits (user_id, balance, total_earned, total_penalties, total_sent, total_received, created_at, updated_at)
                VALUES (:u, :amt, :amt, 0, 0, 0, NOW(), NOW())
                ON DUPLICATE KEY UPDATE balance = balance + :amt, total_earned = total_earned + :amt, updated_at = NOW()
            ");
            $upd->execute([':u' => $userId, ':amt' => $amount]);

            // Log stage
            $logStmt = $db->prepare("
                INSERT INTO content_studio_stage_logs (project_id, stage, completed_by, credits_awarded, created_at)
                VALUES (:p, :s, :u, :amt, NOW())
            ");
            $logStmt->execute([':p' => $projectId, ':s' => $stageName, ':u' => $userId, ':amt' => $amount]);

            return true;
        } catch (Throwable $e) {
            error_log("ContentStudioHelper::awardStageCredit error: " . $e->getMessage());
            return false;
        }
    }
}
