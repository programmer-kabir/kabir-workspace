<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Deterministic rich demo catalog adapter covering all media types, filters, and null-safe edge cases.
 */
final class DemoAdobeClient implements AdobeClientInterface
{
    private const PER_PAGE = 24;

    /** @var array<string, array{label: string, id: int, mime: string}> */
    private const MEDIA_TYPE_TABLE = [
        'photo' => ['label' => 'Photo', 'id' => 1, 'mime' => 'image/jpeg'],
        'illustration' => ['label' => 'Illustration', 'id' => 2, 'mime' => 'image/jpeg'],
        'vector' => ['label' => 'Vector', 'id' => 3, 'mime' => 'image/svg+xml'],
        'video' => ['label' => 'Video', 'id' => 4, 'mime' => 'video/quicktime'],
        'template' => ['label' => 'Template', 'id' => 7, 'mime' => 'application/illustrator.template'],
        '3d' => ['label' => '3D', 'id' => 8, 'mime' => 'image/png'],
    ];

    /** @var array<string, array<int, string>> */
    private const HEATMAP_CATEGORIES_BY_TYPE = [
        'photo' => ['Business', 'Nature', 'Lifestyle', 'People', 'Technology', 'Food', 'Architecture', 'Health'],
        'illustration' => ['Abstract', 'Graphic Resources', 'Technology', 'Education', 'Nature', 'Business', 'Backgrounds'],
        'vector' => ['Graphic Resources', 'Backgrounds', 'Business', 'Technology', 'Education', 'Nature'],
        'video' => ['Technology', 'Nature', 'Business', 'Abstract', 'Lifestyle', 'Architecture'],
        'template' => ['Business', 'Graphic Resources', 'Technology', 'Education', 'Lifestyle'],
        '3d' => ['Abstract', 'Technology', 'Business', 'Graphic Resources', 'Architecture'],
    ];

    /** @var string[] */
    private const TRENDING_TOPICS = [
        'sustainable packaging mockup',
        'minimalist 3d fintech',
        'ai workflow workspace',
        'solar clean energy',
        'editorial studio portrait',
        'ramadan lantern gold',
        'modern typography poster',
        'biotech laboratory glass',
    ];

    /** @var array<int, array{name: string, id: string, country: string}> */
    private const CREATORS = [
        ['name' => 'natara', 'id' => '203712637', 'country' => 'TH'],
        ['name' => 'StudioNord', 'id' => '204198211', 'country' => 'DE'],
        ['name' => 'PixelForgeAI', 'id' => '211509432', 'country' => 'US'],
        ['name' => 'DhakaVectors', 'id' => '209884120', 'country' => 'BD'],
        ['name' => 'KaitoVisuals', 'id' => '207331904', 'country' => 'JP'],
        ['name' => 'LuminaMotion', 'id' => '206112845', 'country' => 'GB'],
    ];

    public function __construct(private readonly string $appUrl)
    {
    }

    public function mode(): string
    {
        return 'demo';
    }

    /**
     * @param array{q: string, order?: string, content_type?: string, generative_ai?: string, page?: int} $params
     * @return array<string, mixed>
     */
    public function search(array $params): array
    {
        $query = trim((string) ($params['q'] ?? ''));
        if ($query === '') {
            $query = 'nature';
        }

        $catalog = $this->buildCatalogForQuery($query);

        return $this->packageCatalogResults($catalog, $query, $params);
    }

    /**
     * @param array{q?: string, order?: string, content_type?: string, generative_ai?: string, page?: int} $params
     * @return array<string, mixed>
     */
    public function trending(array $params): array
    {
        $focus = trim((string) ($params['q'] ?? ''));
        $catalog = $focus !== '' && strtolower($focus) !== 'all'
            ? $this->buildTrendingPool([$focus])
            : $this->buildTrendingPool(self::TRENDING_TOPICS);

        $order = strtolower((string) ($params['order'] ?? 'velocity'));
        if ($order === 'velocity' || $order === 'relevance') {
            $params['order'] = 'creation';
        }

        $queryLabel = ($focus !== '' && strtolower($focus) !== 'all') ? $focus : 'Trending Breakouts';
        return $this->packageCatalogResults($catalog, $queryLabel, $params, 1450);
    }

