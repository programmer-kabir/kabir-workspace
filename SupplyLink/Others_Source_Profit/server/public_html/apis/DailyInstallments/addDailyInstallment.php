<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header('Content-Type: application/json; charset=UTF-8');
date_default_timezone_set('Asia/Dhaka');

$data = json_decode(file_get_contents("php://input"), true);

$amount   = $data['amount'] ?? null;
$date     = $data['date'] ?? null;
$receiver = $data['receiver'] ?? null;
$userId   = $data['userId'] ?? null;
$cardId   = $data['cardId'] ?? null;

// VALIDATION
if (!$amount || !$date || !$receiver || !$userId || !$cardId) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "All fields are required!"
    ]);
    exit;
}

if (!is_numeric($amount) || (float)$amount <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "Amount must be a positive number"
    ]);
    exit;
}

$amount = (float)$amount;
$now    = date('Y-m-d H:i:s');

// 🔥 DUPLICATE CHECK
$stmt = $mysqli->prepare("
    SELECT id FROM daily_installments 
    WHERE userId = ? AND cardId = ? AND date = ? LIMIT 1
");

$stmt->bind_param("iis", $userId, $cardId, $date);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows > 0) {
    echo json_encode([
        "success" => false,
        "message" => "Already added for this date ❌"
    ]);
    exit;
}
$stmt->close();

// 🔥 INSERT INTO daily_installments
$stmt = $mysqli->prepare("
    INSERT INTO daily_installments 
    (userId, cardId, amount, date, receiver) 
    VALUES (?, ?, ?, ?, ?)
");

$stmt->bind_param("iidss", $userId, $cardId, $amount, $date, $receiver);
if (!$stmt->execute()) {
    echo json_encode([
        "success" => false,
        "message" => "Failed to insert installment: " . $stmt->error
    ]);
    exit;
}

$insertId = $stmt->insert_id;
$stmt->close();

// 🔥 FETCH CUSTOMER, RECEIVER & CARD DETAILS FOR NOTIFICATION & AUDIT
$customerData = null;
$customerName = "User #$userId";
$stmtCust = $mysqli->prepare("SELECT id, name, mobile, email, id_number FROM users WHERE id = ? LIMIT 1");
if ($stmtCust) {
    $stmtCust->bind_param("i", $userId);
    $stmtCust->execute();
    $customerData = $stmtCust->get_result()->fetch_assoc();
    if ($customerData && !empty($customerData['name'])) {
        $customerName = $customerData['name'];
    }
    $stmtCust->close();
}

$receiverData = null;
$receiverName = "Staff #$receiver";
$stmtRecv = $mysqli->prepare("SELECT id, name, mobile, email FROM users WHERE id = ? LIMIT 1");
if ($stmtRecv) {
    $stmtRecv->bind_param("i", $receiver);
    $stmtRecv->execute();
    $receiverData = $stmtRecv->get_result()->fetch_assoc();
    if ($receiverData && !empty($receiverData['name'])) {
        $receiverName = $receiverData['name'];
    }
    $stmtRecv->close();
}

// 💳 Fetch Installment Card Info
$cardData = null;
$stmtCard = $mysqli->prepare("SELECT id, card_number, product_name, sale_price FROM installment_cards WHERE id = ? OR card_number = ? LIMIT 1");
if ($stmtCard) {
    $stmtCard->bind_param("is", $cardId, $cardId);
    $stmtCard->execute();
    $cardData = $stmtCard->get_result()->fetch_assoc();
    $stmtCard->close();
}

// 🔥 AUTOMATIC CASH IN SYNC (Directly into cash table)
$cashRefId    = "daily_installment_" . $insertId;
$cashSource   = "{$customerName} - কার্ড #{$cardId} (দৈনিক কিস্তি)";
$cashPurpose  = "দৈনিক কিস্তি আদায়";
$cashCategory = "daily-installment";
$cashRemarks  = "দৈনিক কিস্তি আদায়: গ্রাহক {$customerName} (ID: {$userId}), কার্ড #{$cardId}, সংগ্রাহক: {$receiverName}";
$cashType     = "in";
$cashApproval = "approved";

$stmtCash = $mysqli->prepare("
    INSERT INTO cash 
    (type, source, purpose, amount, category, refId, remarks, date, createdAt, approval_status, approved_by, approved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
");
if ($stmtCash) {
    $stmtCash->bind_param(
        "sssdssssssis",
        $cashType,
        $cashSource,
        $cashPurpose,
        $amount,
        $cashCategory,
        $cashRefId,
        $cashRemarks,
        $date,
        $now,
        $cashApproval,
        $receiver,
        $now
    );
    $stmtCash->execute();
    $stmtCash->close();
}

// 🔥 DISPATCH NOTIFICATION TO ADMIN & DEVELOPER
$targetRoles = '["admin","developer"]';
$notifType = 'daily_installment_deposit';
$notifTitle = 'দৈনিক কিস্তি জমা হয়েছে';
$notifMsg = "{$customerName} (ID: {$userId}) এর কার্ড #{$cardId} এ ৳" . number_format($amount, 2) . " দৈনিক কিস্তি জমা দিয়েছেন {$receiverName}।";
$notifLink = "/DailyInstallments/daily_installments_users/{$cardId}";

$stmtNotif = $mysqli->prepare("
    INSERT INTO notifications 
    (user_id, target_roles, type, title, message, link, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?)
");
if ($stmtNotif) {
    $stmtNotif->bind_param("issssss", $receiver, $targetRoles, $notifType, $notifTitle, $notifMsg, $notifLink, $now);
    $stmtNotif->execute();
    $stmtNotif->close();
}

// 📧 SEND EMAIL TO CUSTOMER (IF EMAIL PRESENT) & TO ADMIN (AUDIT ALERT)
try {
    require_once __DIR__ . '/../helpers/mailer.php';
    $installmentPayload = [
        'id'        => $insertId,
        'amount'    => $amount,
        'date'      => $date,
        'time'      => date('h:i:s A'),
        'ref_id'    => $cashRefId,
        'card_id'   => $cardId,
        'user_id'   => $userId,
        'receiver'  => $receiver,
    ];
    sendDailyInstallmentNotification($installmentPayload, $customerData, $cardData, $receiverData);
} catch (Throwable $e) {
    error_log("Daily installment email notification error: " . $e->getMessage());
}

// 🔥 FETCH COMPLETE RECORD
$result = $mysqli->query("SELECT * FROM daily_installments WHERE id = $insertId");
$row = $result->fetch_assoc();

echo json_encode([
    "success" => true,
    "message" => "Payment Added & Cash In Synced Successfully ✅",
    "data" => $row,
    "cash_synced" => true,
    "receipt" => [
        "id" => $insertId,
        "amount" => $amount,
        "date" => $date,
        "customerName" => $customerName,
        "userId" => $userId,
        "cardId" => $cardId,
        "receiverName" => $receiverName,
        "receiverId" => $receiver,
        "refId" => $cashRefId,
        "createdAt" => $now
    ]
]);