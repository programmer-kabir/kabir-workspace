<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");

function sendJson($status, $payload) {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

// 1. Check if AI is enabled in settings
$aiEnabled = 1;
$setRes = $mysqli->query("SELECT setting_value FROM ai_settings WHERE setting_key = 'ai_auto_audit_enabled' LIMIT 1");
if ($setRes && $row = $setRes->fetch_assoc()) {
    $aiEnabled = intval($row['setting_value'] ?? 1);
}

if (!$aiEnabled) {
    sendJson(200, [
        "success" => false,
        "ai_disabled" => true,
        "fallback_manual" => true,
        "message" => "এডমিন কর্তৃক AI অটো-স্ক্যান এই মুহূর্তে বন্ধ রাখা হয়েছে। অনুগ্রহ করে ম্যানুয়ালি তথ্য প্রদান করুন।"
    ]);
}

// 2. Fetch Image (file upload or base64)
$base64Image = '';
$mimeType = 'image/jpeg';

if (isset($_FILES['slip_image']) && $_FILES['slip_image']['error'] === UPLOAD_ERR_OK) {
    $tmp = $_FILES['slip_image']['tmp_name'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $tmp);
    finfo_close($finfo);
    $base64Image = base64_encode(file_get_contents($tmp));
} elseif (!empty($_POST['slip_base64'])) {
    $rawB64 = $_POST['slip_base64'];
    if (preg_match('/^data:(image\/[a-zA-Z0-9.+_-]+);base64,(.+)$/', $rawB64, $matches)) {
        $mimeType = $matches[1];
        $base64Image = $matches[2];
    } else {
        $base64Image = $rawB64;
    }
}

if (empty($base64Image)) {
    sendJson(400, [
        "success" => false,
        "message" => "স্লিপের ছবি পাওয়া যায়নি। অনুগ্রহ করে ছবি নির্বাচন করুন।"
    ]);
}

// 3. Fetch active API keys from DB (rotation ready)
$keysRes = $mysqli->query("SELECT id, api_key, label, error_count FROM ai_api_keys WHERE is_active = 1 ORDER BY error_count ASC, last_used_at ASC, id ASC");
$apiKeys = [];
while ($kRow = $keysRes->fetch_assoc()) {
    $apiKeys[] = $kRow;
}

if (empty($apiKeys)) {
    sendJson(200, [
        "success" => false,
        "fallback_manual" => true,
        "message" => "কোনো সক্রিয় Gemini API Key পাওয়া যায়নি। অনুগ্রহ করে ম্যানুয়ালি এন্ট্রি দিন।"
    ]);
}

// 4. Gemini Prompt
$systemPrompt = "You are a professional banking receipt OCR analyzer specialized in Bangladeshi bank deposit slips, ATM receipts, and mobile banking transfer receipts (e.g. BRAC Bank Astha, Citytouch, Cellfin, Dutch-Bangla, bKash, Nagad, Sonali Bank, etc.).
Analyze this receipt image and return ONLY a valid JSON object with these exact keys:
{
  \"bank_name\": string or null (the bank name, e.g. 'BRAC Bank PLC', 'City Bank', 'Dutch-Bangla Bank PLC', 'Islami Bank Bangladesh', 'bKash', etc.),
  \"deposited_amount\": number or null (the numeric amount deposited or transferred, e.g. 15000),
  \"account_no\": string or null (the recipient/to account number, card number, or account title if visible),
  \"from_account\": string or null (the sender account if visible),
  \"deposit_date\": string or null (in YYYY-MM-DD format),
  \"reference_no\": string or null (the transaction ID, reference number, or voucher number),
  \"remarks\": string or null,
  \"is_success\": boolean (true if transaction indicates successful / deposited, false otherwise),
  \"confidence\": number (confidence score between 0.0 and 1.0)
}
Return raw JSON only. Do not use markdown backticks.";

$payload = [
    "contents" => [
        [
            "parts" => [
                ["text" => $systemPrompt],
                [
                    "inline_data" => [
                        "mime_type" => $mimeType,
                        "data" => $base64Image
                    ]
                ]
            ]
        ]
    ],
    "generationConfig" => [
        "temperature" => 0.1,
        "response_mime_type" => "application/json"
    ]
];

$modelsToTry = ['gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];
$successData = null;
$lastError = '';

// 5. Try keys in order (failover/rotation)
foreach ($apiKeys as $keyItem) {
    $currentKey = $keyItem['api_key'];
    $keyId = $keyItem['id'];

    foreach ($modelsToTry as $modelName) {
        $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$modelName}:generateContent?key=" . urlencode($currentKey);

        $ch = curl_init($endpoint);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 12);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200 && !empty($response)) {
            $parsed = json_decode($response, true);
            $candidateText = $parsed['candidates'][0]['content']['parts'][0]['text'] ?? '';
            
            // Clean markdown block if present
            $candidateText = trim(preg_replace('/^```(?:json)?\s*/i', '', $candidateText));
            $candidateText = trim(preg_replace('/\s*```$/', '', $candidateText));

            $ocrData = json_decode($candidateText, true);
            if (is_array($ocrData) && (!empty($ocrData['deposited_amount']) || !empty($ocrData['bank_name']))) {
                $successData = $ocrData;

                // Update last_used_at for key
                $mysqli->query("UPDATE ai_api_keys SET last_used_at = NOW(), error_count = 0 WHERE id = {$keyId}");
                break 2;
            }
        } else {
            $errData = json_decode($response, true);
            $lastError = $errData['error']['message'] ?? "HTTP {$httpCode}";
        }
    }

    // Increment error count for key if all models failed on it
    $mysqli->query("UPDATE ai_api_keys SET error_count = error_count + 1 WHERE id = {$keyId}");
}

// 6. Return Result
if ($successData !== null) {
    sendJson(200, [
        "success" => true,
        "message" => "স্লিপ সফলভাবে AI দ্বারা স্ক্যান করা হয়েছে!",
        "data" => $successData
    ]);
} else {
    // Graceful fallback to manual input without breaking user flow
    sendJson(200, [
        "success" => false,
        "fallback_manual" => true,
        "message" => "AI স্ক্যান এই মুহূর্তে সম্ভব হচ্ছে না (" . htmlspecialchars($lastError) . ")। অনুগ্রহ করে তথ্যগুলো নিজে টাইপ করুন।"
    ]);
}
