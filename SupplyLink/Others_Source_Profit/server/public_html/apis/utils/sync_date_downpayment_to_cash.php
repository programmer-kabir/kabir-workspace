<?php
/**
 * Sync & Microscopic Audit: Down Payments (installment_no = 0 or tag = 'ডাউন পেমেন্ট') to Cash Ledger
 * 
 * STRICT RULES:
 * - Exclude Daily Installment cards (ic.is_daily = 1 OR ic.remarks = 'daily')
 * - Target ONLY Monthly Installment Cards down payments
 * - Format: [Customer Name] (কার্ড-[Card No], ডাউন পেমেন্ট)
 * - Category: downpayment
 * - Purpose: ডাউন পেমেন্ট আদায়
 * - Type: in
 * - RefId: downpayment_[payment_id]
 * - Full Discrepancy & Mistakes Detection (Missing, Mismatched amounts, Dates, Ghost entries)
 * - Safe Bulk Sync & Single-Row Fix & Ghost Delete Capability
 */

ini_set('display_errors', 0);
error_reporting(E_ALL);

if (php_sapi_name() !== 'cli') {
    require_once __DIR__ . '/../cors.php';
}
require_once __DIR__ . '/../db.php';

date_default_timezone_set('Asia/Dhaka');

// Parse raw JSON input if provided
$jsonInput = json_decode(file_get_contents('php://input'), true);
if (is_array($jsonInput)) {
    $_REQUEST = array_merge($_REQUEST, $jsonInput);
}

