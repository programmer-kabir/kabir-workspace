<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    // Auto-create table if not exists (fail-safe for live server)
    $db->exec("CREATE TABLE IF NOT EXISTS system_storage_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) NOT NULL UNIQUE,
        setting_value TEXT NULL,
        description VARCHAR(255) NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    $input = json_decode(file_get_contents("php://input"), true);
    if (!isset($input['settings']) || !is_array($input['settings'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Settings payload is required."]);
        exit();
    }

    $allowedKeys = [
        // Tasks & Submissions
        'routing_source_files',
        'routing_preview_images',
        'routing_videos',
        'routing_student_submissions',
        'routing_review_screenshots',

        // Profiles, Chat, Community, Blogs, Brand & Courses
        'routing_profile_pictures',
        'folder_profiles',
        'routing_chat_files',
        'folder_chat',
        'routing_community_posts',
        'folder_community',
        'routing_blog_images',
        'folder_blogs',
        'routing_brand_assets',
        'folder_brand',
        'routing_course_materials',
        'folder_courses',
        'folder_reviews',

        // Cloud Vault & Safety
        'gdrive_enabled',
        'gdrive_root_folder_id',
        'gdrive_task_folder_name',
        'gdrive_final_folder_name',
        'r2_enabled',
        'r2_bucket_name',
        'r2_public_url',
        'r2_prefix_tasks',
        'emergency_failover'
    ];

    // Auto-activate gdrive_enabled if root folder id is provided and not explicitly set
    if (!empty($input['settings']['gdrive_root_folder_id']) && !isset($input['settings']['gdrive_enabled'])) {
        $input['settings']['gdrive_enabled'] = '1';
    }

    $stmt = $db->prepare("INSERT INTO system_storage_settings (setting_key, setting_value) 
        VALUES (:key, :val) 
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");

    $updatedCount = 0;
    foreach ($input['settings'] as $k => $v) {
        if (in_array($k, $allowedKeys)) {
            $stmt->execute([
                ':key' => $k,
                ':val' => is_bool($v) ? ($v ? '1' : '0') : trim((string)$v)
            ]);
            $updatedCount++;
        }
    }

    echo json_encode([
        "status" => "success",
        "message" => "Storage routing and settings updated successfully!",
        "updated_keys" => $updatedCount
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Failed to save storage settings: " . $e->getMessage()
    ]);
}
