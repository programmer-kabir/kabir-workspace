<?php

declare(strict_types=1);

namespace App\Services;

use RuntimeException;

/**
 * Option A official Adobe Stock Search API adapter (/Rest/Media/1/Search/Files).
 */
final class OfficialAdobeClient implements AdobeClientInterface
{
    private const SEARCH_ENDPOINT = 'https://stock.adobe.io/Rest/Media/1/Search/Files';

    /** @var array<string, string> */
    private const ORDER_MAP = [
        'relevance' => 'relevance',
        'creation' => 'creation',
        'featured' => 'featured',
        'nb_downloads' => 'nb_downloads',
        'undiscovered' => 'undiscovered',
    ];

    /** @var array<int, string> */
    private const MEDIA_LABELS = [
        1 => 'Photo',
        2 => 'Illustration',
        3 => 'Vector',
        4 => 'Video',
        7 => 'Template',
        8 => '3D',
    ];

    private const RESULT_COLUMNS = [
        'id',
        'title',
        'nb_downloads',
        'creation_date',
        'keywords',
        'creator_id',
        'creator_name',
        'media_type_id',
        'content_type',
        'category',
        'width',
        'height',
        'thumbnail_500_url',
        'thumbnail_1000_url',
        'is_generative_ai',
    ];

    public function __construct(
        private readonly string $apiKey,
        private readonly string $productHeader
    ) {
    }

    public function mode(): string
    {
        return 'official';
    }

    /**
     * @param array{q: string, order?: string, content_type?: string, generative_ai?: string, page?: int} $params
     * @return array<string, mixed>
     */
    public function search(array $params): array
    {
        $page = max(1, (int) ($params['page'] ?? 1));
        $limit = 32;
        $searchParams = [
            'words' => (string) ($params['q'] ?? ''),
            'limit' => $limit,
            'offset' => ($page - 1) * $limit,
            'order' => self::ORDER_MAP[(string) ($params['order'] ?? 'relevance')] ?? 'relevance',
        ];
        $searchParams = $this->applyCommonFilters($searchParams, $params);

        return $this->runRestSearch($searchParams, (string) ($params['q'] ?? ''), $page, $limit);
    }

    /**
     * @param array{q?: string, order?: string, content_type?: string, generative_ai?: string, page?: int} $params
     * @return array<string, mixed>
     */
    public function trending(array $params): array
    {
        $page = max(1, (int) ($params['page'] ?? 1));
        $limit = 32;
        $focus = trim((string) ($params['q'] ?? ''));
        $searchParams = [
            'words' => ($focus === '' || strtolower($focus) === 'all') ? '' : $focus,
            'limit' => $limit,
            'offset' => ($page - 1) * $limit,
            'order' => self::ORDER_MAP[(string) ($params['order'] ?? 'creation')] ?? 'creation',
        ];
        $searchParams = $this->applyCommonFilters($searchParams, $params);

        $label = $focus !== '' && strtolower($focus) !== 'all' ? $focus : 'Trending Breakouts';
        return $this->runRestSearch($searchParams, $label, $page, $limit);
    }

    /**
     * @return array<string, mixed>
     */
    public function similarByImageId(string $imageId, int $page = 1): array
    {
        $limit = 32;
        $refResponse = $this->runRestSearch([
            'media_id' => $imageId,
            'limit' => 1,
            'offset' => 0,
        ], "Reference #{$imageId}", 1, 1);

        $similarResponse = $this->runRestSearch([
            'similar' => $imageId,
            'limit' => $limit,
            'offset' => ($page - 1) * $limit,
        ], "Similar to #{$imageId}", $page, $limit);

        $similarResponse['referenceAsset'] = $refResponse['assets'][0] ?? null;
        return $similarResponse;
    }

