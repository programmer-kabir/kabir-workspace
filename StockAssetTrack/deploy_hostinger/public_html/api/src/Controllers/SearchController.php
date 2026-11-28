<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Cache;
use App\Core\Request;
use App\Core\Response;
use App\Services\AdobeClientInterface;
use App\Services\CatalogQueryService;
use App\Services\EnrichmentService;

/**
 * Handles keyword/ID asset search, visual similar lookup, and multipart image upload matching.
 */
final class SearchController
{
    private const SEARCH_TTL_SECONDS = 900;     // 15 minutes
    private const SIMILAR_TTL_SECONDS = 1800;   // 30 minutes
    private const MAX_UPLOAD_BYTES = 10485760;  // 10 MB
    private const ALLOWED_MIME_TYPES = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
    ];

    public function __construct(
        private readonly AdobeClientInterface $adobeClient,
        private readonly CatalogQueryService $catalogQuery,
        private readonly EnrichmentService $enrichment,
        private readonly Cache $cache
    ) {
    }

    public function search(Request $request): never
    {
        $query = trim((string) $request->query('q', ''));
        if ($query === '') {
            Response::error('Please enter a search keyword or Asset ID.', 400, 'EMPTY_QUERY');
        }

        $filters = $this->catalogQuery->parseCatalogParams($request, 'relevance');
        if ($filters['order'] === 'velocity') {
            $filters['order'] = 'nb_downloads';
        }

        $cacheKey = sprintf(
            'search:%s:%s:%s:%s:%s:%d',
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

        $raw = $this->adobeClient->search([
            'q' => $query,
            'order' => $filters['order'],
            'content_type' => $filters['contentType'],
            'generative_ai' => $filters['genAi'],
            'page' => $filters['page'],
        ]);

        $responsePayload = $this->catalogQuery->buildEnrichedPayload(
            $raw,
            $this->adobeClient->mode(),
            $query,
            $filters['page']
        );

        $this->cache->set($cacheKey, $responsePayload, self::SEARCH_TTL_SECONDS);
        Response::json($responsePayload);
    }

    public function similar(Request $request): never
    {
        $page = max(1, min(100, (int) $request->query('page', 1)));
        $uploadHash = preg_replace('/[^a-f0-9]/', '', strtolower((string) $request->query('uploadHash', ''))) ?? '';
        $imageId = trim((string) $request->query('imageId', ''));

        if ($uploadHash !== '') {
            $cachedUploadPage = $this->cache->get(sprintf('upload_search:%s:%s:%d', $this->adobeClient->mode(), $uploadHash, $page));
            if (is_array($cachedUploadPage)) {
                $cachedUploadPage['cached'] = true;
                Response::json($cachedUploadPage);
            }

            $meta = $this->cache->get(sprintf('upload_meta:%s:%s', $this->adobeClient->mode(), $uploadHash));
            if (!is_array($meta)) {
                Response::error('Uploaded image session expired. Please upload the reference image again.', 404, 'UPLOAD_EXPIRED');
            }

            $raw = !empty($meta['topMatchId']) && $this->adobeClient->mode() === 'official'
                ? $this->adobeClient->similarByImageId((string) $meta['topMatchId'], $page)
                : $this->adobeClient->similarByUploadedImage([
                    'fileName' => (string) ($meta['fileName'] ?? 'reference.jpg'),
                    'mimeType' => (string) ($meta['mimeType'] ?? 'image/jpeg'),
                    'sha256' => $uploadHash,
                    'width' => (int) ($meta['width'] ?? 800),
                    'height' => (int) ($meta['height'] ?? 600),
                    'tmpPath' => '',
                ], $page);

            $summaryQuery = (string) ($raw['query'] ?? 'Visual Upload Match');
            $payload = $this->catalogQuery->buildEnrichedPayload(
                $raw,
                $this->adobeClient->mode(),
                $summaryQuery,
                $page,
                extra: [
                    'source' => 'upload',
                    'uploadHash' => $uploadHash,
                    'uploadMeta' => array_merge($meta, ['matchedSignals' => $raw['matchedSignals'] ?? ($meta['matchedSignals'] ?? [])]),
                ]
            );

            $this->cache->set(sprintf('upload_search:%s:%s:%d', $this->adobeClient->mode(), $uploadHash, $page), $payload, self::SIMILAR_TTL_SECONDS);
            Response::json($payload);
        }

        if ($imageId === '' || !preg_match('/^[a-zA-Z0-9_-]{3,40}$/', $imageId)) {
            Response::error('Please provide a valid Adobe Stock Asset ID.', 400, 'INVALID_IMAGE_ID');
        }

        $cacheKey = sprintf('similar:%s:%s:%d', $this->adobeClient->mode(), $imageId, $page);
        $cachedPayload = $this->cache->get($cacheKey);
        if (is_array($cachedPayload)) {
            $cachedPayload['cached'] = true;
            Response::json($cachedPayload);
        }

        $raw = $this->adobeClient->similarByImageId($imageId, $page);
        $referenceAsset = is_array($raw['referenceAsset'] ?? null)
            ? $this->enrichment->enrichSingle($raw['referenceAsset'])
            : null;

        $payload = $this->catalogQuery->buildEnrichedPayload(
            $raw,
            $this->adobeClient->mode(),
            "Similar to #{$imageId}",
            $page,
            extra: [
                'source' => 'imageId',
                'imageId' => $imageId,
                'referenceAsset' => $referenceAsset,
            ]
        );

        $this->cache->set($cacheKey, $payload, self::SIMILAR_TTL_SECONDS);
        Response::json($payload);
    }

    public function uploadSearch(Request $request): never
    {
        $file = $request->file('image');
        if ($file === null || $file['error'] === UPLOAD_ERR_NO_FILE) {
            Response::error('Please choose a PNG, JPG, GIF, or WebP image file.', 400, 'MISSING_FILE');
        }

        if ($file['error'] === UPLOAD_ERR_INI_SIZE || $file['error'] === UPLOAD_ERR_FORM_SIZE || $file['size'] > self::MAX_UPLOAD_BYTES) {
            Response::error('Reference image exceeds the 10 MB upload limit.', 413, 'FILE_TOO_LARGE');
        }

        if ($file['error'] !== UPLOAD_ERR_OK || $file['tmp_name'] === '' || !is_file($file['tmp_name']) || $file['size'] <= 0) {
            Response::error('Image upload failed to complete cleanly.', 400, 'UPLOAD_FAILED');
        }

        $detectedMime = $this->detectTrustedImageMime($file['tmp_name']);
        $imageInfo = @getimagesize($file['tmp_name']);
        if ($detectedMime === null || !in_array($detectedMime, self::ALLOWED_MIME_TYPES, true) || $imageInfo === false) {
            Response::error('Only valid JPG, PNG, GIF, or WebP raster images are accepted.', 415, 'UNSUPPORTED_MEDIA_TYPE');
        }

        $page = max(1, min(100, (int) $request->query('page', 1)));
        $sha256 = hash_file('sha256', $file['tmp_name']) ?: hash('sha256', $file['name'] . $file['size']);
        $cacheKey = sprintf('upload_search:%s:%s:%d', $this->adobeClient->mode(), $sha256, $page);

        $cachedPayload = $this->cache->get($cacheKey);
        if (is_array($cachedPayload)) {
            $cachedPayload['cached'] = true;
            Response::json($cachedPayload);
        }

        $width = (int) ($imageInfo[0] ?? 800);
        $height = (int) ($imageInfo[1] ?? 600);
        $safeName = preg_replace('/[^a-zA-Z0-9._-]/', '_', basename($file['name'])) ?: 'reference.jpg';

        $raw = $this->adobeClient->similarByUploadedImage([
            'fileName' => $safeName,
            'mimeType' => $detectedMime,
            'sha256' => $sha256,
            'width' => $width,
            'height' => $height,
            'tmpPath' => $file['tmp_name'],
        ], $page);

        $uploadMeta = [
            'fileName' => $safeName,
            'mimeType' => $detectedMime,
            'sizeBytes' => $file['size'],
            'width' => $width,
            'height' => $height,
            'sha256' => $sha256,
            'topMatchId' => $raw['assets'][0]['id'] ?? '',
            'matchedSignals' => $raw['matchedSignals'] ?? [],
        ];

        $this->cache->set(sprintf('upload_meta:%s:%s', $this->adobeClient->mode(), $sha256), $uploadMeta, self::SIMILAR_TTL_SECONDS);

        $payload = $this->catalogQuery->buildEnrichedPayload(
            $raw,
            $this->adobeClient->mode(),
            (string) ($raw['query'] ?? 'Visual Upload Match'),
            $page,
            extra: [
                'source' => 'upload',
                'uploadHash' => $sha256,
                'uploadMeta' => $uploadMeta,
            ]
        );

        $this->cache->set($cacheKey, $payload, self::SIMILAR_TTL_SECONDS);
        Response::json($payload);
    }

    private function detectTrustedImageMime(string $path): ?string
    {
        if (class_exists(\finfo::class)) {
            $finfo = new \finfo(FILEINFO_MIME_TYPE);
            $mime = $finfo->file($path);
            if (is_string($mime) && $mime !== '') {
                return strtolower(trim($mime));
            }
        }

        $info = @getimagesize($path);
        return is_array($info) && isset($info['mime']) ? strtolower((string) $info['mime']) : null;
    }
}
