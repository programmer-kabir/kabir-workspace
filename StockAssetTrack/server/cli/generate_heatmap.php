<?php

declare(strict_types=1);

/**
 * Hostinger-compatible CLI cron script to refresh the 6-type Category Heat Map MySQL cache snapshot.
 * Usage: php server/cli/generate_heatmap.php
 */

use App\Core\Cache;
use App\Core\Database;
use App\Services\AdobeClientFactory;
use App\Services\EnrichmentService;
use App\Services\HeatmapService;
use App\Services\ScoringService;

$serverRoot = dirname(__DIR__);

require_once $serverRoot . '/config/env.php';
loadEnvFile($serverRoot . '/.env');
require_once $serverRoot . '/src/Core/Autoloader.php';

$appConfig = require $serverRoot . '/config/app.php';
$dbConfig = require $serverRoot . '/config/database.php';

$database = new Database($dbConfig);
$cache = new Cache($database);
$adobeClient = AdobeClientFactory::create($appConfig['adobe'], $appConfig['url']);
$scoringService = new ScoringService($appConfig['scoring']);
$enrichmentService = new EnrichmentService($scoringService);
$heatmapService = new HeatmapService($adobeClient, $enrichmentService, $cache);

$snapshot = $heatmapService->rebuildSnapshot('cron');

echo json_encode([
    'success' => true,
    'mode' => $adobeClient->mode(),
    'triggerSource' => $snapshot['triggerSource'],
    'generatedAt' => $snapshot['generatedAt'],
    'nextRefreshAt' => $snapshot['nextRefreshAt'],
    'summary' => $snapshot['summary'],
    'mediaTypes' => $snapshot['mediaTypes'],
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . PHP_EOL;
