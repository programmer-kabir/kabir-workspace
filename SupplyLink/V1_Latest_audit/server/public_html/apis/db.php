<?php
// db.php - Smart Hybrid DB Connection (Local XAMPP & Hostinger Live)
define('DEBUG', true);
date_default_timezone_set('Asia/Dhaka');

$host = $_SERVER['HTTP_HOST'] ?? '';
$isWindows = (DIRECTORY_SEPARATOR === '\\');
$isLocal = (strpos($host, 'localhost') !== false) 
        || (strpos($host, '127.0.0.1') !== false) 
        || (php_sapi_name() === 'cli' && $isWindows);

if ($isLocal) {
    // 💻 Local XAMPP Environment
    $DB_HOST = "localhost";       
    $DB_USER = 'root';
    $DB_PASS = '';
    $DB_NAME = 'u647959341_audit_db';
} else {
    // 🌐 Hostinger Live Production
    $DB_HOST = "localhost";       
    $DB_USER = 'u647959341_audit_user';
    $DB_PASS = 'Audit_122333';
    $DB_NAME = 'u647959341_audit_db';
}

mysqli_report(MYSQLI_REPORT_OFF);
$mysqli = @new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);

// Fallback attempt for local environments
if ($mysqli->connect_errno && $isLocal) {
    $mysqli = @new mysqli("localhost", "root", "", "u647959341_audit_db");
}

if ($mysqli->connect_errno) {
    if (DEBUG) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success'=>false, 'error'=>"DB connect failed: ({$mysqli->connect_errno}) {$mysqli->connect_error}"]);
    }
    exit;
}

$mysqli->query("SET time_zone = '+06:00'");
$mysqli->set_charset("utf8mb4");
