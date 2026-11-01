<?php
/**
 * Sync & Microscopic Audit: Monthly Customer Installments to Cash Ledger
 * 
 * - Full Discrepancy & Mistakes Detection (Missing, Mismatched amounts, Dates, Ghost entries)
 * - Smart Early Card Settlement Reconciliation (Avoids false missing & duplicate syncs)
 * - Discounts & Waivers Analysis (Card settlements, Waived installments)
 * - Safe Sync & Single-Row Fix Capability
 * - Excludes Daily Installment cards (is_daily = 1)
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
// ACTION: FIX SINGLE INSTALLMENT TO CASH
// -----------------------------------------------------------------------------
if ($action === 'fix_single') {
    $payId = (int)($_REQUEST['payment_id'] ?? 0);
    if ($payId <= 0) {
        returnJson(['success' => false, 'message' => 'অবৈধ কিস্তি আইডি (Invalid Payment ID)']);
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
        returnJson(['success' => false, 'message' => 'কিস্তি রেকর্ড খুঁজে পাওয়া যায়নি']);
    }

    if ((int)$pay['is_daily'] === 1) {
        returnJson(['success' => false, 'message' => 'দৈনিক কিস্তির কার্ড মাসিক কিস্তি ক্যাশে সিঙ্ক করা নিষেধ।']);
    }

    // Check if card is settled
    $chkSettle = $mysqli->prepare("SELECT id, discount_amount, final_settled_amount FROM card_settlements WHERE card_id = ? LIMIT 1");
    $chkSettle->bind_param("i", $pay['card_id']);
    $chkSettle->execute();
    $settleCard = $chkSettle->get_result()->fetch_assoc();
    $chkSettle->close();

    if ($settleCard) {
        returnJson([
            'success' => false, 
            'message' => 'এই কার্ডটি ইতিমধ্যে অগ্রিম নিষ্পত্তি ও ছাড় দিয়ে সেটেল করা হয়েছে। পৃথকভাবে কিস্তি সিঙ্ক করলে ক্যাশে ডুপ্লিকেট হবে।'
        ]);
    }

    $refId = "installment_" . $payId;
    $instNo = (int)$pay['installment_no'];
    $isDown = ($instNo === 0) 
        || (stripos($pay['tag'] ?? '', 'ডাউন') !== false) 
        || (stripos($pay['tag'] ?? '', 'down') !== false);

    if ($isDown) {
        returnJson([
            'success' => false,
            'message' => 'এটি একটি ডাউন পেমেন্ট এন্ট্রি। এটি ডাউন পেমেন্ট ও ক্যাশ অডিট প্যানেল (/audit/downpayments) থেকে সিঙ্ক করুন।'
        ]);
    }

    $category = $isDown ? 'downpayment' : 'installment';
    $purpose = $isDown ? 'ডাউন পেমেন্ট আদায়' : 'মাসিক কিস্তি আদায়';
    $custName = !empty($pay['customer_name']) ? $pay['customer_name'] : "গ্রাহক";
    $cardNo = !empty($pay['card_number']) ? $pay['card_number'] : $pay['card_id'];
    $labelTag = $isDown ? "ডাউন পেমেন্ট" : "কিস্তি #{$instNo}";
    $cashSource = "{$custName} (কার্ড-{$cardNo}, {$labelTag})";
    $cashRemarks = "রশিদ নং: " . ($pay['receipt_number'] ?: 'N/A') . " | মাধ্যম: " . ($pay['payment_method'] ?: 'Cash') . " | অডিট ফিক্স";
    $paidDate = $pay['paid_date'] ?: date('Y-m-d');
    $collectedBy = (int)($pay['collected_by'] ?? 1);
    $amount = (float)$pay['amount'];

    // Check if cash record exists
    $chk = $mysqli->prepare("SELECT id FROM cash WHERE refId = ? LIMIT 1");
    $chk->bind_param("s", $refId);
    $chk->execute();
    $existingCash = $chk->get_result()->fetch_assoc();
    $chk->close();

    if ($existingCash) {
        $up = $mysqli->prepare("
            UPDATE cash SET 
                type = 'in',
                source = ?,
                purpose = ?,
                amount = ?,
                category = ?,
                remarks = ?,
                date = ?,
                approval_status = 'approved',
                approved_by = COALESCE(?, approved_by),
                approved_at = COALESCE(approved_at, NOW())
            WHERE id = ?
        ");
        $up->bind_param("ssdsssii", $cashSource, $purpose, $amount, $category, $cashRemarks, $paidDate, $collectedBy, $existingCash['id']);
        $up->execute();
        $up->close();
        returnJson([
            'success' => true,
            'message' => "কিস্তি #{$instNo} (কার্ড #{$cardNo}) ক্যাশ লেজারে সফলভাবে আপডেট ও সমাধান করা হয়েছে।",
            'fixed_id' => $existingCash['id']
        ]);
    } else {
        $ins = $mysqli->prepare("
            INSERT INTO cash (
                type, source, purpose, amount, category, 
                refId, remarks, date, createdAt, 
                approval_status, approved_by, approved_at
            ) VALUES (
                'in', ?, ?, ?, ?, 
                ?, ?, ?, NOW(), 
                'approved', ?, NOW()
            )
        ");
        $ins->bind_param("ssdssssi", $cashSource, $purpose, $amount, $category, $refId, $cashRemarks, $paidDate, $collectedBy);
        $ins->execute();
        $newId = $ins->insert_id;
        $ins->close();
        returnJson([
            'success' => true,
            'message' => "কিস্তি #{$instNo} (কার্ড #{$cardNo}) সফলভাবে ক্যাশ ইন লেজারে এন্ট্রি হয়েছে।",
            'inserted_id' => $newId
        ]);
    }
}

// -----------------------------------------------------------------------------
// ACTION: DELETE GHOST CASH ENTRY
// -----------------------------------------------------------------------------
if ($action === 'delete_ghost') {
    $cashId = (int)($_REQUEST['cash_id'] ?? 0);
    if ($cashId <= 0) {
        returnJson(['success' => false, 'message' => 'অবৈধ ক্যাশ আইডি']);
    }

    $del = $mysqli->prepare("DELETE FROM cash WHERE id = ? AND refId LIKE 'installment_%' LIMIT 1");
    $del->bind_param("i", $cashId);
    $del->execute();
    $affected = $del->affected_rows;
    $del->close();

    if ($affected > 0) {
        returnJson(['success' => true, 'message' => 'অবাঞ্ছিত/ঘোস্ট ক্যাশ এন্ট্রিটি সফলভাবে মুছে ফেলা হয়েছে।']);
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
          AND category = 'installment'
          AND (refId IS NULL OR refId = '' OR (refId NOT LIKE 'installment_%' AND refId NOT LIKE 'settlement_%'))
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

    // B. Fetch Paid monthly installments
    $instSql = "
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
            u.name as customer_name,
            u.mobile as customer_mobile,
            cb.name as collector_name
        FROM installment_payments ip
        JOIN installment_cards ic ON ip.card_id = ic.id
        LEFT JOIN users u ON ic.user_id = u.id
        LEFT JOIN users cb ON ip.collected_by = cb.id
        WHERE ic.is_daily = 0
          AND (ic.remarks IS NULL OR LOWER(TRIM(ic.remarks)) != 'daily')
          AND ip.status = 'Paid'
          AND ip.installment_no > 0
          AND (ip.tag IS NULL OR (ip.tag NOT LIKE '%ডাউন%' AND ip.tag NOT LIKE '%down%'))
          AND ip.paid_date BETWEEN ? AND ?
        ORDER BY ip.paid_date ASC, ip.id ASC
    ";
    $instStmt = $mysqli->prepare($instSql);
    $instStmt->bind_param("ss", $startDate, $endDate);
    $instStmt->execute();
    $allPayments = $instStmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $instStmt->close();

    // C. Fetch existing refIds in cash table (BOTH installment_% AND settlement_%)
    $refCheckSql = "
        SELECT id, refId, amount, date, source, purpose, remarks 
        FROM cash 
        WHERE (refId LIKE 'installment_%' OR refId LIKE 'settlement_%') 
          AND date BETWEEN ? AND ?
    ";
    $rcStmt = $mysqli->prepare($refCheckSql);
    $rcStmt->bind_param("ss", $startDate, $endDate);
    $rcStmt->execute();
    $existingCashRows = $rcStmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $rcStmt->close();

    $existingRefMap = [];
    $settlementCashByCardId = [];
    $alreadySyncedTotalAmount = 0;
    foreach ($existingCashRows as $r) {
        $existingRefMap[$r['refId']] = $r;
        if (strpos($r['refId'], 'settlement_') === 0) {
            $cId = (int)str_replace('settlement_', '', $r['refId']);
            if ($cId > 0) {
                $settlementCashByCardId[$cId] = $r;
            }
        }
        $alreadySyncedTotalAmount += (float)$r['amount'];
    }

    // D. Fetch Card Settlements
    $settleSql = "
        SELECT 
            cs.id, cs.card_id, cs.customer_id, cs.total_original_amount, cs.total_paid_before,
            cs.remaining_due, cs.discount_amount, cs.final_settled_amount, cs.settlement_date,
            cs.payment_method, cs.note, cs.settled_by_name,
            u.name as customer_name,
            ic.card_number,
            ic.product_name
        FROM card_settlements cs
        LEFT JOIN installment_cards ic ON cs.card_id = ic.id
        LEFT JOIN users u ON cs.customer_id = u.id
        ORDER BY cs.settlement_date DESC, cs.id DESC
    ";
    $setQuery = $mysqli->query($settleSql);
    $allSettlements = $setQuery ? $setQuery->fetch_all(MYSQLI_ASSOC) : [];

    $settlementsByCardId = [];
    $settledCardIds = [];
    $totalDiscountAmount = 0;
    $totalSettledCollectedAmount = 0;
    $settlementsInDateRange = [];

    foreach ($allSettlements as &$st) {
        $cId = (int)$st['card_id'];
        $settledCardIds[$cId] = true;
        $settlementsByCardId[$cId] = $st;

        $inRange = ($st['settlement_date'] >= $startDate && $st['settlement_date'] <= $endDate);
        if ($inRange) {
            $totalDiscountAmount += (float)$st['discount_amount'];
            $totalSettledCollectedAmount += (float)$st['final_settled_amount'];
            $settlementsInDateRange[] = &$st;
        }

        // Check if settlement is synced in cash (any date)
        $setRef = "settlement_" . $cId;
        $chkSet = $mysqli->prepare("SELECT id, amount, date FROM cash WHERE refId = ? LIMIT 1");
        $chkSet->bind_param("s", $setRef);
        $chkSet->execute();
        $setCash = $chkSet->get_result()->fetch_assoc();
        $chkSet->close();
        
        $st['cash_synced'] = !empty($setCash);
        $st['cash_amount'] = !empty($setCash) ? (float)$setCash['amount'] : 0;
        if (!empty($setCash)) {
            $settlementCashByCardId[$cId] = $setCash;
        }
    }
    unset($st);

    // E. Fetch Waived installments in this date range
    $waivedSql = "
        SELECT 
            ip.id as payment_id, ip.card_id, ip.installment_no, ip.tag, ip.due_amount, ip.status,
            ip.due_date, ip.paid_date,
            ic.card_number, ic.product_name, u.name as customer_name
        FROM installment_payments ip
        JOIN installment_cards ic ON ip.card_id = ic.id
        LEFT JOIN users u ON ic.user_id = u.id
        WHERE ic.is_daily = 0
          AND (ic.remarks IS NULL OR LOWER(TRIM(ic.remarks)) != 'daily')
          AND ip.status = 'Waived'
          AND (
            (ip.paid_date BETWEEN ? AND ?) 
            OR (ip.due_date BETWEEN ? AND ? AND ip.paid_date IS NULL)
          )
        ORDER BY ip.id DESC
    ";
    $wStmt = $mysqli->prepare($waivedSql);
    $wStmt->bind_param("ssss", $startDate, $endDate, $startDate, $endDate);
    $wStmt->execute();
    $waivedPayments = $wStmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $wStmt->close();

    $totalWaivedAmount = 0;
    foreach ($waivedPayments as &$wp) {
        $totalWaivedAmount += (float)$wp['due_amount'];
        // Check if accidentally present in cash
        $wRef = "installment_" . $wp['payment_id'];
        $wp['accidental_in_cash'] = isset($existingRefMap[$wRef]);
        $wp['cash_amount'] = isset($existingRefMap[$wRef]) ? (float)$existingRefMap[$wRef]['amount'] : 0;
    }
    unset($wp);

    // F. IDENTIFY DISCREPANCIES & MISTAKES (With Smart Settlement Reconciliation)
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
        $refId = "installment_" . $payId;
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

        $hasDirectCash = isset($existingRefMap[$refId]);
        $isSettledCard = isset($settledCardIds[$cardId]);
        $hasSettlementCash = isset($settlementCashByCardId[$cardId]);

        // CASE 1: Directly synced via individual installment voucher
        if ($hasDirectCash) {
            $pay['cash_synced'] = true;
            $pay['reconciled_via'] = 'direct';

            $cashRow = $existingRefMap[$refId];
            $cashAmt = (float)$cashRow['amount'];
            $cashDate = $cashRow['date'];

            $dateStats[$d]['cash_count']++;
            $dateStats[$d]['cash_amount'] += $cashAmt;

            // Check Amount Mismatch
            if (abs($cashAmt - $amt) > 0.01) {
                $discrepancies[] = [
                    'type' => 'amount_mismatch',
                    'title' => 'টাকার অমিল (Amount Mismatch)',
                    'description' => "গ্রাহক কার্ডে ৳" . number_format($amt, 2) . " কিন্তু ক্যাশ লেজারে ৳" . number_format($cashAmt, 2) . " এন্ট্রি রয়েছে।",
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
                    'cash_id' => $cashRow['id'],
                    'can_fix' => true
                ];
            }

            // Check Date Mismatch
            if ($cashDate !== $d) {
                $discrepancies[] = [
                    'type' => 'date_mismatch',
                    'title' => 'তারিখের অসঙ্গতি (Date Mismatch)',
                    'description' => "কার্ডে পরিশোধের তারিখ {$d} কিন্তু ক্যাশে {$cashDate} এন্ট্রি করা হয়েছে।",
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
                    'cash_id' => $cashRow['id'],
                    'can_fix' => true
                ];
            }
        } 
        // CASE 2: Reconciled via Early Card Settlement Voucher (e.g. Card 261)
        elseif ($isSettledCard && $hasSettlementCash) {
            $setInfo = $settlementsByCardId[$cardId] ?? [];
            $settleCashRow = $settlementCashByCardId[$cardId] ?? [];
            $pay['cash_synced'] = true;
            $pay['reconciled_via'] = 'settlement';
            $pay['settlement_voucher'] = "settlement_" . $cardId;
            $pay['settlement_date'] = $setInfo['settlement_date'] ?? ($settleCashRow['date'] ?? '');
            $pay['settlement_collected'] = (float)($setInfo['final_settled_amount'] ?? 0);
            $pay['settlement_discount'] = (float)($setInfo['discount_amount'] ?? 0);

            // Reconciled! Do NOT flag as discrepancy and do NOT insert into cash!
        }
        // CASE 3: Card was settled but settlement cash was NOT created in cash table
        elseif ($isSettledCard && !$hasSettlementCash) {
            $setInfo = $settlementsByCardId[$cardId] ?? [];
            $discrepancies[] = [
                'type' => 'settlement_missing_in_cash',
                'title' => 'সেটেলমেন্ট ক্যাশে জমা পড়েনি',
                'description' => "এই কার্ডটি ৳" . number_format((float)($setInfo['final_settled_amount'] ?? 0), 2) . " টাকায় নিষ্পত্তি হলেও ক্যাশে কোনো ভাউচার পাওয়া যায়নি।",
                'payment_id' => $payId,
                'card_id' => $cardId,
                'card_number' => $pay['card_number'],
                'customer_name' => $pay['customer_name'],
                'installment_no' => $pay['installment_no'],
                'paid_date' => $pay['paid_date'],
                'card_amount' => $amt,
                'cash_amount' => 0,
                'difference' => $amt,
                'is_settled_card' => true,
                'can_fix' => false
            ];
        }
        // CASE 4: Normal Missing in Cash
        else {
            $pay['cash_synced'] = false;
            $pay['reconciled_via'] = 'none';

            $toInsertList[] = $pay;
            $totalAmountToInsert += $amt;

            $discrepancies[] = [
                'type' => 'missing_in_cash',
                'title' => 'ক্যাশে মিসিং (Missing in Cash)',
                'description' => "কিস্তি কার্ডে পরিশোধিত ('Paid') দেখানো হয়েছে, কিন্তু ক্যাশ ইন লেজারে এখনও যুক্ত হয়নি।",
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
                'is_settled_card' => false,
                'can_fix' => true
            ];
        }
    }
    unset($pay);

    // G. Identify Ghost Cash entries (In cash, but payment is NOT Paid or doesn't exist)
    foreach ($existingCashRows as $cr) {
        if (strpos($cr['refId'], 'installment_') === 0) {
            $pId = (int)str_replace('installment_', '', $cr['refId']);
            if ($pId > 0 && !isset($paymentIdsFound[$pId])) {
                // Verify payment in db
                $chkP = $mysqli->query("SELECT id, status FROM installment_payments WHERE id = $pId LIMIT 1");
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
    }

    // Add settlements in date range into dateStats
    foreach ($settlementsInDateRange as $st) {
        $sDate = $st['settlement_date'];
        if ($st['cash_synced']) {
            if (!isset($dateStats[$sDate])) {
                $dateStats[$sDate] = [
                    'date' => $sDate,
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
            $dateStats[$sDate]['cash_count']++;
            $dateStats[$sDate]['cash_amount'] += (float)$st['final_settled_amount'];
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

    // H. EXECUTE BULK SYNC IF ACTION === 'sync'
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
                'in', ?, ?, ?, ?, 
                ?, ?, ?, ?, 
                'approved', ?, NOW()
            )
        ");

        foreach ($toInsertList as $pay) {
            $payId = (int)$pay['payment_id'];
            $refId = "installment_" . $payId;
            $custName = !empty($pay['customer_name']) ? $pay['customer_name'] : "গ্রাহক";
            $cardNo = !empty($pay['card_number']) ? $pay['card_number'] : $pay['card_id'];
            $instNo = (int)$pay['installment_no'];
            $amount = (float)$pay['amount'];
            $paidDate = $pay['paid_date'];
            $collectedBy = (int)($pay['collected_by'] ?? 1);
            $createdAt = !empty($pay['created_at']) ? $pay['created_at'] : date("Y-m-d H:i:s");

            $isDown = ($instNo === 0) 
                || (stripos($pay['tag'] ?? '', 'ডাউন') !== false) 
                || (stripos($pay['tag'] ?? '', 'down') !== false);

            $category = $isDown ? 'downpayment' : 'installment';
            $purpose = $isDown ? 'ডাউন পেমেন্ট আদায়' : 'মাসিক কিস্তি আদায়';
            $labelTag = $isDown ? "ডাউন পেমেন্ট" : "কিস্তি #{$instNo}";
            $cashSource = "{$custName} (কার্ড-{$cardNo}, {$labelTag})";
            $cashRemarks = "রশিদ নং: " . ($pay['receipt_number'] ?: 'N/A') . " | মাধ্যম: " . ($pay['payment_method'] ?: 'Cash');

            if ($insertStmt) {
                $insertStmt->bind_param(
                    "ssdsssssi",
                    $cashSource,
                    $purpose,
                    $amount,
                    $category,
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
            'total_discounts_count' => count($settlementsInDateRange),
            'total_discount_amount' => $totalDiscountAmount,
            'total_settled_amount' => $totalSettledCollectedAmount,
            'total_waived_count' => count($waivedPayments),
            'total_waived_amount' => $totalWaivedAmount
        ],
        'discrepancies' => $discrepancies,
        'discounts_and_waivers' => [
            'settlements' => $settlementsInDateRange,
            'waived_installments' => $waivedPayments
        ],
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

// Fallback HTML...
?>
<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <title>মাসিক কিস্তি ও ক্যাশ অডিট রিপোর্ট</title>
</head>
<body style="font-family:sans-serif; background:#0f172a; color:#f8fafc; padding:20px;">
    <h2>Audit Result</h2>
    <pre><?= htmlspecialchars(json_encode($executionResult, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)) ?></pre>
</body>
</html>
