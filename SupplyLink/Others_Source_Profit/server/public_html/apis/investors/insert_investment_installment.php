<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=UTF-8");

// Only POST allowed
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        "success" => false,
        "error" => "Invalid request method"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Read JSON body
$input = json_decode(file_get_contents("php://input"), true);

// Validate required fields
$requiredFields = [
    "investment_card_no",
    "investor_id",
    "installment_no",
    "installment_date",
    "amount",
    "signature_by"
];

foreach ($requiredFields as $field) {
    if (!isset($input[$field]) || $input[$field] === "") {
        echo json_encode([
            "success" => false,
            "error" => "Missing field: $field"
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// Sanitize / assign
$investment_card_no = $input["investment_card_no"];
$investor_id        = (int) $input["investor_id"];
$installment_no     = (int) $input["installment_no"];
$installment_date   = $input["installment_date"];
$amount             = (float) $input["amount"];
$signature_by       = (int) $input["signature_by"];

// 1. Fetch Investor Name & Card Name
$investorName = "ইনভেস্টর";
$stmtInv = $mysqli->prepare("SELECT name FROM users WHERE id = ? LIMIT 1");
if ($stmtInv) {
    $stmtInv->bind_param("i", $investor_id);
    $stmtInv->execute();
    $resInv = $stmtInv->get_result()->fetch_assoc();
    if ($resInv && !empty($resInv['name'])) {
        $investorName = $resInv['name'];
    }
    $stmtInv->close();
}

$cardName = "কার্ড #{$investment_card_no}";
$cardIdInt = (int)$investment_card_no;
$stmtCard = $mysqli->prepare("SELECT card_name FROM investment_cards WHERE id = ? LIMIT 1");
if ($stmtCard) {
    $stmtCard->bind_param("i", $cardIdInt);
    $stmtCard->execute();
    $resCard = $stmtCard->get_result()->fetch_assoc();
    if ($resCard && !empty($resCard['card_name'])) {
        $cardName = $resCard['card_name'];
    }
    $stmtCard->close();
}

// 2. Fetch Collector / Staff Name
$collectorName = "কর্মী";
$stmtCol = $mysqli->prepare("SELECT name FROM users WHERE id = ? LIMIT 1");
if ($stmtCol) {
    $stmtCol->bind_param("i", $signature_by);
    $stmtCol->execute();
    $resCol = $stmtCol->get_result()->fetch_assoc();
    if ($resCol && !empty($resCol['name'])) {
        $collectorName = $resCol['name'];
    }
    $stmtCol->close();
}

// Prepare SQL for Installment Insert
$sql = "INSERT INTO investment_installments 
(
    investment_card_no,
    investor_id,
    investment_no,
    investment_date,
    amount,
    signature_by
)
VALUES (?, ?, ?, ?, ?, ?)";

$stmt = $mysqli->prepare($sql);

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "error" => "Prepare failed: " . $mysqli->error
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Bind params
$stmt->bind_param(
    "siisss",
    $investment_card_no,
    $investor_id,
    $installment_no,
    $installment_date,
    $amount,
    $signature_by
);

// Execute
if ($stmt->execute()) {
    $insertId = $stmt->insert_id;
    $stmt->close();

    // 2.5 💰 ক্যাশ ম্যানেজমেন্টে সরাসরি Cash In রেকর্ড করা
    $cashSource = "{$investorName} - কার্ড #{$investment_card_no} ({$cardName}) - কিস্তি #{$installment_no}";
    $cashPurpose = "বিনিয়োগ কিস্তি আদায়";
    $cashCategory = "investment";
    $cashRefId = "inv_inst_" . $insertId;
    $cashRemarks = "ইনভেস্টর আইডি #{$investor_id} - কিস্তি #{$installment_no} (আদায়কারী: {$collectorName})";

    $stmtCash = $mysqli->prepare("
        INSERT INTO cash (type, source, purpose, amount, category, refId, remarks, date, createdAt, approval_status, approved_by, approved_at)
        VALUES ('in', ?, ?, ?, ?, ?, ?, ?, NOW(), 'approved', ?, NOW())
    ");
    if ($stmtCash) {
        $stmtCash->bind_param("ssdssssi", $cashSource, $cashPurpose, $amount, $cashCategory, $cashRefId, $cashRemarks, $installment_date, $signature_by);
        $stmtCash->execute();
        $stmtCash->close();
    }

    // 3. Create Notification for Admin and Developer
    $formattedAmount = number_format($amount, 2);
    $notifTitle = "নতুন বিনিয়োগ কিস্তি আদায়";
    $notifMessage = "{$collectorName} ইনভেস্টর {$investorName} এর কার্ড #{$investment_card_no} ({$cardName})-এ ৳{$formattedAmount} টাকা বিনিয়োগ কিস্তি জমা করেছেন।";
    $notifLink = "/investors/investment_payments?card_id={$investment_card_no}";

    $stmtNotif = $mysqli->prepare("
        INSERT INTO notifications (target_roles, type, title, message, link, created_at)
        VALUES ('admin,developer', 'investment_deposit', ?, ?, ?, NOW())
    ");
    if ($stmtNotif) {
        $stmtNotif->bind_param("sss", $notifTitle, $notifMessage, $notifLink);
        $stmtNotif->execute();
        $stmtNotif->close();
    }

    echo json_encode([
        "success" => true,
        "message" => "Installment added successfully",
        "insert_id" => $insertId,
        "data" => [
            "installment_no" => $installment_no,
            "amount" => $amount,
            "investor_name" => $investorName,
            "card_name" => $cardName,
            "card_id" => $investment_card_no,
            "collector_name" => $collectorName,
            "date" => $installment_date
        ]
    ], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode([
        "success" => false,
        "error" => "Execute failed: " . $stmt->error
    ], JSON_UNESCAPED_UNICODE);
    $stmt->close();
}

$mysqli->close();
