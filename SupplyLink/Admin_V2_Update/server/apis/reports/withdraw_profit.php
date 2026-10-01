<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

// ==========================
// ✅ CORS & Headers
// ==========================
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ==========================
// ✅ Database Connection
// ==========================
require_once __DIR__ . '/../db.php'; // provides $mysqli

function sendJson($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

function tableHasColumn($mysqli, $table, $column) {
    static $cache = [];
    $key = "$table.$column";
    if (isset($cache[$key])) return $cache[$key];
    $res = $mysqli->query("SHOW COLUMNS FROM `$table` LIKE '$column'");
    $exists = ($res && $res->num_rows > 0);
    $cache[$key] = $exists;
    return $exists;
}

// Helper: Calculate carry forward
function getCarryForwardInForMonth($mysqli, $targetMonth, $cashDeletedClause) {
    if (empty($targetMonth)) return 0.0;
    $startDateLimit = $targetMonth . "-01";
    
    $sqlPay = "
        SELECT DATE_FORMAT(paid_date, '%Y-%m') as ym, IFNULL(SUM(profit_amount), 0) as profit
        FROM installment_payments
        WHERE status = 'Paid' AND paid_date < '$startDateLimit'
        GROUP BY DATE_FORMAT(paid_date, '%Y-%m')
        ORDER BY ym ASC
    ";
    $resPay = $mysqli->query($sqlPay);
    $payByMonth = [];
    if ($resPay) {
        while ($r = $resPay->fetch_assoc()) {
            $payByMonth[$r['ym']] = (float)$r['profit'];
        }
    }

    $sqlExp = "
        SELECT DATE_FORMAT(date, '%Y-%m') as ym, IFNULL(SUM(amount), 0) as exp
        FROM cash
        WHERE type = 'out' AND LOWER(TRIM(source)) = 'company-expense' AND date < '$startDateLimit' $cashDeletedClause
        GROUP BY DATE_FORMAT(date, '%Y-%m')
        ORDER BY ym ASC
    ";
    $resExp = $mysqli->query($sqlExp);
    $expByMonth = [];
    if ($resExp) {
        while ($r = $resExp->fetch_assoc()) {
            $expByMonth[$r['ym']] = (float)$r['exp'];
        }
    }

    $sqlWith = "
        SELECT 
            CASE 
                WHEN refId LIKE 'profit-withdraw-%' THEN SUBSTRING(refId, 17, 7)
                WHEN purpose LIKE '%202_-%' THEN SUBSTRING(purpose, LOCATE('202', purpose), 7)
                ELSE DATE_FORMAT(date, '%Y-%m')
            END as ym,
            IFNULL(SUM(amount), 0) as withdrawn
        FROM cash
        WHERE type = 'out' AND (refId LIKE 'profit-withdraw-%' OR category = 'profit-withdraw') AND date < '$startDateLimit' $cashDeletedClause
        GROUP BY ym
        ORDER BY ym ASC
    ";
    $resWith = $mysqli->query($sqlWith);
    $withByMonth = [];
    if ($resWith) {
        while ($r = $resWith->fetch_assoc()) {
            $ym = trim($r['ym']);
            if (!empty($ym)) {
                $withByMonth[$ym] = (float)$r['withdrawn'];
            }
        }
    }

    $allPastMonths = array_unique(array_merge(array_keys($payByMonth), array_keys($expByMonth), array_keys($withByMonth)));
    sort($allPastMonths);

    $carried = 0.0;
    foreach ($allPastMonths as $pym) {
        if ($pym >= $targetMonth) continue;
        $pProfit = $payByMonth[$pym] ?? 0.0;
        $pExp = $expByMonth[$pym] ?? 0.0;
        $pWith = $withByMonth[$pym] ?? 0.0;
        $pNet = $pProfit + $carried - $pExp;
        $pRem = max(0, $pNet - $pWith);
        if ($pNet <= 0) {
            $carried = 0.0;
        } elseif ($pRem < 1.00) {
            $carried = $pRem;
        } else {
            $carried = 0.0;
        }
    }

    return $carried;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson([
        "success" => false,
        "message" => "Only POST method is allowed"
    ], 405);
}

$rawInput = file_get_contents("php://input");
$input = json_decode($rawInput, true);

if (!$input) {
    sendJson([
        "success" => false,
        "message" => "Invalid JSON payload"
    ], 400);
}

$month          = isset($input['month']) ? trim($input['month']) : null; // e.g. "2026-09"
$amount         = isset($input['amount']) ? (float)floor((float)$input['amount']) : 0;
$date           = isset($input['date']) && !empty($input['date']) ? trim($input['date']) : date('Y-m-d');
$payment_method = isset($input['payment_method']) ? trim($input['payment_method']) : 'Cash';
$remarks        = isset($input['remarks']) ? trim($input['remarks']) : '';

// 1. Validation
if (!$month || !preg_match("/^\d{4}-\d{2}$/", $month)) {
    sendJson([
        "success" => false,
        "message" => "সঠিক মাস সিলেক্ট করুন (YYYY-MM)"
    ], 400);
}

if ($amount <= 0) {
    sendJson([
        "success" => false,
        "message" => "উত্তোলনের পরিমাণ অন্তত ১ টাকা হতে হবে"
    ], 400);
}

$hasCashDeletedCol = tableHasColumn($mysqli, 'cash', 'is_deleted');
$cashDeletedClause = $hasCashDeletedCol ? " AND (is_deleted = 0 OR is_deleted IS NULL)" : "";

// 2. Calculate Current Cash In-Hand Balance
$cashBalanceQuery = "
    SELECT 
        SUM(CASE WHEN type = 'in' THEN amount ELSE 0 END) as total_in,
        SUM(CASE WHEN type = 'out' THEN amount ELSE 0 END) as total_out
    FROM cash
    WHERE 1=1 $cashDeletedClause
";
$resCash = $mysqli->query($cashBalanceQuery);
$cashRow = $resCash ? $resCash->fetch_assoc() : null;
$totalCashIn  = $cashRow ? (float)$cashRow['total_in'] : 0.0;
$totalCashOut = $cashRow ? (float)$cashRow['total_out'] : 0.0;
$availableCash = $totalCashIn - $totalCashOut;

if ($amount > $availableCash) {
    sendJson([
        "success" => false,
        "message" => "পর্যাপ্ত ক্যাশ ব্যালেন্স নেই! বর্তমান ক্যাশ ব্যালেন্স: ৳ " . number_format($availableCash),
        "available_cash" => round($availableCash)
    ], 400);
}

// 3. Calculate this Month's Collected Profit + Incoming Rollover
$startDate = $month . "-01";
$endDate   = date("Y-m-t", strtotime($startDate));

$stmtPay = $mysqli->prepare("
    SELECT IFNULL(SUM(profit_amount), 0) as collected_profit
    FROM installment_payments
    WHERE status = 'Paid' AND paid_date BETWEEN ? AND ?
");
$stmtPay->bind_param("ss", $startDate, $endDate);
$stmtPay->execute();
$payRow = $stmtPay->get_result()->fetch_assoc();
$collectedProfit = $payRow ? (float)$payRow['collected_profit'] : 0.0;

// 4. Calculate this Month's Company Expenses (source = 'company-expense')
$sqlExp = "
    SELECT IFNULL(SUM(amount), 0) as company_expenses
    FROM cash
    WHERE type = 'out'
      AND LOWER(TRIM(source)) = 'company-expense'
      AND date BETWEEN ? AND ?
      $cashDeletedClause
";
$stmtExp = $mysqli->prepare($sqlExp);
$stmtExp->bind_param("ss", $startDate, $endDate);
$stmtExp->execute();
$expRow = $stmtExp->get_result()->fetch_assoc();
$companyExpenses = $expRow ? (float)$expRow['company_expenses'] : 0.0;

$carryIn = getCarryForwardInForMonth($mysqli, $month, $cashDeletedClause);
$netProfit = $collectedProfit + $carryIn - $companyExpenses;

if ($netProfit <= 0) {
    sendJson([
        "success" => false,
        "message" => "এই মাসে কোনো উত্তোলনযোগ্য নিট মুনাফা নেই",
        "net_profit" => round($netProfit)
    ], 400);
}

// 5. Calculate Already Withdrawn for this Month
$refIdKey = "profit-withdraw-" . $month;
$sqlWithdrawn = "
    SELECT IFNULL(SUM(amount), 0) as already_withdrawn
    FROM cash
    WHERE type = 'out'
      AND (refId = ? OR (category = 'profit-withdraw' AND purpose LIKE ?))
      $cashDeletedClause
";
$stmtW = $mysqli->prepare($sqlWithdrawn);
$likePattern = "%" . $month . "%";
$stmtW->bind_param("ss", $refIdKey, $likePattern);
$stmtW->execute();
$wRow = $stmtW->get_result()->fetch_assoc();
$alreadyWithdrawn = $wRow ? (float)$wRow['already_withdrawn'] : 0.0;

$rawRemaining = max(0, $netProfit - $alreadyWithdrawn);
$maxAllowed = floor($rawRemaining);

if ($amount > $maxAllowed) {
    sendJson([
        "success" => false,
        "message" => "উত্তোলনের পরিমাণ অবশিষ্ট নিট প্রফিটের চেয়ে বেশি! সর্বোচ্চ উত্তোলনযোগ্য: ৳ " . number_format($maxAllowed),
        "remaining_profit" => $maxAllowed,
        "already_withdrawn" => round($alreadyWithdrawn),
        "net_profit" => round($netProfit)
    ], 400);
}

// 6. Insert Cash Out Entry for Profit Withdrawal
$monthLabel = date("F Y", strtotime($startDate));
$purpose = "Profit Withdrawal for " . $monthLabel;
if (!empty($remarks)) {
    $purpose .= " (" . $remarks . ")";
}

$category = "profit-withdraw";
$source   = "profit-distribution";

// Check which columns exist in cash table
$hasRefIdCol = tableHasColumn($mysqli, 'cash', 'refId');
$hasRemarksCol = tableHasColumn($mysqli, 'cash', 'remarks');
$hasApprovalStatusCol = tableHasColumn($mysqli, 'cash', 'approval_status');

if ($hasRefIdCol && $hasRemarksCol && $hasApprovalStatusCol) {
    $stmtInsert = $mysqli->prepare("
        INSERT INTO cash (type, category, source, purpose, amount, date, refId, remarks, approval_status, approved_at, approved_by, createdAt)
        VALUES ('out', ?, ?, ?, ?, ?, ?, ?, 'approved', NOW(), 1, NOW())
    ");
    $stmtInsert->bind_param("sssdsss", $category, $source, $purpose, $amount, $date, $refIdKey, $remarks);
} elseif ($hasRefIdCol && $hasRemarksCol) {
    $stmtInsert = $mysqli->prepare("
        INSERT INTO cash (type, category, source, purpose, amount, date, refId, remarks, createdAt)
        VALUES ('out', ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    $stmtInsert->bind_param("sssdsss", $category, $source, $purpose, $amount, $date, $refIdKey, $remarks);
} elseif ($hasRefIdCol && $hasApprovalStatusCol) {
    $stmtInsert = $mysqli->prepare("
        INSERT INTO cash (type, category, source, purpose, amount, date, refId, approval_status, approved_at, approved_by, createdAt)
        VALUES ('out', ?, ?, ?, ?, ?, ?, 'approved', NOW(), 1, NOW())
    ");
    $stmtInsert->bind_param("sssdss", $category, $source, $purpose, $amount, $date, $refIdKey);
} elseif ($hasRefIdCol) {
    $stmtInsert = $mysqli->prepare("
        INSERT INTO cash (type, category, source, purpose, amount, date, refId, createdAt)
        VALUES ('out', ?, ?, ?, ?, ?, ?, NOW())
    ");
    $stmtInsert->bind_param("sssdss", $category, $source, $purpose, $amount, $date, $refIdKey);
} else {
    $stmtInsert = $mysqli->prepare("
        INSERT INTO cash (type, category, source, purpose, amount, date, createdAt)
        VALUES ('out', ?, ?, ?, ?, ?, NOW())
    ");
    $stmtInsert->bind_param("sssds", $category, $source, $purpose, $amount, $date);
}

if ($stmtInsert->execute()) {
    $insertId = $stmtInsert->insert_id;
    $newTotalWithdrawn = $alreadyWithdrawn + $amount;
    $newRemaining = max(0, $netProfit - $newTotalWithdrawn);

    sendJson([
        "success" => true,
        "message" => "৳ " . number_format($amount, 2) . " সফলভাবে উইথড্র করা হয়েছে!",
        "withdrawal" => [
            "id"                => $insertId,
            "month"             => $month,
            "month_label"       => $monthLabel,
            "withdrawn_amount"  => round($amount, 2),
            "date"              => $date,
            "payment_method"    => $payment_method,
            "total_net_profit"  => round($netProfit, 2),
            "total_withdrawn"   => round($newTotalWithdrawn, 2),
            "remaining_profit"  => round($newRemaining, 2),
            "status"            => $newRemaining <= 0.01 ? "completed" : "partial"
        ]
    ]);
} else {
    sendJson([
        "success" => false,
        "message" => "ডাটাবেজ এরর: " . $mysqli->error
    ], 500);
}
