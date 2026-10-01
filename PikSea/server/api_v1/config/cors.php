<?php

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$allowed_origins = [
    'https://admin.piksea.com',
    'https://piksea.com',
    'https://www.piksea.com',
    'https://admin.dayalstock.com',
    'https://dayalstock.com',
    'https://www.dayalstock.com',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'http://127.0.0.1:3000',
];

// Check if origin matches allowed list or matches localhost/127.0.0.1 on any port or dayalstock/piksea domains
$is_allowed = in_array($origin, $allowed_origins) || 
              preg_match('/^http(s)?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i', $origin) ||
              preg_match('/^http(s)?:\/\/([a-z0-9-]+\.)?(dayalstock\.com|piksea\.com)$/i', $origin);

if ($origin && $is_allowed) {
    header("Access-Control-Allow-Origin: {$origin}");
    header("Access-Control-Allow-Credentials: true");
} else if (!$origin) {
    header("Access-Control-Allow-Origin: *");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin, x-api-key, X-API-KEY");
header("Access-Control-Max-Age: 86400");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    header("Content-Type: text/plain");
    echo "";
    exit();
}

require_once __DIR__ . '/env.php';
loadEnv(__DIR__ . '/../.env');

$secretKey = getenv('API_SECRET_KEY');
if ($secretKey) {
    // Check multiple header sources
    $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? $_SERVER['HTTP_X_API_KEY'] ?? $_GET['api_key'] ?? '';
    
    if (!$apiKey && function_exists('getallheaders')) {
        $headers = getallheaders();
        foreach ($headers as $k => $v) {
            if (strtolower($k) === 'x-api-key') {
                $apiKey = $v;
                break;
            }
        }
    }

    if ($apiKey !== $secretKey) {
        header('Content-Type: application/json');
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Forbidden: Invalid API Key"]);
        exit();
    }
}
