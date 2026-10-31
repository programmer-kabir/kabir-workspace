<?php
/**
 * Sync & Microscopic Audit: Daily Installments (daily_installments table) to Cash Ledger
 * 
 * FEATURES:
 * - Syncs collections from daily_installments table to cash table
 * - Standard Format: [Customer Name] (কার্ড-[Card No], দৈনিক কিস্তি)
 * - Category: daily-installment
 * - Purpose: দৈনিক কিস্তি আদায়
 * - Type: in
 * - RefId: daily_installment_[id]
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
// ACTION: FIX SINGLE DAILY INSTALLMENT TO CASH
// -----------------------------------------------------------------------------
if ($action === 'fix_single') {
    $dailyId = (int)($_REQUEST['payment_id'] ?? $_REQUEST['daily_id'] ?? 0);
    if ($dailyId <= 0) {
        returnJson(['success' => false, 'message' => 'অবৈধ দৈনিক কিস্তি আইডি (Invalid Daily ID)']);
    }

    $q = $mysqli->prepare("
        SELECT 
            di.id, di.date, di.amount, di.cardId, di.userId, di.receiver, di.created_at,
            u.name as customer_name,
            ic.card_number, ic.product_name,
            r.name as receiver_name
        FROM daily_installments di
        LEFT JOIN users u ON di.userId = u.id
        LEFT JOIN installment_cards ic ON (di.cardId = ic.id OR di.cardId = ic.card_number)
        LEFT JOIN users r ON di.receiver = r.id
        WHERE di.id = ?
        LIMIT 1
    ");
    $q->bind_param("i", $dailyId);
    $q->execute();
    $di = $q->get_result()->fetch_assoc();
    $q->close();

    if (!$di) {
        returnJson(['success' => false, 'message' => 'দৈনিক কিস্তি রেকর্ড খুঁজে পাওয়া যায়নি']);
    }

    $refId = "daily_installment_" . $dailyId;
    $amount = (float)$di['amount'];
    $paidDate = $di['date'];
    $custName = !empty($di['customer_name']) ? trim($di['customer_name'], ", \t\n\r\0\x0B") : "গ্রাহক";
    $cardNo = !empty($di['card_number']) ? $di['card_number'] : $di['cardId'];
    $cashSource = "{$custName} (কার্ড-{$cardNo}, দৈনিক কিস্তি)";
    $purpose = "দৈনিক কিস্তি আদায়";
    $receiverId = (int)($di['receiver'] ?: 1);
    $receiverName = !empty($di['receiver_name']) ? $di['receiver_name'] : "স্টাফ #{$receiverId}";
    $cashRemarks = "দৈনিক কিস্তি আদায়: গ্রাহক {$custName} (ID: {$di['userId']}), কার্ড #{$cardNo}, সংগ্রাহক: {$receiverName}";
    $createdAt = !empty($di['created_at']) ? $di['created_at'] : date("Y-m-d H:i:s");

    // Check if already in cash
    $chk = $mysqli->prepare("SELECT id FROM cash WHERE refId = ? LIMIT 1");
    $chk->bind_param("s", $refId);
    $chk->execute();
    $existing = $chk->get_result()->fetch_assoc();
    $chk->close();

    if ($existing) {
        // Update
        $up = $mysqli->prepare("
            UPDATE cash 
            SET amount = ?, date = ?, source = ?, purpose = ?, remarks = ?, category = 'daily-installment'
            WHERE id = ?
        ");
        $up->bind_param("dssssi", $amount, $paidDate, $cashSource, $purpose, $cashRemarks, $existing['id']);
        $up->execute();
        $up->close();

        returnJson([
            'success' => true,
            'message' => "দৈনিক কিস্তি #{$dailyId} ক্যাশ এন্ট্রিতে সফলভাবে আপডেট ও সমান্তরাল করা হয়েছে!",
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
                'in', ?, ?, ?, 'daily-installment', 
                ?, ?, ?, ?, 
                'approved', ?, NOW()
            )
        ");
        $ins->bind_param("ssdssssi", $cashSource, $purpose, $amount, $refId, $cashRemarks, $paidDate, $createdAt, $receiverId);
        $ins->execute();
        $newId = $mysqli->insert_id;
        $ins->close();

        returnJson([
            'success' => true,
            'message' => "দৈনিক কিস্তি #{$dailyId} সফলভাবে ক্যাশ ইন লেজারে যুক্ত করা হয়েছে!",
            'cash_id' => $newId
        ]);
    }
}

// -----------------------------------------------------------------------------
// ACTION: DELETE GHOST DAILY INSTALLMENT CASH ENTRY
// -----------------------------------------------------------------------------
if ($action === 'delete_ghost') {
    $cashId = (int)($_REQUEST['cash_id'] ?? 0);
    if ($cashId <= 0) {
        returnJson(['success' => false, 'message' => 'অবৈধ ক্যাশ আইডি']);
    }

    $del = $mysqli->prepare("DELETE FROM cash WHERE id = ? AND refId LIKE 'daily_installment_%' LIMIT 1");
    $del->bind_param("i", $cashId);
    $del->execute();
    $affected = $del->affected_rows;
    $del->close();

    if ($affected > 0) {
        returnJson(['success' => true, 'message' => 'অবাঞ্ছিত/ঘোস্ট দৈনিক কিস্তি ক্যাশ এন্ট্রিটি সফলভাবে মুছে ফেলা হয়েছে।']);
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
          AND category = 'daily-installment'
          AND (refId IS NULL OR refId = '' OR refId NOT LIKE 'daily_installment_%')
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

    // B. Fetch Daily Installments from daily_installments table
    $dailySql = "
        SELECT 
            di.id as payment_id,
            di.id as daily_id,
            di.date as paid_date,
            di.amount,
            di.cardId as card_id,
            di.userId as user_id,
            di.receiver as collected_by,
            di.created_at,
            u.name as customer_name,
            u.mobile as customer_mobile,
            ic.card_number,
            ic.product_name,
            r.name as receiver_name
        FROM daily_installments di
        LEFT JOIN users u ON di.userId = u.id
        LEFT JOIN installment_cards ic ON (di.cardId = ic.id OR di.cardId = ic.card_number)
        LEFT JOIN users r ON di.receiver = r.id
        WHERE di.date BETWEEN ? AND ?
        ORDER BY di.date ASC, di.id ASC
    ";
    $dailyStmt = $mysqli->prepare($dailySql);
    $dailyStmt->bind_param("ss", $startDate, $endDate);
    $dailyStmt->execute();
    $allDailyInstallments = $dailyStmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $dailyStmt->close();

    // C. Fetch existing refIds in cash table (daily_installment_%)
    $refCheckSql = "
        SELECT id, refId, amount, date, source, purpose, remarks 
        FROM cash 
        WHERE refId LIKE 'daily_installment_%' 
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

    foreach ($allDailyInstallments as &$di) {
        $diId = (int)$di['payment_id'];
        $cardId = $di['card_id'];
        $paymentIdsFound[$diId] = true;
        $refId = "daily_installment_" . $diId;
        $d = $di['paid_date'];
        $amt = (float)$di['amount'];
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

        $matchedCashRow = $existingRefMap[$refId] ?? null;

        if ($matchedCashRow) {
            $di['cash_synced'] = true;
            $di['reconciled_via'] = 'direct';

            $cashAmt = (float)$matchedCashRow['amount'];
            $cashDate = $matchedCashRow['date'];

            $dateStats[$d]['cash_count']++;
            $dateStats[$d]['cash_amount'] += $cashAmt;

            // Check Amount Mismatch
            if (abs($cashAmt - $amt) > 0.01) {
                $discrepancies[] = [
                    'type' => 'amount_mismatch',
                    'title' => 'টাকার অমিল (Amount Mismatch)',
                    'description' => "দৈনিক কিস্তিতে ৳" . number_format($amt, 2) . " কিন্তু ক্যাশ লেজারে ৳" . number_format($cashAmt, 2) . " এন্ট্রি রয়েছে।",
                    'payment_id' => $diId,
                    'card_id' => $cardId,
                    'card_number' => $di['card_number'] ?: $cardId,
                    'customer_name' => $di['customer_name'],
                    'paid_date' => $di['paid_date'],
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
                    'description' => "কিস্তির তারিখ {$d} কিন্তু ক্যাশে {$cashDate} এন্ট্রি করা হয়েছে।",
                    'payment_id' => $diId,
                    'card_id' => $cardId,
                    'card_number' => $di['card_number'] ?: $cardId,
                    'customer_name' => $di['customer_name'],
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
            $di['cash_synced'] = false;
            $di['reconciled_via'] = 'none';

            $toInsertList[] = $di;
            $totalAmountToInsert += $amt;

            $discrepancies[] = [
                'type' => 'missing_in_cash',
                'title' => 'ক্যাশে মিসিং (Missing in Cash)',
                'description' => "দৈনিক কিস্তি গ্রাহকের লেজারে জমা হয়েছে, কিন্তু ক্যাশ ইন লেজারে এখনও যুক্ত হয়নি।",
                'payment_id' => $diId,
                'card_id' => $cardId,
                'card_number' => $di['card_number'] ?: $cardId,
                'customer_name' => $di['customer_name'],
                'paid_date' => $di['paid_date'],
                'card_amount' => $amt,
                'cash_amount' => 0,
                'difference' => $amt,
                'can_fix' => true
            ];
        }
    }
    unset($di);

    // E. Identify Ghost Cash entries
    foreach ($existingCashRows as $cr) {
        if (strpos($cr['refId'], 'daily_installment_') === 0) {
            $diId = (int)str_replace('daily_installment_', '', $cr['refId']);
            if ($diId > 0 && !isset($paymentIdsFound[$diId])) {
                $chkD = $mysqli->query("SELECT id FROM daily_installments WHERE id = $diId LIMIT 1");
                $dData = $chkD ? $chkD->fetch_assoc() : null;
                if (!$dData) {
                    $discrepancies[] = [
                        'type' => 'ghost_cash',
                        'title' => 'অবাঞ্ছিত ক্যাশ এন্ট্রি (Ghost Entry)',
                        'description' => "ক্যাশ লেজারে ৳" . number_format((float)$cr['amount'], 2) . " জমা দেখানো আছে, কিন্তু দৈনিক কিস্তি লেজারে এই আইডি পাওয়া যায়নি।",
                        'payment_id' => $diId,
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
                'in', ?, ?, ?, 'daily-installment', 
                ?, ?, ?, ?, 
                'approved', ?, NOW()
            )
        ");

        foreach ($toInsertList as $di) {
            $diId = (int)$di['payment_id'];
            $refId = "daily_installment_" . $diId;
            $custName = !empty($di['customer_name']) ? trim($di['customer_name'], ", \t\n\r\0\x0B") : "গ্রাহক";
            $cardNo = !empty($di['card_number']) ? $di['card_number'] : $di['card_id'];
            $amount = (float)$di['amount'];
            $paidDate = $di['paid_date'];
            $receiverId = (int)($di['collected_by'] ?: 1);
            $receiverName = !empty($di['receiver_name']) ? $di['receiver_name'] : "স্টাফ #{$receiverId}";
            $createdAt = !empty($di['created_at']) ? $di['created_at'] : date("Y-m-d H:i:s");

            $cashSource = "{$custName} (কার্ড-{$cardNo}, দৈনিক কিস্তি)";
            $purpose = "দৈনিক কিস্তি আদায়";
            $cashRemarks = "দৈনিক কিস্তি আদায়: গ্রাহক {$custName} (ID: {$di['user_id']}), কার্ড #{$cardNo}, সংগ্রাহক: {$receiverName}";

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
                    $receiverId
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
            'total_card_paid_count' => count($allDailyInstallments),
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
        'all_payments' => $allDailyInstallments
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
    <title>দৈনিক কিস্তি ও ক্যাশ অডিট রিপোর্ট</title>
</head>
<body style="font-family:sans-serif; background:#0f172a; color:#f8fafc; padding:20px;">
    <h2>Daily Installment Audit Result</h2>
    <pre><?= htmlspecialchars(json_encode($executionResult, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)) ?></pre>
</body>
</html>
