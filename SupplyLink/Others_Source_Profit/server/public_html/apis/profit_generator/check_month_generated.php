<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

function apiError($message, $debug = null, $code = 500) {
  http_response_code($code);
  echo json_encode([
    "success" => false,
    "message" => $message,
    "debug" => $debug
  ], JSON_UNESCAPED_UNICODE);
  exit;
}

$mysqli->set_charset("utf8mb4");

$profit_year  = isset($_GET['profit_year']) ? (int)$_GET['profit_year'] : 0;
$profit_month = isset($_GET['profit_month']) ? (int)$_GET['profit_month'] : 0;

if ($profit_year <= 0 || $profit_month < 1 || $profit_month > 12) {
  apiError("Invalid year/month", null, 422);
}

$sql = "SELECT 1 FROM profit_generator WHERE profit_year=? AND profit_month=? LIMIT 1";
$stmt = $mysqli->prepare($sql);
if (!$stmt) apiError("Prepare failed", $mysqli->error);

$stmt->bind_param("ii", $profit_year, $profit_month);
if (!$stmt->execute()) apiError("Execute failed", $stmt->error);

$res = $stmt->get_result();
$exists = $res && $res->num_rows > 0;

echo json_encode([
  "success" => true,
  "generated" => $exists
], JSON_UNESCAPED_UNICODE);
