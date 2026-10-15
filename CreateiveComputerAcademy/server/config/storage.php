<?php
require_once __DIR__ . '/r2.php';

if (!function_exists('resolveStorageUrl')) {
    /**
     * Resolves a raw file key / relative path to a full public / stream URL
     * based on the storage provider ('r2', 'gdrive', 'local').
     *
     * @param string|null $fileKeyOrUrl Relative storage key or existing URL
     * @param string $storageProvider 'r2' | 'gdrive' | 'local'
     * @return string Fully qualified resolvable URL
     */
    function resolveStorageUrl($fileKeyOrUrl, $storageProvider = 'r2') {
        if (empty($fileKeyOrUrl)) {
            return '';
        }

        $trimmed = trim($fileKeyOrUrl);

        // 1. If it's already an absolute URL (e.g. external http/https link)
        if (preg_match('/^https?:\/\//i', $trimmed)) {
            return $trimmed;
        }

        // 2. Google Drive Provider (for heavy task submissions / PSD / Video)
        if ($storageProvider === 'gdrive') {
            // If it's a Google Drive File ID (alphanumeric, dashes, underscores)
            if (preg_match('/^[a-zA-Z0-9_-]{25,}$/', $trimmed)) {
                return "https://drive.google.com/file/d/{$trimmed}/view";
            }
            if (strpos($trimmed, 'gdrive:') === 0) {
                $driveId = substr($trimmed, 7);
                return "https://drive.google.com/file/d/{$driveId}/view";
            }
        }

        // 3. Local Server Storage Provider
        if ($storageProvider === 'local') {
            return '/' . ltrim($trimmed, '/');
        }

        // 4. Cloudflare R2 Storage Provider (Default)
        $base = defined('R2_PUBLIC_URL') ? rtrim(R2_PUBLIC_URL, '/') : 'https://pub-20551b894a524e97915e7c30fe97f682.r2.dev';
        return $base . '/' . ltrim($trimmed, '/');
    }
}

if (!function_exists('formatSubmissionItem')) {
    /**
     * Formats a single task submission database row with resolved public file_url
     *
     * @param array $sub
     * @return array
     */
    function formatSubmissionItem($sub) {
        if (!is_array($sub)) return $sub;
        $provider = !empty($sub['storage_provider']) ? $sub['storage_provider'] : 'r2';
        if (!empty($sub['file_url']) && preg_match('/^https?:\/\//i', trim($sub['file_url']))) {
            $sub['file_url'] = trim($sub['file_url']);
            return $sub;
        }
        $rawPath = !empty($sub['file_key']) ? $sub['file_key'] : ($sub['file_url'] ?? '');
        $sub['file_url'] = resolveStorageUrl($rawPath, $provider);
        return $sub;
    }
}

if (!function_exists('formatFinalDelivery')) {
    /**
     * Formats final delivery row with resolved final_file_url and final_image_url
     *
     * @param array|null $del
     * @return array|null
     */
    function formatFinalDelivery($del) {
        if (!is_array($del)) return $del;
        $provider = !empty($del['storage_provider']) ? $del['storage_provider'] : 'r2';

        if (!empty($del['final_file_url'])) {
            $del['final_file_url'] = resolveStorageUrl($del['final_file_url'], $provider);
        }
        if (!empty($del['final_image_url'])) {
            $del['final_image_url'] = resolveStorageUrl($del['final_image_url'], $provider);
        }
        return $del;
    }
}

if (!function_exists('getStorageRoutingConfig')) {
    /**
     * Reads storage routing configuration from system_storage_settings
     * with in-memory caching
     *
     * @return array
     */
    function getStorageRoutingConfig() {
        static $cached = null;
        if ($cached !== null) return $cached;

        $defaults = [
            // Core Tasks & Deliveries
            'routing_source_files'        => 'r2',
            'routing_preview_images'      => 'r2',
            'routing_videos'              => 'r2',
            'routing_student_submissions' => 'r2',
            'routing_review_screenshots'  => 'r2',

            // Profiles, Chat, Community, Blogs, Brand & Courses
            'routing_profile_pictures'    => 'local',
            'routing_chat_files'          => 'local',
            'routing_community_posts'     => 'local',
            'routing_blog_images'         => 'local',
            'routing_brand_assets'        => 'r2',
            'routing_course_materials'    => 'r2',

            // Folder Paths & Prefixes
            'folder_profiles'             => 'uploads/profiles',
            'folder_chat'                 => 'uploads/chat',
            'folder_community'            => 'uploads/community',
            'folder_blogs'                => 'uploads/blogs',
            'folder_brand'                => 'uploads/brand_resources',
            'folder_courses'              => 'uploads/courses',
            'folder_reviews'              => 'task_reviews',

            // Global Cloud Vault Configs
            'gdrive_enabled'              => '0',
            'emergency_failover'          => '1',
            'gdrive_root_folder_id'       => '',
            'gdrive_task_folder_name'     => 'Task_Submissions',
            'gdrive_final_folder_name'    => 'Approved_Final_Deliveries',
            'r2_enabled'                  => '1',
            'r2_bucket_name'              => 'cca-task-attachments',
            'r2_prefix_tasks'             => 'task_submissions'
        ];

        try {
            require_once __DIR__ . '/database.php';
            $db = (new Database())->getConnection();
            $stmt = $db->query("SELECT setting_key, setting_value FROM system_storage_settings");
            if ($stmt) {
                while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    $defaults[$row['setting_key']] = $row['setting_value'];
                }
            }
        } catch (Throwable $e) {}

        $cached = $defaults;
        return $cached;
    }
}

