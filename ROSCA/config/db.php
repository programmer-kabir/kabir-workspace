<?php
// config/db.php - PDO Database Connection & Environment Config

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$isLocal = in_array($host, ['localhost', '127.0.0.1']) || strpos($_SERVER['SCRIPT_NAME'] ?? '', '/rosca/') !== false;

if ($isLocal) {
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'rosca_db');
    define('DB_USER', 'root');
    define('DB_PASS', '');
    define('BASE_URL', '/rosca/');
} else {
    // Live Server (Hostinger)
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'u647959341_rosca_db');
    define('DB_USER', 'u647959341_rosca_admin');
    define('DB_PASS', 'Rosc@122333@');
    define('BASE_URL', '/');
}

function getDBConnection() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            die("Database Connection Error: " . htmlspecialchars($e->getMessage()));
        }
    }
    return $pdo;
}

function url($path = '') {
    return rtrim(BASE_URL, '/') . '/' . ltrim($path, '/');
}
