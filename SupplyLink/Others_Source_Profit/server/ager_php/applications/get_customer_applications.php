<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=UTF-8");

ini_set('display_errors', 0);
error_reporting(0);

function jsonFail($msg, $code = 400) {
  http_response_code($code);
  echo json_encode([
    "success" => false,
    "message" => $msg
  ], JSON_UNESCAPED_UNICODE);
  exit;
}

try {
  if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    jsonFail("Invalid method. Use GET.", 405);
  }

  // 🔹 optional: image full url বানাতে চাইলে
  $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https" : "http";
  $host = $_SERVER['HTTP_HOST'] ?? "";
  $baseUrl = $scheme . "://" . $host . "/";

  $makeFileUrl = function ($path) use ($baseUrl) {
    if (!$path) return null;
    if (preg_match('/^https?:\/\//i', $path)) return $path;
    $p = preg_replace('/^\.\//', '', $path);
    return $baseUrl . ltrim($p, '/');
  };

  $sql = "SELECT * FROM customer_applications ORDER BY id DESC";
  $res = $mysqli->query($sql);

  if (!$res) {
    jsonFail("DB query failed: " . $mysqli->error, 500);
  }

  $rows = [];

  $imgFields = [
    'customer_nid_front','customer_nid_back','customer_photo',
    'customer_bank_check','customer_bank_statement',
    'guarantor_nid_front','guarantor_nid_back','guarantor_photo'
  ];

  while ($row = $res->fetch_assoc()) {

    // optional image full url
    foreach ($imgFields as $f) {
      $row[$f . "_url"] = $makeFileUrl($row[$f] ?? null);
    }

    $rows[] = $row;
  }

  echo json_encode([
    "success" => true,
    "total" => count($rows),
    "data" => $rows
  ], JSON_UNESCAPED_UNICODE);
  exit;

} catch (Exception $e) {
  jsonFail($e->getMessage(), 500);
}
