<?php
/**
 * ============================================================================
 * SupplyLink - Daily Cash Flow Ledger Sheet API (Excel-style day-by-day balance)
 * ফাইল: server/apis/cash/daily_ledger_sheet.php
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

// 1. Determine Date Range
$today = date('Y-m-d');
$firstDayOfMonth = date('Y-m-01');

// Month filter support (e.g. month=2026-10)
$monthParam = trim($_GET['month'] ?? '');
if (!empty($monthParam) && preg_match('/^\d{4}-\d{2}$/', $monthParam)) {
    $startDate = $monthParam . '-01';
    $endDate = date('Y-m-t', strtotime($startDate));
} else {
    $startDate = trim($_GET['start_date'] ?? $firstDayOfMonth);
    $endDate = trim($_GET['end_date'] ?? $today);
}

// Validate dates
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $startDate)) $startDate = $firstDayOfMonth;
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $endDate)) $endDate = $today;

if ($startDate > $endDate) {
    $tmp = $startDate;
    $startDate = $endDate;
    $endDate = $tmp;
}

$includeEmptyDays = isset($_GET['include_empty_days']) && ($_GET['include_empty_days'] === '1' || $_GET['include_empty_days'] === 'true');

// 2. Calculate Baseline Opening Cash before $startDate
$baseStmt = $mysqli->prepare("
    SELECT IFNULL(SUM(CASE WHEN type = 'in' THEN amount ELSE -amount END), 0) as baseline
    FROM cash
    WHERE date < ? 
      AND is_deleted = 0 
      AND (approval_status = 'approved' OR approval_status IS NULL)
");
$baseStmt->bind_param("s", $startDate);
$baseStmt->execute();
$baselineOpening = (float)($baseStmt->get_result()->fetch_assoc()['baseline'] ?? 0);
$baseStmt->close();

// 3. Fetch Daily Aggregated Cash In and Cash Out
$q = $mysqli->prepare("
    SELECT 
        date,
        SUM(CASE WHEN type = 'in' THEN amount ELSE 0 END) as cash_in,
        SUM(CASE WHEN type = 'out' THEN amount ELSE 0 END) as cash_out,
        COUNT(CASE WHEN type = 'in' THEN 1 END) as in_cnt,
        COUNT(CASE WHEN type = 'out' THEN 1 END) as out_cnt
    FROM cash
    WHERE date BETWEEN ? AND ? 
      AND is_deleted = 0 
      AND (approval_status = 'approved' OR approval_status IS NULL)
    GROUP BY date
    ORDER BY date ASC
");
$q->bind_param("ss", $startDate, $endDate);
$q->execute();
$dailyAggRes = $q->get_result();

$dailyMap = [];
while ($row = $dailyAggRes->fetch_assoc()) {
    $dailyMap[$row['date']] = [
        'cash_in' => (float)$row['cash_in'],
        'cash_out' => (float)$row['cash_out'],
        'in_cnt' => (int)$row['in_cnt'],
        'out_cnt' => (int)$row['out_cnt'],
    ];
}
$q->close();

// 4. Fetch Category Breakdown for active dates
$catStmt = $mysqli->prepare("
    SELECT 
        date,
        type,
        category,
        SUM(amount) as cat_amount,
        COUNT(*) as cnt
    FROM cash
    WHERE date BETWEEN ? AND ? 
      AND is_deleted = 0 
      AND (approval_status = 'approved' OR approval_status IS NULL)
    GROUP BY date, type, category
    ORDER BY date ASC, cat_amount DESC
");
$catStmt->bind_param("ss", $startDate, $endDate);
$catStmt->execute();
$catRes = $catStmt->get_result();

$categoryBreakdown = [];
while ($c = $catRes->fetch_assoc()) {
    $d = $c['date'];
    $t = $c['type']; // 'in' or 'out'
    $categoryBreakdown[$d][$t][] = [
        'category' => $c['category'] ?: 'others',
        'amount' => (float)$c['cat_amount'],
        'count' => (int)$c['cnt']
    ];
}
$catStmt->close();

// 5. Build Continuous Day-by-Day Sheet
$records = [];
$currentBalance = $baselineOpening;
$totalPeriodIn = 0;
$totalPeriodOut = 0;
$activeDaysCount = 0;

$startTs = strtotime($startDate);
$endTs = strtotime($endDate);

for ($cursor = $startTs; $cursor <= $endTs; $cursor += 86400) {
    $d = date('Y-m-d', $cursor);
    $hasActivity = isset($dailyMap[$d]);

    if (!$hasActivity && !$includeEmptyDays) {
        continue;
    }

    $in = $hasActivity ? $dailyMap[$d]['cash_in'] : 0.0;
    $out = $hasActivity ? $dailyMap[$d]['cash_out'] : 0.0;
    $inCount = $hasActivity ? $dailyMap[$d]['in_cnt'] : 0;
    $outCount = $hasActivity ? $dailyMap[$d]['out_cnt'] : 0;

    $opening = $currentBalance;
    $netClosing = $opening + $in - $out;
    $change = $in - $out;
    $currentBalance = $netClosing;

    if ($hasActivity) {
        $activeDaysCount++;
        $totalPeriodIn += $in;
        $totalPeriodOut += $out;
    }

    $dayOfWeek = date('l', $cursor);
    $bnDays = [
        'Saturday' => 'শনিবার',
        'Sunday' => 'রবিবার',
        'Monday' => 'সোমবার',
        'Tuesday' => 'মঙ্গলবার',
        'Wednesday' => 'বুধবার',
        'Thursday' => 'বৃহস্পতিবার',
        'Friday' => 'শুক্রবার'
    ];

    $records[] = [
        'date' => $d,
        'day_name' => $dayOfWeek,
        'day_name_bn' => $bnDays[$dayOfWeek] ?? $dayOfWeek,
        'opening_cash' => $opening,
        'cash_in' => $in,
        'cash_out' => $out,
        'net_closing_cash' => $netClosing,
        'daily_change' => $change,
        'in_count' => $inCount,
        'out_count' => $outCount,
        'has_activity' => $hasActivity,
        'in_breakdown' => $categoryBreakdown[$d]['in'] ?? [],
        'out_breakdown' => $categoryBreakdown[$d]['out'] ?? [],
    ];
}

sendResponse([
    'success' => true,
    'date_range' => [
        'start_date' => $startDate,
        'end_date' => $endDate,
        'total_calendar_days' => (int)(($endTs - $startTs) / 86400) + 1,
        'active_days' => $activeDaysCount
    ],
    'summary' => [
        'baseline_opening' => $baselineOpening,
        'total_cash_in' => $totalPeriodIn,
        'total_cash_out' => $totalPeriodOut,
        'final_closing_cash' => $currentBalance,
        'net_change' => $totalPeriodIn - $totalPeriodOut,
    ],
    'data' => $records
]);

