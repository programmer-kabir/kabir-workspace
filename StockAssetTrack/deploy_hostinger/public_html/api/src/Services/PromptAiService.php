<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Cache;

/**
 * Reverse-engineers winning stock assets into Midjourney v6, Flux 1.1 Pro, and Stable Diffusion prompts
 * using Gemini/OpenAI cURL APIs when configured, or rich deterministic analysis otherwise.
 */
final class PromptAiService
{
    private const CACHE_TTL_SECONDS = 86400; // 24 hours

    /**
     * @param array{geminiApiKey?: string, openaiApiKey?: string} $aiConfig
     */
    public function __construct(
        private readonly AdobeClientInterface $adobeClient,
        private readonly EnrichmentService $enrichment,
        private readonly Cache $cache,
        private readonly array $aiConfig
    ) {
    }

    /**
     * @param array{assetId?: string, imageUrl?: string, title?: string, stylePreset?: string, keywords?: string[]} $input
     * @return array<string, mixed>
     */
    public function reconstruct(array $input): array
    {
        $assetId = preg_replace('/[^a-zA-Z0-9_-]/', '', trim((string) ($input['assetId'] ?? ''))) ?: '';
        $imageUrl = trim((string) ($input['imageUrl'] ?? ''));
        $customTitle = trim((string) ($input['title'] ?? ''));
        $stylePreset = trim((string) ($input['stylePreset'] ?? 'Commercial Editorial')) ?: 'Commercial Editorial';
        $customKeywords = is_array($input['keywords'] ?? null)
            ? array_values(array_filter(array_map('strval', $input['keywords'])))
            : [];

        $referenceAsset = null;
        if ($assetId !== '') {
            $similar = $this->adobeClient->similarByImageId($assetId, 1);
            if (is_array($similar['referenceAsset'] ?? null)) {
                $referenceAsset = $this->enrichment->enrichSingle($similar['referenceAsset']);
            }
        }

        $subjectTitle = $customTitle !== ''
            ? $customTitle
            : ($referenceAsset['title'] ?? 'Minimalist High-Demand Commercial Studio Concept');
        $keywords = $customKeywords !== []
            ? $customKeywords
            : (array) ($referenceAsset['keywords'] ?? ['commercial', 'minimalist', 'studio lighting', 'high resolution']);
        $category = (string) ($referenceAsset['category'] ?? 'Commercial');
        $mediaType = (string) ($referenceAsset['mediaType'] ?? 'Photo');

        $fingerprint = hash('sha256', implode('|', [
            $this->adobeClient->mode(),
            $assetId,
            $imageUrl,
            strtolower($subjectTitle),
            strtolower($stylePreset),
            implode(',', $keywords),
        ]));

        $cacheKey = 'prompt_reconstruct:' . $fingerprint;
        $cached = $this->cache->get($cacheKey);
        if (is_array($cached)) {
            $cached['cached'] = true;
            return $cached;
        }

        $aiResult = null;
        $provider = 'local_heuristic';

        $geminiKey = trim((string) ($this->aiConfig['geminiApiKey'] ?? ''));
        $openaiKey = trim((string) ($this->aiConfig['openaiApiKey'] ?? ''));

        if ($geminiKey !== '') {
            $aiResult = $this->callGemini($geminiKey, $subjectTitle, $category, $mediaType, $stylePreset, $keywords);
            if ($aiResult !== null) {
                $provider = 'gemini_api';
            }
        } elseif ($openaiKey !== '') {
            $aiResult = $this->callOpenAi($openaiKey, $subjectTitle, $category, $mediaType, $stylePreset, $keywords);
            if ($aiResult !== null) {
                $provider = 'openai_api';
            }
        }

        if ($aiResult === null) {
            $aiResult = $this->compileHeuristicPrompts($subjectTitle, $category, $mediaType, $stylePreset, $keywords);
        }

        $payload = [
            'success' => true,
            'cached' => false,
            'mode' => $this->adobeClient->mode(),
            'provider' => $provider,
            'stylePreset' => $stylePreset,
            'referenceAsset' => $referenceAsset,
            'inputImageUrl' => $imageUrl !== '' ? $imageUrl : ($referenceAsset['preview1000Url'] ?? null),
            'visualBreakdown' => $aiResult['visualBreakdown'],
            'prompts' => $aiResult['prompts'],
            'suggestedTitle' => $aiResult['suggestedTitle'],
            'suggestedTags' => $aiResult['suggestedTags'],
        ];

        $this->cache->set($cacheKey, $payload, self::CACHE_TTL_SECONDS);
        return $payload;
    }

