<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once __DIR__ . '/developer_guard.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"), true) ?? [];
$token = $data['token'] ?? ($_SERVER['HTTP_AUTHORIZATION'] ?? '');
if (strpos($token, 'Bearer ') === 0) {
    $token = substr($token, 7);
}

$devUser = verifyDeveloperAccess($db, $token);
if (!$devUser) {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Forbidden: Developer or Admin access required."]);
    exit;
}

// Possible error log locations
$possiblePaths = [
    dirname(__DIR__, 2) . '/error_log',
    dirname(__DIR__) . '/error_log',
    ini_get('error_log')
];

$logPath = null;
foreach ($possiblePaths as $path) {
    if ($path && file_exists($path) && is_file($path)) {
        $logPath = $path;
        break;
    }
}

// If no existing file found, default to server/error_log
if (!$logPath) {
    $logPath = dirname(__DIR__, 2) . '/error_log';
    if (!file_exists($logPath)) {
        @touch($logPath);
    }
}

$action = $data['action'] ?? '';
if ($action === 'clear') {
    if (file_exists($logPath)) {
        file_put_contents($logPath, "");
    }
    echo json_encode([
        "status" => "success",
        "message" => "Server error_log cleared successfully.",
        "log_file" => basename($logPath),
        "lines" => []
    ]);
    exit;
}

$lines = [];
$fileSize = file_exists($logPath) ? filesize($logPath) : 0;

if ($fileSize > 0) {
    // Read the last 150 lines efficiently using file() or tail buffer
    $raw = file($logPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($raw !== false) {
        $slice = array_slice($raw, -150);
        foreach ($slice as $idx => $line) {
            $type = 'info';
            $lower = strtolower($line);
            if (strpos($lower, 'fatal') !== false || strpos($lower, 'uncaught') !== false || strpos($lower, 'sqlstate') !== false || strpos($lower, 'error:') !== false) {
                $type = 'fatal';
            } elseif (strpos($lower, 'warning') !== false) {
                $type = 'warning';
            } elseif (strpos($lower, 'notice') !== false) {
                $type = 'notice';
            } elseif (strpos($lower, 'stack trace') !== false || strpos($lower, '#') === 0) {
                $type = 'trace';
            } elseif (strpos($lower, 'deprecated') !== false) {
                $type = 'deprecated';
            }

            // Extract timestamp if in standard format [12-Oct-2026 12:45:00 UTC]
            $time = '';
            if (preg_match('/^\[(.*?)\]\s*(.*)$/', $line, $matches)) {
                $time = $matches[1];
                $message = $matches[2];
            } else {
                $message = $line;
            }

            $lines[] = [
                'id' => $idx + 1,
                'raw' => $line,
                'time' => $time,
                'message' => $message,
                'type' => $type
            ];
        }
    }
}

echo json_encode([
    "status" => "success",
    "log_file" => basename($logPath),
    "full_path" => $logPath,
    "file_size_bytes" => $fileSize,
    "file_size_formatted" => $fileSize > 1048576 ? round($fileSize / 1048576, 2) . ' MB' : round($fileSize / 1024, 2) . ' KB',
    "line_count" => count($lines),
    "lines" => array_reverse($lines) // Show latest errors at the top
]);
?>
