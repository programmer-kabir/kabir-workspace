<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Swappable contract decoupling business logic from Demo vs Official Adobe Stock API sources.
 */
interface AdobeClientInterface
{
    public function mode(): string;

    /**
     * Search Adobe Stock catalog items and aggregate counts.
     *
     * @param array{q: string, order?: string, content_type?: string, generative_ai?: string, page?: int} $params
     * @return array<string, mixed>
     */
    public function search(array $params): array;

    /**
     * Fetch recent high-velocity breakout uploads across niches.
     *
     * @param array{q?: string, order?: string, content_type?: string, generative_ai?: string, page?: int} $params
     * @return array<string, mixed>
     */
    public function trending(array $params): array;

    /**
     * Find visually similar assets for a given Adobe Stock asset ID plus reference asset metadata.
     *
     * @return array<string, mixed>
     */
    public function similarByImageId(string $imageId, int $page = 1): array;

    /**
     * Find visually similar assets from an uploaded reference image descriptor.
     *
     * @param array{fileName: string, mimeType: string, sha256: string, width: int, height: int, tmpPath: string} $uploadMeta
     * @return array<string, mixed>
     */
    public function similarByUploadedImage(array $uploadMeta, int $page = 1): array;

    /**
     * Sample top-downloaded assets for a specific media type (used for Category Heat Map snapshots).
     *
     * @return array<int, array<string, mixed>>
     */
    public function sampleCategoryTopAssets(string $mediaTypeKey, int $limit = 100): array;

    /**
     * Search assets belonging to a specific Adobe Stock contributor ID or handle.
     *
     * @param array{creatorId: string, creatorName?: string, order?: string, content_type?: string, generative_ai?: string, page?: int} $params
     * @return array<string, mixed>
     */
    public function contributorSearch(array $params): array;

    /**
     * Compute or retrieve aggregate portfolio statistics & monthly velocity series for a contributor.
     *
     * @return array<string, mixed>
     */
    public function contributorStats(string $creatorId, string $creatorNameHint = ''): array;

    /**
     * Batch-resolve creator IDs to 2-letter ISO country codes (empty string when unknown).
     *
     * @param string[] $creatorIds
     * @return array<string, string>
     */
    public function resolveContributorCountries(array $creatorIds): array;
}
