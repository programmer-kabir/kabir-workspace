<?php
// backend/helpers/gemini.php
// AI-powered SEO Tag, Auto-Categorization & Visual Mismatch Inspector for IconBaba using Google Gemini API
// Features Dynamic Multi-Model Fallback Engine, Database Settings, and Auto-Category Creation

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

if (!defined('GEMINI_API_KEY')) {
    define('GEMINI_API_KEY', $geminiKey);
}

/**
 * Ordered list of Gemini models for automatic fallback.
 */
function getGeminiModelsChain(): array {
    return [
        'gemini-3.1-flash-lite',
        'gemini-3.1-pro-preview',
        'gemini-3.1-flash-image',
        'gemini-3.1-flash-lite-preview',
        'gemini-3.5-flash',
        'gemini-3.7-flash',
        'gemini-3.8-flash',
        'gemini-2.5-flash',
        'gemini-2.5-pro',
        'gemini-flash-latest',
        'gemini-pro-latest',
        'gemini-2.5-flash-lite',
        'gemini-3-flash-preview',
        'gemini-1.5-flash',
        'gemini-1.5-pro'
    ];
}

/**
 * Retrieves a system setting from database with fallback.
 */
function getSystemSetting(?PDO $pdo, string $key, string $default = ''): string {
    if ($pdo instanceof PDO) {
        try {
            $stmt = $pdo->prepare("SELECT `setting_value` FROM `system_settings` WHERE `setting_key` = :key LIMIT 1");
            $stmt->execute([':key' => $key]);
            $val = $stmt->fetchColumn();
            if ($val !== false && $val !== null && trim((string)$val) !== '') {
                return trim((string)$val);
            }
        } catch (Exception $e) {
            // Fallback
        }
    }
    return $default;
}

/**
 * Resolves active Gemini API Key:
 * 1. Custom request key if provided
 * 2. Database system_settings (gemini_api_key)
 * 3. Environment variable (GEMINI_API_KEY from .env)
 */
function getActiveGeminiApiKey(?PDO $pdo = null, ?string $customApiKey = null): string {
    $resolvedKey = trim((string)$customApiKey);
    if (empty($resolvedKey)) {
        $resolvedKey = getSystemSetting($pdo, 'gemini_api_key', GEMINI_API_KEY);
    }
    return $resolvedKey;
}

/**
 * Backward-compatible helper for legacy callers.
 */
function getGeminiConfig(?PDO $pdo = null, ?string $customApiKey = null, ?string $customModel = null): array {
    return [
        'apiKey' => getActiveGeminiApiKey($pdo, $customApiKey),
        'model' => $customModel ?: 'gemini-2.5-flash'
    ];
}

/**
 * Gets list of available system categories.
 */
function getAvailableCategoryNames(?PDO $pdo = null): array {
    if ($pdo instanceof PDO) {
        try {
            $stmt = $pdo->query("SELECT name FROM categories WHERE status = 'active' ORDER BY display_order ASC, name ASC");
            $cats = $stmt->fetchAll(PDO::FETCH_COLUMN);
            if (!empty($cats)) return $cats;
        } catch (Exception $e) {}
    }
    return [
        'Animals', 'Arrows', 'Badges', 'Brand', 'Buildings', 'Charts', 'Communication', 'Computers',
        'Currencies', 'Database', 'Design', 'Development', 'Devices', 'Document', 'E-commerce',
        'Electrical', 'Extensions', 'Food', 'Games', 'Gender', 'Gestures', 'Health', 'Laundry',
        'Letters', 'Logic', 'Map', 'Math', 'Media', 'Misc', 'Mood', 'Nature', 'Numbers',
        'Photography', 'Shapes', 'Sport', 'Symbols', 'System', 'Text', 'Vehicles', 'Version control',
        'Weather', 'Zodiac'
    ];
}

/**
 * Finds existing category or automatically creates a new one in the database.
 * Returns array: ['id' => int, 'name' => string, 'slug' => string, 'is_new' => bool]
 */
