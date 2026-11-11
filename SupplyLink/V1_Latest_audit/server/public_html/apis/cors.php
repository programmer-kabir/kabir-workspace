<?php

$allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
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
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-User-Id");
header("Access-Control-Max-Age: 86400");

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// 🛡️ Cross-Subdomain Session Cookie Configuration
if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $isLocal = (strpos($host, 'localhost') !== false) || (strpos($host, '127.0.0.1') !== false);
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => $isLocal ? '' : '.supplylinkbd.com',
        'secure' => $isLocal ? false : true,
        'httponly' => true,
        'samesite' => $isLocal ? 'Lax' : 'None',
    ]);
    session_start();
}

// 🛡️ Central Authentication & Role Guard System
require_once __DIR__ . '/auth_guard.php';

if (!empty($_SESSION['user']['role'])) {
    $sessionRoles = is_array($_SESSION['user']['role']) ? $_SESSION['user']['role'] : [$_SESSION['user']['role']];
    if (in_array('audit', $sessionRoles)) {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        if (in_array($method, ['POST', 'PUT', 'DELETE', 'PATCH'])) {
            $script = basename($_SERVER['SCRIPT_NAME'] ?? '');
            $allowedEndpoints = [
                'login.php', 
                'logout.php', 
                'me.php', 
                'check.php', 
                'report_daily.php',
                'save_daily_report_drive.php',
            ];
            
            $isReadQuery = strpos($script, 'get_') === 0 || 
                           strpos($script, 'fetch_') === 0 || 
                           strpos($script, 'report_') === 0 || 
                           strpos($script, 'view_') === 0;

            if (!in_array($script, $allowedEndpoints) && !$isReadQuery) {
                http_response_code(403);
                header("Content-Type: application/json; charset=UTF-8");
                echo json_encode([
                    "success" => false,
                    "error" => "Audit Role Restriction: Read-only accounts cannot modify system data or perform mutation actions."
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }
    }
}
