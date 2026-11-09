<?php
// server/apis/cash/today_cash_summary.php
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");

date_default_timezone_set('Asia/Dhaka');

// 1. Get & Validate Target Date
$targetDate = isset($_GET['date']) && trim($_GET['date']) !== '' 
    ? trim($_GET['date']) 
    : date('Y-m-d');

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $targetDate)) {
    http_response_code(400);
    echo json_encode([
        "success" => false, 
        "message" => "সঠিক তারিখ ফরম্যাট দিন (YYYY-MM-DD)"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Valid active approved cash records condition
$validCashCondition = "
    (is_deleted = 0 OR is_deleted IS NULL)
    AND (approval_status = 'approved' OR category = 'profit-withdraw')
";

try {
    // 2. Opening Cash Calculation (All net cash before target date)
    $sqlOpening = "
        SELECT 
            IFNULL(SUM(CASE WHEN type = 'in' THEN amount ELSE -amount END), 0) AS opening_cash
        FROM cash
        WHERE date < ? AND $validCashCondition
    ";
    $stmtOpen = $mysqli->prepare($sqlOpening);
    if (!$stmtOpen) {
        throw new Exception("Opening cash query prepare failed: " . $mysqli->error);
    }
    $stmtOpen->bind_param("s", $targetDate);
    $stmtOpen->execute();
    $openingResult = $stmtOpen->get_result()->fetch_assoc();
    $openingCash = (float)($openingResult['opening_cash'] ?? 0.0);
    $stmtOpen->close();

    // 3. Totals on Target Date (Cash In & Cash Out)
    $sqlTodayTotals = "
        SELECT 
            type,
            IFNULL(SUM(amount), 0) AS total
        FROM cash
        WHERE date = ? AND $validCashCondition
        GROUP BY type
    ";
    $stmtTotals = $mysqli->prepare($sqlTodayTotals);
    if (!$stmtTotals) {
        throw new Exception("Totals query prepare failed: " . $mysqli->error);
    }
    $stmtTotals->bind_param("s", $targetDate);
    $stmtTotals->execute();
    $resTotals = $stmtTotals->get_result();

    $todayIn = 0.0;
    $todayOut = 0.0;
    while ($row = $resTotals->fetch_assoc()) {
        if ($row['type'] === 'in') {
            $todayIn = (float)$row['total'];
        } elseif ($row['type'] === 'out') {
            $todayOut = (float)$row['total'];
        }
    }
    $stmtTotals->close();

    // 4. Detailed Transactions on Target Date
    $sqlItems = "
        SELECT 
            id,
            type,
            source,
            purpose,
            amount,
            category,
            refId,
            remarks,
            date,
            approval_status,
            createdAt
        FROM cash
        WHERE date = ? AND $validCashCondition
        ORDER BY id ASC
    ";
    $stmtItems = $mysqli->prepare($sqlItems);
    if (!$stmtItems) {
        throw new Exception("Items query prepare failed: " . $mysqli->error);
    }
    $stmtItems->bind_param("s", $targetDate);
    $stmtItems->execute();
    $resItems = $stmtItems->get_result();

    $cashInList = [];
    $cashOutList = [];

    // Categorized breakdown buckets for detailed reporting
    $categories = [
        "downpayments"     => [], // ডাউন পেমেন্ট
        "monthlyInstallments" => [], // মাসিক কিস্তি
        "dailyInstallments"=> [], // ডেইলি কিস্তি
        "investments"      => [], // ইনভেস্টমেন্ট আদায়
        "loansTaken"       => [], // ঋণ গ্রহণ
        "loanReturns"      => [], // ঋণ ফেরত আদায়
        "otherIn"          => [], // অন্যান্য ক্যাশ ইন
        "productPurchases" => [], // পণ্য ক্রয় / মহাজন পেমেন্ট
        "expenses"         => [], // অফিস / কোম্পানি খরচ
        "loansGiven"       => [], // ঋণ প্রদান
        "loanRepayments"   => [], // ঋণ পরিশোধ
        "investorWithdraw" => [], // ইনভেস্টর উত্তোলন
        "profitWithdrawals"=> [], // লাভ উত্তোলন
        "otherOut"         => []  // অন্যান্য ক্যাশ আউট
    ];

    while ($item = $resItems->fetch_assoc()) {
        $item['amount'] = (float)$item['amount'];
        $cat = strtolower(trim($item['category'] ?? ''));
        $src = strtolower(trim($item['source'] ?? ''));

        if ($item['type'] === 'in') {
            $cashInList[] = $item;

            if ($cat === 'downpayment' || $src === 'downpayment') {
                $categories['downpayments'][] = $item;
            } elseif ($cat === 'daily-installment' || $src === 'daily-installment') {
                $categories['dailyInstallments'][] = $item;
            } elseif ($cat === 'installment' || $src === 'installment') {
                $categories['monthlyInstallments'][] = $item;
            } elseif ($cat === 'invest' || $src === 'investment') {
                $categories['investments'][] = $item;
            } elseif ($cat === 'loan') {
                $categories['loansTaken'][] = $item;
            } elseif ($cat === 'loan-return') {
                $categories['loanReturns'][] = $item;
            } else {
                $categories['otherIn'][] = $item;
            }
        } else {
            $cashOutList[] = $item;

            if ($cat === 'purchase' || $cat === 'product-purchase' || $src === 'purchase' || $src === 'product-purchase') {
                $categories['productPurchases'][] = $item;
            } elseif ($src === 'company-expense' || in_array($cat, ['salary', 'rent', 'bill', 'office-expense', 'maintenance', 'utility', 'marketing', 'transport', 'food', 'internet', 'expense'])) {
                $categories['expenses'][] = $item;
            } elseif ($cat === 'loan-given') {
                $categories['loansGiven'][] = $item;
            } elseif ($cat === 'loan-repayment') {
                $categories['loanRepayments'][] = $item;
            } elseif ($cat === 'investor-withdraw' || $src === 'investor-withdraw' || $cat === 'investor-return') {
                $categories['investorWithdraw'][] = $item;
            } elseif ($cat === 'profit-withdraw' || $cat === 'profit-payout') {
                $categories['profitWithdrawals'][] = $item;
            } else {
                $categories['otherOut'][] = $item;
            }
        }
    }
    $stmtItems->close();

    $netCash = $openingCash + $todayIn - $todayOut;

    echo json_encode([
        "success"      => true,
        "date"         => $targetDate,
        "opening_cash" => $openingCash,
        "today_in"     => $todayIn,
        "today_out"    => $todayOut,
        "net_cash"     => $netCash,
        "cash_in_list" => $cashInList,
        "cash_out_list"=> $cashOutList,
        "categories"   => $categories
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "সার্ভার এরর: " . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

