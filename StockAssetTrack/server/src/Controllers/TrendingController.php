<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Cache;
use App\Core\Request;
use App\Core\Response;
use App\Services\AdobeClientInterface;
use App\Services\CatalogQueryService;

/**
 * Surfaces recent high-velocity breakout uploads across niches and media formats.
 */
final class TrendingController
{
    private const CACHE_TTL_SECONDS = 900; // 15 minutes

    public function __construct(
        private readonly AdobeClientInterface $adobeClient,
        private readonly CatalogQueryService $catalogQuery,
        private readonly Cache $cache
    ) {
    }

    public function trending(Request $request): never
    {
        $query = trim((string) $request->query('q', 'all'));
        if ($query === '') {
            $query = 'all';
        }

        $filters = $this->catalogQuery->parseCatalogParams($request, 'velocity');
        $cacheKey = sprintf(
            'trending:%s:%s:%s:%s:%s:%d',
            $this->adobeClient->mode(),
            strtolower($query),
            $filters['order'],
            $filters['contentType'],
            $filters['genAi'],
            $filters['page']
        );

        $cachedPayload = $this->cache->get($cacheKey);
        if (is_array($cachedPayload)) {
            $cachedPayload['cached'] = true;
            Response::json($cachedPayload);
        }

        $raw = $this->adobeClient->trending([
            'q' => $query,
            'order' => $filters['order'],
            'content_type' => $filters['contentType'],
            'generative_ai' => $filters['genAi'],
            'page' => $filters['page'],
        ]);

        $summaryLabel = strtolower($query) === 'all' ? 'Trending Breakouts' : $query;
        $payload = $this->catalogQuery->buildEnrichedPayload(
            $raw,
            $this->adobeClient->mode(),
            $summaryLabel,
            $filters['page'],
            sortByVelocity: $filters['order'] === 'velocity'
        );

        $this->cache->set($cacheKey, $payload, self::CACHE_TTL_SECONDS);
        Response::json($payload);
    }
}
