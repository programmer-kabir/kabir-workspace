<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Cache;
use App\Core\Request;
use App\Core\Response;
use App\Services\AdobeClientInterface;
use App\Services\CatalogQueryService;
use App\Services\EnrichmentService;
use App\Services\WatchlistService;

/**
 * Handles Adobe Stock contributor URL/ID portfolio lookups, stats caching, country resolution, and watchlist persistence.
 */
final class ContributorController
{
    private const SEARCH_TTL_SECONDS = 900;       // 15 minutes
    private const STATS_TTL_SECONDS = 21600;      // 6 hours
    private const COUNTRY_TTL_SECONDS = 2592000;  // 30 days

    public function __construct(
        private readonly AdobeClientInterface $adobeClient,
        private readonly CatalogQueryService $catalogQuery,
        private readonly EnrichmentService $enrichment,
        private readonly WatchlistService $watchlist,
        private readonly Cache $cache,
        private readonly ?\App\Middleware\AuthMiddleware $authMiddleware = null
    ) {
    }

    public function search(Request $request): never
    {
        $rawInput = trim((string) ($request->query('search') ?? $request->query('creatorId', '')));
        if ($rawInput === '') {
            Response::error('Please enter an Adobe Stock contributor URL, Creator ID, or handle.', 400, 'EMPTY_CREATOR_INPUT');
        }

        $parsed = $this->parseCreatorInput($rawInput);
        $filters = $this->catalogQuery->parseCatalogParams($request, 'nb_downloads');
        if ($filters['order'] === 'velocity') {
            $filters['order'] = 'nb_downloads';
        }

        $cacheKey = sprintf(
            'contributor_search:%s:%s:%s:%s:%s:%s:%d',
            $this->adobeClient->mode(),
            $parsed['creatorId'],
            strtolower($parsed['creatorName']),
            $filters['order'],
            $filters['contentType'],
            $filters['genAi'],
            $filters['page']
        );

        $cached = $this->cache->get($cacheKey);
        if (is_array($cached)) {
            $cached['cached'] = true;
            $cached['contributor']['watching'] = $this->watchlist->isWatched($cached['contributor']['id']);
            Response::json($cached);
        }

        $raw = $this->adobeClient->contributorSearch([
            'creatorId' => $parsed['creatorId'],
            'creatorName' => $parsed['creatorName'],
            'order' => $filters['order'],
            'content_type' => $filters['contentType'],
            'generative_ai' => $filters['genAi'],
            'page' => $filters['page'],
        ]);

        $creatorId = (string) ($raw['creatorId'] ?? $parsed['creatorId']);
        $creatorName = (string) ($raw['creatorName'] ?? $parsed['creatorName'] ?: "Contributor #{$creatorId}");
        $country = $this->enrichment->resolveCountry((string) ($raw['countryCode'] ?? ''), allowFallbackPin: true);

        $payload = $this->catalogQuery->buildEnrichedPayload(
            $raw,
            $this->adobeClient->mode(),
            $creatorName,
            $filters['page'],
            extra: [
                'contributor' => [
                    'id' => $creatorId,
                    'name' => $creatorName,
                    'country' => $country,
                    'adobeProfileUrl' => "https://stock.adobe.com/contributor/{$creatorId}",
                    'watching' => $this->watchlist->isWatched($creatorId),
                ],
            ]
        );

        $this->cache->set($cacheKey, $payload, self::SEARCH_TTL_SECONDS);
        Response::json($payload);
    }

    public function stats(Request $request): never
    {
        $rawInput = trim((string) ($request->query('creatorId') ?? $request->query('search', '')));
        if ($rawInput === '') {
            Response::error('creatorId is required.', 400, 'MISSING_CREATOR_ID');
        }

        $parsed = $this->parseCreatorInput($rawInput);
        $stats = $this->loadCachedStats($parsed['creatorId'], $parsed['creatorName']);

        Response::json($stats);
    }

    public function countries(Request $request): never
    {
        $body = $request->json();
        $rawIds = $body['creatorIds'] ?? null;
        if (!is_array($rawIds) || $rawIds === []) {
            Response::error('creatorIds array is required.', 400, 'INVALID_CREATOR_IDS');
        }

        $creatorIds = array_values(array_slice(array_unique(array_filter(array_map('strval', $rawIds))), 0, 100));
        $countries = [];
        $missingIds = [];

        foreach ($creatorIds as $id) {
            $cached = $this->cache->get($this->countryCacheKey($id));
            if (is_array($cached)) {
                $countries[$id] = $cached;
            } else {
                $missingIds[] = $id;
            }
        }

        if ($missingIds !== []) {
            $resolvedCodes = $this->adobeClient->resolveContributorCountries($missingIds);
            foreach ($missingIds as $id) {
                $country = $this->enrichment->resolveCountry($resolvedCodes[$id] ?? '', allowFallbackPin: true);
                if ($country !== null) {
                    $countries[$id] = $country;
                    $this->cache->set($this->countryCacheKey($id), $country, self::COUNTRY_TTL_SECONDS);
                }
            }
        }

        Response::json([
            'success' => true,
            'count' => count($countries),
            'countries' => $countries,
        ]);
    }

