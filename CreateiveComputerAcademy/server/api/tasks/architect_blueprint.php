<?php
require_once '../../config/cors.php';
require_once '../../config/env.php';

$apiKey = env('OPENROUTER_API_KEY', '');

// Free models list on OpenRouter
$candidateModels = [
    'openrouter/auto',
    'meta-llama/llama-3.3-70b-instruct:free',
    'qwen/qwen-2.5-coder-32b-instruct:free',
    'mistralai/mistral-7b-instruct:free',
    'meta-llama/llama-3.1-8b-instruct:free',
    'deepseek/deepseek-r1:free',
    'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free'
];

$input = json_decode(file_get_contents("php://input"), true);
$customPrompt = $input['instructions'] ?? 'Extract full design blueprint specifications, color palette, typography and PSD layer tree for this flyer/design.';
$imageBase64 = $input['image_base64'] ?? null;
$requestedModel = !empty($input['ai_model']) ? trim($input['ai_model']) : null;

// If client requested a specific model, prioritize it at the top; otherwise use default order
if (!empty($requestedModel)) {
    $candidateModels = array_values(array_unique(array_merge([$requestedModel], $candidateModels)));
}

$systemPrompt = <<<EOT
You are an expert PSD Architect and Graphic Design Director.
Analyze the design requirements and visual inputs (especially the main headline, company name, topic, and category shown in the image), and output a complete, structured PSD design blueprint in strict JSON format.

CRITICAL TITLE RULE:
- Look at the main headline or subject in the input image/instructions (e.g. if the flyer says "BUSINESS MARKETING FLYER DESIGN", your "task_title" MUST be "Business Marketing Flyer Design PSD Template" or "Corporate Business Marketing Agency Flyer PSD").
- NEVER use generic titles like "A4 Print Flyer PSD Blueprint" or "Design Blueprint". Always generate an attractive, commercial-grade title.

Your JSON response MUST strictly follow this exact schema:
{
  "task_title": "Business Marketing Flyer Design PSD Template",
  "doc_format": "A4 Print Flyer",
  "resolution_mode": "300 DPI • CMYK",
  "dimensions": "210 x 297 mm",
  "bleed_margin": "3 mm All Margins",
  "color_palette": [
    { "name": "Primary", "hex": "#1E3A8A" },
    { "name": "Secondary", "hex": "#2563EB" },
    { "name": "Accent", "hex": "#F59E0B" },
    { "name": "Text Dark", "hex": "#0F172A" },
    { "name": "Text Light", "hex": "#F8FAFC" },
    { "name": "Background", "hex": "#0F172A" }
  ],
  "typography": [
    { "font": "Plus Jakarta Sans", "weights": "600, 700, 800", "usage": "Main headlines, badge titles, contact numbers" },
    { "font": "Inter", "weights": "400, 500", "usage": "Body copy, service feature summaries" }
  ],
  "layout_breakdown": [
    { "section": "HEADER SECTION", "description": "Top dark blue diagonal header with amber brand badge" },
    { "section": "HERO SECTION", "description": "Bold high-impact typography with angled blue gradient vector cutouts" },
    { "section": "MIDDLE CONTENT", "description": "3-column feature card grid highlighting core services" },
    { "section": "FOOTER SECTION", "description": "Solid navy footer bar with rounded pill call-to-action button and contact details" }
  ],
  "assets_links": [
    { "type": "font", "name": "Montserrat", "url": "https://fonts.google.com/specimen/Montserrat", "license": "Free Commercial License" },
    { "type": "font", "name": "Inter", "url": "https://fonts.google.com/specimen/Inter", "license": "Free Commercial License" },
    { "type": "icon_font", "name": "FontAwesome Official Vector Font", "note": "Required for Photoshop glyph text tools", "url": "https://fontawesome.com/download" },
    { "type": "glyph", "name": "Feature / Chart Icon", "query": "Flaticon SVG query: chart", "glyph": "\\f080" },
    { "type": "glyph", "name": "Marketing / Bullhorn Icon", "query": "Flaticon SVG query: bullhorn", "glyph": "\\f0a1" },
    { "type": "glyph", "name": "Users / Team Icon", "query": "Flaticon SVG query: users", "glyph": "\\f0c0" },
    { "type": "glyph", "name": "Contact Phone & Globe Icons", "query": "Flaticon SVG query: phone", "glyph": "\\f095" },
    { "type": "stock", "name": "Topic Specific Hero Photo (e.g. Beach Vacation Traveler)", "url": "https://unsplash.com/s/photos/tropical-beach-traveler" },
    { "type": "stock", "name": "Secondary Subject Photo", "url": "https://unsplash.com/s/photos/vacation-resort-ocean" },
    { "type": "stock", "name": "Background Texture or Supporting Cutout", "url": "https://www.freepik.com/search?query=travel+adventure+cutout" }
  ],
  "layer_tree": [
    {
      "folder": "01_BLEED_&_GUIDES (Locked, Non-Printing)",
      "layers": [
        { "name": "Trim Line Margin (210x297mm)", "type": "guide", "icon": "🔲" },
        { "name": "Safe Zone Margin (5mm inside trim)", "type": "guide", "icon": "🔲" }
      ]
    },
    {
      "folder": "02_TEXT_CONTENT",
      "layers": [
        { "name": "Header Text (Brand Logo, Tagline)", "type": "text", "icon": "📁" },
        { "name": "Main Headlines (Titles, Sub-headlines)", "type": "text", "icon": "📁" },
        { "name": "Content / Service Body Text (Columns, Bullets)", "type": "text", "icon": "📁" },
        { "name": "Footer & Contact Info (Phone, Email, URL)", "type": "text", "icon": "📁" }
      ]
    },
    {
      "folder": "03_ICONS_&_BADGES",
      "layers": [
        { "name": "Brand Logo Icon / Badge", "type": "vector", "icon": "📁" },
        { "name": "Category & Feature Icons", "type": "vector", "icon": "📁" },
        { "name": "Social Media & QR Code Placeholder", "type": "vector", "icon": "📁" }
      ]
    },
    {
      "folder": "04_IMAGE_PLACEHOLDERS (Smart Objects)",
      "layers": [
        { "name": "Main Hero Image - Replace Here (Smart Object)", "type": "smart_object", "icon": "🖼️" },
        { "name": "Secondary Image Placeholders (if any)", "type": "smart_object", "icon": "🖼️" }
      ]
    },
    {
      "folder": "05_VECTOR_SHAPES",
      "layers": [
        { "name": "Header Geometric Shapes / Accent Tabs", "type": "shape", "icon": "🎨" },
        { "name": "Flowing Wave Dividers / Masks (photo container mask)", "type": "shape", "icon": "🎨" },
        { "name": "Content Cards, Container Boxes & Button Pills", "type": "shape", "icon": "🎨" },
        { "name": "Footer Wave / Block Shapes", "type": "shape", "icon": "🎨" }
      ]
    },
    {
      "folder": "06_BACKGROUND",
      "layers": [
        { "name": "Solid Base Canvas / Base Background Layer", "type": "solid_color", "icon": "🎨" }
      ]
    }
  ]
}

