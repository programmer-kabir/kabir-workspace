<?php

$allowed_origins = [
    'https://contributor.dayalstock.com',
    'https://admin.dayalstock.com',
    'http://localhost:5173',
    'https://dayalstock.com',
    'https://www.dayalstock.com',
];

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin, x-api-key");
header("Access-Control-Max-Age: 86400");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/env.php';
loadEnv(__DIR__ . '/../.env');

$secretKey = getenv('API_SECRET_KEY');
if ($secretKey) {
    $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? $_GET['api_key'] ?? '';
    if ($apiKey !== $secretKey) {
        header('Content-Type: application/json');
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Forbidden: Invalid API Key"]);
        exit();
    }
}
