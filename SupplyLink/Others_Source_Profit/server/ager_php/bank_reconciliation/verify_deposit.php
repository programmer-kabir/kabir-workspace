<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");

$raw = file_get_contents("php://input");
$data = json_decode($raw, true) ?? $_POST;

$deposit_id   = intval($data['deposit_id'] ?? 0);
$action       = trim($data['action'] ?? 'verify'); // 'verify' or 'reject'
$verified_by  = intval($data['verified_by'] ?? 290);
$admin_notes  = trim($data['admin_notes'] ?? '');

if ($deposit_id <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "ডিপোজিট আইডি আবশ্যক"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$stmt = $mysqli->prepare("SELECT id, collection_date, expected_amount, deposited_amount, status FROM daily_bank_deposits WHERE id = ?");
$stmt->bind_param("i", $deposit_id);
$stmt->execute();
$record = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$record) {
    echo json_encode([
        "success" => false,
        "message" => "ডিপোজিট রেকর্ড পাওয়া যায়নি"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($action === 'verify') {
    $upStmt = $mysqli->prepare("
        UPDATE daily_bank_deposits 
        SET status = 'verified',
            verified_by = ?,
            verified_at = NOW(),
            admin_notes = ?
        WHERE id = ?
    ");
    $upStmt->bind_param("isi", $verified_by, $admin_notes, $deposit_id);
    if ($upStmt->execute()) {
        $upStmt->close();
        echo json_encode([
            "success" => true,
            "message" => "ব্যাংক জমার স্লিপ ও স্টেটমেন্ট সফলভাবে ভেরিফাই ও সমন্বয় করা হয়েছে! ✅",
            "status"  => "verified"
        ], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "ভেরিফিকেশন ব্যর্থ: " . $upStmt->error
        ], JSON_UNESCAPED_UNICODE);
        $upStmt->close();
    }
} elseif ($action === 'reject') {
    if (empty($admin_notes)) {
        echo json_encode([
            "success" => false,
            "message" => "বাতিল করার কারণ বা আপত্তি উল্লেখ করা আবশ্যক"
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $upStmt = $mysqli->prepare("
        UPDATE daily_bank_deposits 
        SET status = 'rejected',
            admin_notes = ?
        WHERE id = ?
    ");
    $upStmt->bind_param("si", $admin_notes, $deposit_id);
    if ($upStmt->execute()) {
        $upStmt->close();
        echo json_encode([
            "success" => true,
            "message" => "জমা বাতিল ও আপত্তিপত্র পাঠানো হয়েছে। কর্মী পুনরায় সঠিক স্লিপ আপলোড করতে পারবে।",
            "status"  => "rejected"
        ], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "বাতিলকরণ ব্যর্থ: " . $upStmt->error
        ], JSON_UNESCAPED_UNICODE);
        $upStmt->close();
    }
} else {
    echo json_encode([
        "success" => false,
        "message" => "অবৈধ অ্যাকশন"
    ], JSON_UNESCAPED_UNICODE);
}
