<?php
/**
 * ============================================================================
 * SupplyLink - Duplicate & Double Entry Payment Audit API
 * ফাইল: server/apis/audit/audit_duplicate_payments.php
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
// ACTION: FIX / ARCHIVE A DUPLICATE CASH ENTRY
// -----------------------------------------------------------------------------
if ($action === 'archive_cash_duplicate') {
    $cashId = (int)($_REQUEST['cash_id'] ?? 0);
    $reason = trim($_REQUEST['reason'] ?? 'Archived duplicate entry via audit');

    if ($cashId <= 0) {
        sendResponse(['success' => false, 'message' => 'অবৈধ ক্যাশ আইডি'], 400);
    }

    $stmt = $mysqli->prepare("UPDATE cash SET is_deleted = 1, deleted_at = NOW(), delete_reason = ? WHERE id = ?");
    $stmt->bind_param("si", $reason, $cashId);
    $ok = $stmt->execute();
    $stmt->close();

    if ($ok) {
        sendResponse(['success' => true, 'message' => "ক্যাশ এন্ট্রি #{$cashId} সফলভাবে আর্কাইভ করা হয়েছে।"]);
    } else {
        sendResponse(['success' => false, 'message' => 'আর্কাইভ করতে ব্যর্থ হয়েছে'], 500);
    }
}

// -----------------------------------------------------------------------------
// ACTION: AUDIT
// -----------------------------------------------------------------------------
$audit = [
    'ref_duplicates' => [],
    'payment_duplicates' => [],
    'same_day_duplicates' => [],
    'multiple_downpayments' => [],
    'cross_type_conflicts' => [],
];

$summary = [
    'total_issues_found' => 0,
    'total_excess_amount' => 0,
];

// 1. Check duplicate refId in cash (where refId is not empty)
$q1 = "
    SELECT 
        refId, 
        category, 
        COUNT(*) as cnt, 
        GROUP_CONCAT(id ORDER BY id ASC) as cash_ids, 
        SUM(amount) as total_amount,
        MIN(amount) as single_amount
    FROM cash 
    WHERE is_deleted = 0 AND refId IS NOT NULL AND refId != ''
    GROUP BY refId 
    HAVING cnt > 1
";
$r1 = $mysqli->query($q1);
if ($r1) {
    while ($row = $r1->fetch_assoc()) {
        $excess = (float)$row['total_amount'] - (float)$row['single_amount'];
        $summary['total_issues_found']++;
        $summary['total_excess_amount'] += $excess;
        $audit['ref_duplicates'][] = [
            'refId' => $row['refId'],
            'category' => $row['category'],
            'count' => (int)$row['cnt'],
            'cash_ids' => explode(',', $row['cash_ids']),
            'total_amount' => (float)$row['total_amount'],
            'excess_amount' => $excess,
            'description' => "ক্যাশ টেবিলে একই রেফারেন্স '{$row['refId']}' এর বিপরীতে {$row['cnt']} বার এন্ট্রি রয়েছে (অতিরিক্ত: ৳" . number_format($excess, 2) . ")।"
        ];
    }
}

// 2. Check duplicate payments in installment_payments (same card_id, installment_no, both Paid)
$q2 = "
    SELECT 
        p.card_id, 
        p.installment_no, 
        COUNT(*) as cnt, 
        GROUP_CONCAT(p.id) as payment_ids, 
        SUM(p.due_amount) as total_amount,
        MIN(p.due_amount) as single_amount,
        u.name as customer_name,
        c.product_name
    FROM installment_payments p
    LEFT JOIN installment_cards c ON c.card_id = p.card_id
    LEFT JOIN users u ON u.user_id = c.user_id
    WHERE p.status = 'Paid'
    GROUP BY p.card_id, p.installment_no 
    HAVING cnt > 1
";
$r2 = $mysqli->query($q2);
if ($r2) {
    while ($row = $r2->fetch_assoc()) {
        $excess = (float)$row['total_amount'] - (float)$row['single_amount'];
        $summary['total_issues_found']++;
        $summary['total_excess_amount'] += $excess;
        $audit['payment_duplicates'][] = [
            'card_id' => (int)$row['card_id'],
            'installment_no' => (int)$row['installment_no'],
            'count' => (int)$row['cnt'],
            'payment_ids' => explode(',', $row['payment_ids']),
            'customer_name' => $row['customer_name'] ?? 'N/A',
            'product_name' => $row['product_name'] ?? 'N/A',
            'total_amount' => (float)$row['total_amount'],
            'excess_amount' => $excess,
            'description' => "কার্ড #{$row['card_id']} এর কিস্তি নম্বর #{$row['installment_no']} চার্টে {$row['cnt']} বার 'Paid' হিসেবে আছে।"
        ];
    }
}

// 3. Same Day & Same Amount Duplicates in Cash (same source, date, amount, category)
$q3 = "
    SELECT 
        source, 
        amount, 
        date, 
        category, 
        COUNT(*) as cnt, 
        GROUP_CONCAT(id ORDER BY id ASC) as cash_ids
    FROM cash 
    WHERE is_deleted = 0 AND category IN ('installment', 'downpayment', 'daily-installment')
    GROUP BY source, amount, date, category 
    HAVING cnt > 1
";
$r3 = $mysqli->query($q3);
if ($r3) {
    while ($row = $r3->fetch_assoc()) {
        $amt = (float)$row['amount'];
        $excess = $amt * ($row['cnt'] - 1);
        $summary['total_issues_found']++;
        $summary['total_excess_amount'] += $excess;
        $audit['same_day_duplicates'][] = [
            'source' => $row['source'],
            'amount' => $amt,
            'date' => $row['date'],
            'category' => $row['category'],
            'count' => (int)$row['cnt'],
            'cash_ids' => explode(',', $row['cash_ids']),
            'excess_amount' => $excess,
            'description' => "একই তারিখে ({$row['date']}) একই ব্যক্তি/সোর্সে ({$row['source']}) ৳" . number_format($amt, 2) . " এর {$row['cnt']} বার ক্যাশ এন্ট্রি হয়েছে।"
        ];
    }
}

// 4. Cards with multiple down payment entries in cash
$allDownCash = $mysqli->query("SELECT id, source, amount, date, refId FROM cash WHERE category = 'downpayment' AND is_deleted = 0");
$downByCard = [];
while ($d = $allDownCash->fetch_assoc()) {
    $cardId = null;
    if (preg_match('/Card No (\d+)/i', $d['source'], $m)) {
        $cardId = (int)$m[1];
    } elseif (preg_match('/^DOWN-(\d+)$/i', $d['refId'], $m)) {
        $cardId = (int)$m[1];
    }
    if ($cardId) {
        $downByCard[$cardId][] = $d;
    }
}
foreach ($downByCard as $cid => $rows) {
    if (count($rows) > 1) {
        $tot = 0;
        foreach ($rows as $rw) $tot += (float)$rw['amount'];
        $first = (float)$rows[0]['amount'];
        $excess = $tot - $first;
        $summary['total_issues_found']++;
        $summary['total_excess_amount'] += $excess;
        $audit['multiple_downpayments'][] = [
            'card_id' => $cid,
            'count' => count($rows),
            'rows' => $rows,
            'total_amount' => $tot,
            'excess_amount' => $excess,
            'description' => "কার্ড #{$cid} এর বিপরীতে ক্যাশে " . count($rows) . " টি ডাউনপেমেন্ট এন্ট্রি রয়েছে।"
        ];
    }
}

// 5. Daily Installment Cards having regular monthly installments in cash WHILE having daily collections
$q5 = "
    SELECT 
        c.card_id, 
        c.installment_type, 
        u.name as customer_name, 
        cs.id as cash_id, 
        cs.amount as cash_amount, 
        cs.date as cash_date, 
        cs.source, 
        cs.refId
    FROM cash cs
    JOIN installment_payments p ON cs.refId = CONCAT('INST-PAY-', p.id)
    JOIN installment_cards c ON c.card_id = p.card_id
    JOIN users u ON u.user_id = c.user_id
    WHERE cs.is_deleted = 0 
      AND cs.category = 'installment' 
      AND c.installment_type = 'daily'
";
$r5 = $mysqli->query($q5);
if ($r5) {
    while ($row = $r5->fetch_assoc()) {
        $cid = (int)$row['card_id'];
        $cntDaily = $mysqli->query("SELECT COUNT(*) as cnt, SUM(amount) as tot FROM daily_installments WHERE cardId = {$cid}")->fetch_assoc();
        $dCnt = (int)($cntDaily['cnt'] ?? 0);
        $dTot = (float)($cntDaily['tot'] ?? 0);

        // If daily collections also exist, it's a conflict!
        if ($dCnt > 0) {
            $summary['total_issues_found']++;
            $summary['total_excess_amount'] += (float)$row['cash_amount'];
            $audit['cross_type_conflicts'][] = [
                'card_id' => $cid,
                'customer_name' => $row['customer_name'],
                'cash_id' => (int)$row['cash_id'],
                'cash_amount' => (float)$row['cash_amount'],
                'cash_date' => $row['cash_date'],
                'daily_collections_count' => $dCnt,
                'daily_collections_amount' => $dTot,
                'description' => "দৈনিক কিস্তির কার্ড #{$cid} ({$row['customer_name']}) এর দৈনিক কিস্তি চালু থাকা সত্ত্বেও মাসিক কিস্তি হিসেবে ৳" . number_format($row['cash_amount'], 2) . " ক্যাশে ঢুকেছে।"
            ];
        }
    }
}

sendResponse([
    'success' => true,
    'summary' => $summary,
    'audit' => $audit,
]);

