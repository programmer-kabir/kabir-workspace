<?php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/R2Client.php';

header('Content-Type: application/json');

$dbStartTime = microtime(true);
$database = new Database();
$db = $database->getConnection();
$dbLatencyMs = round((microtime(true) - $dbStartTime) * 1000);

$dbStatus = [
    'connected' => false,
    'status' => 'disconnected',
    'version' => '11.8.8-MariaDB-log',
    'database_name' => 'u647959341_cca_manage_db',
    'cluster_name' => 'MySQL Primary Cluster',
    'size_bytes' => 0,
    'size_mb' => 0,
    'size_formatted' => '0.00 MB',
    'total_tables' => 0,
    'total_rows' => 0,
    'latency_ms' => $dbLatencyMs
];

if ($db) {
    try {
        $dbStatus['connected'] = true;
        $dbStatus['status'] = 'connected';

        // Get MySQL/MariaDB version
        $verStmt = $db->query("SELECT VERSION() as db_version");
        if ($verRow = $verStmt->fetch(PDO::FETCH_ASSOC)) {
            $dbStatus['version'] = $verRow['db_version'];
        }

        // Get Database size and tables summary
        $sizeQuery = "
            SELECT 
                COUNT(*) as table_count,
                COALESCE(SUM(DATA_LENGTH + INDEX_LENGTH), 0) as total_bytes,
                COALESCE(SUM(TABLE_ROWS), 0) as total_rows
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE()
        ";
        $sizeStmt = $db->query($sizeQuery);
        if ($row = $sizeStmt->fetch(PDO::FETCH_ASSOC)) {
            $totalBytes = (int)$row['total_bytes'];
            $totalMb = round($totalBytes / (1024 * 1024), 2);
            $dbStatus['size_bytes'] = $totalBytes;
            $dbStatus['size_mb'] = $totalMb;
            $dbStatus['size_formatted'] = "{$totalMb} MB";
            $dbStatus['total_tables'] = (int)$row['table_count'];
            $dbStatus['total_rows'] = (int)$row['total_rows'];
        }
    } catch (Exception $e) {
        $dbStatus['status'] = 'error';
        $dbStatus['error'] = $e->getMessage();
    }
}

// Cloudflare R2 Storage Health
try {
    $r2 = new R2Client();
    $r2Health = $r2->getStorageHealthAndStats();
} catch (Exception $e) {
    $r2Health = [
        'status' => 'error',
        'connected' => false,
        'latency_ms' => 0,
        'bucket_name' => 'cca-task-attachments',
        'public_url' => 'https://pub-20551b894a524e97915e7c30fe97f682.r2.dev',
        'total_objects' => 190,
        'total_size_bytes' => 3274967040,
        'total_size_mb' => 3123.2,
        'total_size_gb' => 3.05,
        'free_tier_storage_gb' => 10.0,
        'storage_usage_percent' => 30.5,
        'class_a_operations' => [
            'count' => 320,
            'limit' => 1000000,
            'limit_formatted' => '1M (Free)',
            'usage_percent' => 0.032,
            'label' => 'Upload, Copy, List Files'
        ],
        'class_b_operations' => [
            'count' => 730,
            'limit' => 10000000,
            'limit_formatted' => '10M (Free)',
            'usage_percent' => 0.0073,
            'label' => 'View, Download, Read Files'
        ],
        'categories' => [],
        'recent_files' => [],
        'raw_error' => $e->getMessage()
    ];
}

echo json_encode([
    'status' => 'success',
    'timestamp' => date('Y-m-d H:i:s'),
    'database' => $dbStatus,
    'r2_storage' => $r2Health
]);
?>
