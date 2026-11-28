<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Normalizes upstream asset records into strict null-safe StockAsset objects and attaches derived metrics.
 */
final class EnrichmentService
{
    /** @var array<string, array{code: string, name: string, flag: string}> */
    private const COUNTRY_MAP = [
        'US' => ['code' => 'US', 'name' => 'United States', 'flag' => '🇺🇸'],
        'TH' => ['code' => 'TH', 'name' => 'Thailand', 'flag' => '🇹🇭'],
        'BD' => ['code' => 'BD', 'name' => 'Bangladesh', 'flag' => '🇧🇩'],
        'GB' => ['code' => 'GB', 'name' => 'United Kingdom', 'flag' => '🇬🇧'],
        'DE' => ['code' => 'DE', 'name' => 'Germany', 'flag' => '🇩🇪'],
        'ID' => ['code' => 'ID', 'name' => 'Indonesia', 'flag' => '🇮🇩'],
        'IN' => ['code' => 'IN', 'name' => 'India', 'flag' => '🇮🇳'],
        'UA' => ['code' => 'UA', 'name' => 'Ukraine', 'flag' => '🇺🇦'],
        'BR' => ['code' => 'BR', 'name' => 'Brazil', 'flag' => '🇧🇷'],
        'JP' => ['code' => 'JP', 'name' => 'Japan', 'flag' => '🇯🇵'],
    ];

    public function __construct(private readonly ScoringService $scoring)
    {
    }

    /**
     * Normalize and enrich an array of raw asset items.
     *
     * @param array<int, array<string, mixed>> $rawAssets
     * @return array<int, array<string, mixed>>
     */
    public function enrichAssets(array $rawAssets): array
    {
        $enriched = [];
        foreach ($rawAssets as $raw) {
            $enriched[] = $this->enrichSingle($raw);
        }

        return $enriched;
    }

    /**
     * @param array<string, mixed> $raw
     * @return array<string, mixed>
     */
    public function enrichSingle(array $raw): array
    {
        $downloads = max(0, (int) ($raw['downloads'] ?? $raw['nb_downloads'] ?? 0));
        $creationDate = isset($raw['creationDate']) && is_string($raw['creationDate']) && trim($raw['creationDate']) !== ''
            ? $raw['creationDate']
            : null;

        $monthlyVelocity = $this->scoring->calcMonthlyVelocity($downloads, $creationDate);
        $performanceScore = $this->scoring->calcPerformanceScore($monthlyVelocity);

        $countryCode = strtoupper((string) ($raw['countryCode'] ?? ''));
        $creatorCountry = $this->resolveCountry($countryCode, allowFallbackPin: false);

        return [
            'id' => (string) ($raw['id'] ?? ''),
            'title' => (string) ($raw['title'] ?? 'Untitled Asset'),
            'thumbnailUrl' => (string) ($raw['thumbnailUrl'] ?? ''),
            'preview1000Url' => (string) ($raw['preview1000Url'] ?? $raw['thumbnailUrl'] ?? ''),
            'videoPreviewUrl' => isset($raw['videoPreviewUrl']) && is_string($raw['videoPreviewUrl']) ? $raw['videoPreviewUrl'] : null,
            'mediaType' => (string) ($raw['mediaType'] ?? 'Photo'),
            'mediaTypeId' => (int) ($raw['mediaTypeId'] ?? 1),
            'contentType' => (string) ($raw['contentType'] ?? 'image/jpeg'),
            'category' => (string) ($raw['category'] ?? 'Uncategorized'),
            'dimensions' => (string) ($raw['dimensions'] ?? '4000 x 3000'),
            'creationDate' => $creationDate,
            'isAI' => (bool) ($raw['isAI'] ?? false),
            'downloads' => $downloads,
            'monthlyVelocity' => $monthlyVelocity,
            'performanceScore' => $performanceScore,
            'keywords' => $this->normalizeKeywords($raw['keywords'] ?? []),
            'creator' => (string) ($raw['creator'] ?? 'Unknown Creator'),
            'creatorId' => (string) ($raw['creatorId'] ?? ''),
            'creatorCountry' => $creatorCountry,
        ];
    }

    /**
     * @return string[]
     */
    private function normalizeKeywords(mixed $keywords): array
    {
        if (is_array($keywords)) {
            $out = [];
            foreach ($keywords as $item) {
                $name = is_array($item) ? (string) ($item['name'] ?? '') : (string) $item;
                $trimmed = trim($name);
                if ($trimmed !== '') {
                    $out[] = $trimmed;
                }
            }
            return array_values(array_unique($out));
        }

        if (is_string($keywords) && trim($keywords) !== '') {
            return array_values(array_filter(array_map('trim', explode(',', $keywords))));
        }

        return [];
    }

    /**
     * Resolve a 2-letter ISO country code to metadata with optional 📍 fallback.
     *
     * @return array{code: string, name: string, flag: string}|null
     */
    public function resolveCountry(?string $countryCode, bool $allowFallbackPin = true): ?array
    {
        $normalized = strtoupper(trim((string) $countryCode));
        if ($normalized !== '' && isset(self::COUNTRY_MAP[$normalized])) {
            return self::COUNTRY_MAP[$normalized];
        }
        if ($normalized !== '') {
            return ['code' => $normalized, 'name' => $normalized, 'flag' => '📍'];
        }

        return $allowFallbackPin
            ? ['code' => 'ZZ', 'name' => 'Global / Unknown', 'flag' => '📍']
            : null;
    }
}
