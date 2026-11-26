<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\CalendarService;
use App\Services\HeatmapService;
use App\Services\TagClusterService;

/**
 * Serves analytics endpoints: 6-type Category Heat Map, Top-10 Tag Clusters, and Seasonal Upload Calendar.
 */
final class AnalyticsController
{
    public function __construct(
        private readonly HeatmapService $heatmapService,
        private readonly TagClusterService $tagClusterService,
        private readonly CalendarService $calendarService
    ) {
    }

    public function heatmap(Request $request): never
    {
        $metric = trim((string) $request->query('metric', 'totalDownloads'));
        $type = trim((string) $request->query('type', 'all'));
        $refreshFlag = (string) $request->query('refresh', '0');
        $forceRefresh = $refreshFlag === '1' || strtolower($refreshFlag) === 'true';

        $payload = $this->heatmapService->getHeatmap(
            $metric,
            $type,
            $forceRefresh,
            $forceRefresh ? 'manual_refresh' : 'api'
        );

        Response::json($payload);
    }

    public function keywordClusters(Request $request): never
    {
        $body = $request->json();
        $query = trim((string) ($body['query'] ?? ''));
        $assetIds = is_array($body['assetIds'] ?? null) ? $body['assetIds'] : [];
        $topN = max(5, min(20, (int) ($body['topN'] ?? 10)));
        $contentType = trim((string) ($body['contentType'] ?? 'all'));
        $excludeNoise = array_key_exists('excludeNoise', $body) ? (bool) $body['excludeNoise'] : true;

        $payload = $this->tagClusterService->extractClusters(
            $query,
            $assetIds,
            $topN,
            $contentType,
            $excludeNoise
        );

        Response::json($payload);
    }

    public function calendar(Request $request): never
    {
        $daysAhead = max(30, min(365, (int) $request->query('daysAhead', 180)));
        $category = trim((string) $request->query('category', 'all'));

        $payload = $this->calendarService->getCalendar($daysAhead, $category);
        Response::json($payload);
    }
}
