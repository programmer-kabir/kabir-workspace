<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json");

// Only POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "error" => "Method not allowed. Use POST."
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Read JSON body
$raw = file_get_contents("php://input");
$input = json_decode($raw, true);

if (!is_array($input)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => "Invalid JSON body"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Required fields
$investor_id  = isset($input["investor_id"]) ? (int)$input["investor_id"] : 0;
$card_name    = isset($input["card_name"]) ? trim($input["card_name"]) : "";
$payment_type = isset($input["payment_type"]) ? trim($input["payment_type"]) : "flexible";
$start_date   = isset($input["start_date"]) ? trim($input["start_date"]) : "";
$reference_user_id = null;
if (array_key_exists("reference_user_id", $input) && $input["reference_user_id"] !== "" && $input["reference_user_id"] !== null) {
    $reference_user_id = (int)$input["reference_user_id"];
    if ($reference_user_id <= 0) {
        $reference_user_id = null;
    }
}
// Optional (but we will override defaults safely)
$status = isset($input["status"]) ? trim($input["status"]) : "running";

// Validate
if ($investor_id <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "investor_id is required"], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($card_name === "") {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "card_name is required"], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($start_date === "") {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "start_date is required"], JSON_UNESCAPED_UNICODE);
    exit;
}

// Basic date format check YYYY-MM-DD
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $start_date)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "start_date must be YYYY-MM-DD"], JSON_UNESCAPED_UNICODE);
    exit;
}

// Status normalize (only running/closed allowed as per your enum)
$status = strtolower($status);
if ($status !== "running" && $status !== "closed") {
    $status = "running";
}

// created_at default today (db column type date)
$created_at = date("Y-m-d");

// ✅ Insert with maturity_date auto from start_date
$sql = "INSERT INTO investment_cards
        (investor_id, card_name, payment_type, start_date, maturity_date, status, created_at, reference_user_id)
        VALUES (?, ?, ?, ?, DATE_ADD(?, INTERVAL 1 YEAR), ?, ?, ?)";

$stmt = $mysqli->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Prepare failed: " . $mysqli->error
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// bind: i = int, s = string
$stmt->bind_param(
     "issssssi",
    $investor_id,
    $card_name,
    $payment_type,
    $start_date,
    $start_date, // for DATE_ADD
    $status,
    $created_at,
       $reference_user_id // ✅ NEW
);

$ok = $stmt->execute();

if (!$ok) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Execute failed: " . $stmt->error
    ], JSON_UNESCAPED_UNICODE);
    $stmt->close();
    exit;
}

$newId = $stmt->insert_id;
$stmt->close();

$actorData = [
    "id"   => isset($input["actor_id"]) ? (int)$input["actor_id"] : null,
    "name" => isset($input["actor_name"]) ? trim($input["actor_name"]) : "Admin / Staff",
    "role" => isset($input["actor_role"]) ? trim($input["actor_role"]) : "admin"
];

// Return created row (optional but helpful)
$get = $mysqli->prepare("SELECT * FROM investment_cards WHERE id = ?");
if ($get) {
    $get->bind_param("i", $newId);
    $get->execute();
    $res = $get->get_result();
    $row = $res ? $res->fetch_assoc() : null;
    $get->close();
} else {
    $row = null;
}

// 👤 Ensure user has 'investor' role assigned
try {
    $roleStmt = $mysqli->prepare("
        INSERT INTO user_roles (user_id, role, assigned_at) 
        VALUES (?, 'investor', NOW())
        ON DUPLICATE KEY UPDATE assigned_at = assigned_at
    ");
    if ($roleStmt) {
        $roleStmt->bind_param("i", $investor_id);
        $roleStmt->execute();
        $roleStmt->close();
    }
} catch (Throwable $e) {
    error_log("Failed to assign investor role: " . $e->getMessage());
}

// 📧 Fetch investor details for email notification
$userData = null;
$userStmt = $mysqli->prepare("SELECT id, name, mobile, email, id_number FROM users WHERE id = ? LIMIT 1");
if ($userStmt) {
    $userStmt->bind_param("i", $investor_id);
    $userStmt->execute();
    $uRes = $userStmt->get_result();
    $userData = $uRes ? $uRes->fetch_assoc() : null;
    $userStmt->close();
}

// 👔 Fetch reference staff details if present
$staffData = null;
if (!empty($reference_user_id)) {
    $sStmt = $mysqli->prepare("SELECT id, name, mobile, email FROM users WHERE id = ? LIMIT 1");
    if ($sStmt) {
        $sStmt->bind_param("i", $reference_user_id);
        $sStmt->execute();
        $sRes = $sStmt->get_result();
        $staffData = $sRes ? $sRes->fetch_assoc() : null;
        $sStmt->close();
    }
}

// 🚀 Send Email & In-App Notification (Admin alert + User notice if email exists)
try {
    require_once __DIR__ . '/../helpers/mailer.php';
    $cardData = [
        "id"            => $newId,
        "card_name"     => $card_name,
        "payment_type"  => $payment_type,
        "start_date"    => $start_date,
        "maturity_date" => $row['maturity_date'] ?? date('Y-m-d', strtotime('+1 year', strtotime($start_date))),
        "status"        => $status,
    ];
    sendInvestmentCardCreatedNotification($cardData, $userData, $actorData, $staffData);
} catch (Throwable $e) {
    error_log("Investment card email notification failed: " . $e->getMessage());
}

echo json_encode([
    "success" => true,
    "message" => "ইনভেস্টমেন্ট কার্ড সফলভাবে তৈরি হয়েছে!",
    "id" => (int)$newId,
    "data" => $row
], JSON_UNESCAPED_UNICODE);