    /**
     * @return array<string, mixed>
     */
    public function similarByImageId(string $imageId, int $page = 1): array
    {
        $cleanId = preg_replace('/[^a-zA-Z0-9_-]/', '', trim($imageId)) ?: '489201100';
        $seed = $this->unsignedHash('similar:' . $cleanId);
        $topics = array_keys(self::HEATMAP_CATEGORIES_BY_TYPE);
        $typeKey = $topics[$seed % count($topics)];
        $categories = self::HEATMAP_CATEGORIES_BY_TYPE[$typeKey];
        $category = $categories[$seed % count($categories)];
        $styles = [
            'Clean Studio Lighting',
            'Editorial Minimalist Scene',
            'Modern Isometric Concept',
            'Soft Natural Tone',
        ];
        $style = $styles[$seed % count($styles)];
        $themeLabel = "{$category} {$style}";

        $referenceAsset = $this->makeCatalogItem(
            id: $cleanId,
            title: "Reference #{$cleanId} — {$themeLabel}",
            typeKey: $typeKey,
            category: $category,
            isAi: ($typeKey !== 'vector') && (($seed % 3) === 0),
            downloads: ($seed % 3200) + 180,
            daysAgo: 35 + ($seed % 140),
            creatorIndex: $seed % count(self::CREATORS),
            keywords: $this->buildKeywords($themeLabel, self::MEDIA_TYPE_TABLE[$typeKey]['label'], $category, ($seed % 3) === 0),
            forceNullDate: false
        );

        $similarCatalog = $this->buildVisualPool("similar_{$cleanId}", $themeLabel, $category, $typeKey, 36);
        $paged = $this->packageCatalogResults($similarCatalog, "Similar to #{$cleanId}", ['page' => $page, 'order' => 'nb_downloads'], 42);
        $paged['referenceAsset'] = $referenceAsset;

        return $paged;
    }

