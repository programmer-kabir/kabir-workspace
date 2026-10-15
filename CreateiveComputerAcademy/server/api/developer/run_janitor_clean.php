<?php
@set_time_limit(180);
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

$scope = $data['scope'] ?? 'full'; // 'full' | 'tokens' | 'tables' | 'logs'

try {
    $purgedTokens = 0;
    $optimizedTables = [];
    $trimmedLogs = [];

    // ── 1. PURGE EXPIRED & DANGLING TOKENS ──────────────────────────────────────
    if ($scope === 'full' || $scope === 'tokens') {
        $delStmt = $db->prepare("DELETE FROM user_tokens WHERE expires_at <= NOW() OR expires_at IS NULL");
        $delStmt->execute();
        $purgedTokens = $delStmt->rowCount();
    }

    // ── 2. DEFRAGMENT & OPTIMIZE MYSQL TABLES ──────────────────────────────────
    if ($scope === 'full' || $scope === 'tables') {
        // Core high-traffic tables that benefit most from defragmentation
        $candidateTables = [
            'user_tokens',
            'attendance',
            'user_breaks',
            'chat_messages',
            'notifications',
            'activity_logs',
            'community_posts',
            'community_comments',
            'tasks',
            'credit_transactions',
            'users'
        ];

        // Filter against existing tables in this database
        $dbNameStmt = $db->query("SELECT DATABASE()");
        $dbName = $dbNameStmt->fetchColumn() ?: 'cca_manage_db';

        $existingTablesStmt = $db->prepare("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = :dbname");
        $existingTablesStmt->execute([':dbname' => $dbName]);
        $existingTables = $existingTablesStmt->fetchAll(PDO::FETCH_COLUMN);

        foreach ($candidateTables as $tbl) {
            if (in_array($tbl, $existingTables)) {
                try {
                    // Safe execution of OPTIMIZE TABLE
                    $optStmt = $db->query("OPTIMIZE TABLE `{$tbl}`");
                    $res = $optStmt ? $optStmt->fetchAll(PDO::FETCH_ASSOC) : [];
                    $statusMsg = !empty($res[0]['Msg_text']) ? $res[0]['Msg_text'] : 'Table defragmented & index tree optimized';
                    $optimizedTables[] = [
                        'table' => $tbl,
                        'status' => $statusMsg
                    ];
                } catch (Throwable $tblErr) {
                    // Continue with next table
                }
            }
        }
    }

    // ── 3. TRIM & HYGIENE ON LOG FILES ─────────────────────────────────────────
    if ($scope === 'full' || $scope === 'logs') {
        $logFiles = [
            'auto_checkout_log.txt' => __DIR__ . '/../crons/auto_checkout_log.txt',
            'auto_tiffin_log.txt' => __DIR__ . '/../crons/auto_tiffin_log.txt',
            'cron_absent_log.txt' => __DIR__ . '/../crons/cron_absent_log.txt'
        ];

        foreach ($logFiles as $logName => $logPath) {
            if (file_exists($logPath)) {
                $fsize = filesize($logPath);
                // If larger than 30KB, keep the last 50 lines to prevent unneeded disk bloat
                if ($fsize > 30720) {
                    $content = file_get_contents($logPath);
                    $lines = explode("\n", trim($content));
                    $tail = array_slice($lines, -50);
                    $header = "[HYGIENE ARCHIVE: Log auto-trimmed by Developer Janitor on " . date('Y-m-d H:i:s') . "]\n";
                    file_put_contents($logPath, $header . implode("\n", $tail) . "\n");
                    $trimmedLogs[] = [
                        'file' => $logName,
                        'old_size' => round($fsize / 1024, 1) . ' KB',
                        'new_size' => round(filesize($logPath) / 1024, 1) . ' KB'
                    ];
                }
            }
        }
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Database hygiene and garbage collection routine executed cleanly.',
        'scope' => $scope,
        'purged_tokens_count' => $purgedTokens,
        'optimized_tables_count' => count($optimizedTables),
        'optimized_tables' => $optimizedTables,
        'trimmed_logs_count' => count($trimmedLogs),
        'trimmed_logs' => $trimmedLogs,
        'executed_at' => date('Y-m-d H:i:s'),
        'executed_by' => $devUser['name']
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Janitor execution failed: ' . $e->getMessage()
    ]);
}
?>
