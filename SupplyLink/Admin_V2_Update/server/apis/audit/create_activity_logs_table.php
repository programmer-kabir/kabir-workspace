<?php
/**
 * Migration: Create system_activity_logs table
 * ফাইল: server/apis/audit/create_activity_logs_table.php
 */

header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

$sql = "CREATE TABLE IF NOT EXISTS `system_activity_logs` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `user_name` VARCHAR(100) NULL,
  `user_role` VARCHAR(30) NULL,
  `action_type` VARCHAR(60) NOT NULL,
  `category` ENUM('financial', 'navigation', 'auth', 'modification', 'system') NOT NULL DEFAULT 'financial',
  `entity_type` VARCHAR(60) NULL,
  `entity_id` VARCHAR(60) NULL,
  `amount` DECIMAL(15,2) NULL DEFAULT 0.00,
  `description` TEXT NOT NULL,
  `details_json` LONGTEXT NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(500) NULL,
  `created_at` DATETIME NOT NULL,
  INDEX `idx_user_created` (`user_id`, `created_at`),
  INDEX `idx_action_category` (`action_type`, `category`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

if ($mysqli->query($sql)) {
    echo json_encode([
        "success" => true,
        "message" => "system_activity_logs table created or verified successfully!"
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} else {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => $mysqli->error
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