    public function watchlistIndex(Request $request): never
    {
        $userId = $this->resolveOptionalUserId($request);
        $rows = $this->watchlist->listRows($userId);
        $items = [];

        foreach ($rows as $row) {
            $liveStats = $this->loadCachedStats($row['creatorId'], $row['creatorName']);
            $liveAssets = (int) ($liveStats['totalAssets'] ?? $row['lastTotalAssets']);
            $liveDownloads = (int) ($liveStats['totalDownloads'] ?? $row['lastTotalDownloads']);

            $items[] = [
                'creatorId' => $row['creatorId'],
                'creatorName' => $liveStats['creatorName'] ?? $row['creatorName'],
                'country' => $liveStats['country'] ?? $this->enrichment->resolveCountry('', allowFallbackPin: true),
                'lastTotalAssets' => $row['lastTotalAssets'],
                'lastTotalDownloads' => $row['lastTotalDownloads'],
                'liveTotalAssets' => $liveAssets,
                'liveTotalDownloads' => $liveDownloads,
                'deltaAssets' => $liveAssets - $row['lastTotalAssets'],
                'deltaDownloads' => $liveDownloads - $row['lastTotalDownloads'],
                'aiPercent' => (int) ($liveStats['aiPercent'] ?? 0),
                'notifyEnabled' => $row['notifyEnabled'],
                'updatedAt' => $row['updatedAt'],
            ];
        }

        Response::json([
            'success' => true,
            'count' => count($items),
            'items' => $items,
        ]);
    }

    public function watchlistStore(Request $request): never
    {
        $body = $request->json();
        $rawInput = trim((string) ($body['creatorId'] ?? $body['search'] ?? ''));
        if ($rawInput === '') {
            Response::error('creatorId is required to watch a contributor.', 400, 'MISSING_CREATOR_ID');
        }

        $parsed = $this->parseCreatorInput($rawInput);
        $stats = $this->loadCachedStats($parsed['creatorId'], (string) ($body['creatorName'] ?? $parsed['creatorName']));

        $creatorName = trim((string) ($body['creatorName'] ?? $stats['creatorName'] ?? "Contributor #{$parsed['creatorId']}"));
        $assets = isset($body['totalAssets']) ? (int) $body['totalAssets'] : (int) ($stats['totalAssets'] ?? 0);
        $downloads = isset($body['totalDownloads']) ? (int) $body['totalDownloads'] : (int) ($stats['totalDownloads'] ?? 0);
        $notify = array_key_exists('notifyEnabled', $body) ? (bool) $body['notifyEnabled'] : true;
        $userId = $this->resolveOptionalUserId($request);

        $this->watchlist->upsert($parsed['creatorId'], $creatorName, $assets, $downloads, $notify, $userId);

        Response::json([
            'success' => true,
            'message' => "Added {$creatorName} to competitor watchlist",
            'item' => [
                'creatorId' => $parsed['creatorId'],
                'creatorName' => $creatorName,
                'country' => $stats['country'] ?? null,
                'lastTotalAssets' => $assets,
                'lastTotalDownloads' => $downloads,
                'liveTotalAssets' => $assets,
                'liveTotalDownloads' => $downloads,
                'deltaAssets' => 0,
                'deltaDownloads' => 0,
                'aiPercent' => (int) ($stats['aiPercent'] ?? 0),
                'notifyEnabled' => $notify,
            ],
        ]);
    }

