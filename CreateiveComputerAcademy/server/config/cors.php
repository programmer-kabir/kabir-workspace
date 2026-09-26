<?php
// config/cors.php
date_default_timezone_set('Asia/Dhaka');

$allowed_origins = ['https://staff.creativecomputeracademy.com', 'https://admin.creativecomputeracademy.com', 'https://audit.creativecomputeracademy.com', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175','http://localhost:5176'];
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if (in_array($origin, $allowed_origins) && !headers_sent()) {
    header("Access-Control-Allow-Origin: " . $origin);
}
if (!headers_sent()) {
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Content-Type: application/json; charset=UTF-8");
}

// Handle preflight requests
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>