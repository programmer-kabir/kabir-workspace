<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/developer_guard.php';

header('Content-Type: application/json; charset=UTF-8');
date_default_timezone_set('Asia/Dhaka');

$data = json_decode(file_get_contents("php://input"), true) ?? [];
$token = $data['token'] ?? ($_SERVER['HTTP_AUTHORIZATION'] ?? '');
if (strpos($token, 'Bearer ') === 0) {
    $token = substr($token, 7);
}

$database = new Database();
$db = $database->getConnection();

$devUser = verifyDeveloperAccess($db, $token);
if (!$devUser) {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Forbidden: Developer or Admin access required."]);
    exit;
}

try {
    // 1. Telemetry on user_tokens (Active vs Expired vs Dangling)
    $tokTotalStmt = $db->query("SELECT COUNT(*) FROM user_tokens");
    $totalTokens = (int)$tokTotalStmt->fetchColumn();

    $tokActiveStmt = $db->query("SELECT COUNT(*) FROM user_tokens WHERE expires_at > NOW()");
    $activeTokens = (int)$tokActiveStmt->fetchColumn();

    $tokExpiredStmt = $db->query("SELECT COUNT(*) FROM user_tokens WHERE expires_at <= NOW() OR expires_at IS NULL");
    $expiredTokens = (int)$tokExpiredStmt->fetchColumn();

    // 2. MySQL Tables Telemetry & Fragmentation Overhead
    $dbNameStmt = $db->query("SELECT DATABASE()");
    $dbName = $dbNameStmt->fetchColumn() ?: 'cca_manage_db';

    $tableStatsQuery = "
        SELECT 
            TABLE_NAME as table_name,
            ENGINE as engine,
            TABLE_ROWS as table_rows,
            ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024, 2) as size_kb,
            ROUND(DATA_FREE / 1024, 2) as overhead_kb
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = :dbname
        ORDER BY DATA_FREE DESC, (DATA_LENGTH + INDEX_LENGTH) DESC
    ";

    $tStmt = $db->prepare($tableStatsQuery);
    $tStmt->execute([':dbname' => $dbName]);
    $tables = $tStmt->fetchAll(PDO::FETCH_ASSOC);

    $totalTablesCount = count($tables);
    $totalSizeKb = 0;
    $totalOverheadKb = 0;
    $fragmentedTables = [];

    foreach ($tables as $t) {
        $size = (float)($t['size_kb'] ?? 0);
        $overhead = (float)($t['overhead_kb'] ?? 0);
        $totalSizeKb += $size;
        $totalOverheadKb += $overhead;

        if ($overhead > 0 || in_array($t['table_name'], ['user_tokens', 'attendance', 'messages', 'notifications', 'activity_logs'])) {
            $fragmentedTables[] = [
                'name' => $t['table_name'],
                'rows' => (int)($t['table_rows'] ?? 0),
                'size_kb' => $size,
                'overhead_kb' => $overhead
            ];
        }
    }

    // 3. Scan Temp Logs & Cache Files
    $logFiles = [
        'auto_checkout_log.txt' => __DIR__ . '/../crons/auto_checkout_log.txt',
        'auto_tiffin_log.txt' => __DIR__ . '/../crons/auto_tiffin_log.txt',
        'cron_absent_log.txt' => __DIR__ . '/../crons/cron_absent_log.txt',
        'error_log' => __DIR__ . '/../../error_log',
    ];

    $logTelemetry = [];
    $totalLogsBytes = 0;

    foreach ($logFiles as $name => $path) {
        if (file_exists($path)) {
            $fsize = filesize($path);
            $totalLogsBytes += $fsize;
            $logTelemetry[] = [
                'name' => $name,
                'size_bytes' => $fsize,
                'size_formatted' => $fsize > 1048576 
                    ? round($fsize / 1048576, 2) . ' MB' 
                    : round($fsize / 1024, 2) . ' KB'
            ];
        }
    }

    echo json_encode([
        'status' => 'success',
        'database_name' => $dbName,
        'tokens' => [
            'total' => $totalTokens,
            'active' => $activeTokens,
            'expired' => $expiredTokens,
            'hygiene_score' => $totalTokens > 0 
                ? round(($activeTokens / $totalTokens) * 100, 1) 
                : 100
        ],
        'tables' => [
            'count' => $totalTablesCount,
            'total_size_mb' => round($totalSizeKb / 1024, 2),
            'total_overhead_kb' => round($totalOverheadKb, 2),
            'fragmented_tables' => array_slice($fragmentedTables, 0, 10)
        ],
        'logs' => [
            'count' => count($logTelemetry),
            'total_size_bytes' => $totalLogsBytes,
            'total_size_formatted' => $totalLogsBytes > 1048576 
                ? round($totalLogsBytes / 1048576, 2) . ' MB' 
                : round($totalLogsBytes / 1024, 2) . ' KB',
            'files' => $logTelemetry
        ],
        'server_time' => date('Y-m-d H:i:s')
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to gather janitor statistics: ' . $e->getMessage()
    ]);
}
?>