    public function watchlistDelete(Request $request): never
    {
        $body = $request->json();
        $rawId = trim((string) ($request->query('creatorId') ?? $body['creatorId'] ?? ''));
        if ($rawId === '') {
            Response::error('creatorId is required.', 400, 'MISSING_CREATOR_ID');
        }

        $parsed = $this->parseCreatorInput($rawId);
        $userId = $this->resolveOptionalUserId($request);
        $removed = $this->watchlist->remove($parsed['creatorId'], $userId);

        Response::json([
            'success' => true,
            'removed' => $removed,
            'creatorId' => $parsed['creatorId'],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function loadCachedStats(string $creatorId, string $creatorNameHint = ''): array
    {
        $cacheKey = sprintf('contributor_stats:%s:%s:%s', $this->adobeClient->mode(), $creatorId, strtolower($creatorNameHint));
        $cached = $this->cache->get($cacheKey);
        if (is_array($cached)) {
            $cached['cached'] = true;
            $cached['watching'] = $this->watchlist->isWatched($creatorId);
            return $cached;
        }

        $raw = $this->adobeClient->contributorStats($creatorId, $creatorNameHint);
        $resolvedCountry = $this->enrichment->resolveCountry((string) ($raw['countryCode'] ?? ''), allowFallbackPin: true);

        $payload = [
            'success' => true,
            'cached' => false,
            'mode' => $this->adobeClient->mode(),
            'creatorId' => (string) ($raw['creatorId'] ?? $creatorId),
            'creatorName' => (string) ($raw['creatorName'] ?? ($creatorNameHint ?: "Contributor #{$creatorId}")),
            'country' => $resolvedCountry,
            'totalAssets' => (int) ($raw['totalAssets'] ?? 0),
            'totalDownloads' => (int) ($raw['totalDownloads'] ?? 0),
            'avgDownloads' => (int) ($raw['avgDownloads'] ?? 0),
            'aiCount' => (int) ($raw['aiCount'] ?? 0),
            'nonAiCount' => (int) ($raw['nonAiCount'] ?? 0),
            'aiPercent' => (int) ($raw['aiPercent'] ?? 0),
            'topCategories' => $raw['topCategories'] ?? [],
            'monthlySeries' => $raw['monthlySeries'] ?? [],
            'source' => (string) ($raw['source'] ?? 'demo_portfolio'),
            'computedAt' => (string) ($raw['computedAt'] ?? gmdate('c')),
            'watching' => $this->watchlist->isWatched((string) ($raw['creatorId'] ?? $creatorId)),
        ];

        $this->cache->set($cacheKey, $payload, self::STATS_TTL_SECONDS);
        return $payload;
    }

    /**
     * Parse Adobe Stock contributor URLs, creator_id params, numeric IDs, or handle strings cleanly.
     *
     * @return array{creatorId: string, creatorName: string}
     */
    public static function parseCreatorInput(string $rawInput): array
    {
        $trimmed = trim($rawInput);

        if (preg_match('~contributor/(\d+)(?:/([^/?#]+))?~i', $trimmed, $m) === 1) {
            return [
                'creatorId' => $m[1],
                'creatorName' => isset($m[2]) ? urldecode(str_replace('-', ' ', $m[2])) : '',
            ];
        }

        if (preg_match('/creator_id=(\d+)/i', $trimmed, $m) === 1) {
            return ['creatorId' => $m[1], 'creatorName' => ''];
        }

        if (preg_match('/^#?(\d{4,15})$/', $trimmed, $m) === 1) {
            return ['creatorId' => $m[1], 'creatorName' => ''];
        }

        $knownHandles = [
            'natara' => ['id' => '203712637', 'name' => 'natara'],
            'studionord' => ['id' => '204198211', 'name' => 'StudioNord'],
            'pixelforgeai' => ['id' => '211509432', 'name' => 'PixelForgeAI'],
            'dhakavectors' => ['id' => '209884120', 'name' => 'DhakaVectors'],
            'kaitovisuals' => ['id' => '207331904', 'name' => 'KaitoVisuals'],
            'luminamotion' => ['id' => '206112845', 'name' => 'LuminaMotion'],
        ];

        $key = strtolower(preg_replace('/[^a-z0-9]/i', '', $trimmed) ?: '');
        if (isset($knownHandles[$key])) {
            return [
                'creatorId' => $knownHandles[$key]['id'],
                'creatorName' => $knownHandles[$key]['name'],
            ];
        }

        $deterministicId = (string) (200000000 + (abs((int) crc32(strtolower($trimmed))) % 95000000));
        return ['creatorId' => $deterministicId, 'creatorName' => $trimmed];
    }

    private function countryCacheKey(string $creatorId): string
    {
        return 'contributor_country:' . $this->adobeClient->mode() . ':' . $creatorId;
    }

    private function resolveOptionalUserId(Request $request): ?int
    {
        if ($this->authMiddleware === null) {
            return null;
        }
        $user = $this->authMiddleware->resolveUser($request, required: false);
        return $user !== null ? (int) $user['id'] : null;
    }
}
