<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Cache;
use App\Core\Request;
use App\Core\Response;
use App\Services\AdobeClientInterface;
use App\Services\DemoAdobeClient;

/**
 * Serves batch image stats, SSRF-protected ftcdn.net image proxy, and demo preview SVG media.
 */
final class ProxyController
{
    private const MAX_PROXY_BYTES = 5242880; // 5MB
    private const STATS_TTL_SECONDS = 43200; // 12 hours

    public function __construct(
        private readonly AdobeClientInterface $adobeClient,
        private readonly Cache $cache
    ) {
    }

    public function batchStats(Request $request): never
    {
        $body = $request->json();
        $rawIds = $body['imageIds'] ?? null;

        if (!is_array($rawIds) || $rawIds === []) {
            Response::error('imageIds array is required.', 400, 'INVALID_INPUT');
        }

        $imageIds = array_values(array_slice(array_unique(array_map('strval', $rawIds)), 0, 100));
        $stats = [];
        $missingIds = [];

        foreach ($imageIds as $id) {
            $cached = $this->cache->get("asset_stats:{$id}");
            if (is_array($cached)) {
                $stats[$id] = $cached;
            } else {
                $missingIds[] = $id;
            }
        }

        if ($missingIds !== [] && $this->adobeClient instanceof DemoAdobeClient) {
            $fresh = $this->adobeClient->getBatchStats($missingIds);
            foreach ($fresh as $id => $entry) {
                $this->cache->set("asset_stats:{$id}", $entry, self::STATS_TTL_SECONDS);
                $stats[$id] = $entry;
            }
        }

        Response::json([
            'success' => true,
            'stats' => $stats,
        ]);
    }

    /**
     * Proxy Adobe Stock CDN assets (*.ftcdn.net HTTPS only) to prevent browser Canvas CORS tainting.
     */
    public function proxyImage(Request $request): never
    {
        $url = trim((string) $request->query('url', ''));
        if ($url === '') {
            Response::error('Query parameter url is required.', 400, 'MISSING_URL');
        }

        $parts = parse_url($url);
        if (!is_array($parts)) {
            Response::error('Malformed image URL.', 400, 'INVALID_URL');
        }

        $scheme = strtolower((string) ($parts['scheme'] ?? ''));
        $host = strtolower((string) ($parts['host'] ?? ''));

        if ($scheme !== 'https' || !$this->isAllowedHost($host)) {
            Response::error('Only https://*.ftcdn.net image URLs are allowed.', 403, 'FORBIDDEN_PROXY_HOST');
        }

        $ch = curl_init($url);
        if ($ch === false) {
            Response::error('Unable to initialize proxy request.', 500, 'PROXY_INIT_FAILED');
        }

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_MAXFILESIZE => self::MAX_PROXY_BYTES,
            CURLOPT_HTTPHEADER => ['Accept: image/*'],
        ]);

        $binary = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $contentType = (string) (curl_getinfo($ch, CURLINFO_CONTENT_TYPE) ?: 'image/jpeg');
        curl_close($ch);

        if ($binary === false || $status >= 400 || !str_starts_with(strtolower($contentType), 'image/')) {
            Response::error('Upstream image fetch failed.', 502, 'UPSTREAM_IMAGE_ERROR');
        }

        http_response_code(200);
        header("Content-Type: {$contentType}");
        header('Cache-Control: public, max-age=3600');
        echo $binary;
        exit;
    }

    /**
     * Render clean, deterministic SVG stock preview cards for local demo mode.
     *
     * @param array<string, string> $params
     */
    public function demoMedia(Request $request, array $params): never
    {
        $id = preg_replace('/[^0-9A-Za-z_-]/', '', $params['id'] ?? '0') ?: '0';
        $title = substr(trim((string) $request->query('title', 'StockAssetTrack Preview')), 0, 44);
        $type = substr(trim((string) $request->query('type', 'Photo')), 0, 16);
        $isAi = $request->query('ai', '0') === '1';

        $palettes = [
            ['#312e81', '#0e7490', '#818cf8'],
            ['#4c1d95', '#0f766e', '#22d3ee'],
            ['#1e1b4b', '#6d28d9', '#38bdf8'],
            ['#0f172a', '#4f46e5', '#06b6d4'],
            ['#3b0764', '#be185d', '#a855f7'],
        ];
        $palette = $palettes[abs((int) crc32($id)) % count($palettes)];

        $safeTitle = htmlspecialchars($title, ENT_XML1 | ENT_QUOTES, 'UTF-8');
        $safeType = htmlspecialchars(strtoupper($type), ENT_XML1 | ENT_QUOTES, 'UTF-8');
        $safeId = htmlspecialchars($id, ENT_XML1 | ENT_QUOTES, 'UTF-8');
        $aiBadge = $isAi
            ? '<rect x="650" y="28" width="120" height="32" rx="16" fill="#8b5cf6" fill-opacity="0.9"/><text x="710" y="49" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="700" fill="#ffffff">GEN AI</text>'
            : '';

        $svg = <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="540" viewBox="0 0 800 540">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{$palette[0]}"/>
      <stop offset="100%" stop-color="{$palette[1]}"/>
    </linearGradient>
    <radialGradient id="orb" cx="72%" cy="28%" r="55%">
      <stop offset="0%" stop-color="{$palette[2]}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="{$palette[2]}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="800" height="540" fill="url(#bg)"/>
  <rect width="800" height="540" fill="url(#orb)"/>
  <g stroke="#ffffff" stroke-opacity="0.08" stroke-width="1">
    <line x1="0" y1="135" x2="800" y2="135"/>
    <line x1="0" y1="270" x2="800" y2="270"/>
    <line x1="0" y1="405" x2="800" y2="405"/>
    <line x1="200" y1="0" x2="200" y2="540"/>
    <line x1="400" y1="0" x2="400" y2="540"/>
    <line x1="600" y1="0" x2="600" y2="540"/>
  </g>
  <circle cx="560" cy="240" r="120" fill="#ffffff" fill-opacity="0.09"/>
  <circle cx="220" cy="360" r="150" fill="{$palette[2]}" fill-opacity="0.16"/>
  <rect x="28" y="28" width="132" height="32" rx="16" fill="#0f172a" fill-opacity="0.65"/>
  <text x="94" y="49" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="700" fill="#e2e8f0">{$safeType}</text>
  {$aiBadge}
  <rect x="28" y="422" width="744" height="90" rx="14" fill="#020617" fill-opacity="0.6"/>
  <text x="48" y="458" font-family="Arial,sans-serif" font-size="22" font-weight="700" fill="#ffffff">{$safeTitle}</text>
  <text x="48" y="488" font-family="monospace" font-size="14" fill="#94a3b8">Asset ID #{$safeId} · StockAssetTrack Demo Preview</text>
</svg>
SVG;

        http_response_code(200);
        header('Content-Type: image/svg+xml; charset=utf-8');
        header('Cache-Control: public, max-age=86400');
        echo $svg;
        exit;
    }

    private function isAllowedHost(string $host): bool
    {
        if ($host === '' || filter_var($host, FILTER_VALIDATE_IP) !== false) {
            return false;
        }

        return $host === 'ftcdn.net' || str_ends_with($host, '.ftcdn.net');
    }
}