    /**
     * @param string[] $keywords
     * @return array<string, mixed>
     */
    private function compileHeuristicPrompts(
        string $title,
        string $category,
        string $mediaType,
        string $stylePreset,
        array $keywords
    ): array {
        $cleanSubject = preg_replace('/^(Reference\s+#\d+\s+[—-]\s+)/i', '', $title) ?: $title;
        $cleanSubject = trim((string) preg_replace('/#[0-9]+$/', '', $cleanSubject));
        $seed = abs((int) crc32(strtolower($cleanSubject . ':' . $stylePreset)));

        $lightingOptions = [
            'Soft diffused golden-hour key light with subtle rim separation and clean shadow gradient',
            'Crisp commercial three-point studio softbox lighting with balanced specular highlights',
            'Bright airy window-light atmosphere with natural bounce fill and high dynamic range',
            'Dramatic sculptural side-lighting against clean editorial backdrop with soft bokeh',
        ];
        $palettes = [
            'Warm neutral sand, brushed titanium, deep slate charcoal, and cyan-indigo micro accents',
            'Minimalist alabaster white, organic sage green, amber wood tones, and soft ivory',
            'High-contrast obsidian dark mode palette with luminous indigo and teal highlights',
            'Clean pastel sky blue, matte ceramic cream, soft terracotta, and natural sunlight warmth',
        ];
        $lenses = [
            '85mm f/2.8 prime commercial macro lens, razor-sharp focal plane, shallow natural depth',
            '50mm full-frame editorial lens, clean orthogonal lines, f/5.6 edge-to-edge clarity',
            '35mm architectural lifestyle framing, wide negative copy space on right third',
            'Isometric cinema render camera, Octane 3D physically-based materials, subsurface scattering',
        ];

        $composition = match (strtolower($mediaType)) {
            '3d' => 'Centered isometric 3D diorama floating with generous negative margin for overlay headline typography',
            'vector', 'illustration' => 'Balanced flat-modern editorial vector framing with crisp silhouette hierarchy and copy space',
            default => 'Rule-of-thirds commercial focal hero with unobstructed negative copy space for buyer headline placement',
        };

        $lighting = $lightingOptions[$seed % count($lightingOptions)];
        $palette = $palettes[($seed + 1) % count($palettes)];
        $lens = $lenses[($seed + 2) % count($lenses)];
        $topDescriptorTags = implode(', ', array_slice($keywords, 0, 6));

        $midjourney = sprintf(
            '%s, %s style, %s, %s, %s, %s, ultra-clean commercial stock asset aesthetics --ar 3:2 --v 6.1 --style raw --stylize 150 --no text, watermark, logo, signature, deformed hands, blurry artifacts',
            $cleanSubject,
            strtolower($stylePreset),
            strtolower($composition),
            strtolower($lighting),
            strtolower($palette),
            strtolower($lens)
        );

        $flux = sprintf(
            'A high-resolution %s %s artwork depicting %s for Adobe Stock commercial licensing. %s. Illuminated by %s. Color harmony features %s. Captured with %s, emphasizing authentic surface micro-textures, crisp edges, zero embedded text, and practical buyer copy space.',
            strtolower($category),
            strtolower($mediaType === 'Vector' ? 'editorial illustration' : $mediaType),
            $cleanSubject,
            $composition,
            strtolower($lighting),
            strtolower($palette),
            strtolower($lens)
        );

        $sdPositive = sprintf(
            '(masterpiece, commercial microstock quality:1.2), %s, %s, %s, %s, %s, (%s:1.1), clean negative space, sharp focus, 8k raw output',
            $cleanSubject,
            strtolower($stylePreset),
            strtolower($lighting),
            strtolower($palette),
            strtolower($lens),
            $topDescriptorTags ?: strtolower($category)
        );

        $sdNegative = 'text, watermark, signature, brand logo, lowres, jpeg artifacts, oversaturated hdr, distorted anatomy, messy clutter, cropped subject';

        $suggestedTags = array_values(array_slice(array_unique(array_merge(
            array_map('strtolower', $keywords),
            ['generative ai', 'ai generated', strtolower($category), strtolower($stylePreset), 'commercial', 'copy space', 'minimalist', 'high resolution', 'modern', 'editorial']
        )), 0, 28));

        return [
            'visualBreakdown' => [
                'subject' => $cleanSubject,
                'composition' => $composition,
                'lighting' => $lighting,
                'colorPalette' => $palette,
                'lensAndCamera' => $lens,
                'commercialAppeal' => "Optimized {$category} {$mediaType} staging with clean copy space for agency, SaaS, and editorial buyer layouts.",
            ],
            'prompts' => [
                'midjourneyV6' => $midjourney,
                'fluxPro' => $flux,
                'stableDiffusion' => $sdPositive,
                'negativePrompt' => $sdNegative,
            ],
            'suggestedTitle' => mb_substr("{$cleanSubject} — {$stylePreset} Commercial Concept", 0, 200),
            'suggestedTags' => $suggestedTags,
        ];
    }

