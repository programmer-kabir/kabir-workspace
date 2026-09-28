<?php
// backend/api/admin/icons/ai_inspect_icons.php
// AI-Powered Visual Mismatch & Accuracy Inspector endpoint using Google Gemini

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
    jsonResponse(false, null, 'No icons provided. Expected an array of icons with name, category, and svg.', 400);
}

if (empty(GEMINI_API_KEY)) {
    jsonResponse(false, null, 'Google Gemini API key is missing. Please set GEMINI_API_KEY in backend/.env.', 500);
}

// Chunk into batches of 10 for optimal multimodal SVG analysis & prompt response speed
$chunks = array_chunk($iconsList, 10);
$allInspections = [];
$mismatchCount = 0;

foreach ($chunks as $chunk) {
    $batchResults = inspectGeminiVisuals($chunk, $limit);
    if (!empty($batchResults)) {
        foreach ($batchResults as $k => $v) {
            $allInspections[$k] = $v;
            if (!empty($v['is_mismatch'])) {
                $mismatchCount++;
            }
        }
    }
}

if (empty($allInspections) && !empty($iconsList)) {
    jsonResponse(false, null, 'Gemini AI Visual Inspection could not process the icons. Please check your API key quota or network connection.', 500);
}

jsonResponse(true, [
    'inspections' => $allInspections,
    'total_inspected' => count($allInspections),
    'mismatch_count' => $mismatchCount
], "Visual inspection completed. Found {$mismatchCount} potential name mismatches.");