    /**
     * @param array{fileName: string, mimeType: string, sha256: string, width: int, height: int, tmpPath: string} $uploadMeta
     * @return array<string, mixed>
     */
    public function similarByUploadedImage(array $uploadMeta, int $page = 1): array
    {
        $seed = $this->unsignedHash($uploadMeta['sha256']);
        $aspectRatio = $uploadMeta['height'] > 0 ? ($uploadMeta['width'] / $uploadMeta['height']) : 1.0;
        $orientation = $aspectRatio > 1.15 ? 'Landscape' : ($aspectRatio < 0.85 ? 'Portrait' : 'Square');

        $nameTokens = array_values(array_filter(
            preg_split('/[^a-zA-Z0-9]+/', strtolower(pathinfo($uploadMeta['fileName'], PATHINFO_FILENAME))) ?: [],
            static fn(string $token): bool => strlen($token) >= 3 && !is_numeric($token)
        ));

        $fallbackThemes = ['Minimalist Studio Product', 'Modern Tech Workspace', 'Eco Botanical Aesthetic', 'Abstract 3D Geometry'];
        $theme = $nameTokens !== []
            ? ucwords(implode(' ', array_slice($nameTokens, 0, 3)))
            : $fallbackThemes[$seed % count($fallbackThemes)];

        $types = ['photo', 'illustration', 'vector', '3d'];
        $dominantType = $types[$seed % count($types)];
        $categories = self::HEATMAP_CATEGORIES_BY_TYPE[$dominantType];
        $dominantCategory = $categories[$seed % count($categories)];

        $pool = $this->buildVisualPool('upload_' . substr($uploadMeta['sha256'], 0, 12), "{$theme} {$orientation}", $dominantCategory, $dominantType, 36);
        $paged = $this->packageCatalogResults($pool, "Visual Match: {$theme}", ['page' => $page, 'order' => 'relevance'], 35);
        $paged['matchedSignals'] = [
            'orientation' => $orientation,
            'dominantStyle' => $theme,
            'dominantCategory' => $dominantCategory,
            'dimensions' => "{$uploadMeta['width']} x {$uploadMeta['height']}",
            'inferredTags' => array_values(array_slice(array_values(array_unique(array_merge(
                array_slice($nameTokens, 0, 3),
                [strtolower($orientation), strtolower($dominantCategory), 'commercial', 'studio lighting']
            ))), 0, 6)),
        ];

        return $paged;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function sampleCategoryTopAssets(string $mediaTypeKey, int $limit = 100): array
    {
        $normalizedKey = array_key_exists(strtolower($mediaTypeKey), self::MEDIA_TYPE_TABLE)
            ? strtolower($mediaTypeKey)
            : 'photo';

        $typeMeta = self::MEDIA_TYPE_TABLE[$normalizedKey];
        $categories = self::HEATMAP_CATEGORIES_BY_TYPE[$normalizedKey] ?? ['Business', 'Nature', 'Technology'];
        $baseSeed = $this->unsignedHash('heatmap:' . $normalizedKey);
        $targetCount = max(10, min(100, $limit));
        $assets = [];

        for ($i = 0; $i < $targetCount; $i++) {
            $itemSeed = $baseSeed + ($i * 6971);
            // Bias early categories higher to produce a crisp 5-tier heat gradient per media type
            $weightedBucket = (int) floor(pow(($itemSeed % 1000) / 1000.0, 1.35) * count($categories));
            $category = $categories[min(count($categories) - 1, $weightedBucket)];
            $isAi = ($normalizedKey !== 'vector') && (($itemSeed % 10) < ($normalizedKey === '3d' || $normalizedKey === 'illustration' ? 5 : 3));
            $downloads = (int) round((12500 - ($i * 95)) * (1.0 - ($weightedBucket * 0.06)) + ($itemSeed % 650));
            $daysAgo = 20 + (($itemSeed % 420));
            $id = (string) (510000000 + (($baseSeed + $i * 9199) % 450000000));
            $title = "{$category} {$typeMeta['label']} Top Asset #" . ($i + 1);

            $assets[] = $this->makeCatalogItem(
                id: $id,
                title: $title,
                typeKey: $normalizedKey,
                category: $category,
                isAi: $isAi,
                downloads: max(25, $downloads),
                daysAgo: $daysAgo,
                creatorIndex: $i % count(self::CREATORS),
                keywords: $this->buildKeywords("{$category} top trend", $typeMeta['label'], $category, $isAi),
                forceNullDate: ($normalizedKey === 'vector' && ($i % 12 === 0))
            );
        }

        usort($assets, static fn(array $a, array $b): int => $b['downloads'] <=> $a['downloads']);
        return $assets;
    }

    /**
     * @param array<int, array<string, mixed>> $catalog
     * @param array<string, mixed> $params
     * @return array<string, mixed>
     */
    private function packageCatalogResults(array $catalog, string $query, array $params, ?int $multiplierOverride = null): array
    {
        $order = (string) ($params['order'] ?? 'relevance');
        $contentType = strtolower((string) ($params['content_type'] ?? 'all'));
        $genAi = strtolower((string) ($params['generative_ai'] ?? 'all'));
        $page = max(1, (int) ($params['page'] ?? 1));

        $filtered = $this->filterCatalog($catalog, $contentType, $genAi);
        $ordered = $this->sortCatalog($filtered, $order);

        $offset = ($page - 1) * self::PER_PAGE;
        $pageItems = array_slice($ordered, $offset, self::PER_PAGE);
        $stats = $this->computeAggregateCounts($query, $catalog, $contentType, $genAi, $multiplierOverride);

        return [
            'mode' => $this->mode(),
            'query' => $query,
            'page' => $page,
            'perPage' => self::PER_PAGE,
            'hasMore' => ($offset + self::PER_PAGE) < count($ordered),
            'totalResults' => $stats['totalResults'],
            'typeCounts' => $stats['typeCounts'],
            'aiSplit' => $stats['aiSplit'],
            'assets' => $pageItems,
        ];
    }

    /**
     * @param string[] $topics
     * @return array<int, array<string, mixed>>
     */
    private function buildTrendingPool(array $topics): array
    {
        $types = array_keys(self::MEDIA_TYPE_TABLE);
        $categories = ['Technology', 'Business', 'Nature', 'Lifestyle', 'Graphic Resources', 'Abstract'];
        $pool = [];

        for ($i = 0; $i < 48; $i++) {
            $topic = $topics[$i % count($topics)];
            $seed = $this->unsignedHash('trending:' . $topic . ':' . $i);
            $typeKey = $types[$i % count($types)];
            $category = $categories[($seed + $i) % count($categories)];
            $isAi = ($typeKey !== 'vector') && (($seed % 10) < 5);
            $daysAgo = 5 + ($seed % 45);
            $downloads = 95 + ($seed % 1650);
            $id = (string) (610000000 + (($seed + $i * 17911) % 380000000));
            $title = ucwords($topic) . ' — Rising Niche #' . ($i + 1);

            $pool[] = $this->makeCatalogItem(
                id: $id,
                title: $title,
                typeKey: $typeKey,
                category: $category,
                isAi: $isAi,
                downloads: $downloads,
                daysAgo: $daysAgo,
                creatorIndex: $i % count(self::CREATORS),
                keywords: $this->buildKeywords($topic, self::MEDIA_TYPE_TABLE[$typeKey]['label'], $category, $isAi),
                forceNullDate: false
            );
        }

        return $pool;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildVisualPool(string $seedPrefix, string $themeLabel, string $primaryCategory, string $primaryTypeKey, int $count): array
    {
        $baseSeed = $this->unsignedHash($seedPrefix);
        $types = array_values(array_unique([$primaryTypeKey, 'photo', 'illustration', 'vector', '3d']));
        $styles = ['Studio Composition', 'Close-Up Angle', 'Isolated Minimalist', 'Commercial Scene', 'Vibrant Gradient'];
        $pool = [];

        for ($i = 0; $i < $count; $i++) {
            $itemSeed = $baseSeed + ($i * 8297);
            $typeKey = $i < (int) ($count * 0.55) ? $primaryTypeKey : $types[$i % count($types)];
            $category = $i % 3 === 0 ? $primaryCategory : (self::HEATMAP_CATEGORIES_BY_TYPE[$typeKey][0] ?? $primaryCategory);
            $isAi = ($typeKey !== 'vector') && (($itemSeed % 10) < 4);
            $daysAgo = 18 + ($itemSeed % 280);
            $downloads = 85 + ($itemSeed % 2400);
            $id = (string) (400000000 + (($baseSeed + $i * 23017) % 580000000));
            $title = "{$themeLabel} — " . $styles[$i % count($styles)] . ' #' . ($i + 1);

            $pool[] = $this->makeCatalogItem(
                id: $id,
                title: $title,
                typeKey: $typeKey,
                category: $category,
                isAi: $isAi,
                downloads: $downloads,
                daysAgo: $daysAgo,
                creatorIndex: $i % count(self::CREATORS),
                keywords: $this->buildKeywords($themeLabel, self::MEDIA_TYPE_TABLE[$typeKey]['label'], $category, $isAi),
                forceNullDate: ($typeKey === 'vector' && ($i % 9 === 0))
            );
        }

        return $pool;
    }

    /**
     * @param string[] $keywords
     * @return array<string, mixed>
     */
    private function makeCatalogItem(
        string $id,
        string $title,
        string $typeKey,
        string $category,
        bool $isAi,
        int $downloads,
        int $daysAgo,
        int $creatorIndex,
        array $keywords,
        bool $forceNullDate,
        ?array $creatorOverride = null
    ): array {
        $typeMeta = self::MEDIA_TYPE_TABLE[$typeKey] ?? self::MEDIA_TYPE_TABLE['photo'];
        $creator = $creatorOverride ?? self::CREATORS[$creatorIndex % count(self::CREATORS)];
        $previewUrl = $this->demoPreviewUrl($id, $title, $typeMeta['label'], $isAi);

        return [
            'id' => $id,
            'title' => $title,
            'thumbnailUrl' => $previewUrl,
            'preview1000Url' => $previewUrl,
            'videoPreviewUrl' => null,
            'mediaType' => $typeMeta['label'],
            'mediaTypeId' => $typeMeta['id'],
            'contentType' => $typeMeta['mime'],
            'category' => $category,
            'dimensions' => $typeKey === 'video' ? '3840 x 2160' : ($typeKey === 'vector' ? '5000 x 3333' : '6000 x 4000'),
            'creationDate' => $forceNullDate ? null : gmdate('Y-m-d H:i:s', time() - ($daysAgo * 86400)),
            'isAI' => $isAi,
            'downloads' => $downloads,
            'keywords' => $keywords,
            'creator' => $creator['name'],
            'creatorId' => $creator['id'],
            'countryCode' => $creator['country'],
        ];
    }

    private function unsignedHash(string $input): int
    {
        return abs((int) crc32($input));
    }

    /**
     * @param array{creatorId: string, creatorName?: string, order?: string, content_type?: string, generative_ai?: string, page?: int} $params
     * @return array<string, mixed>
     */
    public function contributorSearch(array $params): array
    {
        $persona = $this->resolveCreatorPersona((string) ($params['creatorId'] ?? ''), (string) ($params['creatorName'] ?? ''));
        $catalog = $this->buildCreatorPortfolioCatalog($persona);
        $paged = $this->packageCatalogResults($catalog, $persona['name'], $params, $persona['portfolioMultiplier']);

        $paged['creatorId'] = $persona['id'];
        $paged['creatorName'] = $persona['name'];
        $paged['countryCode'] = $persona['country'];
        $paged['totalAssets'] = $persona['totalAssets'];

        return $paged;
    }

    /**
     * @return array<string, mixed>
     */
    public function contributorStats(string $creatorId, string $creatorNameHint = ''): array
    {
        $persona = $this->resolveCreatorPersona($creatorId, $creatorNameHint);
        $catalog = $this->buildCreatorPortfolioCatalog($persona);

        $sampleDownloads = 0;
        $sampleAi = 0;
        $categories = [];
        foreach ($catalog as $item) {
            $sampleDownloads += (int) $item['downloads'];
            if (!empty($item['isAI'])) {
                $sampleAi++;
            }
            $cat = (string) $item['category'];
            $categories[$cat] = [
                'name' => $cat,
                'count' => ($categories[$cat]['count'] ?? 0) + 1,
                'downloads' => ($categories[$cat]['downloads'] ?? 0) + (int) $item['downloads'],
            ];
        }

        $totalAssets = $persona['totalAssets'];
        $aiPercent = (int) round(($sampleAi / max(1, count($catalog))) * 100);
        $aiCount = (int) round(($aiPercent / 100.0) * $totalAssets);
        $avgDownloads = (int) round($sampleDownloads / max(1, count($catalog)));
        $totalDownloads = (int) round($avgDownloads * $totalAssets * 0.62);

        $seed = $this->unsignedHash('stats:' . $persona['id']);
        $monthlySeries = [];
        for ($m = 7; $m >= 0; $m--) {
            $monthTs = strtotime("-{$m} months");
            $monthLabel = $monthTs !== false ? gmdate('M Y', $monthTs) : "M-{$m}";
            $trendFactor = 0.72 + ((7 - $m) * 0.06) + ((($seed + $m * 131) % 18) / 100.0);
            $uploads = max(8, (int) round(($totalAssets / 42.0) * (0.65 + (($seed + $m * 47) % 45) / 100.0)));
            $downloads = (int) round(($totalDownloads / 12.0) * $trendFactor);
            $monthlySeries[] = [
                'month' => $monthLabel,
                'uploads' => $uploads,
                'downloads' => $downloads,
                'velocity' => (int) round($downloads / max(1, (int) round($totalAssets / 18.0))),
            ];
        }

        usort($categories, static fn(array $a, array $b): int => $b['downloads'] <=> $a['downloads']);

        return [
            'creatorId' => $persona['id'],
            'creatorName' => $persona['name'],
            'countryCode' => $persona['country'],
            'totalAssets' => $totalAssets,
            'totalDownloads' => $totalDownloads,
            'avgDownloads' => $avgDownloads,
            'aiCount' => $aiCount,
            'nonAiCount' => max(0, $totalAssets - $aiCount),
            'aiPercent' => $aiPercent,
            'topCategories' => array_slice(array_values($categories), 0, 5),
            'monthlySeries' => $monthlySeries,
            'source' => 'demo_portfolio',
            'computedAt' => gmdate('c'),
        ];
    }

    /**
     * @param string[] $creatorIds
     * @return array<string, string>
     */
    public function resolveContributorCountries(array $creatorIds): array
    {
        $codes = ['US', 'GB', 'DE', 'JP', 'TH', 'BD', 'ID', 'IN', 'UA', 'BR'];
        $map = [];

        foreach ($creatorIds as $rawId) {
            $id = trim((string) $rawId);
            if ($id === '') {
                continue;
            }
            $matched = null;
            foreach (self::CREATORS as $creator) {
                if ($creator['id'] === $id) {
                    $matched = $creator['country'];
                    break;
                }
            }
            $map[$id] = $matched ?? $codes[$this->unsignedHash('country:' . $id) % count($codes)];
        }

        return $map;
    }

    /**
     * Look up batch demo stats for specific asset IDs.
     *
     * @param string[] $imageIds
     * @return array<string, array<string, mixed>>
     */
    public function getBatchStats(array $imageIds): array
    {
        $stats = [];
        foreach ($imageIds as $id) {
            $seed = $this->unsignedHash((string) $id);
            $downloads = ($seed % 4500) + 12;
            $stats[(string) $id] = [
                'id' => (string) $id,
                'downloads' => $downloads,
                'cachedAt' => gmdate('c'),
            ];
        }

        return $stats;
    }

    /**
     * @return array{id: string, name: string, country: string, primaryTypes: string[], aiProbability: int, totalAssets: int, portfolioMultiplier: int}
     */
    private function resolveCreatorPersona(string $creatorId, string $nameHint = ''): array
    {
        $cleanId = preg_replace('/[^0-9]/', '', trim($creatorId));
        if ($cleanId === '') {
            foreach (self::CREATORS as $c) {
                if (strtolower($c['name']) === strtolower(trim($nameHint))) {
                    $cleanId = $c['id'];
                    break;
                }
            }
            if ($cleanId === '') {
                $cleanId = (string) (200000000 + ($this->unsignedHash($nameHint ?: 'creator') % 95000000));
            }
        }

        $presets = [
            '203712637' => ['name' => 'natara', 'country' => 'TH', 'primaryTypes' => ['photo', 'illustration'], 'aiProbability' => 35, 'totalAssets' => 2480, 'portfolioMultiplier' => 42],
            '204198211' => ['name' => 'StudioNord', 'country' => 'DE', 'primaryTypes' => ['photo', 'template'], 'aiProbability' => 15, 'totalAssets' => 3940, 'portfolioMultiplier' => 65],
            '211509432' => ['name' => 'PixelForgeAI', 'country' => 'US', 'primaryTypes' => ['photo', 'illustration', '3d'], 'aiProbability' => 85, 'totalAssets' => 1620, 'portfolioMultiplier' => 27],
            '209884120' => ['name' => 'DhakaVectors', 'country' => 'BD', 'primaryTypes' => ['vector', 'template'], 'aiProbability' => 0, 'totalAssets' => 5120, 'portfolioMultiplier' => 85],
            '207331904' => ['name' => 'KaitoVisuals', 'country' => 'JP', 'primaryTypes' => ['illustration', 'template', 'vector'], 'aiProbability' => 25, 'totalAssets' => 2190, 'portfolioMultiplier' => 36],
            '206112845' => ['name' => 'LuminaMotion', 'country' => 'GB', 'primaryTypes' => ['video', '3d'], 'aiProbability' => 30, 'totalAssets' => 1380, 'portfolioMultiplier' => 23],
        ];

        if (isset($presets[$cleanId])) {
            return array_merge(['id' => $cleanId], $presets[$cleanId]);
        }

        $seed = $this->unsignedHash('persona:' . $cleanId);
        $countries = ['US', 'GB', 'DE', 'ID', 'IN', 'BD', 'JP', 'BR'];
        $allTypes = ['photo', 'illustration', 'vector', 'video', 'template', '3d'];
        $cleanName = trim($nameHint) !== ''
            ? ucfirst(preg_replace('/[^a-zA-Z0-9_-]/', '', $nameHint) ?: "Studio{$cleanId}")
            : 'CreatorStudio_' . substr($cleanId, -4);

        return [
            'id' => $cleanId,
            'name' => $cleanName,
            'country' => $countries[$seed % count($countries)],
            'primaryTypes' => [$allTypes[$seed % count($allTypes)], $allTypes[($seed + 2) % count($allTypes)]],
            'aiProbability' => ($seed % 9) * 10,
            'totalAssets' => 420 + ($seed % 3800),
            'portfolioMultiplier' => 12 + ($seed % 50),
        ];
    }

    /**
     * @param array{id: string, name: string, country: string, primaryTypes: string[], aiProbability: int, totalAssets: int, portfolioMultiplier: int} $persona
     * @return array<int, array<string, mixed>>
     */
    private function buildCreatorPortfolioCatalog(array $persona): array
    {
        $baseSeed = $this->unsignedHash('portfolio:' . $persona['id']);
        $themes = ['Modern Commercial Layout', 'Editorial Minimalist Concept', 'Workspace Productivity', 'Abstract Brand System', 'Lifestyle Story Frame'];
        $categories = ['Business', 'Technology', 'Nature', 'Graphic Resources', 'Lifestyle', 'Abstract'];
        $override = ['name' => $persona['name'], 'id' => $persona['id'], 'country' => $persona['country']];
        $pool = [];

        for ($i = 0; $i < 60; $i++) {
            $seed = $baseSeed + ($i * 7573);
            $typeKey = $persona['primaryTypes'][$i % count($persona['primaryTypes'])];
            $category = $categories[($seed + $i) % count($categories)];
            $isAi = ($typeKey !== 'vector') && (($seed % 100) < $persona['aiProbability']);
            $daysAgo = 8 + ($seed % 640);
            $downloads = 45 + ($seed % 3400);
            $id = (string) (700000000 + (($baseSeed + $i * 19417) % 280000000));
            $theme = $themes[$i % count($themes)];
            $title = "{$persona['name']} — {$theme} #{$id}";

            $pool[] = $this->makeCatalogItem(
                id: $id,
                title: $title,
                typeKey: $typeKey,
                category: $category,
                isAi: $isAi,
                downloads: $downloads,
                daysAgo: $daysAgo,
                creatorIndex: 0,
                keywords: $this->buildKeywords("{$category} {$theme}", self::MEDIA_TYPE_TABLE[$typeKey]['label'], $category, $isAi),
                forceNullDate: ($typeKey === 'vector' && ($i % 10 === 0)),
                creatorOverride: $override
            );
        }

        return $pool;
    }

    /**
     * Generate a deterministic 48-asset pool seeded by query so every keyword renders rich, realistic items.
     *
     * @return array<int, array<string, mixed>>
     */
    private function buildCatalogForQuery(string $query): array
    {
        $lower = strtolower($query);
        $baseSeed = (int) sprintf('%u', crc32($lower));
        $isSpecificNiche = str_contains($lower, 'brass') || str_contains($lower, 'compass') || str_contains($lower, 'eid');

        $curated = $this->curatedPrefixItems($query);
        $types = array_keys(self::MEDIA_TYPE_TABLE);
        $categories = ['Nature', 'Business', 'Technology', 'Lifestyle', 'Graphic Resources', 'Abstract'];
        $styles = [
            'Minimalist Studio Composition',
            'Editorial Sunlight Scene',
            'Clean Isometric Concept',
            'Cinematic High Contrast',
            'Flat Modern Design Asset',
            'Eco Sustainable Aesthetic',
        ];

        $items = $curated;
        $totalNeeded = 48;

        for ($i = count($curated); $i < $totalNeeded; $i++) {
            $itemSeed = $baseSeed + ($i * 7919);
            $typeKey = $types[$i % count($types)];
            $typeMeta = self::MEDIA_TYPE_TABLE[$typeKey];
            $creator = self::CREATORS[$i % count(self::CREATORS)];
            $isAi = ($typeKey !== 'vector') && (($itemSeed % 10) < 4);

            $daysAgo = match ($i % 5) {
                0 => 14 + ($itemSeed % 20),
                1 => 95 + ($itemSeed % 120),
                2 => 360 + ($itemSeed % 400),
                3 => 900 + ($itemSeed % 700),
                default => 45 + ($itemSeed % 90),
            };

            // Intentionally leave some Vector items with null creationDate to verify null-safe rendering
            $creationDate = ($typeKey === 'vector' && ($i % 3 === 0))
                ? null
                : gmdate('Y-m-d H:i:s', time() - ($daysAgo * 86400));

            $downloads = $isSpecificNiche
                ? (($itemSeed % 420) + 8)
                : (($itemSeed % 9500) + ($i % 4 === 0 ? 1200 : 18));

            $id = (string) (300000000 + (($baseSeed + $i * 104729) % 699999999));
            $style = $styles[$i % count($styles)];
            $category = $categories[$i % count($categories)];
            $title = ucfirst($query) . ' — ' . $style . ' #' . ($i + 1);
            $previewUrl = $this->demoPreviewUrl($id, $title, $typeMeta['label'], $isAi);

            $items[] = [
                'id' => $id,
                'title' => $title,
                'thumbnailUrl' => $previewUrl,
                'preview1000Url' => $previewUrl,
                'videoPreviewUrl' => null,
                'mediaType' => $typeMeta['label'],
                'mediaTypeId' => $typeMeta['id'],
                'contentType' => $typeMeta['mime'],
                'category' => $category,
                'dimensions' => $typeKey === 'video' ? '3840 x 2160' : (($typeKey === 'vector') ? '5000 x 3333' : '6000 x 4000'),
                'creationDate' => $creationDate,
                'isAI' => $isAi,
                'downloads' => $downloads,
                'keywords' => $this->buildKeywords($query, $typeMeta['label'], $category, $isAi),
                'creator' => $creator['name'],
                'creatorId' => $creator['id'],
                'countryCode' => $creator['country'],
            ];
        }

        return $items;
    }

    /**
     * Include explicit edge-case items (e.g. Vector with null creationDate, high-velocity breakout item).
     *
     * @return array<int, array<string, mixed>>
     */
    private function curatedPrefixItems(string $query): array
    {
        $clean = ucfirst($query);
        $vectorId = (string) (354630825 + (crc32(strtolower($query)) % 10000));
        $breakoutId = (string) (489201100 + (crc32(strtolower($query)) % 10000));

        return [
            [
                'id' => $breakoutId,
                'title' => "{$clean} Cinematic High-Demand Commercial Scene",
                'thumbnailUrl' => $this->demoPreviewUrl($breakoutId, "{$clean} Commercial Scene", 'Photo', true),
                'preview1000Url' => $this->demoPreviewUrl($breakoutId, "{$clean} Commercial Scene", 'Photo', true),
                'videoPreviewUrl' => null,
                'mediaType' => 'Photo',
                'mediaTypeId' => 1,
                'contentType' => 'image/jpeg',
                'category' => 'Nature',
                'dimensions' => '6144 x 4096',
                'creationDate' => gmdate('Y-m-d H:i:s', time() - (22 * 86400)),
                'isAI' => true,
                'downloads' => 245,
                'keywords' => $this->buildKeywords($query, 'Photo', 'Nature', true),
                'creator' => 'PixelForgeAI',
                'creatorId' => '211509432',
                'countryCode' => 'US',
            ],
            [
                'id' => $vectorId,
                'title' => "{$clean} Scalable Flat Vector Concept Pack",
                'thumbnailUrl' => $this->demoPreviewUrl($vectorId, "{$clean} Vector Pack", 'Vector', false),
                'preview1000Url' => $this->demoPreviewUrl($vectorId, "{$clean} Vector Pack", 'Vector', false),
                'videoPreviewUrl' => null,
                'mediaType' => 'Vector',
                'mediaTypeId' => 3,
                'contentType' => 'image/svg+xml',
                'category' => 'Graphic Resources',
                'dimensions' => '5000 x 3500',
                'creationDate' => null,
                'isAI' => false,
                'downloads' => 1868,
                'keywords' => $this->buildKeywords($query, 'Vector', 'Graphic Resources', false),
                'creator' => 'DhakaVectors',
                'creatorId' => '209884120',
                'countryCode' => 'BD',
            ],
        ];
    }

    /**
     * @param array<int, array<string, mixed>> $items
     * @return array<int, array<string, mixed>>
     */
    private function filterCatalog(array $items, string $contentType, string $genAi): array
    {
        return array_values(array_filter($items, static function (array $item) use ($contentType, $genAi): bool {
            if ($contentType !== 'all') {
                $expectedLabel = self::MEDIA_TYPE_TABLE[$contentType]['label'] ?? null;
                if ($expectedLabel !== null && $item['mediaType'] !== $expectedLabel) {
                    return false;
                }
            }

            if ($genAi === 'only' && !$item['isAI']) {
                return false;
            }
            if ($genAi === 'exclude' && $item['isAI']) {
                return false;
            }

            return true;
        }));
    }

    /**
     * @param array<int, array<string, mixed>> $items
     * @return array<int, array<string, mixed>>
     */
    private function sortCatalog(array $items, string $order): array
    {
        usort($items, static function (array $a, array $b) use ($order): int {
            return match ($order) {
                'nb_downloads' => $b['downloads'] <=> $a['downloads'],
                'undiscovered' => $a['downloads'] <=> $b['downloads'],
                'creation' => strtotime((string) ($b['creationDate'] ?? '1970-01-01')) <=> strtotime((string) ($a['creationDate'] ?? '1970-01-01')),
                'featured' => ($b['isAI'] ? 1 : 0) <=> ($a['isAI'] ? 1 : 0) ?: ($b['downloads'] <=> $a['downloads']),
                default => 0,
            };
        });

        return $items;
    }

    /**
     * @param array<int, array<string, mixed>> $catalog
     * @return array{totalResults: int, typeCounts: array{photo: int, illustration: int, vector: int, video: int}, aiSplit: array{aiCount: int, realCount: int}}
     */
    private function computeAggregateCounts(
        string $query,
        array $catalog,
        string $contentType,
        string $genAi,
        ?int $multiplierOverride = null
    ): array {
        $lower = strtolower($query);
        $multiplier = $multiplierOverride ?? match (true) {
            str_contains($lower, 'vintage brass compass') => 24,
            str_contains($lower, 'eid') || str_contains($lower, 'sustainable packaging') => 185,
            str_contains($lower, 'nature') || str_contains($lower, 'business') => 5200000,
            default => 14500,
        };

        $filtered = $this->filterCatalog($catalog, $contentType, $genAi);
        $aiSample = 0;
        $realSample = 0;
        foreach ($filtered as $item) {
            if ($item['isAI']) {
                $aiSample++;
            } else {
                $realSample++;
            }
        }

        $totalResults = max(count($filtered), count($filtered) * $multiplier);

        return [
            'totalResults' => $totalResults,
            'typeCounts' => [
                'photo' => (int) round($totalResults * 0.54),
                'illustration' => (int) round($totalResults * 0.24),
                'vector' => (int) round($totalResults * 0.12),
                'video' => (int) round($totalResults * 0.10),
            ],
            'aiSplit' => [
                'aiCount' => $aiSample * $multiplier,
                'realCount' => $realSample * $multiplier,
            ],
        ];
    }

    private function demoPreviewUrl(string $id, string $title, string $mediaType, bool $isAi): string
    {
        $query = http_build_query([
            'title' => $title,
            'type' => $mediaType,
            'ai' => $isAi ? '1' : '0',
        ]);

        $baseUrl = $this->appUrl;
        if (!empty($_SERVER['HTTP_HOST']) && (str_contains($baseUrl, 'localhost') || str_contains($baseUrl, '127.0.0.1') || empty($baseUrl))) {
            $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
            $baseUrl = "{$scheme}://{$_SERVER['HTTP_HOST']}";
        }

        return "{$baseUrl}/api/demo-media/{$id}?{$query}";
    }

    /**
     * @return string[]
     */
    private function buildKeywords(string $query, string $mediaType, string $category, bool $isAi): array
    {
        $words = array_values(array_filter(preg_split('/\s+/', strtolower($query)) ?: []));
        $base = array_merge($words, [
            strtolower($mediaType),
            strtolower($category),
            'commercial',
            'editorial',
            'high resolution',
            'background',
            'modern',
            'concept',
            'banner',
            'design',
            'copy space',
            'marketing',
        ]);

        if ($isAi) {
            $base[] = 'generative ai';
            $base[] = 'ai generated';
        }

        return array_values(array_unique($base));
    }
}
