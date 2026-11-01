<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers/mailer.php';

header("Content-Type: application/json; charset=UTF-8");

$deposit_id         = intval($_POST['deposit_id'] ?? 0);
$collection_date    = trim($_POST['collection_date'] ?? '');
$deposit_date       = trim($_POST['deposit_date'] ?? date('Y-m-d'));
$bank_name          = trim($_POST['bank_name'] ?? '');
$account_no         = trim($_POST['account_no'] ?? '');
$deposited_amount   = floatval($_POST['deposited_amount'] ?? 0);
$discrepancy_reason = trim($_POST['discrepancy_reason'] ?? '');
$submitted_by       = intval($_POST['submitted_by'] ?? 290);
$user_role          = strtolower(trim($_POST['user_role'] ?? ''));

if ($user_role === 'admin' || $user_role === 'developer') {
    echo json_encode([
        "success" => false,
        "message" => "এডমিন ডিপোজিট জমা দেবেন না। এটি ফিল্ড স্টাফ বা ব্রাঞ্চ ম্যানেজারের দায়িত্ব।"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($deposited_amount <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "সঠিক জমা টাকার পরিমাণ দিন"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($bank_name === '') {
    echo json_encode([
        "success" => false,
        "message" => "ব্যাংকের নাম নির্বাচন করুন"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 1. Locate the record
if ($deposit_id > 0) {
    $stmt = $mysqli->prepare("SELECT id, collection_date, total_cash_in, deducted_expense_amount, adjustment_mode, expected_amount, status, slip_image FROM daily_bank_deposits WHERE id = ?");
    $stmt->bind_param("i", $deposit_id);
} else {
    $stmt = $mysqli->prepare("SELECT id, collection_date, total_cash_in, deducted_expense_amount, adjustment_mode, expected_amount, status, slip_image FROM daily_bank_deposits WHERE collection_date = ?");
    $stmt->bind_param("s", $collection_date);
}
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

$id = $record['id'];
$cDate = $record['collection_date'];
$expected_amount = floatval($record['expected_amount']);
$shortage = max(0, $expected_amount - $deposited_amount);

// If there is shortage, reason is mandatory; otherwise clear discrepancy reason
if ($shortage > 0) {
    if (empty($discrepancy_reason)) {
        echo json_encode([
            "success" => false,
            "message" => "আদায়ের চেয়ে ৳ " . number_format($shortage, 2) . " টাকা কম জমা দিচ্ছেন! ক্যাশ কম জমার কারণ বা কৈফিয়ত উল্লেখ করা বাধ্যতামূলক।"
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
} else {
    $discrepancy_reason = '';
}

// 2. Handle Slip Image Upload safely
$slipPath = $record['slip_image'] ?? '';
if (isset($_FILES['slip_image']) && $_FILES['slip_image']['error'] === UPLOAD_ERR_OK) {
    $fileTmp  = $_FILES['slip_image']['tmp_name'];
    $fileExt  = strtolower(pathinfo($_FILES['slip_image']['name'], PATHINFO_EXTENSION));
    $allowed  = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];

    if (!in_array($fileExt, $allowed)) {
        echo json_encode([
            "success" => false,
            "message" => "অনুমোদিত ফাইল ফরম্যাট: JPG, JPEG, PNG, WEBP, PDF"
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $uploadDir = __DIR__ . '/../../uploads/bank_slips/';
    if (!is_dir($uploadDir)) {
        @mkdir($uploadDir, 0777, true);
    }

    $fileName = 'slip_' . $id . '_' . time() . '.' . $fileExt;
    $targetPath = $uploadDir . $fileName;

    if (@move_uploaded_file($fileTmp, $targetPath)) {
        $slipPath = 'uploads/bank_slips/' . $fileName;
    }
}

if (empty($slipPath)) {
    echo json_encode([
        "success" => false,
        "message" => "ব্যাংক জমার সিলযুক্ত স্লিপ বা রসিদের ছবি আপলোড করা বাধ্যতামূলক।"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 3. Update Record in Database
$updateStmt = $mysqli->prepare("
    UPDATE daily_bank_deposits 
    SET deposit_date = ?,
        bank_name = ?,
        account_no = ?,
        deposited_amount = ?,
        shortage_amount = ?,
        slip_image = ?,
        discrepancy_reason = ?,
        submitted_by = ?,
        submitted_at = NOW(),
        status = 'submitted'
    WHERE id = ?
");

if (!$updateStmt) {
    echo json_encode([
        "success" => false,
        "message" => "Prepare failed: " . $mysqli->error
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$updateStmt->bind_param(
    "sssddssii",
    $deposit_date,
    $bank_name,
    $account_no,
    $deposited_amount,
    $shortage,
    $slipPath,
    $discrepancy_reason,
    $submitted_by,
    $id
);

if ($updateStmt->execute()) {
    $updateStmt->close();

    // 4. Fetch Submitter (Staff) info
    $staffData = [
        'name'  => 'ফিল্ড কর্মী',
        'email' => '',
        'phone' => ''
    ];
    try {
        $uStmt = $mysqli->prepare("SELECT name, email, mobile FROM users WHERE id = ?");
        if ($uStmt) {
            $uStmt->bind_param("i", $submitted_by);
            $uStmt->execute();
            $uRes = $uStmt->get_result()->fetch_assoc();
            if ($uRes) {
                $staffData['name']  = $uRes['name'] ?? 'ফিল্ড কর্মী';
                $staffData['email'] = $uRes['email'] ?? '';
                $staffData['phone'] = $uRes['mobile'] ?? '';
            }
            $uStmt->close();
        }
    } catch (\Throwable $uErr) {
        error_log("Submitter info fetch error: " . $uErr->getMessage());
    }

    $depositData = [
        'id'                      => $id,
        'collection_date'         => $cDate,
        'total_in'                => floatval($record['total_cash_in'] ?? 0),
        'deducted_expense_amount' => floatval($record['deducted_expense_amount'] ?? 0),
        'adjustment_mode'         => $record['adjustment_mode'] ?? 'net',
        'expected_amount'         => $expected_amount,
        'deposited_amount'        => $deposited_amount,
        'shortage'                => $shortage,
        'bank_name'               => $bank_name,
        'account_no'              => $account_no,
        'deposit_date'            => $deposit_date,
        'slip_image'              => $slipPath,
        'discrepancy_reason'      => $discrepancy_reason,
        'submitted_by'            => $submitted_by
    ];

    // 5. Send Automated SupplyLink Email & In-App Alert (Using mailer.php)
    $mailResults = null;
    try {
        if (function_exists('sendBankDepositSubmittedNotification')) {
            $mailResults = sendBankDepositSubmittedNotification($depositData, $staffData);
        }
    } catch (\Throwable $mErr) {
        error_log("Bank reconciliation notification error: " . $mErr->getMessage());
    }

    // 6. Return response to user
    echo json_encode([
        "success" => true,
        "message" => "ব্যাংক জমার স্লিপ ও তথ্য সফলভাবে আপলোড হয়েছে 🎉",
        "data" => [
            "id"               => $id,
            "deposited_amount" => $deposited_amount,
            "shortage_amount"  => $shortage,
            "slip_image"       => $slipPath,
            "status"           => 'submitted',
            "notification"     => $mailResults
        ]
    ], JSON_UNESCAPED_UNICODE);

} else {
    echo json_encode([
        "success" => false,
        "message" => "সংরক্ষণ ব্যর্থ: " . $updateStmt->error
    ], JSON_UNESCAPED_UNICODE);
    $updateStmt->close();
}
