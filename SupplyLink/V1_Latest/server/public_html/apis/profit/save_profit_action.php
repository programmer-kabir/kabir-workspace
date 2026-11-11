<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';
requireAuth();

header("Content-Type: application/json; charset=utf-8");
date_default_timezone_set('Asia/Dhaka');

function apiError($message, $debug = null, $code = 400) {
    http_response_code($code);
    echo json_encode([
        "success" => false,
        "message" => $message,
        "debug"   => $debug
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$mysqli->set_charset("utf8mb4");

// =======================
// INPUT
// =======================
$investor_id    = (int)($_POST['investor_id'] ?? 0);
$card_id        = (int)($_POST['card_id'] ?? 0);

$status         = strtolower(trim($_POST['status'] ?? ''));        // withdraw
$action_name    = strtolower(trim($_POST['action_name'] ?? ''));   // pending

$payment_method = trim($_POST['payment_method'] ?? '');
$amount         = (float)($_POST['amount'] ?? 0);

$start_date     = trim($_POST['start_date'] ?? '');
$end_date       = trim($_POST['end_date'] ?? '');
$requested_at   = trim($_POST['requested_at'] ?? '');

// ✅ "monthly" | "yearly"
$period_type    = strtolower(trim($_POST['period_type'] ?? 'yearly'));

$created_at = date('Y-m-d H:i:s');

// =======================
// VALIDATION
// =======================
if (!$investor_id || !$card_id || !$amount || !$status || !$action_name || !$start_date || !$end_date || !$requested_at) {
    apiError("Invalid data provided");
}

if ($status !== 'withdraw') apiError("Only withdraw allowed here");
if ($action_name !== 'pending') apiError("Only pending allowed here");

if (!in_array($period_type, ['monthly','yearly'], true)) {
    apiError("Invalid period_type", $period_type);
}

// =======================
// PROFIT PERIOD (from end_date)
// =======================
$end_ts = strtotime($end_date);
if (!$end_ts) apiError("Invalid end_date", $end_date);

$profit_year  = (int)date('Y', $end_ts);
$profit_month = ($period_type === 'monthly') ? (int)date('n', $end_ts) : 0; // 1-12 else 0

// =======================
// 🔒 DUPLICATE CHECK
// Same investor+card+year+month
// pending/approved থাকলে BLOCK
// rejected থাকলে allow
// =======================
$check = $mysqli->prepare("
    SELECT id
    FROM profit_history
    WHERE investor_id = ?
      AND card_id = ?
      AND profit_year = ?
      AND profit_month = ?
      AND status = 'withdraw'
      AND action_name IN ('pending','approved')
    LIMIT 1
");

if (!$check) apiError("Prepare failed", $mysqli->error, 500);

$check->bind_param("iiii", $investor_id, $card_id, $profit_year, $profit_month);
$check->execute();
$res = $check->get_result();

if ($res && $res->num_rows > 0) {
    apiError("You already have a pending/approved withdraw for this period");
}

// =======================
// INSERT
// =======================
$stmt = $mysqli->prepare("
    INSERT INTO profit_history (
        investor_id,
        card_id,
        status,
        action_name,
        amount,
        start_date,
        end_date,
        profit_year,
        profit_month,
        requested_at,
        payment_method,
        created_at
    ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
");

if (!$stmt) apiError("Prepare failed", $mysqli->error, 500);

$stmt->bind_param(
    "iissdssiisss",
    $investor_id,
    $card_id,
    $status,
    $action_name,
    $amount,
    $start_date,
    $end_date,
    $profit_year,
    $profit_month,
    $requested_at,
    $payment_method,
    $created_at
);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "id" => (int)$stmt->insert_id,
        "profit_year" => $profit_year,
        "profit_month" => $profit_month,
        "period_type" => $period_type,
        "message" => "Withdraw request submitted"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

apiError("Insert failed", $stmt->error, 500);