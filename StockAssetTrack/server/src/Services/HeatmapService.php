<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Cache;

/**
 * Builds and caches 6-type top-100 Category Heat Map snapshots across Photo, Illustration, Vector, Video, Template, and 3D.
 */
final class HeatmapService
{
    public const SNAPSHOT_TTL_SECONDS = 86400; // 24 hours
    public const ALLOWED_METRICS = ['totalDownloads', 'avgDownloads', 'sampleSize'];

    /** @var array<string, string> */
    public const MEDIA_TYPES = [
        'photo' => 'Photo',
        'illustration' => 'Illustration',
        'vector' => 'Vector',
        'video' => 'Video',
        'template' => 'Template',
        '3d' => '3D',
    ];

    public function __construct(
        private readonly AdobeClientInterface $adobeClient,
        private readonly EnrichmentService $enrichment,
        private readonly Cache $cache
    ) {
    }

    /**
     * Load the 6-type heatmap snapshot from 24h MySQL cache or build/refresh it when empty or forced.
     *
     * @return array<string, mixed>
     */
    public function getHeatmap(
        string $metric = 'totalDownloads',
        string $typeFilter = 'all',
        bool $forceRefresh = false,
        string $source = 'api'
    ): array {
        $normalizedMetric = in_array($metric, self::ALLOWED_METRICS, true) ? $metric : 'totalDownloads';
        $normalizedType = array_key_exists(strtolower($typeFilter), self::MEDIA_TYPES)
            ? strtolower($typeFilter)
            : 'all';

        $cacheKey = 'heatmap:snapshot:' . $this->adobeClient->mode();
        $snapshot = $forceRefresh ? null : $this->cache->get($cacheKey);
        $fromCache = is_array($snapshot);

        if (!is_array($snapshot)) {
            $snapshot = $this->rebuildSnapshot($source);
        }

        return [
            'success' => true,
            'cached' => $fromCache,
            'mode' => $this->adobeClient->mode(),
            'metric' => $normalizedMetric,
            'selectedType' => $normalizedType,
            'generatedAt' => $snapshot['generatedAt'],
            'nextRefreshAt' => $snapshot['nextRefreshAt'],
            'triggerSource' => $fromCache ? 'mysql_cache' : ($snapshot['triggerSource'] ?? $source),
            'summary' => $snapshot['summary'],
            'mediaTypes' => $snapshot['mediaTypes'],
            'categoriesByType' => $snapshot['categoriesByType'],
        ];
    }

    /**
     * Rebuild the full top-100-per-type snapshot and persist it in MySQL cache for 24 hours.
     *
     * @return array<string, mixed>
     */
    public function rebuildSnapshot(string $triggerSource = 'cron'): array
    {
        $categoriesByType = [];
        $mediaTypeSummaries = [];
        $totalSampled = 0;
        $totalAi = 0;
        $totalDownloadsAll = 0;
        $topCategoryOverall = ['name' => 'Business', 'mediaType' => 'Photo', 'totalDownloads' => 0];
        $topVelocityOverall = ['name' => 'Technology', 'mediaType' => 'Photo', 'avgVelocity' => 0];

        foreach (self::MEDIA_TYPES as $typeKey => $label) {
            $rawSample = $this->adobeClient->sampleCategoryTopAssets($typeKey, 100);
            $enrichedSample = $this->enrichment->enrichAssets($rawSample);
            $buckets = $this->aggregateTypeBuckets($enrichedSample, $typeKey, $label);

            $categoriesByType[$typeKey] = $buckets;
            $typeDownloads = array_sum(array_column($buckets, 'totalDownloads'));
            $typeAi = array_sum(array_column($buckets, 'aiCount'));
            $typeCount = count($enrichedSample);

            $mediaTypeSummaries[] = [
                'key' => $typeKey,
                'label' => $label,
                'sampledAssets' => $typeCount,
                'categoryCount' => count($buckets),
                'totalDownloads' => $typeDownloads,
                'aiPercent' => $typeCount > 0 ? (int) round(($typeAi / $typeCount) * 100) : 0,
            ];

            $totalSampled += $typeCount;
            $totalAi += $typeAi;
            $totalDownloadsAll += $typeDownloads;

            foreach ($buckets as $bucket) {
                if ($bucket['totalDownloads'] > $topCategoryOverall['totalDownloads']) {
                    $topCategoryOverall = [
                        'name' => $bucket['name'],
                        'mediaType' => $label,
                        'totalDownloads' => $bucket['totalDownloads'],
                    ];
                }
                if ($bucket['avgVelocity'] > $topVelocityOverall['avgVelocity']) {
                    $topVelocityOverall = [
                        'name' => $bucket['name'],
                        'mediaType' => $label,
                        'avgVelocity' => $bucket['avgVelocity'],
                    ];
                }
            }
        }

        $now = time();
        $snapshot = [
            'generatedAt' => gmdate('c', $now),
            'nextRefreshAt' => gmdate('c', $now + self::SNAPSHOT_TTL_SECONDS),
            'triggerSource' => $triggerSource,
            'summary' => [
                'totalSampledAssets' => $totalSampled,
                'totalSampledDownloads' => $totalDownloadsAll,
                'overallAiPercent' => $totalSampled > 0 ? (int) round(($totalAi / $totalSampled) * 100) : 0,
                'topCategory' => $topCategoryOverall,
                'topVelocityCategory' => $topVelocityOverall,
            ],
            'mediaTypes' => $mediaTypeSummaries,
            'categoriesByType' => $categoriesByType,
        ];

        $cacheKey = 'heatmap:snapshot:' . $this->adobeClient->mode();
        $this->cache->set($cacheKey, $snapshot, self::SNAPSHOT_TTL_SECONDS);

        return $snapshot;
    }

