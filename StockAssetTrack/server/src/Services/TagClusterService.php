<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Cache;

/**
 * Aggregates keywords from top-10 to top-20 performing Adobe Stock assets, filters noise,
 * classifies buyer intent, and builds Adobe Stock Contributor CSV metadata drafts.
 */
final class TagClusterService
{
    private const CACHE_TTL_SECONDS = 1800; // 30 minutes

    /** @var string[] */
    private const NOISE_WORDS = [
        'a', 'an', 'the', 'and', 'or', 'for', 'of', 'in', 'on', 'with', 'to', 'by', 'from',
        'no', 'people', 'nobody', 'stock', 'image', 'picture', 'graphic', 'asset', 'file',
        'high', 'quality', 'illustration', 'vector', 'photo', '3d', 'template',
    ];

    /** @var string[] */
    private const BUYER_INTENT_WORDS = [
        'commercial', 'mockup', 'template', 'banner', 'copy space', 'isolated', 'branding',
        'marketing', 'ecommerce', 'poster', 'packaging', 'social media', 'infographic',
        'editorial', 'presentation', 'ui', 'landing page', 'business', 'corporate', 'high resolution',
    ];

    /** @var string[] */
    private const STYLE_MOOD_WORDS = [
        'minimalist', 'modern', 'abstract', 'cinematic', 'clean', 'sustainable', 'eco',
        'flat', 'isometric', 'futuristic', 'luxury', 'pastel', 'studio', 'warm', 'neon',
        'ai generated', 'generative ai', 'background', 'concept',
    ];

    public function __construct(
        private readonly AdobeClientInterface $adobeClient,
        private readonly EnrichmentService $enrichment,
        private readonly Cache $cache
    ) {
    }

    /**
     * Extract frequency- and buyer-intent-ranked tag clusters for a query and/or explicit asset IDs.
     *
     * @param string[] $assetIds
     * @return array<string, mixed>
     */
    public function extractClusters(
        string $query = '',
        array $assetIds = [],
        int $topN = 10,
        string $contentType = 'all',
        bool $excludeNoise = true
    ): array {
        $cleanQuery = trim($query);
        $cleanIds = array_values(array_slice(array_unique(array_filter(array_map('strval', $assetIds))), 0, 20));
        $sampleTarget = max(5, min(20, $topN));
        $cleanType = strtolower(trim($contentType)) ?: 'all';

        if ($cleanQuery === '' && $cleanIds === []) {
            $cleanQuery = 'sustainable packaging mockup';
        }

        $cacheKey = sprintf(
            'tag_clusters:%s:%s:%s:%d:%s:%s',
            $this->adobeClient->mode(),
            strtolower($cleanQuery),
            implode(',', $cleanIds),
            $sampleTarget,
            $cleanType,
            $excludeNoise ? '1' : '0'
        );

        $cached = $this->cache->get($cacheKey);
        if (is_array($cached)) {
            $cached['cached'] = true;
            return $cached;
        }

        $sampledAssets = $this->collectTopAssets($cleanQuery, $cleanIds, $sampleTarget, $cleanType);
        $aggregated = $this->aggregateKeywords($sampledAssets, $cleanQuery, $excludeNoise);

        $topTags = array_slice($aggregated, 0, 49);
        $buyerIntentCount = count(array_filter(
            $topTags,
            static fn(array $t): bool => $t['intent'] === 'Buyer Intent'
        ));

        $primaryCategory = $sampledAssets[0]['category'] ?? 'Business';
        $leadTitle = $cleanQuery !== ''
            ? ucwords($cleanQuery) . ' — Commercial High-Demand Concept'
            : ($sampledAssets[0]['title'] ?? 'Curated Top-Seller Asset Pack');

        $payload = [
            'success' => true,
            'cached' => false,
            'mode' => $this->adobeClient->mode(),
            'query' => $cleanQuery !== '' ? $cleanQuery : ('Selected Assets (' . count($sampledAssets) . ')'),
            'sampledCount' => count($sampledAssets),
            'totalUniqueTags' => count($aggregated),
            'buyerIntentShare' => $topTags !== [] ? (int) round(($buyerIntentCount / count($topTags)) * 100) : 0,
            'recommendedTitle' => mb_substr($leadTitle, 0, 200),
            'recommendedCategory' => $primaryCategory,
            'recommendedTags' => array_slice(array_column($topTags, 'tag'), 0, 49),
            'clusters' => $topTags,
            'sourceAssets' => array_map(static fn(array $a): array => [
                'id' => $a['id'],
                'title' => $a['title'],
                'thumbnailUrl' => $a['thumbnailUrl'],
                'mediaType' => $a['mediaType'],
                'category' => $a['category'],
                'downloads' => $a['downloads'],
                'monthlyVelocity' => $a['monthlyVelocity'],
                'keywordsCount' => count((array) ($a['keywords'] ?? [])),
            ], $sampledAssets),
        ];

        $this->cache->set($cacheKey, $payload, self::CACHE_TTL_SECONDS);
        return $payload;
    }

