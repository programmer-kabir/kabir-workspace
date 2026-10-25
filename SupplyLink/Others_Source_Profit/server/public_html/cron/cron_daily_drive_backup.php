<?php
/**
 * Daily Report Backup Cron Job
 * Schedule to run every day at 11:55 PM (23:55 BD Time)
 * Cron Expression: 55 23 * * * (Asia/Dhaka)
 */

ini_set('display_errors', 1);
error_reporting(E_ALL);

date_default_timezone_set('Asia/Dhaka');

require_once __DIR__ . '/../apis/db.php';
require_once __DIR__ . '/../apis/helpers/DailyReportPdf.php';

$logFile = __DIR__ . '/daily_drive_backup.log';
$timestamp = date("Y-m-d H:i:s");
$today = date("Y-m-d");

function logCron($msg, $file) {
    file_put_contents($file, $msg . PHP_EOL, FILE_APPEND);
    echo $msg . (php_sapi_name() === 'cli' ? PHP_EOL : "<br>");
}

logCron("--------------------------------------------------", $logFile);
logCron("[$timestamp] Daily Report Backup Started...", $logFile);

try {
    // 1. Fetch Opening Cash Balance (< Today, Approved Only)
    $stmtOpen = $mysqli->prepare("
        SELECT 
            IFNULL(SUM(CASE WHEN type='in' THEN amount ELSE 0 END), 0) AS total_in,
            IFNULL(SUM(CASE WHEN type='out' THEN amount ELSE 0 END), 0) AS total_out
        FROM cash 
        WHERE approval_status='approved' AND date < ?
    ");
    $stmtOpen->bind_param("s", $today);
    $stmtOpen->execute();
    $openRes = $stmtOpen->get_result()->fetch_assoc();
    $stmtOpen->close();

    $openIn = (float)($openRes['total_in'] ?? 0);
    $openOut = (float)($openRes['total_out'] ?? 0);
    $openingCash = $openIn - $openOut;

    // 2. Fetch Today's Approved Cash In Transactions
    $stmtIn = $mysqli->prepare("
        SELECT id, source, purpose, category, amount, refId, remarks, date, createdAt
        FROM cash 
        WHERE type='in' AND approval_status='approved' AND date=?
        ORDER BY id ASC
    ");
    $stmtIn->bind_param("s", $today);
    $stmtIn->execute();
    $resIn = $stmtIn->get_result();

    $cashInRows = [];
    $totalCashIn = 0;
    $idxIn = 1;
    while ($row = $resIn->fetch_assoc()) {
        $amt = (float)$row['amount'];
        $totalCashIn += $amt;
        $source = !empty($row['source']) ? $row['source'] : 'Cash In';
        $purpose = !empty($row['purpose']) ? $row['purpose'] : (!empty($row['remarks']) ? $row['remarks'] : '-');
        $category = !empty($row['category']) ? $row['category'] : 'Regular';

        $cashInRows[] = [
            $idxIn++,
            "V-" . $row['id'],
            $source,
            $purpose,
            $category,
            number_format($amt, 2)
        ];
    }
    $stmtIn->close();

    // 3. Fetch Today's Approved Cash Out Transactions
    $stmtOut = $mysqli->prepare("
        SELECT id, source, purpose, category, amount, refId, remarks, date, createdAt
        FROM cash 
        WHERE type='out' AND approval_status='approved' AND date=?
        ORDER BY id ASC
    ");
    $stmtOut->bind_param("s", $today);
    $stmtOut->execute();
    $resOut = $stmtOut->get_result();

    $cashOutRows = [];
    $totalCashOut = 0;
    $idxOut = 1;
    while ($row = $resOut->fetch_assoc()) {
        $amt = (float)$row['amount'];
        $totalCashOut += $amt;
        $source = !empty($row['source']) ? $row['source'] : 'Expense Head';
        $purpose = !empty($row['purpose']) ? $row['purpose'] : (!empty($row['remarks']) ? $row['remarks'] : '-');
        $category = !empty($row['category']) ? $row['category'] : 'Expense';

        $cashOutRows[] = [
            $idxOut++,
            "V-" . $row['id'],
            $source,
            $purpose,
            $category,
            number_format($amt, 2)
        ];
    }
    $stmtOut->close();

    // 4. Ledger Calculations
    $netToday = $totalCashIn - $totalCashOut;
    $closingBalance = $openingCash + $netToday;

    $summary = [
        'date' => $today,
        'openingCash' => $openingCash,
        'totalCashIn' => $totalCashIn,
        'totalCashOut' => $totalCashOut,
        'netToday' => $netToday,
        'closingBalance' => $closingBalance,
        'inCount' => count($cashInRows),
        'outCount' => count($cashOutRows)
    ];

    // 5. Generate Multi-Page PDF
    $pdfGen = new DailyReportPdf();
    $pdfBinary = $pdfGen->generateReport($summary, $cashInRows, $cashOutRows);

    // 6. Save PDF to Hostinger uploads/daily_report/[date].pdf
    $baseUploadDir = dirname(__DIR__, 1) . '/uploads';
    $dailyReportDir = $baseUploadDir . '/daily_report';

    if (!is_dir($dailyReportDir)) {
        if (!mkdir($dailyReportDir, 0755, true) && !is_dir($dailyReportDir)) {
            throw new Exception("uploads/daily_report ডিরেক্টরি তৈরি করা যায়নি");
        }
    }

    $fileName = $today . '.pdf';
    $filePath = $dailyReportDir . '/' . $fileName;

    if (file_put_contents($filePath, $pdfBinary) === false) {
        throw new Exception("Hostinger সার্ভারে PDF ফাইল সংরক্ষণ করা যায়নি। ফোল্ডার পারমিশন চেক করুন।");
    }

    logCron("[$timestamp] SUCCESS: File saved to uploads/daily_report/{$fileName}", $logFile);
    logCron("[$timestamp] SUMMARY: Opening: $openingCash | In: $totalCashIn | Out: $totalCashOut | Net: $netToday | Closing: $closingBalance", $logFile);

} catch (Throwable $e) {
    logCron("[$timestamp] ERROR: " . $e->getMessage(), $logFile);
}

logCron("[$timestamp] Daily Report Backup Completed.", $logFile);
