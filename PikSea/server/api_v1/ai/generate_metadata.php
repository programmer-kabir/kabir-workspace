<?php

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/db_setup.php';

header("Content-Type: application/json; charset=UTF-8");

// Increase script execution time for AI image processing
set_time_limit(60);

try {
    ensureAiKeysTable($mysqli);

    // 1. Resolve Image to Base64
    $base64Data = null;
    $mimeType = 'image/jpeg';

    if (!empty($_FILES['image']['tmp_name'])) {
        $tmpPath = $_FILES['image']['tmp_name'];
        $fileBytes = file_get_contents($tmpPath);
        $base64Data = base64_encode($fileBytes);
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $tmpPath) ?: 'image/jpeg';
        finfo_close($finfo);
    } elseif (!empty($_FILES['preview_file']['tmp_name'])) {
        $tmpPath = $_FILES['preview_file']['tmp_name'];
        $fileBytes = file_get_contents($tmpPath);
        $base64Data = base64_encode($fileBytes);
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $tmpPath) ?: 'image/jpeg';
        finfo_close($finfo);
    } elseif (!empty($_POST['base64_image'])) {
        $rawBase64 = $_POST['base64_image'];
        if (preg_match('/^data:(image\/[a-zA-Z0-9\+\-\.]+);base64,(.*)$/', $rawBase64, $matches)) {
            $mimeType = $matches[1];
            $base64Data = $matches[2];
        } else {
            $base64Data = $rawBase64;
        }
    } elseif (!empty($_POST['content_id'])) {
        $contentId = (int) $_POST['content_id'];
        $stmt = $mysqli->prepare("SELECT preview_image, thumbnail_url, preview_600_url FROM contents WHERE id = ? LIMIT 1");
        $stmt->bind_param("i", $contentId);
        $stmt->execute();
        $res = $stmt->get_result();
        $row = $res->fetch_assoc();
        $stmt->close();

        if ($row) {
            $publicRoot = realpath(__DIR__ . '/../../');
            $possiblePaths = [
                $row['preview_600_url'],
                $row['thumbnail_url'],
                $row['preview_image']
            ];
            foreach ($possiblePaths as $rel) {
                if (!$rel) continue;
                $full = rtrim($publicRoot, '/') . '/' . ltrim($rel, '/');
                if (file_exists($full)) {
                    $fileBytes = file_get_contents($full);
                    $base64Data = base64_encode($fileBytes);
                    $finfo = finfo_open(FILEINFO_MIME_TYPE);
                    $mimeType = finfo_file($finfo, $full) ?: 'image/jpeg';
                    finfo_close($finfo);
                    break;
                }
            }
        }
    } elseif (!empty($_POST['preview_path'])) {
        $publicRoot = realpath(__DIR__ . '/../../');
        $rel = ltrim($_POST['preview_path'], '/');
        $full = rtrim($publicRoot, '/') . '/' . $rel;
        if (file_exists($full)) {
            $fileBytes = file_get_contents($full);
            $base64Data = base64_encode($fileBytes);
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $full) ?: 'image/jpeg';
            finfo_close($finfo);
        }
    }

    if (!$base64Data) {
        throw new Exception("No valid image provided for AI metadata generation.");
    }

    // 2. Fetch Active Categories for Category Matching
    $catRes = $mysqli->query("
        SELECT id, name, parent_id 
        FROM categories 
        ORDER BY CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END, id ASC
    ");
    $allCats = [];
    $parents = [];
    $children = [];
    if ($catRes) {
        while ($c = $catRes->fetch_assoc()) {
            $allCats[$c['id']] = $c;
            if ($c['parent_id'] === null || $c['parent_id'] === 'NULL' || $c['parent_id'] == 0) {
                $parents[] = ['id' => $c['id'], 'name' => $c['name']];
            } else {
                $children[] = ['id' => $c['id'], 'name' => $c['name'], 'parent_id' => $c['parent_id']];
            }
        }
    }
    $categoriesContext = json_encode(['main_categories' => $parents, 'subcategories' => $children], JSON_UNESCAPED_UNICODE);

    // 3. Fetch Available Active API Keys (Ordered by least used)
    $keyStmt = $mysqli->prepare("
        SELECT id, api_key, usage_count 
        FROM ai_api_keys 
        WHERE status = 'active' 
        ORDER BY usage_count ASC, id ASC
    ");
    $keyStmt->execute();
    $keyRes = $keyStmt->get_result();
    $activeKeys = [];
    while ($k = $keyRes->fetch_assoc()) {
        $activeKeys[] = $k;
    }
    $keyStmt->close();

    if (empty($activeKeys)) {
        // Fallback: Check if there is any key regardless of status
        $fallbackRes = $mysqli->query("SELECT id, api_key, usage_count FROM ai_api_keys ORDER BY id ASC LIMIT 1");
        if ($fallbackRes && $fk = $fallbackRes->fetch_assoc()) {
            $activeKeys[] = $fk;
        } else {
            throw new Exception("No active AI API key found in the database. Please add a Gemini API key in Settings.");
        }
    }

    // 4. Construct Strict Gemini Prompt
    $systemInstruction = "You are a professional stock media metadata specialist for PikSea (a high-end marketplace like Freepik/Shutterstock/Envato). Analyze the provided image thoroughly and output strictly a JSON object with:
1. 'title': A high-performing SEO stock title describing the image accurately. Must be between 60 and 120 characters. Do NOT use quotes, brackets, or generic filler words.
2. 'description': A detailed, commercial description of the visual elements, style, lighting, color palette, and usage contexts. Must be between 120 and 250 characters.
3. 'tags': Exactly between 45 and 49 highly relevant, search-optimized keywords separated by commas. All tags must be lowercase, single words or short 2-word phrases. No duplicates, no numbers, no hashtags. Exactly 45 to 49 tags.
4. 'category_id': The ID of the best matching main category from this list: {$categoriesContext}.
5. 'subcategory_id': The ID of the best matching subcategory from this list (or null if none fits): {$categoriesContext}.
6. 'content_type': 'vector' | 'photo' | 'png' | 'video'.

Return ONLY valid JSON adhering to this exact schema:
{
  \"title\": \"string\",
  \"description\": \"string\",
  \"tags\": [\"string\", \"string\", ...],
  \"category_id\": number,
  \"subcategory_id\": number or null,
  \"content_type\": \"string\"
}";

    $payload = [
        "system_instruction" => [
            "parts" => [
                ["text" => $systemInstruction]
            ]
        ],
        "contents" => [
            [
                "parts" => [
                    [
                        "text" => "Generate stock media metadata for this image following all strict rules."
                    ],
                    [
                        "inline_data" => [
                            "mime_type" => $mimeType,
                            "data" => $base64Data
                        ]
                    ]
                ]
            ]
        ],
        "generationConfig" => [
            "response_mime_type" => "application/json",
            "temperature" => 0.3,
            "maxOutputTokens" => 2048
        ]
    ];

    // 5. Try Gemini API with Automatic Failover / Key Rotation
    $successResult = null;
    $winningKeyId = null;
    $lastErrorMsg = "";

    $modelsToTry = [
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
        'gemini-3-flash-preview'
    ];

    foreach ($activeKeys as $keyObj) {
        $apiKey = $keyObj['api_key'];
        $keyId = $keyObj['id'];

        foreach ($modelsToTry as $modelName) {
            $geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/" . urlencode($modelName) . ":generateContent?key=" . urlencode($apiKey);

            $ch = curl_init($geminiUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                "Content-Type: application/json"
            ]);
            curl_setopt($ch, CURLOPT_TIMEOUT, 25);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

            $responseRaw = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = curl_error($ch);
            curl_close($ch);

            if ($httpCode === 200 && $responseRaw) {
                $jsonDecoded = json_decode($responseRaw, true);
                $candidateText = $jsonDecoded['candidates'][0]['content']['parts'][0]['text'] ?? '';
                $parsedData = json_decode($candidateText, true);

                if ($parsedData && !empty($parsedData['title'])) {
                    $successResult = $parsedData;
                    $winningKeyId = $keyId;
                    break 2; // Successfully generated!
                }
            } else {
                $errResponse = json_decode($responseRaw, true);
                $errMsg = $errResponse['error']['message'] ?? ($curlError ?: "HTTP Code $httpCode");
                $lastErrorMsg = $errMsg;

                // If 404 (model not found), try next model in list
                if ($httpCode === 404) {
                    continue;
                }

                // If quota exhausted or rate limit hit, mark this key as rate_limited and try next key
                if ($httpCode === 429 || strpos(strtolower($errMsg), 'quota') !== false) {
                    $mysqli->query("UPDATE ai_api_keys SET status = 'rate_limited' WHERE id = $keyId");
                    break; // Skip to next key
                }
            }
        }
    }

    if (!$successResult) {
        throw new Exception("AI Generation failed across all keys. Last error: " . $lastErrorMsg);
    }

    // 6. Enforce Formatting & Post-Processing Rules
    $title = trim($successResult['title'] ?? '');
    // Clean unwanted quotes or prefix
    $title = preg_replace('/^["\']|["\']$/', '', $title);
    if (strlen($title) < 50) {
        $title = $title . " - High Quality Creative Stock Asset";
    }
    if (strlen($title) > 180) {
        $title = substr($title, 0, 175) . '...';
    }

    $description = trim($successResult['description'] ?? '');
    $description = preg_replace('/^["\']|["\']$/', '', $description);
    if (strlen($description) < 100) {
        $description = $description . " Perfect for commercial design, web projects, social media, marketing campaigns and print media.";
    }
    if (strlen($description) > 350) {
        $description = substr($description, 0, 345) . '...';
    }

    // Process Tags: Exactly 45 to 49 tags
    $rawTags = $successResult['tags'] ?? [];
    if (is_string($rawTags)) {
        $rawTags = explode(',', $rawTags);
    }
    $cleanTags = [];
    foreach ($rawTags as $t) {
        $t = strtolower(trim(preg_replace('/[^a-zA-Z0-9\s\-]/', '', $t)));
        if (strlen($t) >= 2 && !in_array($t, $cleanTags)) {
            $cleanTags[] = $t;
        }
    }

    // Default backup stock keywords if Gemini generated fewer than 45
    $fallbackKeywords = [
        'stock', 'vector', 'illustration', 'graphic', 'design', 'creative', 'digital', 'background',
        'modern', 'art', 'template', 'concept', 'abstract', 'isolated', 'element', 'banner',
        'visual', 'icon', 'symbol', 'style', 'trendy', 'clean', 'professional', 'commercial',
        'artwork', 'clipart', 'layout', 'wallpaper', 'media', 'creative art', 'asset', 'download',
        'marketing', 'branding', 'presentation', 'hd', 'decorative', 'vibrant', 'decorative art',
        'elegant', 'smooth', 'bright', 'flat design', 'minimalist', 'poster', 'print', 'composition'
    ];

    foreach ($fallbackKeywords as $fk) {
        if (count($cleanTags) >= 48) break;
        if (!in_array($fk, $cleanTags)) {
            $cleanTags[] = $fk;
        }
    }

    // Clamp strictly between 45 and 49
    if (count($cleanTags) > 49) {
        $cleanTags = array_slice($cleanTags, 0, 48);
    }

    $tagsString = implode(', ', $cleanTags);

    $catId = !empty($successResult['category_id']) ? (int) $successResult['category_id'] : null;
    $subcatId = !empty($successResult['subcategory_id']) ? (int) $successResult['subcategory_id'] : null;
    $contentType = !empty($successResult['content_type']) ? strtolower(trim($successResult['content_type'])) : 'vector';
    if (!in_array($contentType, ['vector', 'photo', 'png', 'video'])) {
        $contentType = 'vector';
    }

    // 7. Update usage count for the winning key
    if ($winningKeyId) {
        $mysqli->query("UPDATE ai_api_keys SET usage_count = usage_count + 1, last_used_at = NOW(), status = 'active' WHERE id = $winningKeyId");
    }

    echo json_encode([
        "success" => true,
        "data" => [
            "title" => $title,
            "description" => $description,
            "tags" => $tagsString,
            "tags_count" => count($cleanTags),
            "category_id" => $catId,
            "subcategory_id" => $subcatId,
            "content_type" => $contentType,
            "used_key_id" => $winningKeyId
        ]
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
