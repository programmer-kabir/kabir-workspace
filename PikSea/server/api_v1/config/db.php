<?php

// Load environment variables from .env file
require_once __DIR__ . '/env.php';
loadEnv(__DIR__ . '/../.env');

// Initialize Logger
require_once __DIR__ . '/Logger.php';

// Settings from environment
$isDebug  = getenv('DEBUG') === 'true';
$timezone = getenv('TIMEZONE') ?: 'Asia/Dhaka';

define('DEBUG', $isDebug);
date_default_timezone_set($timezone);

// Database credentials — এখন .env থেকে আসছে, hardcoded নেই
$DB_HOST = getenv('DB_HOST') ?: 'localhost';
$DB_USER = getenv('DB_USER') ?: '';
$DB_PASS = getenv('DB_PASS') ?: '';
$DB_NAME = getenv('DB_NAME') ?: '';

// Try primary connection
mysqli_report(MYSQLI_REPORT_OFF);
$mysqli = @new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);

// If running locally (XAMPP / localhost) and production credentials failed, fallback to local root
if ($mysqli->connect_errno && in_array($_SERVER['SERVER_ADDR'] ?? '127.0.0.1', ['127.0.0.1', '::1']) || in_array($_SERVER['HTTP_HOST'] ?? '', ['localhost', '127.0.0.1'])) {
    if ($mysqli->connect_errno) {
        $mysqli = @new mysqli('localhost', 'root', '', 'u647959341_dayaldb');
    }
}

if ($mysqli->connect_errno) {
    $errorMsg = "DB connect failed: ({$mysqli->connect_errno}) {$mysqli->connect_error}";
    Logger::log($errorMsg, 'FATAL');
    
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    if (DEBUG) {
        echo json_encode(['success' => false, 'error' => $errorMsg]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Database connection failed. Our team has been notified.']);
    }
    exit;
}

$mysqli->set_charset("utf8mb4");

if (DEBUG) {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
}