    /**
     * @param array<int, array<string, mixed>> $assets
     * @return array<int, array<string, mixed>>
     */
    private function aggregateTypeBuckets(array $assets, string $typeKey, string $typeLabel): array
    {
        $grouped = [];

        foreach ($assets as $asset) {
            $categoryName = trim((string) ($asset['category'] ?? 'Uncategorized')) ?: 'Uncategorized';
            if (!isset($grouped[$categoryName])) {
                $grouped[$categoryName] = [
                    'name' => $categoryName,
                    'mediaType' => $typeLabel,
                    'mediaTypeKey' => $typeKey,
                    'totalDownloads' => 0,
                    'sampleSize' => 0,
                    'aiCount' => 0,
                    'velocities' => [],
                    'keywordCounts' => [],
                ];
            }

            $grouped[$categoryName]['totalDownloads'] += (int) ($asset['downloads'] ?? 0);
            $grouped[$categoryName]['sampleSize']++;
            if (!empty($asset['isAI'])) {
                $grouped[$categoryName]['aiCount']++;
            }
            if (is_int($asset['monthlyVelocity'] ?? null)) {
                $grouped[$categoryName]['velocities'][] = $asset['monthlyVelocity'];
            }
            foreach (array_slice((array) ($asset['keywords'] ?? []), 0, 8) as $kw) {
                $normalized = strtolower(trim((string) $kw));
                if ($normalized === '' || $normalized === strtolower($typeLabel) || $normalized === strtolower($categoryName)) {
                    continue;
                }
                $grouped[$categoryName]['keywordCounts'][$normalized] = ($grouped[$categoryName]['keywordCounts'][$normalized] ?? 0) + 1;
            }
        }

        $buckets = [];
        foreach ($grouped as $bucket) {
            $sampleSize = max(1, $bucket['sampleSize']);
            arsort($bucket['keywordCounts']);
            $velocities = $bucket['velocities'];
            $avgVelocity = $velocities === [] ? 0 : (int) round(array_sum($velocities) / count($velocities));

            $buckets[] = [
                'name' => $bucket['name'],
                'mediaType' => $typeLabel,
                'mediaTypeKey' => $typeKey,
                'totalDownloads' => $bucket['totalDownloads'],
                'avgDownloads' => (int) round($bucket['totalDownloads'] / $sampleSize),
                'sampleSize' => $bucket['sampleSize'],
                'aiCount' => $bucket['aiCount'],
                'aiPercent' => (int) round(($bucket['aiCount'] / $sampleSize) * 100),
                'avgVelocity' => $avgVelocity,
                'topKeywords' => array_slice(array_keys($bucket['keywordCounts']), 0, 4),
            ];
        }

        usort($buckets, static fn(array $a, array $b): int => $b['totalDownloads'] <=> $a['totalDownloads']);

        return $buckets;
    }
}
