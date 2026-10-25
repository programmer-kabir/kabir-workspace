<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

// CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// DB
require_once __DIR__ . '/../db.php';

function sendJson($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// 1. Get & Validate Date
$date = $_GET["date"] ?? date("Y-m-d");

if (!date_create($date)) {
    sendJson([
        "success" => false,
        "message" => "Invalid date format"
    ], 400);
}

// 2. Opening Cash (< date, approved only)
$stmtOpen = $mysqli->prepare("
    SELECT 
        IFNULL(SUM(CASE WHEN type='in' THEN amount ELSE 0 END), 0) AS total_in,
        IFNULL(SUM(CASE WHEN type='out' THEN amount ELSE 0 END), 0) AS total_out
    FROM cash 
    WHERE approval_status='approved' AND date < ?
");
$stmtOpen->bind_param("s", $date);
$stmtOpen->execute();
$openRes = $stmtOpen->get_result()->fetch_assoc();
$openingCash = (float)($openRes['total_in'] ?? 0) - (float)($openRes['total_out'] ?? 0);
$stmtOpen->close();

// 3. Cash In List (Approved Only)
$stmt = $mysqli->prepare("
    SELECT * FROM cash 
    WHERE type='in' AND date=? AND approval_status='approved'
    ORDER BY id ASC
");
$stmt->bind_param("s", $date);
$stmt->execute();
$cashInList = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

// 4. Cash Out List (Approved Only)
$stmt = $mysqli->prepare("
    SELECT * FROM cash 
    WHERE type='out' AND date=? AND approval_status='approved'
    ORDER BY id ASC
");
$stmt->bind_param("s", $date);
$stmt->execute();
$cashOutList = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

// 5. Calculate Totals
$totalIn = 0;
foreach ($cashInList as $cin) {
    $totalIn += (float)$cin['amount'];
}

$totalOut = 0;
foreach ($cashOutList as $cout) {
    $totalOut += (float)$cout['amount'];
}

$net = $totalIn - $totalOut;
$closingBalance = $openingCash + $net;

// 6. Response
sendJson([
    "success" => true,
    "date" => $date,
    "openingCash" => (float)$openingCash,
    "totalIn" => (float)$totalIn,
    "totalOut" => (float)$totalOut,
    "net" => (float)$net,
    "closingBalance" => (float)$closingBalance,
    "cashInList" => $cashInList,
    "cashOutList" => $cashOutList
]);