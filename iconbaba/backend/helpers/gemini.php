<?php
// backend/helpers/gemini.php
// AI-powered SEO Tag & Visual Mismatch Inspector for IconBaba using Google Gemini API

if (!function_exists('loadIconbabaEnv')) {
    function loadIconbabaEnv() {
        $possiblePaths = [
            __DIR__ . '/../.env',
            __DIR__ . '/../../.env',
            __DIR__ . '/.env',
            isset($_SERVER['DOCUMENT_ROOT']) ? rtrim($_SERVER['DOCUMENT_ROOT'], '/') . '/.env' : null,
            isset($_SERVER['DOCUMENT_ROOT']) ? rtrim($_SERVER['DOCUMENT_ROOT'], '/') . '/backend/.env' : null,
        ];

        foreach ($possiblePaths as $path) {
            if ($path && file_exists($path) && is_readable($path)) {
                $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                foreach ($lines as $line) {
                    $line = trim($line);
                    if ($line === '' || strpos($line, '#') === 0) {
                        continue;
                    }
                    $parts = explode('=', $line, 2);
                    if (count($parts) === 2) {
                        $key = trim($parts[0]);
                        $val = trim($parts[1]);
                        if ((substr($val, 0, 1) === '"' && substr($val, -1) === '"') ||
                            (substr($val, 0, 1) === "'" && substr($val, -1) === "'")) {
                            $val = substr($val, 1, -1);
                        }
                        if (!empty($key)) {
                            putenv("{$key}={$val}");
                            $_ENV[$key] = $val;
                            $_SERVER[$key] = $val;
                        }
                    }
                }
                break;
            }
        }
    }
    loadIconbabaEnv();
}

$geminiKey = getenv('GEMINI_API_KEY') ?: ($_ENV['GEMINI_API_KEY'] ?? '');
$geminiModel = getenv('GEMINI_MODEL') ?: ($_ENV['GEMINI_MODEL'] ?? 'gemini-2.5-flash');

if (!defined('GEMINI_API_KEY')) {
    define('GEMINI_API_KEY', $geminiKey);
}
if (!defined('GEMINI_MODEL')) {
    define('GEMINI_MODEL', $geminiModel);
}

/**
 * Generates SEO-optimized tags for a batch of icon names using Google Gemini.
 */
function generateGeminiTags(array $icons, int $keywordLimit = 12): array {
    $apiKey = GEMINI_API_KEY;
    if (empty($apiKey) || empty($icons)) {
        return [];
    }

    $limit = max(4, min(25, $keywordLimit));
    
    // Prepare prompt items
    $itemsList = [];
    foreach ($icons as $item) {
        $id = (string)($item['id'] ?? '');
        $name = trim($item['name'] ?? '');
        $category = trim($item['category'] ?? 'General');
        if (!empty($name)) {
            $itemsList[] = [
                'id' => $id,
                'name' => $name,
                'category' => $category
            ];
        }
    }

    if (empty($itemsList)) {
        return [];
    }

    $sampleKeywords = array_map(function($i) { return "tag{$i}"; }, range(1, $limit));
    $sampleKeywordsJson = json_encode($sampleKeywords);

    $prompt = "You are a World-Class SEO Specialist and UI Icon Taxonomy Expert for IconBaba.
MANDATORY REQUIREMENT: For EVERY icon in the provided JSON input list, generate EXACTLY {$limit} unique, high-ranking, search-intent keywords and tags in lowercase English.
Include:
1. Primary synonyms and alternative names
2. Category and domain context (UI, web, app, graphic, design)
3. Visual shape and style descriptors (form, symbol, sign, glyph, element, pattern)
4. Functional use cases and action terms

Format MUST be valid JSON only matching this schema without markdown fences:
{
  \"results\": [
    {
      \"id\": \"string id from input\",
      \"tags\": {$sampleKeywordsJson}
    }
  ]
}

Input icons:
" . json_encode($itemsList, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    $url = "https://generativelanguage.googleapis.com/v1beta/models/" . GEMINI_MODEL . ":generateContent?key=" . $apiKey;

    $postData = [
        'contents' => [
            [
                'parts' => [
                    ['text' => $prompt]
                ]
            ]
        ],
        'generationConfig' => [
            'temperature' => 0.3,
            'responseMimeType' => 'application/json'
        ]
    ];

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($postData),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Accept: application/json'
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 60,
        CURLOPT_CONNECTTIMEOUT => 15,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if ($curlErr || $httpCode >= 400 || empty($response)) {
        error_log("Gemini API error (HTTP {$httpCode}): {$curlErr} - Response: {$response}");
        return [];
    }

    $json = json_decode($response, true);
    $rawText = $json['candidates'][0]['content']['parts'][0]['text'] ?? '';
    if (empty($rawText)) {
        return [];
    }

    $parsed = json_decode($rawText, true);
    if (!isset($parsed['results']) || !is_array($parsed['results'])) {
        return [];
    }

    $finalTags = [];
    foreach ($parsed['results'] as $res) {
        $id = (string)($res['id'] ?? '');
        $tagList = $res['tags'] ?? [];
        if (!empty($id) && is_array($tagList)) {
            $cleaned = array_values(array_unique(array_filter(array_map('trim', $tagList))));
            $finalTags[$id] = implode(', ', array_slice($cleaned, 0, $limit));
        }
    }

    return $finalTags;
}