    /**
     * @param string[] $assetIds
     * @return array<int, array<string, mixed>>
     */
    private function collectTopAssets(string $query, array $assetIds, int $sampleTarget, string $contentType): array
    {
        $rawPool = [];

        if ($assetIds !== []) {
            foreach ($assetIds as $id) {
                $similar = $this->adobeClient->similarByImageId($id, 1);
                if (is_array($similar['referenceAsset'] ?? null)) {
                    $rawPool[] = $similar['referenceAsset'];
                }
            }
        }

        if ($query !== '' || count($rawPool) < $sampleTarget) {
            $searchQuery = $query !== '' ? $query : 'commercial concept';
            $searchRes = $this->adobeClient->search([
                'q' => $searchQuery,
                'order' => 'nb_downloads',
                'content_type' => $contentType,
                'generative_ai' => 'all',
                'page' => 1,
            ]);
            foreach ((array) ($searchRes['assets'] ?? []) as $item) {
                if (is_array($item)) {
                    $rawPool[] = $item;
                }
            }
        }

        // Deduplicate by asset ID and enrich cleanly
        $unique = [];
        foreach ($rawPool as $raw) {
            $id = (string) ($raw['id'] ?? '');
            if ($id !== '' && !isset($unique[$id])) {
                $unique[$id] = $raw;
            }
        }

        $enriched = $this->enrichment->enrichAssets(array_values($unique));
        usort($enriched, static fn(array $a, array $b): int => (int) $b['downloads'] <=> (int) $a['downloads']);

        return array_slice($enriched, 0, $sampleTarget);
    }

    /**
     * @param array<int, array<string, mixed>> $assets
     * @return array<int, array<string, mixed>>
     */
    private function aggregateKeywords(array $assets, string $query, bool $excludeNoise): array
    {
        $assetCount = max(1, count($assets));
        $queryTokens = array_values(array_filter(preg_split('/\s+/', strtolower($query)) ?: []));
        $tagStats = [];

        foreach ($assets as $asset) {
            $downloads = max(1, (int) ($asset['downloads'] ?? 0));
            $keywords = array_values(array_unique(array_map(
                static fn($k): string => strtolower(trim((string) $k)),
                (array) ($asset['keywords'] ?? [])
            )));

            foreach ($keywords as $position => $tag) {
                if ($tag === '' || mb_strlen($tag) < 2) {
                    continue;
                }
                if ($excludeNoise && in_array($tag, self::NOISE_WORDS, true)) {
                    continue;
                }

                if (!isset($tagStats[$tag])) {
                    $tagStats[$tag] = [
                        'tag' => $tag,
                        'frequency' => 0,
                        'weightedDownloads' => 0,
                        'positionBonusSum' => 0.0,
                    ];
                }

                $tagStats[$tag]['frequency']++;
                $tagStats[$tag]['weightedDownloads'] += $downloads;
                $tagStats[$tag]['positionBonusSum'] += max(0.2, 1.0 - ($position * 0.04));
            }
        }

        $maxDownloads = 1;
        foreach ($tagStats as $entry) {
            if ($entry['weightedDownloads'] > $maxDownloads) {
                $maxDownloads = $entry['weightedDownloads'];
            }
        }

        $ranked = [];
        foreach ($tagStats as $entry) {
            $tag = $entry['tag'];
            $intent = $this->classifyIntent($tag, $queryTokens);
            $coveragePct = (int) round(($entry['frequency'] / $assetCount) * 100);
            $freqScore = ($entry['frequency'] / $assetCount) * 55.0;
            $dlScore = ($entry['weightedDownloads'] / $maxDownloads) * 25.0;
            $intentBonus = match ($intent) {
                'Subject Core' => 18.0,
                'Buyer Intent' => 16.0,
                default => 10.0,
            };
            $posScore = min(10.0, ($entry['positionBonusSum'] / $assetCount) * 10.0);
            $relevanceScore = (int) max(1, min(100, round($freqScore + $dlScore + $intentBonus + $posScore * 0.2)));

            $ranked[] = [
                'tag' => $tag,
                'frequency' => $entry['frequency'],
                'coveragePercent' => $coveragePct,
                'weightedDownloads' => $entry['weightedDownloads'],
                'intent' => $intent,
                'relevanceScore' => $relevanceScore,
            ];
        }

        usort($ranked, static function (array $a, array $b): int {
            return ($b['relevanceScore'] <=> $a['relevanceScore'])
                ?: ($b['frequency'] <=> $a['frequency'])
                ?: ($b['weightedDownloads'] <=> $a['weightedDownloads']);
        });

        return $ranked;
    }

    /**
     * @param string[] $queryTokens
     */
    private function classifyIntent(string $tag, array $queryTokens): string
    {
        if (in_array($tag, self::BUYER_INTENT_WORDS, true)) {
            return 'Buyer Intent';
        }
        foreach ($queryTokens as $token) {
            if ($token !== '' && str_contains($tag, $token)) {
                return 'Subject Core';
            }
        }
        if (in_array($tag, self::STYLE_MOOD_WORDS, true)) {
            return 'Style & Mood';
        }

        return 'Buyer Intent';
    }
}
