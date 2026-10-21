<?php
// require_once __DIR__ . '/../db.php';
// require_once __DIR__ . '/../cors.php';

// // =======================
// // Debug (remove in production)
// // =======================
// ini_set('display_errors', 1);
// ini_set('display_startup_errors', 1);
// error_reporting(E_ALL);

// header("Content-Type: application/json; charset=utf-8");

// // =======================
// // Timezone
// // =======================
// date_default_timezone_set('Asia/Dhaka');

// // =======================
// // POST Data
// // =======================
// $investor_id     = intval($_POST["investor_id"] ?? 0);
// $card_id         = intval($_POST["card_id"] ?? 0);
// $status          = $_POST["status"] ?? "";        // withdraw / reinvest
// $action_name     = $_POST["action_name"] ?? "";   // pending
// $payment_method  = $_POST["payment_method"] ?? "";
// $amount          = floatval($_POST["amount"] ?? 0);
// $start_date      = $_POST["start_date"] ?? null;
// $end_date        = $_POST["end_date"] ?? null;
// $requested_at    = $_POST["requested_at"] ?? null;

// // auto created time
// $created_at = date('Y-m-d H:i:s');

// // =======================
// // Validation
// // =======================
// if (
//     !$investor_id ||
//     !$card_id ||
//     !$amount ||
//     !$status ||
//     !$action_name ||
//     !$start_date ||
//     !$end_date ||
//     !$requested_at
// ) {
//     echo json_encode([
//         "success" => false,
//         "message" => "Invalid data provided"
//     ]);
//     exit;
// }

// // =======================
// // Profit year calculate
// // =======================
// $profit_year = intval(date('Y', strtotime($end_date)));

// // =======================
// // Duplicate Check (same year + same status)
// // =======================
// $check = $mysqli->prepare("
//     SELECT id
//     FROM profit_history
//     WHERE investor_id = ?
//       AND card_id = ?
//       AND profit_year = ?
//       AND status = ?
//     LIMIT 1
// ");

// if (!$check) {
//     echo json_encode([
//         "success" => false,
//         "message" => "Prepare failed: " . $mysqli->error
//     ]);
//     exit;
// }

// $check->bind_param(
//     "iiis",
//     $investor_id,
//     $card_id,
//     $profit_year,
//     $status
// );

// $check->execute();
// $checkRes = $check->get_result();

// if ($checkRes->num_rows > 0) {
//     echo json_encode([
//         "success" => false,
//         "message" => "You have already taken a decision for this year"
//     ]);
//     exit;
// }

// // =======================
// // INSERT Profit History
// // =======================
// $stmt = $mysqli->prepare("
//     INSERT INTO profit_history
//     (
//         investor_id,
//         card_id,
//         status,
//         action_name,
//         payment_method,
//         amount,
//         start_date,
//         end_date,
//         profit_year,
//         requested_at,
//         created_at
//     )
//     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
// ");

// if (!$stmt) {
//     echo json_encode([
//         "success" => false,
//         "message" => "Prepare failed: " . $mysqli->error
//     ]);
//     exit;
// }

// // =======================
// // Bind Params (VERY IMPORTANT)
// // =======================
// $stmt->bind_param(
//     "iisssdssiss",
//     $investor_id,     // i
//     $card_id,         // i
//     $status,          // s
//     $action_name,     // s
//     $payment_method, // s
//     $amount,          // d
//     $start_date,      // s
//     $end_date,        // s
//     $profit_year,     // i
//     $requested_at,    // s
//     $created_at       // s
// );

// // =======================
// // Execute
// // =======================
// if ($stmt->execute()) {
//     echo json_encode([
//         "success"      => true,
//         "profit_year"  => $profit_year,
//         "requested_at" => $requested_at,
//         "created_at"   => $created_at
//     ]);
// } else {
//     echo json_encode([
//         "success" => false,
//         "message" => "Execute failed: " . $stmt->error
//     ]);
// }

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

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