/**
 * Inspects SVG visuals vs provided icon names to detect mismatches and suggest correct real names/tags.
 *
 * @param array $icons Array of ['id' => string, 'name' => string, 'category' => string, 'svg' => string]
 * @param int $keywordLimit Number of keywords per icon
 * @return array Array of inspection results keyed by id
 */
function inspectGeminiVisuals(array $icons, int $keywordLimit = 8): array {
    $apiKey = GEMINI_API_KEY;
    if (empty($apiKey) || empty($icons)) {
        return [];
    }

    $limit = max(4, min(20, $keywordLimit));
    
    $itemsList = [];
    foreach ($icons as $item) {
        $id = (string)($item['id'] ?? '');
        $name = trim($item['name'] ?? '');
        $category = trim($item['category'] ?? 'General');
        $rawSvg = trim($item['svg'] ?? ($item['svg_outlined'] ?? ($item['svg_filled'] ?? '')));
        
        // Clean and compress SVG representation to conserve tokens
        $cleanSvg = preg_replace('/\s+/', ' ', $rawSvg);
        if (strlen($cleanSvg) > 2000) {
            $cleanSvg = substr($cleanSvg, 0, 2000) . '</svg>';
        }

        if (!empty($name) || !empty($cleanSvg)) {
            $itemsList[] = [
                'id' => $id,
                'name' => $name,
                'category' => $category,
                'svg' => $cleanSvg
            ];
        }
    }

    if (empty($itemsList)) {
        return [];
    }

    $sampleKeywords = array_map(function($i) { return "tag{$i}"; }, range(1, $limit));
    $sampleKeywordsJson = json_encode($sampleKeywords);

    $prompt = "You are a Vector Art Inspection & UI Icon Taxonomy Expert for IconBaba.
For each icon in the provided JSON list, carefully analyze BOTH the provided name AND the actual visual drawing defined in the SVG code.
1. Identify what visual symbol/object is ACTUALLY drawn in the SVG.
2. Check if the provided name matches what is drawn. If the provided name is clearly wrong or misleading (e.g. name is 'user' or 'download' but the SVG code draws an 'arrow' or 'trash can' or 'heart'), set is_mismatch: true and provide the accurate suggested_name and reason.
3. If the provided name is accurate, set is_mismatch: false.
4. Generate {$limit} high-ranking SEO tags in lowercase English matching the ACTUAL VISUAL DRAWING in the SVG.

Format MUST be valid JSON only matching this schema without markdown:
{
  \"results\": [
    {
      \"id\": \"string id matching input\",
      \"is_mismatch\": false,
      \"detected_visual\": \"e.g. Arrow pointing right\",
      \"suggested_name\": \"e.g. Arrow Right\",
      \"suggested_category\": \"e.g. Navigation\",
      \"reason\": \"e.g. Name was 'User' but the SVG path forms a right-facing arrow.\",
      \"tags\": {$sampleKeywordsJson}
    }
  ]
}

Input icons:
" . json_encode($itemsList, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    $url = "https://generativelanguage.googleapis.com/v1beta/models/" . GEMINI_MODEL . ":generateContent?key=" . $apiKey;

    $postData = [
        'contents' => [
            [
                'parts' => [
                    ['text' => $prompt]
                ]
            ]
        ],
        'generationConfig' => [
            'temperature' => 0.2,
            'responseMimeType' => 'application/json'
        ]
    ];

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($postData),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Accept: application/json'
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 60,
        CURLOPT_CONNECTTIMEOUT => 15,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if ($curlErr || $httpCode >= 400 || empty($response)) {
        error_log("Gemini Visual Inspection error (HTTP {$httpCode}): {$curlErr} - Response: {$response}");
        return [];
    }

    $json = json_decode($response, true);
    $rawText = $json['candidates'][0]['content']['parts'][0]['text'] ?? '';
    if (empty($rawText)) {
        return [];
    }

    $parsed = json_decode($rawText, true);
    if (!isset($parsed['results']) || !is_array($parsed['results'])) {
        return [];
    }

    $finalResults = [];
    foreach ($parsed['results'] as $res) {
        $id = (string)($res['id'] ?? '');
        if (!empty($id)) {
            $tagList = $res['tags'] ?? [];
            $cleanedTags = is_array($tagList) ? array_values(array_unique(array_filter(array_map('trim', $tagList)))) : [];
            
            $finalResults[$id] = [
                'id' => $id,
                'is_mismatch' => (bool)($res['is_mismatch'] ?? false),
                'detected_visual' => (string)($res['detected_visual'] ?? ''),
                'suggested_name' => (string)($res['suggested_name'] ?? ''),
                'suggested_category' => (string)($res['suggested_category'] ?? ''),
                'reason' => (string)($res['reason'] ?? ''),
                'tags' => implode(', ', array_slice($cleanedTags, 0, $limit))
            ];
        }
    }

    return $finalResults;
}
