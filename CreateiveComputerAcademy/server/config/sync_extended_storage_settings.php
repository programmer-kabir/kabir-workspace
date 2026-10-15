<?php
require_once __DIR__ . '/database.php';

try {
    $db = (new Database())->getConnection();

    $settingsToInsert = [
        ['routing_profile_pictures', 'local', 'Staff, student & admin profile and cover pictures'],
        ['folder_profiles', 'uploads/profiles', 'Profiles upload folder path'],
        ['routing_chat_files', 'local', 'Chat room attachments, voice recordings and media'],
        ['folder_chat', 'uploads/chat', 'Chat attachments upload folder path'],
        ['routing_community_posts', 'local', 'Community wall feed photos, badges and media'],
        ['folder_community', 'uploads/community', 'Community posts upload folder path'],
        ['routing_blog_images', 'local', 'Academy blog & news featured images and content'],
        ['folder_blogs', 'uploads/blogs', 'Blog images upload folder path'],
        ['routing_brand_assets', 'r2', 'Brand Kit logos, vectors, templates and certificates'],
        ['folder_brand', 'uploads/brand_resources', 'Brand assets upload folder path'],
        ['routing_course_materials', 'r2', 'Curriculum lectures, exercise files & course media'],
        ['folder_courses', 'uploads/courses', 'Course materials upload folder path'],
        ['routing_review_screenshots', 'r2', 'Task reviewer feedback, rejection proofs and markup attachments'],
        ['folder_reviews', 'task_reviews', 'Reviewer rejection proofs upload folder path']
    ];

    $stmt = $db->prepare("INSERT INTO system_storage_settings (setting_key, setting_value, description) 
                           VALUES (?, ?, ?) 
                           ON DUPLICATE KEY UPDATE description = VALUES(description)");

    foreach ($settingsToInsert as $s) {
        $stmt->execute($s);
        echo "Inserted/Updated: {$s[0]} = {$s[1]}\n";
    }

    echo "ALL_SETTINGS_SYNCED_SUCCESSFULLY\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
