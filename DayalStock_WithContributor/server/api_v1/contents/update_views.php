<?php

// ১. CORS এবং হেডার সেটআপ
$allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://dayalstock.com",
    "https://www.dayalstock.com",
];

$origin = $_SERVER["HTTP_ORIGIN"] ?? "";

if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Vary: Origin");
}

header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Max-Age: 86400");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

// ২. ডাটাবেজ কানেকশন ইমপোর্ট
require_once __DIR__ . '/../config/db.php';

require_once __DIR__ . '/../middleware/rate_limit.php';
applyRateLimit($mysqli, 'contents', 120, 60);


// ৩. রেসপন্স হেল্পার ফাংশন
function sendResponse($success, $message, $extra = []) {
    while (ob_get_level() > 0) {
        ob_end_clean();
    }

    echo json_encode(
        array_merge([
            "success" => $success,
            "message" => $message
        ], $extra),
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );

    exit;
}

try {
    // ডাটাবেজ কানেকশন চেক
    if (!isset($mysqli) || !$mysqli) {
        throw new Exception('Database connection পাওয়া যায়নি।');
    }

    // ৪. ফ্রন্টএন্ড থেকে পাঠানো JSON ডাটা রিসিভ করা
    $rawInput = file_get_contents("php://input");
    $inputData = json_decode($rawInput, true);

    // JSON ভ্যালিডেশন চেক
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON input.');
    }

    // ৫. content_id এক্সট্রাক্ট এবং ভ্যালিডেশন
    $contentId = isset($inputData['content_id']) ? (int)$inputData['content_id'] : 0;

    if ($contentId <= 0) {
        throw new Exception('Valid content ID required.');
    }

    // Session-based anti-inflation / view deduplication
    session_start();
    $viewKey = 'viewed_content_' . $contentId;
    if (!empty($_SESSION[$viewKey])) {
        // Already viewed in this session
        sendResponse(true, 'Already viewed in this session.', ['content_id' => $contentId]);
    }
    $_SESSION[$viewKey] = true;

    // ৬. ডাটাবেজে views_count আপডেট করার কুয়েরি
    $updateQuery = "UPDATE contents SET views_count = views_count + 1 WHERE id = ?";
    $statement = $mysqli->prepare($updateQuery);

    if (!$statement) {
        throw new Exception('Database prepare error: ' . $mysqli->error);
    }

    $statement->bind_param('i', $contentId);

    if (!$statement->execute()) {
        throw new Exception('Failed to update view count: ' . $statement->error);
    }

    // কুয়েরি ক্লোজ করা
    $statement->close();

    // সফল রেসপন্স
    sendResponse(true, 'View count updated successfully.', [
        'content_id' => $contentId
    ]);

} catch (Throwable $error) {
    // কোনো ইরর হলে ৪০০ কোডসহ মেসেজ পাঠানো
    http_response_code(400);
    sendResponse(false, $error->getMessage());
}