// Determine request type
$isCli = (php_sapi_name() === 'cli');
$isJsonRequest = $isCli 
    || (isset($_REQUEST['format']) && $_REQUEST['format'] === 'json')
    || (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false)
    || (isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false)
    || (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest')
    || !empty($jsonInput);

// Helper for sending JSON
function returnJson($data) {
    if (!headers_sent()) {
        header("Content-Type: application/json; charset=UTF-8");
    }
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// 1. Parse Dates & Action
$action = trim($_REQUEST['action'] ?? ($isCli ? ($argv[3] ?? 'audit') : 'audit'));
if ($action === 'preview') $action = 'audit';

$startDate = trim($_REQUEST['start_date'] ?? $_REQUEST['date'] ?? ($isCli ? ($argv[1] ?? date("Y-m-01")) : date("Y-m-01")));
$endDate = trim($_REQUEST['end_date'] ?? ($isCli ? ($argv[2] ?? $startDate) : (isset($_REQUEST['date']) ? $startDate : date("Y-m-d"))));
$removeOldLumps = !empty($_REQUEST['remove_old_lumps']) && in_array($_REQUEST['remove_old_lumps'], [1, '1', true, 'true', 'on'], true);

// Validate Dates
$dateValid = preg_match('/^\d{4}-\d{2}-\d{2}$/', $startDate) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $endDate);
if ($dateValid && $startDate > $endDate) {
    $temp = $startDate;
    $startDate = $endDate;
    $endDate = $temp;
}

if (!$dateValid) {
    if ($isJsonRequest) {
        returnJson([
            'success' => false,
            'message' => 'সঠিক শুরুর তারিখ এবং শেষ তারিখ প্রদান করুন (YYYY-MM-DD)'
        ]);
    }
}

// -----------------------------------------------------------------------------
// ACTION: FIX SINGLE DOWN PAYMENT TO CASH
// -----------------------------------------------------------------------------
if ($action === 'fix_single') {
    $payId = (int)($_REQUEST['payment_id'] ?? 0);
    if ($payId <= 0) {
        returnJson(['success' => false, 'message' => 'অবৈধ পেমেন্ট আইডি (Invalid Payment ID)']);
    }

    $q = $mysqli->prepare("
        SELECT 
            ip.id as payment_id, ip.card_id, ip.installment_no, ip.tag,
            ip.due_amount as amount, ip.paid_date, ip.payment_method,
            ip.receipt_number, ip.collected_by, ip.created_at,
            ic.card_number, ic.product_name, ic.is_daily,
            u.name as customer_name
        FROM installment_payments ip
        JOIN installment_cards ic ON ip.card_id = ic.id
        LEFT JOIN users u ON ic.user_id = u.id
        WHERE ip.id = ?
        LIMIT 1
    ");
    $q->bind_param("i", $payId);
    $q->execute();
    $pay = $q->get_result()->fetch_assoc();
    $q->close();

    if (!$pay) {
        returnJson(['success' => false, 'message' => 'ডাউন পেমেন্ট রেকর্ড খুঁজে পাওয়া যায়নি']);
    }

    if ((int)$pay['is_daily'] === 1) {
        returnJson(['success' => false, 'message' => 'দৈনিক কিস্তির কার্ডের ডাউন পেমেন্ট এখানে সিঙ্ক করা নিষেধ।']);
    }

    $refId = "downpayment_" . $payId;
    $altRefId = "installment_" . $payId;
    $amount = (float)$pay['amount'];
    $paidDate = $pay['paid_date'];
    $custName = !empty($pay['customer_name']) ? trim($pay['customer_name'], ", \t\n\r\0\x0B") : "গ্রাহক";
    $cardNo = !empty($pay['card_number']) ? $pay['card_number'] : $pay['card_id'];
    $cashSource = "{$custName} (কার্ড-{$cardNo}, ডাউন পেমেন্ট)";
    $purpose = "ডাউন পেমেন্ট আদায়";
    $cashRemarks = "রশিদ নং: " . ($pay['receipt_number'] ?: 'N/A') . " | মাধ্যম: " . ($pay['payment_method'] ?: 'Cash');
    $collectedBy = (int)($pay['collected_by'] ?? 1);
    $createdAt = !empty($pay['created_at']) ? $pay['created_at'] : date("Y-m-d H:i:s");

    // Check if already in cash
    $chk = $mysqli->prepare("SELECT id FROM cash WHERE refId = ? OR (refId = ? AND category = 'downpayment') LIMIT 1");
    $chk->bind_param("ss", $refId, $altRefId);
    $chk->execute();
    $existing = $chk->get_result()->fetch_assoc();
    $chk->close();

    if ($existing) {
        // Update
        $up = $mysqli->prepare("
            UPDATE cash 
            SET amount = ?, date = ?, source = ?, purpose = ?, remarks = ?, category = 'downpayment', refId = ?
            WHERE id = ?
        ");
        $up->bind_param("dsssssi", $amount, $paidDate, $cashSource, $purpose, $cashRemarks, $refId, $existing['id']);
        $up->execute();
        $up->close();

        returnJson([
            'success' => true,
            'message' => "ডাউন পেমেন্ট #{$payId} ক্যাশ এন্ট্রিতে সফলভাবে আপডেট ও সমান্তরাল করা হয়েছে!",
            'cash_id' => $existing['id']
        ]);
    } else {
        // Insert
        $ins = $mysqli->prepare("
            INSERT INTO cash (
                type, source, purpose, amount, category, 
                refId, remarks, date, createdAt, 
                approval_status, approved_by, approved_at
            ) VALUES (
                'in', ?, ?, ?, 'downpayment', 
                ?, ?, ?, ?, 
                'approved', ?, NOW()
            )
        ");
        $ins->bind_param("ssdssssi", $cashSource, $purpose, $amount, $refId, $cashRemarks, $paidDate, $createdAt, $collectedBy);
        $ins->execute();
        $newId = $mysqli->insert_id;
        $ins->close();

        returnJson([
            'success' => true,
            'message' => "ডাউন পেমেন্ট #{$payId} সফলভাবে ক্যাশ ইন লেজারে যুক্ত করা হয়েছে!",
            'cash_id' => $newId
        ]);
    }
}

// -----------------------------------------------------------------------------
// ACTION: DELETE GHOST DOWN PAYMENT CASH ENTRY
// -----------------------------------------------------------------------------
if ($action === 'delete_ghost') {
    $cashId = (int)($_REQUEST['cash_id'] ?? 0);
    if ($cashId <= 0) {
        returnJson(['success' => false, 'message' => 'অবৈধ ক্যাশ আইডি']);
    }

    $del = $mysqli->prepare("DELETE FROM cash WHERE id = ? AND (refId LIKE 'downpayment_%' OR (refId LIKE 'installment_%' AND category = 'downpayment')) LIMIT 1");
    $del->bind_param("i", $cashId);
    $del->execute();
    $affected = $del->affected_rows;
    $del->close();

    if ($affected > 0) {
        returnJson(['success' => true, 'message' => 'অবাঞ্ছিত/ঘোস্ট ডাউন পেমেন্ট ক্যাশ এন্ট্রিটি সফলভাবে মুছে ফেলা হয়েছে।']);
    } else {
        returnJson(['success' => false, 'message' => 'এন্ট্রি মুছে ফেলা সম্ভব হয়নি।']);
    }
}

// -----------------------------------------------------------------------------
// CORE AUDIT & SYNC PROCESSING
// -----------------------------------------------------------------------------
try {
    // A. Fetch existing old lump-sum entries in cash
    $oldLumpSql = "
        SELECT id, date, source, purpose, amount, category, remarks, approval_status
        FROM cash
        WHERE type = 'in'
          AND category = 'downpayment'
          AND (refId IS NULL OR refId = '' OR (refId NOT LIKE 'downpayment_%' AND refId NOT LIKE 'installment_%'))
          AND date BETWEEN ? AND ?
        ORDER BY date ASC, id ASC
    ";
    $lumpStmt = $mysqli->prepare($oldLumpSql);
    $lumpStmt->bind_param("ss", $startDate, $endDate);
    $lumpStmt->execute();
    $oldLumpEntries = $lumpStmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $lumpStmt->close();

    $oldLumpsTotalAmount = 0;
    foreach ($oldLumpEntries as $ol) {
        $oldLumpsTotalAmount += (float)$ol['amount'];
    }

    // Check if is_daily column exists
    $colCheck = $mysqli->query("SHOW COLUMNS FROM installment_cards LIKE 'is_daily'");
    $hasIsDaily = ($colCheck && $colCheck->num_rows > 0);
    $dailyFilter = $hasIsDaily ? "ic.is_daily = 0 AND " : "";

    // B. Fetch Paid Down Payments (STRICTLY monthly cards, NO daily cards)
    $downSql = "
        SELECT 
            ip.id as payment_id,
            ip.card_id,
            ip.installment_no,
            ip.tag,
            ip.due_amount as amount,
            ip.paid_date,
            ip.payment_method,
            ip.receipt_number,
            ip.collected_by,
            ip.status,
            ip.created_at,
            ic.card_number,
            ic.product_name,
            ic.down_payment as card_dp_amount,
            u.name as customer_name,
            u.mobile as customer_mobile,
            cb.name as collector_name
        FROM installment_payments ip
        JOIN installment_cards ic ON ip.card_id = ic.id
        LEFT JOIN users u ON ic.user_id = u.id
        LEFT JOIN users cb ON ip.collected_by = cb.id
        WHERE {$dailyFilter} (ic.remarks IS NULL OR LOWER(TRIM(ic.remarks)) != 'daily')
          AND ip.status = 'Paid'
          AND (ip.installment_no = 0 OR ip.tag LIKE '%ডাউন%' OR ip.tag LIKE '%down%')
          AND ip.paid_date BETWEEN ? AND ?
        ORDER BY ip.paid_date ASC, ip.id ASC
    ";
    $downStmt = $mysqli->prepare($downSql);
    $downStmt->bind_param("ss", $startDate, $endDate);
    $downStmt->execute();
    $allPayments = $downStmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $downStmt->close();

    // C. Fetch existing refIds in cash table
    $refCheckSql = "
        SELECT id, refId, amount, date, source, purpose, remarks 
        FROM cash 
        WHERE (refId LIKE 'downpayment_%' OR (refId LIKE 'installment_%' AND category = 'downpayment'))
          AND date BETWEEN ? AND ?
    ";
    $rcStmt = $mysqli->prepare($refCheckSql);
    $rcStmt->bind_param("ss", $startDate, $endDate);
    $rcStmt->execute();
    $existingCashRows = $rcStmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $rcStmt->close();

    $existingRefMap = [];
    $alreadySyncedTotalAmount = 0;
    foreach ($existingCashRows as $r) {
        $existingRefMap[$r['refId']] = $r;
        $alreadySyncedTotalAmount += (float)$r['amount'];
    }

    // D. IDENTIFY DISCREPANCIES & MISTAKES
    $discrepancies = [];
    $toInsertList = [];
    $totalAmountToInsert = 0;
    $dateStats = [];
    $grandTotalAmountFound = 0;
    $paymentIdsFound = [];

    foreach ($allPayments as &$pay) {
        $payId = (int)$pay['payment_id'];
        $cardId = (int)$pay['card_id'];
        $paymentIdsFound[$payId] = true;
        $refId = "downpayment_" . $payId;
        $altRefId = "installment_" . $payId;
        $d = $pay['paid_date'];
        $amt = (float)$pay['amount'];
        $grandTotalAmountFound += $amt;

        if (!isset($dateStats[$d])) {
            $dateStats[$d] = [
                'date' => $d,
                'card_count' => 0,
                'card_amount' => 0,
                'cash_count' => 0,
                'cash_amount' => 0,
                'old_lump_count' => 0,
                'old_lump_amount' => 0,
                'difference' => 0,
                'status' => 'matched'
            ];
        }

        $dateStats[$d]['card_count']++;
        $dateStats[$d]['card_amount'] += $amt;

        $matchedCashRow = $existingRefMap[$refId] ?? ($existingRefMap[$altRefId] ?? null);

        if ($matchedCashRow) {
            $pay['cash_synced'] = true;
            $pay['reconciled_via'] = 'direct';

            $cashAmt = (float)$matchedCashRow['amount'];
            $cashDate = $matchedCashRow['date'];

            $dateStats[$d]['cash_count']++;
            $dateStats[$d]['cash_amount'] += $cashAmt;

            // Check Amount Mismatch
            if (abs($cashAmt - $amt) > 0.01) {
                $discrepancies[] = [
                    'type' => 'amount_mismatch',
                    'title' => 'টাকার অমিল (Amount Mismatch)',
                    'description' => "গ্রাহক কার্ডে ডাউন পেমেন্ট ৳" . number_format($amt, 2) . " কিন্তু ক্যাশ লেজারে ৳" . number_format($cashAmt, 2) . " এন্ট্রি রয়েছে।",
                    'payment_id' => $payId,
                    'card_id' => $cardId,
                    'card_number' => $pay['card_number'],
                    'customer_name' => $pay['customer_name'],
                    'installment_no' => $pay['installment_no'],
                    'tag' => $pay['tag'],
                    'paid_date' => $pay['paid_date'],
                    'card_amount' => $amt,
                    'cash_amount' => $cashAmt,
                    'difference' => $amt - $cashAmt,
                    'cash_id' => $matchedCashRow['id'],
                    'can_fix' => true
                ];
            }

            // Check Date Mismatch
            if ($cashDate !== $d) {
                $discrepancies[] = [
                    'type' => 'date_mismatch',
                    'title' => 'তারিখের অসঙ্গতি (Date Mismatch)',
                    'description' => "কার্ডে ডাউন পেমেন্ট পরিশোধের তারিখ {$d} কিন্তু ক্যাশে {$cashDate} এন্ট্রি করা হয়েছে।",
                    'payment_id' => $payId,
                    'card_id' => $cardId,
                    'card_number' => $pay['card_number'],
                    'customer_name' => $pay['customer_name'],
                    'installment_no' => $pay['installment_no'],
                    'paid_date' => $d,
                    'cash_date' => $cashDate,
                    'card_amount' => $amt,
                    'cash_amount' => $cashAmt,
                    'difference' => 0,
                    'cash_id' => $matchedCashRow['id'],
                    'can_fix' => true
                ];
            }
        } else {
            // Missing in Cash
            $pay['cash_synced'] = false;
            $pay['reconciled_via'] = 'none';

            $toInsertList[] = $pay;
            $totalAmountToInsert += $amt;

            $discrepancies[] = [
                'type' => 'missing_in_cash',
                'title' => 'ক্যাশে মিসিং (Missing in Cash)',
                'description' => "ডাউন পেমেন্ট কার্ডে পরিশোধিত ('Paid') দেখানো হয়েছে, কিন্তু ক্যাশ ইন লেজারে এখনও যুক্ত হয়নি।",
                'payment_id' => $payId,
                'card_id' => $cardId,
                'card_number' => $pay['card_number'],
                'customer_name' => $pay['customer_name'],
                'installment_no' => $pay['installment_no'],
                'tag' => $pay['tag'],
                'paid_date' => $pay['paid_date'],
                'card_amount' => $amt,
                'cash_amount' => 0,
                'difference' => $amt,
                'can_fix' => true
            ];
        }
    }
    unset($pay);

    // E. Identify Ghost Cash entries
    foreach ($existingCashRows as $cr) {
        $pId = 0;
        if (strpos($cr['refId'], 'downpayment_') === 0) {
            $pId = (int)str_replace('downpayment_', '', $cr['refId']);
        } elseif (strpos($cr['refId'], 'installment_') === 0) {
            $pId = (int)str_replace('installment_', '', $cr['refId']);
        }

        if ($pId > 0 && !isset($paymentIdsFound[$pId])) {
            $chkP = $mysqli->query("SELECT id, status, tag FROM installment_payments WHERE id = $pId LIMIT 1");
            $pData = $chkP ? $chkP->fetch_assoc() : null;
            if (!$pData || $pData['status'] !== 'Paid') {
                $discrepancies[] = [
                    'type' => 'ghost_cash',
                    'title' => 'অবাঞ্ছিত ক্যাশ এন্ট্রি (Ghost Entry)',
                    'description' => "ক্যাশ লেজারে ৳" . number_format((float)$cr['amount'], 2) . " জমা দেখানো আছে, কিন্তু কিস্তি কার্ডে এটি " . ($pData ? $pData['status'] : 'মুছে ফেলা') . " অবস্থায় আছে।",
                    'payment_id' => $pId,
                    'cash_id' => $cr['id'],
                    'cash_amount' => (float)$cr['amount'],
                    'card_amount' => 0,
                    'paid_date' => $cr['date'],
                    'source' => $cr['source'],
                    'difference' => -(float)$cr['amount'],
                    'can_delete_cash' => true
                ];
            }
        }
    }

    // Map old lumps into dateStats
    foreach ($oldLumpEntries as $ol) {
        $d = $ol['date'];
        if (!isset($dateStats[$d])) {
            $dateStats[$d] = [
                'date' => $d,
                'card_count' => 0,
                'card_amount' => 0,
                'cash_count' => 0,
                'cash_amount' => 0,
                'old_lump_count' => 0,
                'old_lump_amount' => 0,
                'difference' => 0,
                'status' => 'matched'
            ];
        }
        $dateStats[$d]['old_lump_count']++;
        $dateStats[$d]['old_lump_amount'] += (float)$ol['amount'];
    }

    // Finalize date stats differences
    foreach ($dateStats as &$ds) {
        $totalInCashForDay = $ds['cash_amount'] + $ds['old_lump_amount'];
        $diff = $ds['card_amount'] - $totalInCashForDay;
        $ds['difference'] = $diff;
        $ds['status'] = abs($diff) < 0.01 ? 'matched' : ($diff > 0 ? 'cash_short' : 'cash_excess');
    }
    unset($ds);
    ksort($dateStats);

    $insertedCount = 0;
    $deletedLumpsCount = 0;
    $deletedLumpsAmount = 0;

    // F. EXECUTE BULK SYNC IF ACTION === 'sync'
    if ($action === 'sync') {
        // 1. Remove old lump sums if requested
        if ($removeOldLumps && count($oldLumpEntries) > 0) {
            $lumpIds = array_column($oldLumpEntries, 'id');
            if (!empty($lumpIds)) {
                $inPlaceholders = implode(',', array_fill(0, count($lumpIds), '?'));
                $types = str_repeat('i', count($lumpIds));
                $delStmt = $mysqli->prepare("DELETE FROM cash WHERE id IN ($inPlaceholders)");
                $delStmt->bind_param($types, ...$lumpIds);
                $delStmt->execute();
                $deletedLumpsCount = $delStmt->affected_rows;
                $deletedLumpsAmount = $oldLumpsTotalAmount;
                $delStmt->close();
            }
        }

        // 2. Insert into cash
        $insertStmt = $mysqli->prepare("
            INSERT INTO cash (
                type, source, purpose, amount, category, 
                refId, remarks, date, createdAt, 
                approval_status, approved_by, approved_at
            ) VALUES (
                'in', ?, ?, ?, 'downpayment', 
                ?, ?, ?, ?, 
                'approved', ?, NOW()
            )
        ");

        foreach ($toInsertList as $pay) {
            $payId = (int)$pay['payment_id'];
            $refId = "downpayment_" . $payId;
            $custName = !empty($pay['customer_name']) ? trim($pay['customer_name'], ", \t\n\r\0\x0B") : "গ্রাহক";
            $cardNo = !empty($pay['card_number']) ? $pay['card_number'] : $pay['card_id'];
            $amount = (float)$pay['amount'];
            $paidDate = $pay['paid_date'];
            $collectedBy = (int)($pay['collected_by'] ?? 1);
            $createdAt = !empty($pay['created_at']) ? $pay['created_at'] : date("Y-m-d H:i:s");

            $cashSource = "{$custName} (কার্ড-{$cardNo}, ডাউন পেমেন্ট)";
            $purpose = "ডাউন পেমেন্ট আদায়";
            $cashRemarks = "রশিদ নং: " . ($pay['receipt_number'] ?: 'N/A') . " | মাধ্যম: " . ($pay['payment_method'] ?: 'Cash');

            if ($insertStmt) {
                $insertStmt->bind_param(
                    "ssdssssi",
                    $cashSource,
                    $purpose,
                    $amount,
                    $refId,
                    $cashRemarks,
                    $paidDate,
                    $createdAt,
                    $collectedBy
                );
                if ($insertStmt->execute()) {
                    $insertedCount++;
                }
            }
        }
        if ($insertStmt) {
            $insertStmt->close();
        }
    }

    $netDifference = $grandTotalAmountFound - ($alreadySyncedTotalAmount + $oldLumpsTotalAmount);

    $executionResult = [
        'success' => true,
        'action' => $action,
        'start_date' => $startDate,
        'end_date' => $endDate,
        'summary' => [
            'total_card_paid_count' => count($allPayments),
            'total_card_paid_amount' => $grandTotalAmountFound,
            'total_cash_synced_count' => count($existingCashRows),
            'total_cash_synced_amount' => $alreadySyncedTotalAmount,
            'old_lumps_count' => count($oldLumpEntries),
            'old_lumps_amount' => $oldLumpsTotalAmount,
            'total_cash_in_ledger' => $alreadySyncedTotalAmount + $oldLumpsTotalAmount,
            'net_difference' => $netDifference,
            'all_matched' => (count($discrepancies) === 0 && abs($netDifference) < 0.01),
            'discrepancies_count' => count($discrepancies),
            'to_insert_count' => count($toInsertList),
            'to_insert_amount' => $totalAmountToInsert,
            'inserted_count' => $insertedCount,
            'deleted_lumps_count' => $deletedLumpsCount,
            'deleted_lumps_amount' => $deletedLumpsAmount,
        ],
        'discrepancies' => $discrepancies,
        'date_stats' => array_values($dateStats),
        'old_lumps_details' => $oldLumpEntries,
        'all_payments' => $allPayments
    ];

} catch (Throwable $e) {
    $executionResult = [
        'success' => false,
        'error' => $e->getMessage()
    ];
}

// IF JSON REQUEST, RETURN STRUCTURED JSON AND EXIT
if ($isJsonRequest) {
    returnJson($executionResult);
}
?>
<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <title>ডাউন পেমেন্ট ও ক্যাশ অডিট রিপোর্ট</title>
</head>
<body style="font-family:sans-serif; background:#0f172a; color:#f8fafc; padding:20px;">
    <h2>Down Payment Audit Result</h2>
    <pre><?= htmlspecialchars(json_encode($executionResult, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)) ?></pre>
</body>
</html>
