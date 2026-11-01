<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

// CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// DB
require_once __DIR__ . '/../db.php'; // $mysqli

// helper
function sendJson($data) {
    echo json_encode($data);
    exit;
}

$today = date("Y-m-d");

// ==========================
// ✅ Today Deposit (IN) - Only Approved
// ==========================
$stmt = $mysqli->prepare("
    SELECT IFNULL(SUM(amount), 0) AS total 
    FROM cash 
    WHERE type='in' AND date=? AND approval_status='approved'
");
$stmt->bind_param("s", $today);
$stmt->execute();
$deposit = $stmt->get_result()->fetch_assoc()['total'];

// ==========================
// ✅ Today Withdraw (OUT) - Only Approved
// ==========================
$stmt = $mysqli->prepare("
    SELECT IFNULL(SUM(amount), 0) AS total 
    FROM cash 
    WHERE type='out' AND date=? AND approval_status='approved'
");
$stmt->bind_param("s", $today);
$stmt->execute();
$withdraw = $stmt->get_result()->fetch_assoc()['total'];

// ==========================
// ✅ Total IN - Only Approved
// ==========================
$res = $mysqli->query("
    SELECT IFNULL(SUM(amount), 0) AS total 
    FROM cash 
    WHERE type='in' AND approval_status='approved'
");
$totalIn = $res->fetch_assoc()['total'];

// ==========================
// ✅ Total OUT - Only Approved
// ==========================
$res = $mysqli->query("
    SELECT IFNULL(SUM(amount), 0) AS total 
    FROM cash 
    WHERE type='out' AND approval_status='approved'
");
$totalOut = $res->fetch_assoc()['total'];

// ==========================
// ✅ Response
// ==========================
sendJson([
    "todayDeposit" => (float)$deposit,
    "todayWithdraw" => (float)$withdraw,
    "todayNet" => (float)$deposit - (float)$withdraw,
    "handCash" => (float)$totalIn - (float)$totalOut
]);