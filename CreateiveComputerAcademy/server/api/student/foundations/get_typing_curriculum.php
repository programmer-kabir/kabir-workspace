<?php
require_once '../../../config/cors.php';

header('Content-Type: application/json; charset=utf-8');

// Path to server curriculum JSON
$jsonPath = __DIR__ . '/../../../data/typing_curriculum.json';

if (!file_exists($jsonPath)) {
    echo json_encode([
        "status" => "error",
        "message" => "Curriculum file not found on server."
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Support HTTP caching / ETag for ultra-fast repeated loads
$lastModified = filemtime($jsonPath);
$etag = md5_file($jsonPath);

header("Last-Modified: " . gmdate("D, d M Y H:i:s", $lastModified) . " GMT");
header("Etag: $etag");
header("Cache-Control: public, max-age=60"); // Cache for 1 min, then revalidate

if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && trim($_SERVER['HTTP_IF_NONE_MATCH']) == $etag) {
    header("HTTP/1.1 304 Not Modified");
    exit;
}

$rawJson = file_get_contents($jsonPath);
$curriculum = json_decode($rawJson, true);

if ($curriculum === null) {
    echo json_encode([
        "status" => "error",
        "message" => "Failed to parse curriculum JSON."
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode([
    "status" => "success",
    "data" => $curriculum,
    "total_lessons" => count($curriculum),
    "updated_at" => date('Y-m-d H:i:s', $lastModified)
], JSON_UNESCAPED_UNICODE);
