<?php
/**
 * ============================================================================
 * SupplyLink - Down Payment & Cash Synchronization API
 * ফাইল: server/apis/audit/sync_downpayment_to_cash.php
 * ============================================================================
 */

ini_set('display_errors', 0);
error_reporting(E_ALL);

date_default_timezone_set('Asia/Dhaka');

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");

// Helper to return JSON
function sendResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

$rawInput = json_decode(file_get_contents('php://input'), true);
if (is_array($rawInput)) {
    $_REQUEST = array_merge($_REQUEST, $rawInput);
}

$action = trim($_REQUEST['action'] ?? 'audit');

// -----------------------------------------------------------------------------
// ACTION: FIX / SYNC SINGLE DOWN PAYMENT TO CASH
// -----------------------------------------------------------------------------
if ($action === 'fix_single') {
    $payId = (int)($_REQUEST['payment_id'] ?? 0);
    $cardId = (int)($_REQUEST['card_id'] ?? 0);

    if ($payId <= 0 && $cardId <= 0) {
        sendResponse(['success' => false, 'message' => 'অবৈধ পেমেন্ট বা কার্ড আইডি'], 400);
    }

    $stmt = $mysqli->prepare("
        SELECT 
            ip.id AS payment_id,
            ip.card_id,
            ip.installment_no,
            ip.tag,
            ip.due_amount,
            ip.paid_date,
            ip.payment_method,
            ip.receipt_number,
            ip.collected_by,
            ic.card_id AS official_card_id,
            ic.installment_type,
            ic.product_name,
            ic.down_payment AS card_dp,
            ic.delivery_date,
            u.name AS customer_name
        FROM installment_payments ip
        JOIN installment_cards ic ON ic.card_id = ip.card_id
        LEFT JOIN users u ON u.user_id = ic.user_id
        WHERE ip.id = ? LIMIT 1
    ");
    $stmt->bind_param("i", $payId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) {
        sendResponse(['success' => false, 'message' => 'ডাউন পেমেন্ট রেকর্ড খুঁজে পাওয়া যায়নি'], 404);
    }

    $amount = (float)($row['due_amount'] > 0 ? $row['due_amount'] : $row['card_dp']);
    $paidDate = !empty($row['paid_date']) ? $row['paid_date'] : ($row['delivery_date'] ?: date('Y-m-d'));
    $customerName = trim($row['customer_name'] ?: 'Customer');
    $cId = $row['official_card_id'] ?: $row['card_id'];
    $source = "{$customerName} Down Payment Card No {$cId}";
    $purpose = "ডাউন পেমেন্ট আদায় (" . ($row['installment_type'] === 'daily' ? 'দৈনিক কিস্তি' : 'মাসিক কিস্তি') . ")";
    $remarks = "কিস্তি পরিশোধ: ডাউন পেমেন্ট, কার্ড #{$cId} (" . ($row['product_name'] ?: '') . "), মেথড: " . ($row['payment_method'] ?: 'Cash');
    $refId = "INST-PAY-" . (int)$payId;
    $collectedBy = (int)($row['collected_by'] ?: 1);

    // চেক করা অলরেডি ক্যাশে আছে কিনা
    $chk = $mysqli->prepare("SELECT id FROM cash WHERE refId = ? OR refId = ? LIMIT 1");
    $altRef = "downpayment_" . $payId;
    $chk->bind_param("ss", $refId, $altRef);
    $chk->execute();
    $existing = $chk->get_result()->fetch_assoc();
    $chk->close();

    if ($existing) {
        $up = $mysqli->prepare("
            UPDATE cash 
            SET type = 'in', source = ?, purpose = ?, amount = ?, category = 'downpayment',
                remarks = ?, date = ?, approval_status = 'approved', is_deleted = 0
            WHERE id = ?
        ");
        $up->bind_param("ssdssi", $source, $purpose, $amount, $remarks, $paidDate, $existing['id']);
        $up->execute();
        $up->close();

        sendResponse([
            'success' => true,
            'message' => "কার্ড #{$cId} এর ডাউন পেমেন্ট (৳" . number_format($amount) . ") ক্যাশ টেবিলে সফলভাবে আপডেট করা হয়েছে!",
            'cash_id' => $existing['id']
        ]);
    } else {
        $ins = $mysqli->prepare("
            INSERT INTO cash (
                type, source, purpose, amount, category, refId, remarks, date, 
                createdAt, approval_status, approved_by, approved_at, is_deleted
            ) VALUES (
                'in', ?, ?, ?, 'downpayment', ?, ?, ?, NOW(), 'approved', ?, NOW(), 0
            )
        ");
        $ins->bind_param("ssdsssi", $source, $purpose, $amount, $refId, $remarks, $paidDate, $collectedBy);
        $ins->execute();
        $newId = $mysqli->insert_id;
        $ins->close();

        $mysqli->query("UPDATE installment_payments SET status = 'Paid', paid_date = '{$paidDate}' WHERE id = {$payId}");

        sendResponse([
            'success' => true,
            'message' => "কার্ড #{$cId} এর ডাউন পেমেন্ট (৳" . number_format($amount) . ") সফলভাবে ক্যাশ ইন করা হয়েছে!",
            'cash_id' => $newId
        ]);
    }
}

// -----------------------------------------------------------------------------
// ACTION: SYNC ALL MISSING DOWN PAYMENTS
// -----------------------------------------------------------------------------
if ($action === 'sync_all_missing') {
    $sql = "
        SELECT 
            ip.id AS payment_id,
            ip.card_id,
            ip.due_amount,
            ip.paid_date,
            ip.payment_method,
            ip.collected_by,
            ic.card_id AS official_card_id,
            ic.installment_type,
            ic.product_name,
            ic.down_payment AS card_dp,
            ic.delivery_date,
            u.name AS customer_name
        FROM installment_payments ip
        JOIN installment_cards ic ON ic.card_id = ip.card_id
        LEFT JOIN users u ON u.user_id = ic.user_id
        WHERE ip.status = 'Paid' AND (ip.installment_no = 0 OR ip.tag LIKE '%ডাউন%' OR ip.tag LIKE '%down%')
        ORDER BY ip.paid_date ASC, ip.id ASC
    ";
    $res = $mysqli->query($sql);
    $payments = $res ? $res->fetch_all(MYSQLI_ASSOC) : [];

    // ক্যাশের সকল refId ও (তারিখ_টাকা) ক্যাশ ম্যাপ
    $cashRes = $mysqli->query("SELECT id, refId, date, amount FROM cash WHERE category = 'downpayment' AND (is_deleted = 0 OR is_deleted IS NULL)");
    $existingCash = [];
    $existingByDateAmt = [];
    if ($cashRes) {
        while ($c = $cashRes->fetch_assoc()) {
            if (!empty($c['refId'])) {
                $existingCash[$c['refId']] = $c;
            }
            $existingByDateAmt[$c['date'] . '_' . (float)$c['amount']] = $c;
        }
    }

    $syncedCount = 0;
    $totalSyncedAmount = 0.0;

    foreach ($payments as $pay) {
        $payId = (int)$pay['payment_id'];
        $ref1 = "INST-PAY-" . $payId;
        $ref2 = "downpayment_" . $payId;
        $amt = (float)($pay['due_amount'] > 0 ? $pay['due_amount'] : $pay['card_dp']);
        $paidDate = !empty($pay['paid_date']) ? $pay['paid_date'] : ($pay['delivery_date'] ?: date('Y-m-d'));
        $dateAmtKey = $paidDate . '_' . $amt;

        if (isset($existingCash[$ref1]) || isset($existingCash[$ref2]) || isset($existingByDateAmt[$dateAmtKey])) {
            continue;
        }

        $customerName = trim($pay['customer_name'] ?: 'Customer');
        $cId = $pay['official_card_id'] ?: $pay['card_id'];
        $source = "{$customerName} Down Payment Card No {$cId}";
        $purpose = "ডাউন পেমেন্ট আদায় (" . ($pay['installment_type'] === 'daily' ? 'দৈনিক কিস্তি' : 'মাসিক কিস্তি') . ")";
        $remarks = "কিস্তি পরিশোধ: ডাউন পেমেন্ট, কার্ড #{$cId} (" . ($pay['product_name'] ?: '') . "), মেথড: " . ($pay['payment_method'] ?: 'Cash');
        $collectedBy = (int)($pay['collected_by'] ?: 1);

        $ins = $mysqli->prepare("
            INSERT INTO cash (
                type, source, purpose, amount, category, refId, remarks, date, 
                createdAt, approval_status, approved_by, approved_at, is_deleted
            ) VALUES (
                'in', ?, ?, ?, 'downpayment', ?, ?, ?, NOW(), 'approved', ?, NOW(), 0
            )
        ");
        $ins->bind_param("ssdsssi", $source, $purpose, $amt, $ref1, $remarks, $paidDate, $collectedBy);
        if ($ins->execute()) {
            $syncedCount++;
            $totalSyncedAmount += $amt;
        }
        $ins->close();
    }

    sendResponse([
        'success' => true,
        'message' => "মোট {$syncedCount} টি বাদ পড়া ডাউনপেমেন্ট (মোট ৳" . number_format($totalSyncedAmount) . ") সফলভাবে ক্যাশ ইন করা হয়েছে!",
        'synced_count' => $syncedCount,
        'synced_amount' => $totalSyncedAmount
    ]);
}

// -----------------------------------------------------------------------------
// CORE AUDIT: FETCH ALL DOWN PAYMENTS (DAILY & MONTHLY) & COMPARE
// -----------------------------------------------------------------------------
$sqlAllDownPayments = "
    SELECT 
        ip.id AS payment_id,
        ip.card_id,
        ip.installment_no,
        ip.tag,
        ip.due_amount,
        ip.paid_date,
        ip.payment_method,
        ip.receipt_number,
        ip.status AS payment_status,
        ic.card_id AS official_card_id,
        ic.installment_type,
        ic.product_name,
        ic.down_payment AS card_dp,
        ic.delivery_date,
        ic.status AS card_status,
        u.name AS customer_name,
        u.mobile AS customer_mobile,
        u.user_id AS customer_user_id
    FROM installment_payments ip
    JOIN installment_cards ic ON ic.card_id = ip.card_id
    LEFT JOIN users u ON u.user_id = ic.user_id
    WHERE ip.installment_no = 0 OR ip.tag LIKE '%ডাউন%' OR ip.tag LIKE '%down%'
    ORDER BY COALESCE(ip.paid_date, ic.delivery_date) DESC, ip.id DESC
";
$resPayments = $mysqli->query($sqlAllDownPayments);
$allDownPayments = $resPayments ? $resPayments->fetch_all(MYSQLI_ASSOC) : [];

$sqlAllCash = "
    SELECT id, refId, amount, date, source, purpose, remarks, approval_status, is_deleted
    FROM cash
    WHERE category = 'downpayment' AND (is_deleted = 0 OR is_deleted IS NULL)
";
$resCash = $mysqli->query($sqlAllCash);
$cashRows = $resCash ? $resCash->fetch_all(MYSQLI_ASSOC) : [];

$cashByRef = [];
$cashByDateAmount = [];
$totalCashDownAmount = 0.0;

foreach ($cashRows as $c) {
    $amt = (float)$c['amount'];
    $totalCashDownAmount += $amt;
    if (!empty($c['refId'])) {
        $cashByRef[$c['refId']] = $c;
    }
    $k = $c['date'] . '_' . number_format($amt, 2, '.', '');
    if (!isset($cashByDateAmount[$k])) {
        $cashByDateAmount[$k] = $c;
    }
}

$auditList = [];
$totalCardsCount = 0;
$totalExpectedAmount = 0.0;
$syncedCount = 0;
$syncedAmount = 0.0;
$missingCount = 0;
$missingAmount = 0.0;

foreach ($allDownPayments as $item) {
    $payId = (int)$item['payment_id'];
    $cardId = $item['official_card_id'] ?: $item['card_id'];
    $amt = (float)($item['due_amount'] > 0 ? $item['due_amount'] : $item['card_dp']);
    $date = !empty($item['paid_date']) ? $item['paid_date'] : ($item['delivery_date'] ?: '-');
    $isDaily = strtolower(trim($item['installment_type'] ?? '')) === 'daily';
    
    $totalCardsCount++;
    $totalExpectedAmount += $amt;

    $ref1 = "INST-PAY-" . $payId;
    $ref2 = "downpayment_" . $payId;
    $ref3 = "installment_" . $payId;
    $dateAmtKey = $date . '_' . number_format($amt, 2, '.', '');

    $matchedCash = null;
    $matchType = 'none';

    if (isset($cashByRef[$ref1])) {
        $matchedCash = $cashByRef[$ref1];
        $matchType = 'exact_ref';
    } elseif (isset($cashByRef[$ref2])) {
        $matchedCash = $cashByRef[$ref2];
        $matchType = 'legacy_ref';
    } elseif (isset($cashByRef[$ref3])) {
        $matchedCash = $cashByRef[$ref3];
        $matchType = 'inst_ref';
    } elseif (isset($cashByDateAmount[$dateAmtKey])) {
        $matchedCash = $cashByDateAmount[$dateAmtKey];
        $matchType = 'date_amount';
    }

    $status = 'missing';
    if ($matchedCash) {
        if (abs((float)$matchedCash['amount'] - $amt) < 0.01) {
            $status = 'synced';
            $syncedCount++;
            $syncedAmount += $amt;
        } else {
            $status = 'mismatch';
            $missingCount++;
            $missingAmount += $amt;
        }
    } else {
        $status = 'missing';
        $missingCount++;
        $missingAmount += $amt;
    }

    $auditList[] = [
        'payment_id'       => $payId,
        'card_id'          => $cardId,
        'customer_name'    => $item['customer_name'] ?: 'Unknown',
        'customer_mobile'  => $item['customer_mobile'] ?: '-',
        'product_name'     => $item['product_name'] ?: '-',
        'installment_type' => $isDaily ? 'daily' : 'monthly',
        'amount'           => $amt,
        'date'             => $date,
        'payment_status'   => $item['payment_status'],
        'sync_status'      => $status,
        'match_type'       => $matchType,
        'matched_cash_id'  => $matchedCash ? $matchedCash['id'] : null,
        'cash_amount'      => $matchedCash ? (float)$matchedCash['amount'] : null,
    ];
}

sendResponse([
    'success' => true,
    'stats' => [
        'total_records' => $totalCardsCount,
        'total_amount'  => $totalExpectedAmount,
        'synced_count'  => $syncedCount,
        'synced_amount' => $syncedAmount,
        'missing_count' => $missingCount,
        'missing_amount'=> $missingAmount,
    ],
    'data' => $auditList
]);