if (!function_exists('getStorageFolderPath')) {
    /**
     * Resolves the configured directory or prefix path for a specific category
     *
     * @param string $category
     * @return string
     */
    function getStorageFolderPath($category = 'tasks') {
        $cfg = getStorageRoutingConfig();
        switch (strtolower(trim($category))) {
            case 'profile':
            case 'profiles':
                return $cfg['folder_profiles'] ?? 'uploads/profiles';
            case 'chat':
            case 'messages':
                return $cfg['folder_chat'] ?? 'uploads/chat';
            case 'community':
            case 'posts':
                return $cfg['folder_community'] ?? 'uploads/community';
            case 'blog':
            case 'blogs':
                return $cfg['folder_blogs'] ?? 'uploads/blogs';
            case 'brand':
            case 'assets':
                return $cfg['folder_brand'] ?? 'uploads/brand_resources';
            case 'course':
            case 'courses':
                return $cfg['folder_courses'] ?? 'uploads/courses';
            case 'review':
            case 'reviews':
                return $cfg['folder_reviews'] ?? 'task_reviews';
            case 'final':
            case 'approved':
                return $cfg['gdrive_final_folder_name'] ?? 'Approved_Final_Deliveries';
            case 'task':
            case 'tasks':
            default:
                return $cfg['r2_prefix_tasks'] ?? 'task_submissions';
        }
    }
}

if (!function_exists('determineUploadProvider')) {
    /**
     * Determines whether a file should route to 'gdrive', 'r2', or 'local'
     * based on admin-configured system settings
     *
     * @param string $fileExt
     * @param string $classifiedType 'source' | 'preview' | 'video' | 'profile' | 'chat' | 'community' | 'blog' | 'brand' | 'course' | 'review' | 'student'
     * @return string
     */
    function determineUploadProvider($fileExt = '', $classifiedType = 'source') {
        $cfg = getStorageRoutingConfig();
        $ext = strtolower(trim($fileExt));
        $type = strtolower(trim($classifiedType));

        $provider = 'r2';

        switch ($type) {
            case 'profile':
            case 'avatar':
                $provider = $cfg['routing_profile_pictures'] ?? 'local';
                break;

            case 'chat':
            case 'message':
                $provider = $cfg['routing_chat_files'] ?? 'local';
                break;

            case 'community':
            case 'wall':
                $provider = $cfg['routing_community_posts'] ?? 'local';
                break;

            case 'blog':
            case 'article':
                $provider = $cfg['routing_blog_images'] ?? 'local';
                break;

            case 'brand':
            case 'kit':
                $provider = $cfg['routing_brand_assets'] ?? 'r2';
                break;

            case 'course':
            case 'curriculum':
                $provider = $cfg['routing_course_materials'] ?? 'r2';
                break;

            case 'review':
            case 'rejection':
                $provider = $cfg['routing_review_screenshots'] ?? 'r2';
                break;

            case 'student':
            case 'assignment':
                $provider = $cfg['routing_student_submissions'] ?? 'r2';
                break;

            case 'video':
                $provider = $cfg['routing_videos'] ?? 'r2';
                break;

            case 'preview':
                $provider = $cfg['routing_preview_images'] ?? 'r2';
                break;

            case 'source':
            default:
                if (in_array($ext, ['mp4', 'mov', 'webm'])) {
                    $provider = $cfg['routing_videos'] ?? 'r2';
                } elseif (in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'])) {
                    $provider = $cfg['routing_preview_images'] ?? 'r2';
                } else {
                    $provider = $cfg['routing_source_files'] ?? 'r2';
                }
                break;
        }

        // If GDrive chosen but GDrive credentials not present or GDrive disabled, and emergency_failover on:
        if ($provider === 'gdrive') {
            $credsPath = __DIR__ . '/google_drive_credentials.json';
            $hasCreds = file_exists($credsPath);
            $isEnabled = (($cfg['gdrive_enabled'] ?? '0') === '1') || !empty($cfg['gdrive_root_folder_id']);

            if ((!$hasCreds || !$isEnabled) && ($cfg['emergency_failover'] ?? '1') === '1') {
                $provider = 'r2';
            }
        }

        return $provider;
    }
}
?>

