<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\PromptAiService;

/**
 * Handles AI Prompt Reverse Engineering requests (Midjourney v6, Flux 1.1 Pro & Stable Diffusion).
 */
final class AiController
{
    public function __construct(private readonly PromptAiService $promptAi)
    {
    }

    public function reconstruct(Request $request): never
    {
        $body = $request->json();
        $assetId = trim((string) ($body['assetId'] ?? ''));
        $imageUrl = trim((string) ($body['imageUrl'] ?? ''));
        $title = trim((string) ($body['title'] ?? ''));

        if ($assetId === '' && $imageUrl === '' && $title === '') {
            Response::error(
                'Provide an Asset ID, preview image URL, or concept title to reconstruct prompts.',
                400,
                'EMPTY_PROMPT_INPUT'
            );
        }

        if ($imageUrl !== '' && !$this->isSafeImageUrl($imageUrl)) {
            Response::error('Only valid HTTPS or local demo preview URLs are accepted.', 400, 'INVALID_IMAGE_URL');
        }

        $payload = $this->promptAi->reconstruct([
            'assetId' => $assetId,
            'imageUrl' => $imageUrl,
            'title' => $title,
            'stylePreset' => (string) ($body['stylePreset'] ?? 'Commercial Editorial'),
            'keywords' => is_array($body['keywords'] ?? null) ? $body['keywords'] : [],
        ]);

        Response::json($payload);
    }

    private function isSafeImageUrl(string $url): bool
    {
        $parts = parse_url($url);
        if (!is_array($parts)) {
            return false;
        }
        $scheme = strtolower((string) ($parts['scheme'] ?? ''));
        $host = strtolower((string) ($parts['host'] ?? ''));

        if ($host === 'localhost' || $host === '127.0.0.1') {
            return $scheme === 'http' || $scheme === 'https';
        }

        return $scheme === 'https' && $host !== '' && filter_var($host, FILTER_VALIDATE_IP) === false;
    }
}
