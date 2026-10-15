<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

$input = json_decode(file_get_contents("php://input"), true);
$rawText = isset($input['text']) ? trim($input['text']) : '';
$category = isset($input['category']) ? trim($input['category']) : 'Personal';
$duration = isset($input['duration']) ? (int)$input['duration'] : 15;

if (empty($rawText)) {
    echo json_encode([
        "status" => "error",
        "message" => "Text to polish is required."
    ]);
    exit;
}

// ── 1. Fetch Gemini API Key (Priority: Database system_settings -> config/env.php) ──
$apiKey = '';

if ($db) {
    try {
        $stmt = $db->prepare("SELECT setting_value FROM system_settings WHERE setting_key = 'gemini_api_key' LIMIT 1");
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!empty($row['setting_value'])) {
            $apiKey = trim($row['setting_value']);
        }
    } catch (Throwable $e) {
        // Table or query issue
    }
}

// Fallback to .env if not found in DB
if (empty($apiKey)) {
    if (file_exists('../../config/env.php')) {
        require_once '../../config/env.php';
        $apiKey = env('GEMINI_API_KEY', '');
    }
}

// ── 2. Smart Rule-Based Fallback Generator (If API key is missing or API fails) ──
function getRuleBasedPolish($raw, $cat, $dur) {
    $clean = trim($raw, " .\t\n\r");
    $durText = $dur > 0 ? " ({$dur} mins)" : "";

    // Common Bangla/Banglish keywords mapping
    $lower = strtolower($raw);
    if (strpos($lower, 'namaz') !== false || strpos($lower, 'prayer') !== false || $cat === 'Prayer') {
        return "Stepping away for daily prayer and ablution, returning promptly{$durText}.";
    }
    if (strpos($lower, 'doctor') !== false || strpos($lower, 'medicine') !== false || strpos($lower, 'osudh') !== false || strpos($lower, 'headache') !== false || strpos($lower, 'matha') !== false || $cat === 'Medical') {
        return "Taking a short medical rest due to sudden discomfort; will resume work shortly{$durText}.";
    }
    if (strpos($lower, 'cha') !== false || strpos($lower, 'tea') !== false || strpos($lower, 'coffee') !== false || strpos($lower, 'snack') !== false || $cat === 'Tea/Snack') {
        return "Taking a brief tea and refreshment break to recharge{$durText}.";
    }
    if (strpos($lower, 'emergency') !== false || strpos($lower, 'urgent') !== false || $cat === 'Emergency') {
        return "Stepping out briefly to attend to an urgent matter; will be back on schedule{$durText}.";
    }

    // Capitalize first letter and format cleanly
    $capitalized = ucfirst($clean);
    return "Stepping out for personal matters ({$capitalized}); will resume promptly in {$dur} minutes.";
}

// ── 3. Call Google Gemini API if key is available ──
if (!empty($apiKey)) {
    $modelsToTry = [
        'gemini-3.5-flash-lite',
        'gemini-3.5-flash',
        'gemini-3.8-flash'
    ];

    $prompt = "You are a professional HR & workplace communication assistant for Creative Computer Academy.
An employee is submitting a break request and provided a raw/informal explanation.
Rewrite their note into ONE concise, polite, grammatically perfect, and formal office break note in English.

Employee Category: {$category}
Duration: {$duration} minutes
Employee's Raw Note: \"{$rawText}\"

Strict Rules:
1. Return ONLY the polished note sentence. No intro, no quotes, no labels like 'Note:' or 'Reason:'.
2. Maximum 12 to 20 words.
3. Keep the actual intent (e.g. if medical, personal errand, family, bank, or prayer).
4. Tone should be professional, polite, and accountable.
5. If the raw note was in Bengali or Banglish, translate the meaning smoothly into natural English.";

    $geminiPayload = [
        "contents" => [
            [
                "parts" => [
                    ["text" => $prompt]
                ]
            ]
        ],
        "generationConfig" => [
            "temperature" => 0.2,
            "maxOutputTokens" => 80
        ]
    ];

    foreach ($modelsToTry as $model) {
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . urlencode($apiKey);

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($geminiPayload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_TIMEOUT, 6);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200 && !empty($response)) {
            $json = json_decode($response, true);
            $candidateText = $json['candidates'][0]['content']['parts'][0]['text'] ?? '';
            $candidateText = trim(trim($candidateText), "\"'`");

            if (!empty($candidateText)) {
                echo json_encode([
                    "status" => "success",
                    "polished_note" => $candidateText,
                    "model_used" => $model,
                    "source" => "gemini_ai"
                ]);
                exit;
            }
        }
    }
}

// ── 4. Fallback if API key missing or Gemini failed ──
$fallbackNote = getRuleBasedPolish($rawText, $category, $duration);

echo json_encode([
    "status" => "success",
    "polished_note" => $fallbackNote,
    "source" => "smart_template",
    "notice" => empty($apiKey) ? "Gemini API key is not yet configured in system_settings; smart template used." : "Gemini API request timed out; smart template used."
]);
