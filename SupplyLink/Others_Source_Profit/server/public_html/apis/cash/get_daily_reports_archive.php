<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../cors.php';

try {
    $baseUploadDir = dirname(__DIR__, 2) . '/uploads/daily_report';
    
    if (!is_dir($baseUploadDir)) {
        echo json_encode([
            "success" => true,
            "total_count" => 0,
            "reports" => []
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'http://';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
    if (php_sapi_name() === 'cli' || strpos($scriptName, ':\\') !== false) {
        $baseSubdir = '';
    } else {
        $baseSubdir = preg_replace('#/apis/.*$#', '', $scriptName);
    }
    $baseUrl = rtrim("{$protocol}{$host}{$baseSubdir}", '/');

    $files = scandir($baseUploadDir);
    $reports = [];
    $totalBytes = 0;

    foreach ($files as $f) {
        if ($f === '.' || $f === '..' || substr($f, -4) !== '.pdf') {
            continue;
        }

        $filePath = $baseUploadDir . '/' . $f;
        $sizeBytes = filesize($filePath);
        $modifiedTime = filemtime($filePath);
        $totalBytes += $sizeBytes;

        $datePart = str_replace('.pdf', '', $f);
        $timestamp = strtotime($datePart);
        $formattedDate = $timestamp ? date("F d, Y", $timestamp) : $datePart;

        // Human readable size
        if ($sizeBytes >= 1048576) {
            $formattedSize = number_format($sizeBytes / 1048576, 2) . ' MB';
        } else {
            $formattedSize = number_format($sizeBytes / 1024, 2) . ' KB';
        }

        $fileUrl = "{$baseUrl}/uploads/daily_report/{$f}";

        $reports[] = [
            "file_name" => $f,
            "date" => $datePart,
            "formatted_date" => $formattedDate,
            "size_bytes" => $sizeBytes,
            "formatted_size" => $formattedSize,
            "modified_time" => date("Y-m-d H:i:s", $modifiedTime),
            "file_url" => $fileUrl,
        ];
    }

    // Sort descending by date (latest first)
    usort($reports, function ($a, $b) {
        return strcmp($b['date'], $a['date']);
    });

    if ($totalBytes >= 1048576) {
        $totalSizeFormatted = number_format($totalBytes / 1048576, 2) . ' MB';
    } else {
        $totalSizeFormatted = number_format($totalBytes / 1024, 2) . ' KB';
    }

    echo json_encode([
        "success" => true,
        "total_count" => count($reports),
        "total_size" => $totalSizeFormatted,
        "latest_date" => !empty($reports) ? $reports[0]['date'] : null,
        "reports" => $reports
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

