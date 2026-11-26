<?php
// backend/config/database.php
// Database connection using PDO for IconBaba

// -------------------------------------------------------------
// Auto-load .env file if present (cPanel / Apache / Live Server)
// -------------------------------------------------------------
if (!function_exists('loadIconbabaEnv')) {
    function loadIconbabaEnv() {
        $possiblePaths = [
            __DIR__ . '/../.env',
            __DIR__ . '/../../.env',
            __DIR__ . '/.env',
            isset($_SERVER['DOCUMENT_ROOT']) ? rtrim($_SERVER['DOCUMENT_ROOT'], '/') . '/.env' : null,
            isset($_SERVER['DOCUMENT_ROOT']) ? rtrim($_SERVER['DOCUMENT_ROOT'], '/') . '/backend/.env' : null,
        ];

        foreach ($possiblePaths as $path) {
            if ($path && file_exists($path) && is_readable($path)) {
                $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                foreach ($lines as $line) {
                    $line = trim($line);
                    if ($line === '' || strpos($line, '#') === 0) {
                        continue;
                    }
                    $parts = explode('=', $line, 2);
                    if (count($parts) === 2) {
                        $key = trim($parts[0]);
                        $val = trim($parts[1]);
                        // Strip quotes if present
                        if ((substr($val, 0, 1) === '"' && substr($val, -1) === '"') ||
                            (substr($val, 0, 1) === "'" && substr($val, -1) === "'")) {
                            $val = substr($val, 1, -1);
                        }
                        if (!empty($key)) {
                            putenv("{$key}={$val}");
                            $_ENV[$key] = $val;
                            $_SERVER[$key] = $val;
                        }
                    }
                }
                break;
            }
        }
    }
    loadIconbabaEnv();
}

$db_host = getenv('DB_HOST') ?: ($_ENV['DB_HOST'] ?? 'localhost');
$db_name = getenv('DB_NAME') ?: ($_ENV['DB_NAME'] ?? 'iconbaba');
$db_user = getenv('DB_USER') ?: ($_ENV['DB_USER'] ?? 'root');
$db_pass = getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : ($_ENV['DB_PASSWORD'] ?? '');

// Set default timezone for PHP to Bangladesh Standard Time (BST, UTC+6)
date_default_timezone_set('Asia/Dhaka');

try {
    $dsn = "mysql:host={$db_host};dbname={$db_name};charset=utf8mb4";
    $pdo = new PDO($dsn, $db_user, $db_pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
    // Ensure all MySQL TIMESTAMP and DATETIME queries use Bangladesh Time (+06:00)
    $pdo->exec("SET time_zone = '+06:00'");
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed',
        'error'   => $e->getMessage(),
        'debug'   => [
            'host'     => $db_host,
            'database' => $db_name,
            'user'     => $db_user
        ]
    ]);
    exit;
}
