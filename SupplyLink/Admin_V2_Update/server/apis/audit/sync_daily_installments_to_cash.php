<?php
/**
 * ============================================================================
 * SupplyLink - Daily Installments & Cash Synchronization Audit API
 * ফাইল: server/apis/audit/sync_daily_installments_to_cash.php
 * ============================================================================
 */

ini_set('display_errors', 0);
error_reporting(E_ALL);

date_default_timezone_set('Asia/Dhaka');

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers/cash_helper.php';

header("Content-Type: application/json; charset=UTF-8");

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
// ACTION: FIX / SYNC SINGLE DAILY INSTALLMENT TO CASH
// -----------------------------------------------------------------------------
if ($action === 'fix_single') {
    $dailyId = (int)($_REQUEST['daily_id'] ?? 0);

    if ($dailyId <= 0) {
        sendResponse([
            'success' => false,
            'message' => 'অবৈধ কিস্তি আইডি (Invalid daily installment ID)'
        ], 400);
    }

    $q = $mysqli->prepare("
        SELECT id, userId, cardId, amount, date, receiver 
        FROM daily_installments 
        WHERE id = ? 
        LIMIT 1
    ");
    $q->bind_param("i", $dailyId);
    $q->execute();
    $item = $q->get_result()->fetch_assoc();
    $q->close();

    if (!$item) {
        sendResponse([
            'success' => false,
            'message' => 'দৈনিক কিস্তির তথ্য খুঁজে পাওয়া যায়নি'
        ], 404);
    }

    $synced = syncDailyInstallmentCash(
        $mysqli, 
        $item['id'], 
        $item['cardId'], 
        $item['userId'], 
        $item['amount'], 
        $item['date'], 
        $item['receiver'], 
        false
    );

    if ($synced) {
        sendResponse([
            'success' => true,
            'message' => 'দৈনিক কিস্তি সফলভাবে ক্যাশে সিঙ্ক করা হয়েছে',
            'daily_id' => $dailyId,
            'amount' => (float)$item['amount']
        ]);
    } else {
        sendResponse([
            'success' => false,
            'message' => 'ক্যাশ টেবিলে সিঙ্ক করতে ব্যর্থ হয়েছে'
        ], 500);
    }
}

// -----------------------------------------------------------------------------
// ACTION: FIX / SYNC ALL MISSING DAILY INSTALLMENTS
// -----------------------------------------------------------------------------
if ($action === 'fix_all') {
    // 1. Fetch all itemized and batch cash
    $itemCash = [];
    $cRes = $mysqli->query("SELECT refId FROM cash WHERE category = 'daily-installment' AND is_deleted = 0 AND refId LIKE 'DAILY-INST-%'");
    while ($c = $cRes->fetch_assoc()) {
        $itemCash[$c['refId']] = true;
    }

    $batchCash = [];
    $bRes = $mysqli->query("SELECT date FROM cash WHERE category = 'daily-installment' AND is_deleted = 0 AND (refId IS NULL OR refId = '')");
    while ($b = $bRes->fetch_assoc()) {
        $batchCash[$b['date']] = true;
    }

    // 2. Fetch all daily installments
    $dRes = $mysqli->query("
        SELECT id, userId, cardId, amount, date, receiver 
        FROM daily_installments 
        ORDER BY date ASC, id ASC
    ");

    $syncedCount = 0;
    $syncedAmount = 0;
    $errors = [];

    while ($item = $dRes->fetch_assoc()) {
        $dailyId = $item['id'];
        $refKey = "DAILY-INST-" . $dailyId;
        $date = $item['date'];

        // If already itemized or covered in batch, skip to avoid double cash-in
        if (isset($itemCash[$refKey]) || isset($batchCash[$date])) {
            continue;
        }

        $ok = syncDailyInstallmentCash(
            $mysqli,
            $item['id'],
            $item['cardId'],
            $item['userId'],
            $item['amount'],
            $item['date'],
            $item['receiver'],
            false
        );

        if ($ok) {
            $syncedCount++;
            $syncedAmount += (float)$item['amount'];
            $itemCash[$refKey] = true;
        } else {
            $errors[] = "কিস্তি #{$dailyId} সিঙ্ক করতে সমস্যা হয়েছে";
        }
    }

    sendResponse([
        'success' => true,
        'message' => "মোট {$syncedCount} টি মিসিং কিস্তি (৳" . number_format($syncedAmount, 2) . ") সফলভাবে ক্যাশে সিঙ্ক করা হয়েছে।",
        'synced_count' => $syncedCount,
        'synced_amount' => $syncedAmount,
        'errors' => $errors
    ]);
}

// -----------------------------------------------------------------------------
// ACTION: CONVERT BATCH ENTRIES TO REAL ITEMIZED INSTALLMENTS WITH CUSTOMER NAMES
// -----------------------------------------------------------------------------
if ($action === 'convert_batches') {
    // 1. Soft-delete all old batch entries (without refId)
    $delBatchQuery = "
        UPDATE cash 
        SET 
            is_deleted = 1,
            deleted_at = NOW(),
            delete_reason = 'Replaced with real itemized daily installments via audit'
        WHERE category = 'daily-installment' 
          AND is_deleted = 0 
          AND (refId IS NULL OR refId = '')
    ";
    $mysqli->query($delBatchQuery);
    $deletedBatchCount = $mysqli->affected_rows;

    // 2. Fetch all daily installments that do not yet have an active itemized cash entry
    $missingQuery = "
        SELECT d.id, d.userId, d.cardId, d.amount, d.date, d.receiver 
        FROM daily_installments d
        LEFT JOIN cash ON (cash.refId = CONCAT('DAILY-INST-', d.id) AND cash.category = 'daily-installment' AND cash.is_deleted = 0)
        WHERE cash.id IS NULL
        ORDER BY d.date ASC, d.id ASC
    ";
    $mRes = $mysqli->query($missingQuery);

    $insertedCount = 0;
    $insertedAmount = 0;
    $errors = [];

    while ($item = $mRes->fetch_assoc()) {
        $ok = syncDailyInstallmentCash(
            $mysqli,
            $item['id'],
            $item['cardId'],
            $item['userId'],
            $item['amount'],
            $item['date'],
            $item['receiver'],
            false
        );

        if ($ok) {
            $insertedCount++;
            $insertedAmount += (float)$item['amount'];
        } else {
            $errors[] = "কিস্তি #{$item['id']} সিঙ্ক করতে ব্যর্থ হয়েছে";
        }
    }

    sendResponse([
        'success' => true,
        'message' => "সফলভাবে {$deletedBatchCount} টি পুরানো ব্যাচ এন্ট্রি সরানো হয়েছে এবং {$insertedCount} টি আসল কিস্তি গ্রাহকের নাম ও কার্ড নম্বরসহ ক্যাশে যুক্ত করা হয়েছে (মোট ৳" . number_format($insertedAmount, 2) . ")।",
        'deleted_batch_count' => $deletedBatchCount,
        'inserted_real_count' => $insertedCount,
        'inserted_real_amount' => $insertedAmount,
        'errors' => $errors
    ]);
}

// -----------------------------------------------------------------------------
// ACTION: AUDIT / LIST
// -----------------------------------------------------------------------------
// 1. Fetch batch cash entries (grouped by date)
$batchCash = [];
$bRes = $mysqli->query("
    SELECT id, date, amount, source, remarks 
    FROM cash 
    WHERE category = 'daily-installment' 
      AND is_deleted = 0 
      AND (refId IS NULL OR refId = '')
");
while ($b = $bRes->fetch_assoc()) {
    $batchCash[$b['date']][] = $b;
}

// 2. Fetch itemized cash entries (by refId)
$itemCash = [];
$iRes = $mysqli->query("
    SELECT id, date, amount, refId, remarks 
    FROM cash 
    WHERE category = 'daily-installment' 
      AND is_deleted = 0 
      AND refId LIKE 'DAILY-INST-%'
");
while ($i = $iRes->fetch_assoc()) {
    $itemCash[$i['refId']] = $i;
}

// 3. Fetch all daily installments with customer & card details
$sql = "
    SELECT 
        d.id as daily_id,
        d.userId,
        d.cardId,
        d.amount,
        d.date,
        d.receiver,
        d.created_at,
        u.name as customer_name,
        u.mobile as customer_mobile,
        c.product_name,
        rec.name as receiver_name
    FROM daily_installments d
    LEFT JOIN users u ON u.user_id = d.userId
    LEFT JOIN installment_cards c ON c.id = d.cardId
    LEFT JOIN users rec ON rec.user_id = d.receiver
    ORDER BY d.date DESC, d.id DESC
";
$dRes = $mysqli->query($sql);

$records = [];
$stats = [
    'total_records' => 0,
    'total_amount' => 0,
    'synced_count' => 0,
    'synced_amount' => 0,
    'batch_count' => 0,
    'batch_amount' => 0,
    'missing_count' => 0,
    'missing_amount' => 0,
];

while ($row = $dRes->fetch_assoc()) {
    $stats['total_records']++;
    $amt = (float)$row['amount'];
    $stats['total_amount'] += $amt;

    $dailyId = (int)$row['daily_id'];
    $refKey = "DAILY-INST-" . $dailyId;
    $date = $row['date'];

    $syncStatus = 'missing';
    $matchType = 'none';
    $matchedCashId = null;
    $matchedCashAmount = null;
    $batchNote = null;

    if (isset($itemCash[$refKey])) {
        $syncStatus = 'synced';
        $matchType = 'exact_item';
        $matchedCashId = $itemCash[$refKey]['id'];
        $matchedCashAmount = (float)$itemCash[$refKey]['amount'];
        $stats['synced_count']++;
        $stats['synced_amount'] += $amt;
    } elseif (isset($batchCash[$date])) {
        $syncStatus = 'batch_synced';
        $matchType = 'batch_date';
        $bEntry = $batchCash[$date][0];
        $matchedCashId = $bEntry['id'];
        $matchedCashAmount = (float)$bEntry['amount'];
        $batchNote = "এই তারিখের মোট কালেকশন ক্যাশ আইডি #{$matchedCashId} তে ৳" . number_format($matchedCashAmount, 2) . " হিসেবে অন্তর্ভুক্ত আছে।";
        $stats['batch_count']++;
        $stats['batch_amount'] += $amt;
    } else {
        $syncStatus = 'missing';
        $stats['missing_count']++;
        $stats['missing_amount'] += $amt;
    }

    $records[] = [
        'daily_id' => $dailyId,
        'user_id' => (int)$row['userId'],
        'card_id' => (int)$row['cardId'],
        'customer_name' => $row['customer_name'] ?? 'Unknown Customer',
        'customer_mobile' => $row['customer_mobile'] ?? '',
        'product_name' => $row['product_name'] ?? 'N/A',
        'receiver_id' => $row['receiver'],
        'receiver_name' => $row['receiver_name'] ?? "User #{$row['receiver']}",
        'amount' => $amt,
        'date' => $row['date'],
        'created_at' => $row['created_at'],
        'sync_status' => $syncStatus,
        'match_type' => $matchType,
        'matched_cash_id' => $matchedCashId,
        'matched_cash_amount' => $matchedCashAmount,
        'batch_note' => $batchNote,
    ];
}

// 4. Reverse Audit: Check Cash entries that are EXTRA or have discrepancies
$extraCash = [];
$dailySumsByDate = [];
$sumRes = $mysqli->query("SELECT date, COUNT(*) as cnt, SUM(amount) as total FROM daily_installments GROUP BY date");
while ($s = $sumRes->fetch_assoc()) {
    $dailySumsByDate[$s['date']] = (float)$s['total'];
}

$allDailyIds = [];
$idRes = $mysqli->query("SELECT id FROM daily_installments");
while ($idRow = $idRes->fetch_assoc()) {
    $allDailyIds[(int)$idRow['id']] = true;
}

$allCashRes = $mysqli->query("
    SELECT id, date, amount, source, purpose, category, refId, remarks, createdAt, approved_by 
    FROM cash 
    WHERE category = 'daily-installment' AND is_deleted = 0 
    ORDER BY date DESC, id DESC
");

$stats['extra_cash_count'] = 0;
$stats['extra_cash_amount'] = 0;

while ($c = $allCashRes->fetch_assoc()) {
    $refId = $c['refId'];
    $cAmount = (float)$c['amount'];
    $cDate = $c['date'];

    if (!empty($refId) && preg_match('/^DAILY-INST-(\d+)$/', $refId, $m)) {
        $instId = (int)$m[1];
        if (!isset($allDailyIds[$instId])) {
            $stats['extra_cash_count']++;
            $stats['extra_cash_amount'] += $cAmount;
            $extraCash[] = [
                'cash_id' => (int)$c['id'],
                'date' => $cDate,
                'amount' => $cAmount,
                'source' => $c['source'],
                'refId' => $refId,
                'remarks' => $c['remarks'],
                'issue_type' => 'ghost_ref',
                'description' => "ক্যাশে refId {$refId} আছে কিন্তু দৈনিক কিস্তি টেবিলে #{$instId} রেকর্ড পাওয়া যায়নি!"
            ];
        }
    } else {
        // Lump sum / manual entry
        $dTotalOnDate = $dailySumsByDate[$cDate] ?? 0;
        if ($dTotalOnDate == 0) {
            $stats['extra_cash_count']++;
            $stats['extra_cash_amount'] += $cAmount;
            $extraCash[] = [
                'cash_id' => (int)$c['id'],
                'date' => $cDate,
                'amount' => $cAmount,
                'source' => $c['source'],
                'refId' => $refId,
                'remarks' => $c['remarks'],
                'issue_type' => 'no_daily_records',
                'description' => "ক্যাশে ৳" . number_format($cAmount, 2) . " জমা আছে কিন্তু এই তারিখে ({$cDate}) দৈনিক কিস্তির কোনো কালেকশন ডাটাবেজে নেই!"
            ];
        } elseif ($cAmount > $dTotalOnDate) {
            $diff = $cAmount - $dTotalOnDate;
            $stats['extra_cash_count']++;
            $stats['extra_cash_amount'] += $diff;
            $extraCash[] = [
                'cash_id' => (int)$c['id'],
                'date' => $cDate,
                'amount' => $cAmount,
                'daily_total' => $dTotalOnDate,
                'excess_amount' => $diff,
                'source' => $c['source'],
                'refId' => $refId,
                'remarks' => $c['remarks'],
                'issue_type' => 'excess_amount',
                'description' => "ক্যাশে ৳" . number_format($cAmount, 2) . " আছে, কিন্তু দৈনিক কিস্তির মোট আদায় ৳" . number_format($dTotalOnDate, 2) . " (ক্যাশে ৳" . number_format($diff, 2) . " বেশি রয়েছে)!"
            ];
        }
    }
}

sendResponse([
    'success' => true,
    'stats' => $stats,
    'data' => $records,
    'extra_cash' => $extraCash
]);

