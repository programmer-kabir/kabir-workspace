<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';

header('Content-Type: application/json; charset=UTF-8');
date_default_timezone_set('Asia/Dhaka');

try {
    $database = new Database();
    $db = $database->getConnection();

    if (!$db) {
        throw new Exception("Database connection failed");
    }

    $db_status = "Connected (MySQL PDO)";
    
    // Total active users
    $uCountStmt = $db->query("SELECT COUNT(*) FROM users WHERE status = 'active'");
    $active_users = (int)$uCountStmt->fetchColumn();

    // Total active tokens / sessions
    $tokCountStmt = $db->query("SELECT COUNT(*) FROM user_tokens WHERE expires_at > NOW()");
    $active_tokens = (int)$tokCountStmt->fetchColumn();

    // Check uploads directory
    $uploadsDir = __DIR__ . '/../../uploads';
    $uploadsWritable = is_dir($uploadsDir) && is_writable($uploadsDir);

    echo json_encode([
        'status' => 'success',
        'data' => [
            'php_version' => phpversion(),
            'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'PHP FastCGI / Apache',
            'server_time_bd' => date('Y-m-d h:i:s A'),
            'timezone' => date_default_timezone_get(),
            'database_name' => 'u647959341_cca_manage_db',
            'database_status' => $db_status,
            'active_users' => $active_users,
            'active_sessions' => $active_tokens,
            'memory_usage' => round(memory_get_usage(true) / 1024 / 1024, 2) . ' MB',
            'memory_limit' => ini_get('memory_limit'),
            'uploads_writable' => $uploadsWritable,
            'pusher_configured' => true
        ]
    ]);

} catch (Throwable $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
