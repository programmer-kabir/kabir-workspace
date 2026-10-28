<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");

$raw = file_get_contents("php://input");
$data = json_decode($raw, true) ?? $_POST;

$deposit_id          = intval($data['deposit_id'] ?? 0);
$adjustment_mode     = trim($data['adjustment_mode'] ?? 'net_deduct'); // 'net_deduct', 'gross_full', 'custom'
$selected_expense_ids = $data['selected_expense_ids'] ?? []; // Array of cash IDs to deduct
$custom_target       = isset($data['custom_target_amount']) ? floatval($data['custom_target_amount']) : null;
$admin_id            = intval($data['admin_id'] ?? 290);

if ($deposit_id <= 0) {
    echo json_encode(["success" => false, "message" => "ডিপোজিট আইডি আবশ্যক"], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!in_array($adjustment_mode, ['net_deduct', 'gross_full', 'custom'])) {
    echo json_encode(["success" => false, "message" => "অবৈধ অ্যাডজাস্টমেন্ট মোড"], JSON_UNESCAPED_UNICODE);
    exit;
}

// 1. Fetch current record
$stmt = $mysqli->prepare("SELECT id, collection_date, total_cash_in, total_cash_out, deposited_amount, status FROM daily_bank_deposits WHERE id = ?");
$stmt->bind_param("i", $deposit_id);
$stmt->execute();
$record = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$record) {
    echo json_encode(["success" => false, "message" => "রেকর্ড পাওয়া যায়নি"], JSON_UNESCAPED_UNICODE);
    exit;
}

$cDate = $record['collection_date'];

// 2. Re-query real-time cash in and cash out for this date
$cashStmt = $mysqli->prepare("
    SELECT 
        SUM(CASE WHEN type='in' THEN amount ELSE 0 END) as total_in,
        SUM(CASE WHEN type='out' THEN amount ELSE 0 END) as total_out
    FROM cash 
    WHERE date = ? AND approval_status = 'approved'
");
$cashStmt->bind_param("s", $cDate);
$cashStmt->execute();
$cashRow = $cashStmt->get_result()->fetch_assoc();
$cashStmt->close();

$totalIn = floatval($cashRow['total_in'] ?? 0);
$totalOut = floatval($cashRow['total_out'] ?? 0);

// 3. Calculate expected amount and selected deductions
$newExpected = 0.0;
$deductedAmount = 0.0;
$deductedIdsJson = null;

if ($adjustment_mode === 'gross_full') {
    $newExpected = $totalIn;
    $deductedAmount = 0.0;
    $deductedIdsJson = '[]';
} elseif ($adjustment_mode === 'net_deduct') {
    $deductedAmount = $totalOut;
    $newExpected = max(0.0, $totalIn - $totalOut);
    $deductedIdsJson = null; // null indicates all out was deducted
} elseif ($adjustment_mode === 'custom') {
    if (is_array($selected_expense_ids) && !empty($selected_expense_ids)) {
        $cleanIds = array_map('intval', $selected_expense_ids);
        $cleanIds = array_filter($cleanIds, fn($id) => $id > 0);
        
        if (!empty($cleanIds)) {
            $inClause = implode(',', $cleanIds);
            $outQuery = "SELECT id, amount FROM cash WHERE id IN ({$inClause}) AND date = '{$cDate}' AND type = 'out' AND approval_status = 'approved'";
            $outRes = $mysqli->query($outQuery);
            $validIds = [];
            if ($outRes) {
                while ($orow = $outRes->fetch_assoc()) {
                    $validIds[] = intval($orow['id']);
                    $deductedAmount += floatval($orow['amount']);
                }
            }
            $deductedIdsJson = json_encode($validIds);
        } else {
            $deductedIdsJson = '[]';
            $deductedAmount = 0.0;
        }
    } else {
        $deductedIdsJson = '[]';
        $deductedAmount = 0.0;
    }
    
    // Target is Cash In minus the selected drawer expenses
    $newExpected = max(0.0, $totalIn - $deductedAmount);
}

$deposited = floatval($record['deposited_amount']);
$newShortage = max(0.0, $newExpected - $deposited);

// 4. Update daily_bank_deposits
$upStmt = $mysqli->prepare("
    UPDATE daily_bank_deposits
    SET expected_amount = ?,
        total_cash_in = ?,
        total_cash_out = ?,
        adjustment_mode = ?,
        custom_target_amount = ?,
        deducted_expense_ids = ?,
        deducted_expense_amount = ?,
        shortage_amount = ?,
        admin_adjusted_by = ?,
        admin_adjusted_at = NOW()
    WHERE id = ?
");
$upStmt->bind_param(
    "dddsssddii",
    $newExpected,
    $totalIn,
    $totalOut,
    $adjustment_mode,
    $custom_target,
    $deductedIdsJson,
    $deductedAmount,
    $newShortage,
    $admin_id,
    $deposit_id
);

if ($upStmt->execute()) {
    $upStmt->close();
    echo json_encode([
        "success" => true,
        "message" => "খরচ সমন্বয় ও ব্যাংক জমার পলিসি সফলভাবে সেভ হয়েছে! ✅",
        "data" => [
            "id" => $deposit_id,
            "collection_date" => $cDate,
            "adjustment_mode" => $adjustment_mode,
            "total_cash_in" => $totalIn,
            "total_cash_out" => $totalOut,
            "deducted_expense_amount" => $deductedAmount,
            "deducted_expense_ids" => $deductedIdsJson ? json_decode($deductedIdsJson, true) : null,
            "expected_amount" => $newExpected,
            "deposited_amount" => $deposited,
            "shortage_amount" => $newShortage
        ]
    ], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode(["success" => false, "message" => "আপডেট ব্যর্থ: " . $upStmt->error], JSON_UNESCAPED_UNICODE);
}