function findOrCreateCategory(?PDO $pdo, string $rawCategoryName): array {
    $cleanName = trim(preg_replace('/\s+/', ' ', ucwords(strtolower(trim($rawCategoryName)))));
    if (empty($cleanName)) {
        $cleanName = 'General';
    }

    if (!($pdo instanceof PDO)) {
        return ['id' => 1, 'name' => $cleanName, 'slug' => strtolower($cleanName), 'is_new' => false];
    }

    try {
        // 1. Check existing by name (case-insensitive) or slug
        $slug = strtolower(trim(preg_replace('/[^a-zA-Z0-9]+/', '-', $cleanName), '-'));
        if (empty($slug)) {
            $slug = 'category-' . substr(md5($cleanName), 0, 6);
        }

        $stmt = $pdo->prepare("SELECT id, name, slug FROM categories WHERE LOWER(name) = LOWER(:name) OR slug = :slug LIMIT 1");
        $stmt->execute([':name' => $cleanName, ':slug' => $slug]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            return [
                'id' => (int)$row['id'],
                'name' => $row['name'],
                'slug' => $row['slug'],
                'is_new' => false
            ];
        }

        // 2. Not found: calculate next display_order and insert new category
        $orderStmt = $pdo->query("SELECT COALESCE(MAX(display_order), 0) + 1 FROM categories");
        $nextOrder = (int)$orderStmt->fetchColumn();

        $insertStmt = $pdo->prepare("
            INSERT INTO categories (name, slug, display_order, status, icon_count)
            VALUES (:name, :slug, :order, 'active', 0)
        ");
        $insertStmt->execute([
            ':name' => $cleanName,
            ':slug' => $slug,
            ':order' => $nextOrder
        ]);

        $newId = (int)$pdo->lastInsertId();

        return [
            'id' => $newId,
            'name' => $cleanName,
            'slug' => $slug,
            'is_new' => true
        ];

    } catch (Exception $e) {
        error_log("findOrCreateCategory error: " . $e->getMessage());
        return ['id' => 1, 'name' => $cleanName, 'slug' => 'general', 'is_new' => false];
    }
}

/**
 * Generates SEO-optimized tags AND Category for a batch of icons.
 * Automatically cascades through $modelsToTry until successful response.
 * Auto-creates new categories dynamically if a new category is identified.
 */
function generateGeminiTags(
    array $icons, 
    int $keywordLimit = 8, 
    ?string $overrideKey = null, 
    ?string $overrideModel = null, 
    ?PDO $pdo = null
): array {
    $apiKey = getActiveGeminiApiKey($pdo, $overrideKey);

    if (empty($apiKey) || empty($icons)) {
        return [
            'tags' => [],
            'categories' => [],
            'category_ids' => [],
            'created_categories' => []
        ];
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
        return [
            'tags' => [],
            'categories' => [],
            'category_ids' => [],
            'created_categories' => []
        ];
    }

    $allowedCats = getAvailableCategoryNames($pdo);
    $allowedCatsStr = implode(', ', $allowedCats);

    $sampleKeywords = array_map(function($i) { return "tag{$i}"; }, range(1, $limit));
    $sampleKeywordsJson = json_encode($sampleKeywords);

    $prompt = "You are a World-Class SEO Specialist and UI Icon Taxonomy Expert for IconBaba.
MANDATORY REQUIREMENTS for EVERY icon in the JSON input list:
1. Categorization:
   - Primary: Select the single most accurate matching category from this existing list: [{$allowedCatsStr}].
   - If (and only if) the icon clearly belongs to a distinct new domain (e.g. Astronomy, Blockchain, Real Estate, Agriculture) that does NOT fit well in the list, provide a concise, clean Title Case new category name (1-2 words).
2. Generate EXACTLY {$limit} unique, high-ranking, search-intent keywords and tags in lowercase English (synonyms, shape descriptors, functional use cases, context terms).

Format MUST be valid JSON only matching this schema without markdown fences:
{
  \"results\": [
    {
      \"id\": \"string id from input\",
      \"category\": \"Category name (from list or new clean name)\",
      \"tags\": {$sampleKeywordsJson}
    }
  ]
}

Input icons:
" . json_encode($itemsList, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

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
    $jsonPostData = json_encode($postData);

    $models = !empty($overrideModel) ? [$overrideModel] : getGeminiModelsChain();

    // Cascade through models
    foreach ($models as $model) {
        $url = "https://generativelanguage.googleapis.com/v1beta/models/" . urlencode($model) . ":generateContent?key=" . $apiKey;

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $jsonPostData,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Accept: application/json'
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr = curl_error($ch);
        curl_close($ch);

        if ($curlErr || $httpCode >= 400 || empty($response)) {
            error_log("Gemini model {$model} failed (HTTP {$httpCode}). Trying next model in chain...");
            continue;
        }

        $json = json_decode($response, true);
        $rawText = $json['candidates'][0]['content']['parts'][0]['text'] ?? '';
        if (empty($rawText)) {
            continue;
        }

        $parsed = json_decode($rawText, true);
        if (!isset($parsed['results']) || !is_array($parsed['results'])) {
            continue;
        }

        $finalTags = [];
        $finalCategories = [];
        $finalCategoryIds = [];
        $createdCategoriesMap = [];

        foreach ($parsed['results'] as $res) {
            $id = (string)($res['id'] ?? '');
            $tagList = $res['tags'] ?? [];
            $rawCat = trim((string)($res['category'] ?? ''));

            if (!empty($id)) {
                if (is_array($tagList)) {
                    $cleaned = array_values(array_unique(array_filter(array_map('trim', $tagList))));
                    $finalTags[$id] = implode(', ', array_slice($cleaned, 0, $limit));
                }

                if (!empty($rawCat)) {
                    $catResult = findOrCreateCategory($pdo, $rawCat);
                    $finalCategories[$id] = $catResult['name'];
                    $finalCategoryIds[$id] = $catResult['id'];
                    if ($catResult['is_new']) {
                        $createdCategoriesMap[$catResult['id']] = [
                            'id' => $catResult['id'],
                            'name' => $catResult['name'],
                            'slug' => $catResult['slug']
                        ];
                    }
                }
            }
        }

        if (!empty($finalTags)) {
            return [
                'tags' => $finalTags,
                'categories' => $finalCategories,
                'category_ids' => $finalCategoryIds,
                'created_categories' => array_values($createdCategoriesMap)
            ];
        }
    }

    return [
        'tags' => [],
        'categories' => [],
        'category_ids' => [],
        'created_categories' => []
    ];
}

