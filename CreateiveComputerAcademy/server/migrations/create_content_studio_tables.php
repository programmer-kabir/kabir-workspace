<?php
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    die("Database connection failed.\n");
}

echo "Running Content Studio database migrations...\n";

$sql = "
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
  INDEX `idx_status` (`status`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `content_studio_reviews` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT NOT NULL,
  `reviewer_id` INT NOT NULL,
  `timestamp_seconds` INT NOT NULL,
  `timestamp_formatted` VARCHAR(10) NOT NULL,
  `feedback_text` TEXT NOT NULL,
  `status` ENUM('open', 'resolved') DEFAULT 'open',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX `idx_project_rev` (`project_id`),
  FOREIGN KEY (`project_id`) REFERENCES `content_studio_projects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `content_studio_stage_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT NOT NULL,
  `stage` VARCHAR(50) NOT NULL,
  `completed_by` INT NOT NULL,
  `credits_awarded` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX `idx_proj_stage` (`project_id`),
  FOREIGN KEY (`project_id`) REFERENCES `content_studio_projects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`completed_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
";

try {
    $db->exec($sql);
    echo "SUCCESS: Content Studio tables created successfully!\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