    /**
     * @param array{fileName: string, mimeType: string, sha256: string, width: int, height: int, tmpPath: string} $uploadMeta
     * @return array<string, mixed>
     */
    public function similarByUploadedImage(array $uploadMeta, int $page = 1): array
    {
        $this->assertApiKeyConfigured();
        $limit = 32;
        $offset = ($page - 1) * $limit;

        $postFields = [
            'locale' => 'en_US',
            'search_parameters[limit]' => (string) $limit,
            'search_parameters[offset]' => (string) $offset,
            'search_parameters[similar_image]' => new \CURLFile(
                $uploadMeta['tmpPath'],
                $uploadMeta['mimeType'],
                $uploadMeta['fileName']
            ),
        ];

        foreach (self::RESULT_COLUMNS as $index => $col) {
            $postFields["result_columns[{$index}]"] = $col;
        }

        $payload = $this->executeRequest(self::SEARCH_ENDPOINT, 'POST', $postFields);
        $mapped = $this->mapRestPayload($payload, 'Visual Upload Match', $page, $limit);
        $mapped['matchedSignals'] = [
            'orientation' => $uploadMeta['width'] > $uploadMeta['height'] ? 'Landscape' : 'Portrait',
            'dominantStyle' => 'Adobe Visual Similarity',
            'dominantCategory' => $mapped['assets'][0]['category'] ?? 'General',
            'dimensions' => "{$uploadMeta['width']} x {$uploadMeta['height']}",
            'inferredTags' => array_slice($mapped['assets'][0]['keywords'] ?? [], 0, 6),
        ];

        return $mapped;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function sampleCategoryTopAssets(string $mediaTypeKey, int $limit = 100): array
    {
        $result = $this->runRestSearch([
            'limit' => max(1, min(100, $limit)),
            'offset' => 0,
            'order' => 'nb_downloads',
            'filters' => ["content_type:{$mediaTypeKey}" => 1],
        ], "Heatmap {$mediaTypeKey}", 1, min(100, $limit));

        return $result['assets'];
    }

    /**
     * @param array{creatorId: string, creatorName?: string, order?: string, content_type?: string, generative_ai?: string, page?: int} $params
     * @return array<string, mixed>
     */
    public function contributorSearch(array $params): array
    {
        $creatorId = trim((string) ($params['creatorId'] ?? ''));
        $page = max(1, (int) ($params['page'] ?? 1));
        $limit = 32;

        $searchParams = [
            'creator_id' => (int) $creatorId,
            'limit' => $limit,
            'offset' => ($page - 1) * $limit,
            'order' => self::ORDER_MAP[(string) ($params['order'] ?? 'nb_downloads')] ?? 'nb_downloads',
        ];
        $searchParams = $this->applyCommonFilters($searchParams, $params);

        $res = $this->runRestSearch($searchParams, "Contributor #{$creatorId}", $page, $limit);
        $first = $res['assets'][0] ?? null;
        $res['creatorId'] = $creatorId;
        $res['creatorName'] = is_array($first) && !empty($first['creator'])
            ? (string) $first['creator']
            : ((string) ($params['creatorName'] ?? "Contributor #{$creatorId}"));
        $res['countryCode'] = '';

        return $res;
    }

    /**
     * @return array<string, mixed>
     */
    public function contributorStats(string $creatorId, string $creatorNameHint = ''): array
    {
        $sample = $this->runRestSearch([
            'creator_id' => (int) $creatorId,
            'limit' => 100,
            'offset' => 0,
            'order' => 'nb_downloads',
        ], "Stats #{$creatorId}", 1, 100);

        $assets = $sample['assets'] ?? [];
        $totalAssets = (int) ($sample['totalResults'] ?? count($assets));
        $aiSample = 0;
        $sampleDownloads = 0;
        $categories = [];
        $monthlyBuckets = [];

        foreach ($assets as $asset) {
            $dl = (int) ($asset['downloads'] ?? 0);
            $sampleDownloads += $dl;
            if (!empty($asset['isAI'])) {
                $aiSample++;
            }
            $cat = (string) ($asset['category'] ?? 'Uncategorized');
            $categories[$cat] = ['name' => $cat, 'count' => ($categories[$cat]['count'] ?? 0) + 1, 'downloads' => ($categories[$cat]['downloads'] ?? 0) + $dl];
            if (!empty($asset['creationDate'])) {
                $ts = strtotime((string) $asset['creationDate']);
                if ($ts !== false) {
                    $key = gmdate('Y-m', $ts);
                    $monthlyBuckets[$key]['uploads'] = ($monthlyBuckets[$key]['uploads'] ?? 0) + 1;
                    $monthlyBuckets[$key]['downloads'] = ($monthlyBuckets[$key]['downloads'] ?? 0) + $dl;
                }
            }
        }

        $sampleCount = max(1, count($assets));
        $aiPercent = (int) round(($aiSample / $sampleCount) * 100);
        $aiCount = (int) round(($aiPercent / 100.0) * $totalAssets);
        $avgDownloads = (int) round($sampleDownloads / $sampleCount);
        $estimatedTotalDownloads = max($sampleDownloads, $totalAssets > count($assets) ? (int) round($avgDownloads * $totalAssets * 0.55) : $sampleDownloads);

        ksort($monthlyBuckets);
        $monthlySeries = [];
        foreach (array_slice($monthlyBuckets, -8, 8, true) as $ym => $row) {
            $monthlySeries[] = [
                'month' => $ym,
                'uploads' => $row['uploads'],
                'downloads' => $row['downloads'],
                'velocity' => (int) round($row['downloads'] / max(1, $row['uploads'])),
            ];
        }

        usort($categories, static fn(array $a, array $b): int => $b['downloads'] <=> $a['downloads']);
        $first = $assets[0] ?? [];

        return [
            'creatorId' => $creatorId,
            'creatorName' => !empty($first['creator']) ? (string) $first['creator'] : ($creatorNameHint ?: "Contributor #{$creatorId}"),
            'countryCode' => '',
            'totalAssets' => $totalAssets,
            'totalDownloads' => $estimatedTotalDownloads,
            'avgDownloads' => $avgDownloads,
            'aiCount' => $aiCount,
            'nonAiCount' => max(0, $totalAssets - $aiCount),
            'aiPercent' => $aiPercent,
            'topCategories' => array_slice(array_values($categories), 0, 5),
            'monthlySeries' => $monthlySeries,
            'source' => 'official_api',
            'computedAt' => gmdate('c'),
        ];
    }

    /**
     * @param string[] $creatorIds
     * @return array<string, string>
     */
    public function resolveContributorCountries(array $creatorIds): array
    {
        $map = [];
        foreach ($creatorIds as $id) {
            $map[(string) $id] = '';
        }
        return $map;
    }

    /**
     * @param array<string, mixed> $searchParams
     * @param array<string, mixed> $inputParams
     * @return array<string, mixed>
     */
    private function applyCommonFilters(array $searchParams, array $inputParams): array
    {
        $contentType = strtolower((string) ($inputParams['content_type'] ?? 'all'));
        if ($contentType !== 'all' && $contentType !== '') {
            $searchParams['filters']["content_type:{$contentType}"] = 1;
        }

        $genAi = strtolower((string) ($inputParams['generative_ai'] ?? 'all'));
        if ($genAi === 'only') {
            $searchParams['filters']['generative_ai'] = 'only';
        } elseif ($genAi === 'exclude') {
            $searchParams['filters']['generative_ai'] = 'exclude';
        }

        return $searchParams;
    }

    /**
     * @param array<string, mixed> $searchParameters
     * @return array<string, mixed>
     */
    private function runRestSearch(array $searchParameters, string $queryLabel, int $page, int $limit): array
    {
        $this->assertApiKeyConfigured();

        $query = [
            'locale' => 'en_US',
            'search_parameters' => $searchParameters,
            'result_columns' => self::RESULT_COLUMNS,
        ];

        $payload = $this->executeRequest(self::SEARCH_ENDPOINT . '?' . http_build_query($query), 'GET');
        return $this->mapRestPayload($payload, $queryLabel, $page, $limit);
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    private function mapRestPayload(array $payload, string $queryLabel, int $page, int $limit): array
    {
        $files = is_array($payload['files'] ?? null) ? $payload['files'] : [];
        $totalResults = (int) ($payload['nb_results'] ?? count($files));

        $assets = [];
        $aiCount = 0;
        $realCount = 0;
        foreach ($files as $file) {
            if (!is_array($file)) {
                continue;
            }
            $isAi = (bool) ($file['is_generative_ai'] ?? false);
            $isAi ? $aiCount++ : $realCount++;
            $mediaTypeId = (int) ($file['media_type_id'] ?? 1);

            $assets[] = [
                'id' => (string) ($file['id'] ?? ''),
                'title' => (string) ($file['title'] ?? ''),
                'thumbnailUrl' => (string) ($file['thumbnail_500_url'] ?? ''),
                'preview1000Url' => (string) ($file['thumbnail_1000_url'] ?? $file['thumbnail_500_url'] ?? ''),
                'videoPreviewUrl' => null,
                'mediaType' => self::MEDIA_LABELS[$mediaTypeId] ?? 'Photo',
                'mediaTypeId' => $mediaTypeId,
                'contentType' => (string) ($file['content_type'] ?? 'image/jpeg'),
                'category' => (string) ($file['category']['name'] ?? $file['category'] ?? 'Uncategorized'),
                'dimensions' => sprintf('%d x %d', (int) ($file['width'] ?? 0), (int) ($file['height'] ?? 0)),
                'creationDate' => isset($file['creation_date']) ? (string) $file['creation_date'] : null,
                'isAI' => $isAi,
                'downloads' => (int) ($file['nb_downloads'] ?? 0),
                'keywords' => $file['keywords'] ?? [],
                'creator' => (string) ($file['creator_name'] ?? 'Contributor'),
                'creatorId' => (string) ($file['creator_id'] ?? ''),
                'countryCode' => '',
            ];
        }

        return [
            'mode' => $this->mode(),
            'query' => $queryLabel,
            'page' => $page,
            'perPage' => $limit,
            'hasMore' => ($page * $limit) < $totalResults,
            'totalResults' => $totalResults,
            'typeCounts' => ['photo' => 0, 'illustration' => 0, 'vector' => 0, 'video' => 0],
            'aiSplit' => ['aiCount' => $aiCount, 'realCount' => $realCount],
            'assets' => $assets,
        ];
    }

    private function assertApiKeyConfigured(): void
    {
        if (trim($this->apiKey) === '') {
            throw new RuntimeException('ADOBE_API_KEY is required when ADOBE_DATA_MODE=official.');
        }
    }

    /**
     * @param array<string, mixed>|null $postFields
     * @return array<string, mixed>
     */
    private function executeRequest(string $url, string $method = 'GET', ?array $postFields = null): array
    {
        $ch = curl_init($url);
        if ($ch === false) {
            throw new RuntimeException('Failed to initialize HTTP client for Adobe Stock API.');
        }

        $options = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 25,
            CURLOPT_HTTPHEADER => [
                'Accept: application/json',
                "x-api-key: {$this->apiKey}",
                "X-Product: {$this->productHeader}",
            ],
        ];

        if ($method === 'POST') {
            $options[CURLOPT_POST] = true;
            $options[CURLOPT_POSTFIELDS] = $postFields ?? [];
        }

        curl_setopt_array($ch, $options);

        $raw = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($raw === false || $curlError !== '') {
            throw new RuntimeException("Adobe Stock API request error: {$curlError}");
        }

        $decoded = json_decode((string) $raw, true);
        if ($status >= 400 || !is_array($decoded)) {
            throw new RuntimeException("Adobe Stock API returned HTTP {$status}.");
        }

        return $decoded;
    }
}