/**
 * Inspects SVG visuals vs provided icon names to detect mismatches.
 * Cascades automatically through $modelsToTry and supports auto-category creation.
 */
function inspectGeminiVisuals(
    array $icons, 
    int $keywordLimit = 8, 
    ?string $overrideKey = null, 
    ?string $overrideModel = null, 
    ?PDO $pdo = null
): array {
    $apiKey = getActiveGeminiApiKey($pdo, $overrideKey);

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

    $allowedCats = getAvailableCategoryNames($pdo);
    $allowedCatsStr = implode(', ', $allowedCats);

    $sampleKeywords = array_map(function($i) { return "tag{$i}"; }, range(1, $limit));
    $sampleKeywordsJson = json_encode($sampleKeywords);

    $prompt = "You are a Vector Art Inspection & UI Icon Taxonomy Expert for IconBaba.
For each icon in the provided JSON list, carefully analyze BOTH the provided name AND the actual visual drawing defined in the SVG code.
1. Identify what visual symbol/object is ACTUALLY drawn in the SVG.
2. Check if the provided name matches what is drawn. If the provided name is clearly wrong or misleading (e.g. name is 'user' or 'download' but the SVG code draws an 'arrow' or 'trash can' or 'heart'), set is_mismatch: true and provide the accurate suggested_name and reason.
3. If the provided name is accurate, set is_mismatch: false.
4. Select the best matching category from this list: [{$allowedCatsStr}] (or provide a new Title Case category if completely new domain).
5. Generate {$limit} high-ranking SEO tags in lowercase English matching the ACTUAL VISUAL DRAWING in the SVG.

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
    $jsonPostData = json_encode($postData);

    $models = !empty($overrideModel) ? [$overrideModel] : getGeminiModelsChain();

    foreach ($models as $model) {
        $url = "https://generativelanguage.googleapis.com/v1beta/models/" . urlencode($model) . ":generateContent?key=" . $apiKey;

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $jsonPostData,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Accept: application/json'
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 40,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr = curl_error($ch);
        curl_close($ch);

        if ($curlErr || $httpCode >= 400 || empty($response)) {
            error_log("Gemini Visual inspection model {$model} failed (HTTP {$httpCode}). Trying next model...");
            continue;
        }

        $json = json_decode($response, true);
        $rawText = $json['candidates'][0]['content']['parts'][0]['text'] ?? '';
        if (empty($rawText)) {
            continue;
        }

        $parsed = json_decode($rawText, true);
        if (!isset($parsed['results']) || !is_array($parsed['results'])) {
            continue;
        }

        $finalResults = [];
        foreach ($parsed['results'] as $res) {
            $id = (string)($res['id'] ?? '');
            if (!empty($id)) {
                $tagList = $res['tags'] ?? [];
                $cleanedTags = is_array($tagList) ? array_values(array_unique(array_filter(array_map('trim', $tagList)))) : [];
                $rawCat = trim((string)($res['suggested_category'] ?? ''));
                $catResult = !empty($rawCat) ? findOrCreateCategory($pdo, $rawCat) : ['id' => 1, 'name' => 'General'];
                
                $finalResults[$id] = [
                    'id' => $id,
                    'is_mismatch' => (bool)($res['is_mismatch'] ?? false),
                    'detected_visual' => (string)($res['detected_visual'] ?? ''),
                    'suggested_name' => (string)($res['suggested_name'] ?? ''),
                    'suggested_category' => $catResult['name'],
                    'suggested_category_id' => $catResult['id'],
                    'reason' => (string)($res['reason'] ?? ''),
                    'tags' => implode(', ', array_slice($cleanedTags, 0, $limit))
                ];
            }
        }

        if (!empty($finalResults)) {
            return $finalResults;
        }
    }

    return [];
}
