<?php
// backend/api/admin/icons/ai_generate_tags.php
// AI-Powered SEO Tag Generator endpoint for Admin Icon Uploads

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

if (!is_array($iconsList) || empty($iconsList)) {
    jsonResponse(false, null, 'No icons provided. Expected an array of icons with name and category.', 400);
}

// Chunk icons into batches of 40 for optimal Gemini speed
$chunks = array_chunk($iconsList, 40);
$allGeneratedTags = [];

foreach ($chunks as $chunk) {
    $batchTags = generateGeminiTags($chunk, $limit);
    if (!empty($batchTags)) {
        foreach ($batchTags as $k => $v) {
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
    'total_generated' => count($allGeneratedTags)
], 'AI SEO Tags generated successfully.');
