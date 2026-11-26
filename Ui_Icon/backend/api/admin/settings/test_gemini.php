<?php
// backend/api/admin/settings/test_gemini.php
// Live Test Connection endpoint for Google Gemini AI API Key with Auto-Fallback

require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';
require_once __DIR__ . '/../../../helpers/gemini.php';

$admin = requireAdmin($pdo);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, null, 'Method not allowed.', 405);
}

$data = getJsonInput();
$apiKey = trim((string)($data['api_key'] ?? ''));

if (empty($apiKey)) {
    $apiKey = getActiveGeminiApiKey($pdo);
}

if (empty($apiKey)) {
    jsonResponse(false, null, 'Gemini API Key is empty. Please enter an API key.', 400);
}

$startTime = microtime(true);

$testIcon = [
    [
        'id' => 'test_1',
        'name' => 'Search Lens',
        'category' => 'System'
    ]
];

$tags = generateGeminiTags($testIcon, 4, $apiKey, null, $pdo);
$latencyMs = round((microtime(true) - $startTime) * 1000);

if (!empty($tags['test_1'])) {
    jsonResponse(true, [
        'status' => 'connected',
        'latency_ms' => $latencyMs,
        'sample_tags' => $tags['test_1']
    ], "Google Gemini AI connected successfully! Latency: {$latencyMs}ms");
} else {
    jsonResponse(false, [
        'status' => 'failed'
    ], 'Failed to connect to Google Gemini. Please verify that your API key is valid.', 400);
}
