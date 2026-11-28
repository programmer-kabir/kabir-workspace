<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Request;

/**
 * Shared request normalization and enriched response builder for Search, Trending, Similar, and Upload-Search.
 */
final class CatalogQueryService
{
    public const ALLOWED_ORDERS = ['relevance', 'creation', 'featured', 'nb_downloads', 'undiscovered', 'velocity'];
    public const ALLOWED_TYPES = ['all', 'photo', 'illustration', 'vector', 'video', 'template', '3d'];
    public const ALLOWED_AI = ['all', 'only', 'exclude'];

    public function __construct(
        private readonly EnrichmentService $enrichment,
        private readonly ScoringService $scoring
    ) {
    }

    /**
     * Normalize order, content_type, generative_ai, and page query parameters safely.
     *
     * @return array{order: string, contentType: string, genAi: string, page: int}
     */
    public function parseCatalogParams(Request $request, string $defaultOrder = 'relevance'): array
    {
        $order = strtolower(trim((string) $request->query('order', $defaultOrder)));
        $contentType = strtolower(trim((string) $request->query('content_type', 'all')));
        $genAi = strtolower(trim((string) $request->query('generative_ai', 'all')));
        $page = max(1, min(100, (int) $request->query('page', 1)));

        if (!in_array($order, self::ALLOWED_ORDERS, true)) {
            $order = $defaultOrder;
        }
        if (!in_array($contentType, self::ALLOWED_TYPES, true)) {
            $contentType = 'all';
        }
        if (!in_array($genAi, self::ALLOWED_AI, true)) {
            $genAi = 'all';
        }

        return [
            'order' => $order,
            'contentType' => $contentType,
            'genAi' => $genAi,
            'page' => $page,
        ];
    }

    /**
     * Enrich raw assets, attach scoring summary, and build the unified API payload.
     *
     * @param array<string, mixed> $raw
     * @param array<string, mixed> $extra
     * @return array<string, mixed>
     */
    public function buildEnrichedPayload(
        array $raw,
        string $mode,
        string $summaryQuery,
        int $page,
        bool $sortByVelocity = false,
        array $extra = []
    ): array {
        $assets = $this->enrichment->enrichAssets($raw['assets'] ?? []);

        if ($sortByVelocity) {
            usort($assets, static function (array $a, array $b): int {
                $velA = is_int($a['monthlyVelocity'] ?? null) ? $a['monthlyVelocity'] : -1;
                $velB = is_int($b['monthlyVelocity'] ?? null) ? $b['monthlyVelocity'] : -1;
                return ($velB <=> $velA) ?: ((int) $b['downloads'] <=> (int) $a['downloads']);
            });
        }

        $summary = $this->scoring->buildSearchSummary(
            $summaryQuery,
            $assets,
            (int) ($raw['totalResults'] ?? count($assets)),
            $raw['typeCounts'] ?? ['photo' => 0, 'illustration' => 0, 'vector' => 0, 'video' => 0],
            $raw['aiSplit'] ?? ['aiCount' => 0, 'realCount' => count($assets)]
        );

        $payload = [
            'success' => true,
            'cached' => false,
            'mode' => $mode,
            'page' => (int) ($raw['page'] ?? $page),
            'perPage' => (int) ($raw['perPage'] ?? count($assets)),
            'hasMore' => (bool) ($raw['hasMore'] ?? false),
            'summary' => $summary,
            'assets' => $assets,
        ];

        return array_merge($payload, $extra);
    }
}
