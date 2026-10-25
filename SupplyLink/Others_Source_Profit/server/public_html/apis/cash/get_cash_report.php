<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

// CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// DB
require_once __DIR__ . '/../db.php';

// helper
function sendJson($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

// Enable gzip compression if supported to drastically reduce transfer time
if (!ob_start("ob_gzhandler")) {
    ob_start();
}

// ==========================
// ✅ Get All Cash Data (Fast LEFT JOIN instead of correlated subqueries)
// ==========================
$stmt = $mysqli->prepare("
    SELECT 
        c.id, c.type, c.source, c.purpose, c.amount, c.category, c.refId, c.remarks, 
        c.date, c.createdAt, c.approval_status, c.approved_by, c.approved_at, c.reject_reason,
        ce.id AS pending_edit_id,
        ce.new_amount AS pending_new_amount
    FROM cash c
    LEFT JOIN cash_edits ce ON ce.cash_id = c.id AND ce.status = 'pending'
    ORDER BY c.date DESC, c.id DESC
");

$stmt->execute();

$data = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

// ==========================
// ✅ Total In / Out
// ==========================
$stmt = $mysqli->prepare("
    SELECT 
        type,
        IFNULL(SUM(amount),0) as total
    FROM cash
    GROUP BY type
");

$stmt->execute();

$rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

$totalIn = 0;
$totalOut = 0;

foreach ($rows as $r) {

    if ($r['type'] === 'in') {
        $totalIn = (float)$r['total'];
    }

    if ($r['type'] === 'out') {
        $totalOut = (float)$r['total'];
    }
}

// ==========================
// ✅ Response
// ==========================
sendJson([
    "success" => true,

    "summary" => [
        "totalIn" => $totalIn,
        "totalOut" => $totalOut,
        "net" => $totalIn - $totalOut
    ],

    "totalData" => count($data),

    // all rows
    "data" => $data
]);