DO NOT wrap with markdown quotes or backticks. Return ONLY the raw valid JSON object.
EOT;

$userPromptText = "Instructions: " . $customPrompt . "\nPlease extract real design specs, accurate color hex codes, typography, layout breakdown, asset links, and a complete Photoshop layer tree.";

function callOpenRouter($model, $systemPrompt, $userPromptText, $imageBase64, $apiKey) {
    $ch = curl_init('https://openrouter.ai/api/v1/chat/completions');

    // Build message content
    if (!empty($imageBase64)) {
        $userContent = [
            ["type" => "text", "text" => $userPromptText],
            ["type" => "image_url", "image_url" => ["url" => $imageBase64]]
        ];
    } else {
        $userContent = $userPromptText;
    }

    $messages = [
        ['role' => 'system', 'content' => $systemPrompt],
        ['role' => 'user', 'content' => $userContent]
    ];

    $payload = json_encode([
        'model' => $model,
        'messages' => $messages,
        'temperature' => 0.2
    ]);

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey,
        'HTTP-Referer: https://creativecomputeracademy.com',
        'X-Title: CCA PSD Blueprint Architect'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return [$httpCode, $response];
}

$success = false;
$rawText = '';
$lastError = '';
$usedModel = null;

// Try OpenRouter auto router first, then candidate models
foreach ($candidateModels as $model) {
    list($httpCode, $response) = callOpenRouter($model, $systemPrompt, $userPromptText, $imageBase64, $apiKey);
    
    if ($httpCode === 200 && !empty($response)) {
        $resData = json_decode($response, true);
        if (!empty($resData['choices'][0]['message']['content'])) {
            $rawText = $resData['choices'][0]['message']['content'];
            $success = true;
            $usedModel = $model;
            break;
        }
    } else {
        $lastError = "Model $model: " . $response;
    }
}

// If all models failed because of free image limits, retry with text description
if (!$success && !empty($imageBase64)) {
    foreach ($candidateModels as $model) {
        list($httpCode, $response) = callOpenRouter($model, $systemPrompt, $userPromptText . " (Design flyer / brochure preview provided)", null, $apiKey);
        if ($httpCode === 200 && !empty($response)) {
            $resData = json_decode($response, true);
            if (!empty($resData['choices'][0]['message']['content'])) {
                $rawText = $resData['choices'][0]['message']['content'];
                $success = true;
                $usedModel = $model;
                break;
            }
        }
    }
}

if (!$success || empty($rawText)) {
    echo json_encode([
        "status" => "error",
        "message" => "AI Provider error: " . $lastError
    ]);
    exit();
}

// Clean text to extract JSON
$rawText = trim($rawText);
if (strpos($rawText, '```json') !== false) {
    $rawText = preg_replace('/^```json\s*/i', '', $rawText);
    $rawText = preg_replace('/\s*```$/', '', $rawText);
} elseif (strpos($rawText, '```') !== false) {
    $rawText = preg_replace('/^```\s*/i', '', $rawText);
    $rawText = preg_replace('/\s*```$/', '', $rawText);
}

$blueprintData = json_decode($rawText, true);

if (!$blueprintData) {
    if (preg_match('/\{.*\}/s', $rawText, $matches)) {
        $blueprintData = json_decode($matches[0], true);
    }
}

if (!$blueprintData) {
    echo json_encode([
        "status" => "error",
        "message" => "Failed to parse JSON response from AI",
        "raw" => $rawText
    ]);
    exit();
}

echo json_encode([
    "status" => "success",
    "blueprint" => $blueprintData,
    "model_used" => $usedModel
]);
?>
