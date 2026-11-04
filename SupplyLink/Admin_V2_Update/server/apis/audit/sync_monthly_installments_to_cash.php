<?php
/**
 * ============================================================================
 * SupplyLink - Monthly Installments & Cash Synchronization API
 * File: server/apis/audit/sync_monthly_installments_to_cash.php
 * ============================================================================
 */

ini_set('display_errors', 0);
error_reporting(E_ALL);

date_default_timezone_set('Asia/Dhaka');

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

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
// ACTION: FIX / SYNC SINGLE MONTHLY INSTALLMENT TO CASH
// -----------------------------------------------------------------------------
if ($action === 'fix_single') {
    $payId = (int)($_REQUEST['payment_id'] ?? 0);

    if ($payId <= 0) {
        sendResponse(['success' => false, 'message' => 'সঠিক পেমেন্ট আইডি প্রদান করুন'], 400);
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
            u.name AS customer_name,
            u.mobile AS customer_mobile
        FROM installment_payments ip
        JOIN installment_cards ic ON ic.card_id = ip.card_id
        LEFT JOIN users u ON u.user_id = ic.user_id
        WHERE ip.id = ? AND ip.status = 'Paid' AND ip.installment_no > 0
        LIMIT 1
    ");
    $stmt->bind_param("i", $payId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) {
        sendResponse(['success' => false, 'message' => 'পরিশোধিত মাসিক কিস্তির রেকর্ড পাওয়া যায়নি'], 404);
    }

    $refKey = "INST-PAY-" . $payId;
    $chk = $mysqli->prepare("SELECT id FROM cash WHERE refId = ? AND is_deleted = 0 LIMIT 1");
    $chk->bind_param("s", $refKey);
    $chk->execute();
    $existingCash = $chk->get_result()->fetch_assoc();
    $chk->close();

    if ($existingCash) {
        sendResponse([
            'success' => true,
            'message' => 'এই কিস্তির টাকা ইতোমধ্যে ক্যাশে যুক্ত রয়েছে (Cash ID: #' . $existingCash['id'] . ')',
            'cash_id' => $existingCash['id']
        ]);
    }

    $amount = (float)$row['due_amount'];
    $paidDate = !empty($row['paid_date']) ? $row['paid_date'] : date('Y-m-d');
    $customerName = trim($row['customer_name'] ?: 'Customer');
    $cId = $row['official_card_id'] ?: $row['card_id'];
    $instNo = (int)$row['installment_no'];

    $suffixes = [1 => '1st', 2 => '2nd', 3 => '3rd'];
    $instTag = $suffixes[$instNo] ?? ($instNo . 'th');

    $source = "{$customerName} {$instTag} Installment Card No {$cId}";
    $purpose = "Installment Collection";
    $category = "installment";
    $paymentMethod = $row['payment_method'] ?: 'Cash';
    $remarks = "কিস্তি আদায়: কার্ড #{$cId} ({$row['product_name']}), কিস্তি নং: {$instNo}, মাধ্যম: {$paymentMethod}";
    $approvalStatus = "approved";
    $approvedBy = !empty($row['collected_by']) ? (int)$row['collected_by'] : 1;

    $ins = $mysqli->prepare("
        INSERT INTO cash (
            type, source, purpose, amount, category, refId, remarks, date, 
            createdAt, approval_status, approved_by, approved_at, is_deleted
        ) VALUES (
            'in', ?, ?, ?, ?, ?, ?, ?, 
            NOW(), ?, ?, NOW(), 0
        )
    ");
    $ins->bind_param(
        "ssdsssssi",
        $source,
        $purpose,
        $amount,
        $category,
        $refKey,
        $remarks,
        $paidDate,
        $approvalStatus,
        $approvedBy
    );

    if ($ins->execute()) {
        $newCashId = $ins->insert_id;
        $ins->close();
        sendResponse([
            'success' => true,
            'message' => "মাসিক কিস্তির {$amount} ৳ সফলভাবে ক্যাশে সিঙ্ক হয়েছে (Cash ID: #{$newCashId})",
            'payment_id' => $payId,
            'cash_id' => $newCashId,
            'amount' => $amount
        ]);
    } else {
        $err = $ins->error;
        $ins->close();
        sendResponse(['success' => false, 'message' => "ক্যাশে সিঙ্ক করতে ব্যর্থ: {$err}"], 500);
    }
}

// -----------------------------------------------------------------------------
// ACTION: FIX / SYNC ALL MISSING MONTHLY INSTALLMENTS
// -----------------------------------------------------------------------------
if ($action === 'fix_all') {
    // 1. Fetch existing cash entries
    $cashByRef = [];
    $cRes = $mysqli->query("SELECT id, refId FROM cash WHERE is_deleted = 0 AND refId LIKE 'INST-PAY-%'");
    while ($c = $cRes->fetch_assoc()) {
        $cashByRef[$c['refId']] = (int)$c['id'];
    }

    $q = $mysqli->query("
        SELECT 
            ip.id AS payment_id,
            ip.card_id,
            ip.installment_no,
            ip.tag,
            ip.due_amount,
            ip.paid_date,
            ip.payment_method,
            ip.collected_by,
            ic.card_id AS official_card_id,
            ic.product_name,
            u.name AS customer_name
        FROM installment_payments ip
        JOIN installment_cards ic ON ic.card_id = ip.card_id
        LEFT JOIN users u ON u.user_id = ic.user_id
        WHERE ip.status = 'Paid' AND ip.installment_no > 0
        ORDER BY ip.paid_date ASC, ip.id ASC
    ");

    $syncedCount = 0;
    $syncedAmount = 0;
    $errors = [];

    while ($row = $q->fetch_assoc()) {
        $payId = (int)$row['payment_id'];
        $refKey = "INST-PAY-" . $payId;

        if (isset($cashByRef[$refKey])) {
            continue;
        }

        $amount = (float)$row['due_amount'];
        $paidDate = !empty($row['paid_date']) ? $row['paid_date'] : date('Y-m-d');
        $customerName = trim($row['customer_name'] ?: 'Customer');
        $cId = $row['official_card_id'] ?: $row['card_id'];
        $instNo = (int)$row['installment_no'];

        $suffixes = [1 => '1st', 2 => '2nd', 3 => '3rd'];
        $instTag = $suffixes[$instNo] ?? ($instNo . 'th');

        $source = "{$customerName} {$instTag} Installment Card No {$cId}";
        $purpose = "Installment Collection";
        $category = "installment";
        $remarks = "কিস্তি আদায়: কার্ড #{$cId} ({$row['product_name']}), কিস্তি নং: {$instNo}";
        $approvalStatus = "approved";
        $approvedBy = !empty($row['collected_by']) ? (int)$row['collected_by'] : 1;

        $ins = $mysqli->prepare("
            INSERT INTO cash (
                type, source, purpose, amount, category, refId, remarks, date, 
                createdAt, approval_status, approved_by, approved_at, is_deleted
            ) VALUES (
                'in', ?, ?, ?, ?, ?, ?, ?, 
                NOW(), ?, ?, NOW(), 0
            )
        ");
        $ins->bind_param("ssdsssssi", $source, $purpose, $amount, $category, $refKey, $remarks, $paidDate, $approvalStatus, $approvedBy);

        if ($ins->execute()) {
            $syncedCount++;
            $syncedAmount += $amount;
            $cashByRef[$refKey] = $ins->insert_id;
        } else {
            $errors[] = "পেমেন্ট #{$payId} ব্যর্থ: " . $ins->error;
        }
        $ins->close();
    }

    sendResponse([
        'success' => true,
        'message' => "মোট {$syncedCount} টি মিসিং মাসিক কিস্তি (মোট " . number_format($syncedAmount, 2) . " ৳) সফলভাবে ক্যাশে সিঙ্ক করা হয়েছে।",
        'synced_count' => $syncedCount,
        'synced_amount' => $syncedAmount,
        'errors' => $errors
    ]);
}

// -----------------------------------------------------------------------------
// DEFAULT ACTION: AUDIT (LIST ALL MONTHLY INSTALLMENTS WITH CASH MATCH)
// -----------------------------------------------------------------------------
// Preload all cash transactions for fast matching
$allCash = [];
$cRes = $mysqli->query("
    SELECT id, amount, date, source, category, refId, remarks 
    FROM cash 
    WHERE is_deleted = 0
");
while ($c = $cRes->fetch_assoc()) {
    $allCash[] = [
        'id' => (int)$c['id'],
        'amount' => (float)$c['amount'],
        'date' => $c['date'],
        'source' => strtolower($c['source'] ?? ''),
        'category' => $c['category'] ?? '',
        'refId' => $c['refId'] ?? '',
        'remarks' => strtolower($c['remarks'] ?? '')
    ];
}

$sql = "
    SELECT 
        ip.id AS payment_id,
        ip.card_id,
        ip.installment_no,
        ip.tag,
        ip.due_amount,
        ip.paid_date,
        ip.payment_method,
        ip.receipt_number,
        ip.status,
        ip.collected_by,
        ic.card_id AS official_card_id,
        ic.installment_type,
        ic.product_name,
        ic.per_installment_amount,
        u.name AS customer_name,
        u.mobile AS customer_mobile,
        collector.name AS collector_name
    FROM installment_payments ip
    JOIN installment_cards ic ON ic.card_id = ip.card_id
    LEFT JOIN users u ON u.user_id = ic.user_id
    LEFT JOIN users collector ON collector.id = ip.collected_by OR collector.user_id = ip.collected_by
    WHERE ip.status = 'Paid' AND ip.installment_no > 0
    ORDER BY ip.paid_date DESC, ip.id DESC
";

$res = $mysqli->query($sql);
if (!$res) {
    sendResponse(['success' => false, 'message' => "কুয়েরি ত্রুটি: " . $mysqli->error], 500);
}

$stats = [
    'total_records' => 0,
    'total_amount' => 0,
    'synced_count' => 0,
    'synced_amount' => 0,
    'missing_count' => 0,
    'missing_amount' => 0,
];

$records = [];

while ($row = $res->fetch_assoc()) {
    $payId = (int)$row['payment_id'];
    $cardId = (int)($row['official_card_id'] ?: $row['card_id']);
    $amount = (float)$row['due_amount'];
    $refKey = "INST-PAY-" . $payId;
    $paidDate = $row['paid_date'];
    $instNo = (int)$row['installment_no'];
    $custNameLower = strtolower($row['customer_name'] ?? '');

    $stats['total_records']++;
    $stats['total_amount'] += $amount;

    $isSynced = false;
    $matchedCashId = null;
    $matchType = null;

    // Strategy 1: Match by exact refId
    foreach ($allCash as $c) {
        if ($c['refId'] === $refKey) {
            $isSynced = true;
            $matchedCashId = $c['id'];
            $matchType = 'exact_ref';
            break;
        }
    }

    // Strategy 2: Match by cardId in source and exact amount
    if (!$isSynced) {
        foreach ($allCash as $c) {
            if (abs($c['amount'] - $amount) < 0.01) {
                if (
                    strpos($c['source'], "card no {$cardId}") !== false ||
                    strpos($c['source'], "card {$cardId}") !== false ||
                    strpos($c['source'], "card no 0{$cardId}") !== false ||
                    strpos($c['source'], "card #{$cardId}") !== false ||
                    strpos($c['remarks'], "#{$cardId}") !== false
                ) {
                    $isSynced = true;
                    $matchedCashId = $c['id'];
                    $matchType = 'card_and_amount_match';
                    break;
                }
            }
        }
    }

    // Strategy 3: Match by cardId in advance/lump-sum (e.g., Card 3 Shohel Miah 20,000 lump sum)
    if (!$isSynced) {
        foreach ($allCash as $c) {
            if (
                (strpos($c['source'], "card no {$cardId}") !== false || strpos($c['source'], "card {$cardId}") !== false) &&
                (strpos($c['source'], "advance") !== false || strpos($c['source'], "01-") !== false || $c['amount'] > $amount)
            ) {
                $isSynced = true;
                $matchedCashId = $c['id'];
                $matchType = 'batch_advance_match';
                break;
            }
        }
    }

    // Strategy 4: Match by customer name and date + amount
    if (!$isSynced && !empty($custNameLower) && !empty($paidDate)) {
        foreach ($allCash as $c) {
            if ($c['date'] === $paidDate && abs($c['amount'] - $amount) < 0.01) {
                $firstWord = explode(' ', trim($custNameLower))[0] ?? '';
                if (strlen($firstWord) >= 4 && strpos($c['source'], $firstWord) !== false) {
                    $isSynced = true;
                    $matchedCashId = $c['id'];
                    $matchType = 'name_date_match';
                    break;
                }
            }
        }
    }

    if ($isSynced) {
        $stats['synced_count']++;
        $stats['synced_amount'] += $amount;
    } else {
        $stats['missing_count']++;
        $stats['missing_amount'] += $amount;
    }

    $records[] = [
        'payment_id' => $payId,
        'card_id' => $cardId,
        'installment_no' => $instNo,
        'tag' => $row['tag'],
        'customer_name' => $row['customer_name'] ?? 'Unknown Customer',
        'customer_mobile' => $row['customer_mobile'] ?? '',
        'product_name' => $row['product_name'] ?? 'N/A',
        'amount' => $amount,
        'paid_date' => $row['paid_date'],
        'payment_method' => $row['payment_method'] ?? 'Cash',
        'collector_name' => $row['collector_name'] ?? ($row['collected_by'] ? "User #{$row['collected_by']}" : 'System'),
        'sync_status' => $isSynced ? 'synced' : 'missing',
        'match_type' => $matchType,
        'matched_cash_id' => $matchedCashId,
    ];
}

sendResponse([
    'success' => true,
    'stats' => $stats,
    'data' => $records
]);
