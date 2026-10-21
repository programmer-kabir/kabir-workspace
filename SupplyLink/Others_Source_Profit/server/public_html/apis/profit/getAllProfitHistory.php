<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

// ===============================
// DEBUG (dev only)
// ===============================
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Content-Type: application/json; charset=utf-8");

// timezone
date_default_timezone_set('Asia/Dhaka');

// ===============================
// SQL (NO WHERE, NO FILTER)
// ===============================
$sql = "
    SELECT
        id,
        investor_id,
        card_id,
        status,
        amount,
        start_date,
        end_date,
        profit_month,
        profit_year,
       payment_method,
       action_name,
       requested_at,
       remarks,
       decision_at,decision_by,
        created_at
    FROM profit_history
    ORDER BY created_at DESC, id DESC
";

// ===============================
// Query
// ===============================
$result = $mysqli->query($sql);

if (!$result) {
    echo json_encode([
        "success" => false,
        "message" => "Query failed: " . $mysqli->error
    ]);
    exit;
}

// ===============================
// Fetch
// ===============================
$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

// ===============================
// Response
// ===============================
echo json_encode([
    "success" => true,
    "count"   => count($data),
    "data"    => $data
], JSON_UNESCAPED_UNICODE);
