<?php

declare(strict_types=1);

/**
 * Hostinger Cron maintenance script to purge expired MySQL cache_entries and rate_limits rows.
 * Recommended cron schedule: daily at 03:30 AM (php /path/to/server/cli/cleanup_cache.php).
 */

use App\Core\Database;

$serverRoot = dirname(__DIR__);
require_once $serverRoot . '/config/env.php';
loadEnvFile($serverRoot . '/.env');
require_once $serverRoot . '/src/Core/Autoloader.php';

$dbConfig = require $serverRoot . '/config/database.php';
$database = new Database($dbConfig);
$pdo = $database->connection();

$cacheStmt = $pdo->prepare('DELETE FROM cache_entries WHERE expires_at <= UTC_TIMESTAMP()');
$cacheStmt->execute();

$rateStmt = $pdo->prepare('DELETE FROM rate_limits WHERE reset_at <= UTC_TIMESTAMP()');
$rateStmt->execute();

echo json_encode([
    'success' => true,
    'purgedCacheEntries' => $cacheStmt->rowCount(),
    'purgedRateLimits' => $rateStmt->rowCount(),
    'timestamp' => gmdate('c'),
], JSON_UNESCAPED_SLASHES) . PHP_EOL;
