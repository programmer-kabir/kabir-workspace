<?php
class BlogDbHelper {
    public static function ensureSchema($db) {
        if (!$db) return;
        // 1. Table: academy_blogs
        $db->exec("CREATE TABLE IF NOT EXISTS `academy_blogs` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `title` VARCHAR(255) NOT NULL,
            `slug` VARCHAR(255) NULL,
            `category` VARCHAR(100) NOT NULL DEFAULT 'General',
            `cover_image` VARCHAR(500) NULL,
            `summary` TEXT NULL,
            `content` LONGTEXT NOT NULL,
            `author_id` INT NOT NULL,
            `status` ENUM('published', 'draft') NOT NULL DEFAULT 'published',
            `is_pinned` TINYINT(1) NOT NULL DEFAULT 0,
            `views_count` INT NOT NULL DEFAULT 0,
            `read_time_mins` INT NOT NULL DEFAULT 2,
            `published_at` DATETIME NULL,
            `created_at` DATETIME NOT NULL,
            `updated_at` DATETIME NOT NULL,
            INDEX (`category`),
            INDEX (`status`),
            INDEX (`is_pinned`),
            INDEX (`created_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

        // 2. Table: blog_comments
        $db->exec("CREATE TABLE IF NOT EXISTS `blog_comments` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `blog_id` INT NOT NULL,
            `user_id` INT NOT NULL,
            `parent_comment_id` INT NULL,
            `comment` TEXT NOT NULL,
            `created_at` DATETIME NOT NULL,
            `updated_at` DATETIME NOT NULL,
            INDEX (`blog_id`),
            INDEX (`user_id`),
            INDEX (`parent_comment_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

        // 3. Table: blog_reads
        $db->exec("CREATE TABLE IF NOT EXISTS `blog_reads` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `blog_id` INT NOT NULL,
            `user_id` INT NOT NULL,
            `read_at` DATETIME NOT NULL,
            UNIQUE KEY `unique_user_blog_read` (`blog_id`, `user_id`),
            INDEX (`blog_id`),
            INDEX (`user_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

        // 4. Table: blog_reactions
        $db->exec("CREATE TABLE IF NOT EXISTS `blog_reactions` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `blog_id` INT NOT NULL,
            `user_id` INT NOT NULL,
            `reaction_type` VARCHAR(30) NOT NULL DEFAULT 'like',
            `created_at` DATETIME NOT NULL,
            UNIQUE KEY `unique_user_blog_reaction` (`blog_id`, `user_id`),
            INDEX (`blog_id`),
            INDEX (`user_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
    }
}
?>