    /**
     * @param string[] $keywords
     * @return array<string, mixed>|null
     */
    private function callGemini(string $apiKey, string $title, string $category, string $mediaType, string $stylePreset, array $keywords): ?array
    {
        $prompt = $this->buildStructuredLlmInstruction($title, $category, $mediaType, $stylePreset, $keywords);
        $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' . urlencode($apiKey);
        $raw = $this->postJson($url, [
            'contents' => [['parts' => [['text' => $prompt]]]],
            'generationConfig' => ['responseMimeType' => 'application/json'],
        ]);

        if (!is_array($raw)) {
            return null;
        }
        $text = $raw['candidates'][0]['content']['parts'][0]['text'] ?? null;
        return is_string($text) ? $this->parseAiJson($text) : null;
    }

    /**
     * @param string[] $keywords
     * @return array<string, mixed>|null
     */
    private function callOpenAi(string $apiKey, string $title, string $category, string $mediaType, string $stylePreset, array $keywords): ?array
    {
        $prompt = $this->buildStructuredLlmInstruction($title, $category, $mediaType, $stylePreset, $keywords);
        $raw = $this->postJson('https://api.openai.com/v1/chat/completions', [
            'model' => 'gpt-4o-mini',
            'response_format' => ['type' => 'json_object'],
            'messages' => [
                ['role' => 'system', 'content' => 'Return valid JSON only for microstock AI prompt engineering.'],
                ['role' => 'user', 'content' => $prompt],
            ],
        ], ["Authorization: Bearer {$apiKey}"]);

        if (!is_array($raw)) {
            return null;
        }
        $text = $raw['choices'][0]['message']['content'] ?? null;
        return is_string($text) ? $this->parseAiJson($text) : null;
    }

    /**
     * @param string[] $keywords
     */
    private function buildStructuredLlmInstruction(string $title, string $category, string $mediaType, string $stylePreset, array $keywords): string
    {
        $tagList = implode(', ', array_slice($keywords, 0, 15));
        return "Analyze this best-selling Adobe Stock asset ({$mediaType} in {$category}, title: '{$title}', style: '{$stylePreset}', tags: {$tagList}) and output JSON with keys: visualBreakdown ({subject, composition, lighting, colorPalette, lensAndCamera, commercialAppeal}), prompts ({midjourneyV6, fluxPro, stableDiffusion, negativePrompt}), suggestedTitle, suggestedTags (array of 20 lowercase tags).";
    }

    /**
     * @return array<string, mixed>|null
     */
    private function parseAiJson(string $text): ?array
    {
        $decoded = json_decode($text, true);
        if (!is_array($decoded) || !is_array($decoded['visualBreakdown'] ?? null) || !is_array($decoded['prompts'] ?? null)) {
            return null;
        }
        return $decoded;
    }

    /**
     * @param array<string, mixed> $body
     * @param string[] $extraHeaders
     * @return array<string, mixed>|null
     */
    private function postJson(string $url, array $body, array $extraHeaders = []): ?array
    {
        $ch = curl_init($url);
        if ($ch === false) {
            return null;
        }

        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_HTTPHEADER => array_merge(['Content-Type: application/json'], $extraHeaders),
            CURLOPT_POSTFIELDS => json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ]);

        $raw = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($raw === false || $status >= 400) {
            return null;
        }

        $decoded = json_decode((string) $raw, true);
        return is_array($decoded) ? $decoded : null;
    }
}
