<?php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';
require_once __DIR__ . '/../../../helpers/gemini.php';

// 1. Require Admin Authentication
$admin = requireAdmin($pdo);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, null, 'Method not allowed. Only POST requests are accepted.', 405);
}

// 2. Parse JSON Input
$data = getJsonInput();
$iconsList = $data['icons'] ?? [];
$limit = isset($data['limit']) ? (int)$data['limit'] : 8;
$customApiKey = isset($data['api_key']) ? trim((string)$data['api_key']) : null;
$customModel = isset($data['model']) ? trim((string)$data['model']) : null;

if (!is_array($iconsList) || empty($iconsList)) {
    jsonResponse(false, null, 'No icons provided. Expected an array of icons with name and category.', 400);
}

// Chunk icons into batches of 40 for optimal Gemini speed
$chunks = array_chunk($iconsList, 40);
$allGeneratedTags = [];
$allSuggestedCategories = [];
$allSuggestedCategoryIds = [];
$allCreatedCategories = [];

foreach ($chunks as $chunk) {
    $batchRes = generateGeminiTags($chunk, $limit, $customApiKey, $customModel, $pdo);
    
    if (isset($batchRes['tags']) && is_array($batchRes['tags'])) {
        foreach ($batchRes['tags'] as $k => $v) {
            $allGeneratedTags[$k] = $v;
        }
        if (isset($batchRes['categories']) && is_array($batchRes['categories'])) {
            foreach ($batchRes['categories'] as $k => $cat) {
                $allSuggestedCategories[$k] = $cat;
            }
        }
        if (isset($batchRes['category_ids']) && is_array($batchRes['category_ids'])) {
            foreach ($batchRes['category_ids'] as $k => $catId) {
                $allSuggestedCategoryIds[$k] = $catId;
            }
        }
        if (isset($batchRes['created_categories']) && is_array($batchRes['created_categories'])) {
            foreach ($batchRes['created_categories'] as $newCat) {
                $allCreatedCategories[$newCat['id']] = $newCat;
            }
        }
    } elseif (is_array($batchRes)) {
        foreach ($batchRes as $k => $v) {
            $allGeneratedTags[$k] = $v;
        }
    }
}

// Fallback for any icons that Gemini might have missed
foreach ($iconsList as $item) {
    $id = (string)($item['id'] ?? '');
    if (!empty($id) && !isset($allGeneratedTags[$id])) {
        $rawName = trim($item['name'] ?? '');
        $nameTokens = array_filter(preg_split('/[^a-zA-Z0-9]+/', strtolower($rawName)), function($w) {
            return strlen($w) > 2 && !is_numeric($w);
        });
        $allGeneratedTags[$id] = implode(', ', array_unique($nameTokens));
    }
}

jsonResponse(true, [
    'tags' => $allGeneratedTags,
    'categories' => $allSuggestedCategories,
    'category_ids' => $allSuggestedCategoryIds,
    'created_categories' => array_values($allCreatedCategories),
    'total_generated' => count($allGeneratedTags)
], 'AI SEO Tags and Categories generated successfully.');
