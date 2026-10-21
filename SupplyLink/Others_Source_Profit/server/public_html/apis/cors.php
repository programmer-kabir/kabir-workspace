<?php

$allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'https://admin.supplylinkbd.com',
    'https://api.supplylinkbd.com',
    'https://supplylinkbd.com',
    'https://www.supplylinkbd.com',
    'https://v1.supplylinkbd.com',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (
    in_array($origin, $allowedOrigins) ||
    preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin) ||
    preg_match('/^https?:\/\/([a-zA-Z0-9-]+\.)*supplylinkbd\.com$/', $origin)
) {
    header("Access-Control-Allow-Origin: " . $origin);
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Max-Age: 86400");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}