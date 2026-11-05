<?php
/**
 * ============================================================================
 * SupplyLink - Automated Daily Cash Report & PDF Archiver (Cron + On-Demand)
 * ফাইল: server/apis/cash/save_daily_report_drive.php
 * 
 * ক্রন জব শিডিউল (রাত ১১:৫৫ মিনিট):
 * 55 23 * * * php /path-to-server/apis/cash/save_daily_report_drive.php
 * ============================================================================
 */

ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers/DailyReportPdf.php';

date_default_timezone_set('Asia/Dhaka');

// 1. Determine Target Date (Defaults to Today, or parameter ?date=YYYY-MM-DD or CLI arg)
$targetDate = date("Y-m-d");

if (php_sapi_name() === 'cli' && isset($argv[1]) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $argv[1])) {
    $targetDate = $argv[1];
} elseif (!empty($_GET['date']) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $_GET['date'])) {
    $targetDate = $_GET['date'];
} elseif (!empty($_POST['date']) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $_POST['date'])) {
    $targetDate = $_POST['date'];
}

$currentDateTime = date("d M, Y h:i A");

try {
    // 2. Fetch Opening Cash Balance (< Target Date, Approved & Non-Deleted)
    $stmtOpen = $mysqli->prepare("
        SELECT 
            IFNULL(SUM(CASE WHEN type = 'in' THEN amount ELSE 0 END), 0) AS total_in,
            IFNULL(SUM(CASE WHEN type = 'out' THEN amount ELSE 0 END), 0) AS total_out
        FROM cash 
        WHERE date < ? 
          AND is_deleted = 0 
          AND (approval_status = 'approved' OR approval_status IS NULL OR approval_status = '')
    ");
    $stmtOpen->bind_param("s", $targetDate);
    $stmtOpen->execute();
    $openRes = $stmtOpen->get_result()->fetch_assoc();
    $stmtOpen->close();

    $openIn = (float)($openRes['total_in'] ?? 0);
    $openOut = (float)($openRes['total_out'] ?? 0);
    $openingCash = $openIn - $openOut;

    // 3. Fetch Target Date's Approved Cash In Transactions
    $stmtIn = $mysqli->prepare("
        SELECT id, source, purpose, category, amount, refId, remarks, date, createdAt
        FROM cash 
        WHERE type = 'in' 
          AND date = ? 
          AND is_deleted = 0 
          AND (approval_status = 'approved' OR approval_status IS NULL OR approval_status = '')
        ORDER BY category ASC, id ASC
    ");
    $stmtIn->bind_param("s", $targetDate);
    $stmtIn->execute();
    $resIn = $stmtIn->get_result();

    $cashInRows = [];
    $totalCashIn = 0;
    $idxIn = 1;
    while ($row = $resIn->fetch_assoc()) {
        $amt = (float)$row['amount'];
        $totalCashIn += $amt;
        $category = !empty($row['category']) ? $row['category'] : 'regular';
        
        $source = !empty($row['source']) ? trim($row['source']) : '';
        if (trim(preg_replace('/[^\x20-\x7E]/', '', $source)) === '') {
            $source = ucwords(str_replace(['-', '_'], ' ', $category));
        }

        $purpose = !empty($row['purpose']) ? trim($row['purpose']) : (!empty($row['remarks']) ? trim($row['remarks']) : '');
        if (trim(preg_replace('/[^\x20-\x7E]/', '', $purpose)) === '') {
            $purpose = 'Cash Received (' . $category . ')';
        }

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

    // 4. Fetch Target Date's Approved Cash Out Transactions
    $stmtOut = $mysqli->prepare("
        SELECT id, source, purpose, category, amount, refId, remarks, date, createdAt
        FROM cash 
        WHERE type = 'out' 
          AND date = ? 
          AND is_deleted = 0 
          AND (approval_status = 'approved' OR approval_status IS NULL OR approval_status = '')
        ORDER BY category ASC, id ASC
    ");
    $stmtOut->bind_param("s", $targetDate);
    $stmtOut->execute();
    $resOut = $stmtOut->get_result();

    $cashOutRows = [];
    $totalCashOut = 0;
    $idxOut = 1;
    while ($row = $resOut->fetch_assoc()) {
        $amt = (float)$row['amount'];
        $totalCashOut += $amt;
        $category = !empty($row['category']) ? $row['category'] : 'expense';

        $source = !empty($row['source']) ? trim($row['source']) : '';
        if (trim(preg_replace('/[^\x20-\x7E]/', '', $source)) === '') {
            $source = ucwords(str_replace(['-', '_'], ' ', $category));
        }

        $purpose = !empty($row['purpose']) ? trim($row['purpose']) : (!empty($row['remarks']) ? trim($row['remarks']) : '');
        if (trim(preg_replace('/[^\x20-\x7E]/', '', $purpose)) === '') {
            $purpose = 'Payment (' . $category . ')';
        }

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

    // 5. Category Breakdown Queries
    $stmtCatIn = $mysqli->prepare("
        SELECT category, COUNT(*) as voucher_count, SUM(amount) as total_amount
        FROM cash 
        WHERE type = 'in' 
          AND date = ? 
          AND is_deleted = 0 
          AND (approval_status = 'approved' OR approval_status IS NULL OR approval_status = '')
        GROUP BY category
        ORDER BY total_amount DESC
    ");
    $stmtCatIn->bind_param("s", $targetDate);
    $stmtCatIn->execute();
    $resCatIn = $stmtCatIn->get_result();
    $cashInCategories = [];
    while ($row = $resCatIn->fetch_assoc()) {
        $cashInCategories[] = [
            'category' => $row['category'] ?? 'others',
            'count' => (int)$row['voucher_count'],
            'total' => (float)$row['total_amount']
        ];
    }
    $stmtCatIn->close();

    $stmtCatOut = $mysqli->prepare("
        SELECT category, COUNT(*) as voucher_count, SUM(amount) as total_amount
        FROM cash 
        WHERE type = 'out' 
          AND date = ? 
          AND is_deleted = 0 
          AND (approval_status = 'approved' OR approval_status IS NULL OR approval_status = '')
        GROUP BY category
        ORDER BY total_amount DESC
    ");
    $stmtCatOut->bind_param("s", $targetDate);
    $stmtCatOut->execute();
    $resCatOut = $stmtCatOut->get_result();
    $cashOutCategories = [];
    while ($row = $resCatOut->fetch_assoc()) {
        $cashOutCategories[] = [
            'category' => $row['category'] ?? 'others',
            'count' => (int)$row['voucher_count'],
            'total' => (float)$row['total_amount']
        ];
    }
    $stmtCatOut->close();

    $categoryBreakdown = [
        'in' => $cashInCategories,
        'out' => $cashOutCategories
    ];

    // 6. Ledger Calculations
    $netToday = $totalCashIn - $totalCashOut;
    $closingBalance = $openingCash + $netToday;

    $summary = [
        'date' => $targetDate,
        'openingCash' => $openingCash,
        'totalCashIn' => $totalCashIn,
        'totalCashOut' => $totalCashOut,
        'netToday' => $netToday,
        'closingBalance' => $closingBalance,
        'inCount' => count($cashInRows),
        'outCount' => count($cashOutRows)
    ];

    // 7. Generate Multi-Page PDF
    $pdfGen = new DailyReportPdf();
    $pdfBinary = $pdfGen->generateReport($summary, $cashInRows, $cashOutRows, $categoryBreakdown);

    // 8. Save PDF to server uploads/daily_report/{date}.pdf
    $baseUploadDir = dirname(__DIR__, 2) . '/uploads';
    $dailyReportDir = $baseUploadDir . '/daily_report';

    if (!is_dir($dailyReportDir)) {
        if (!mkdir($dailyReportDir, 0755, true) && !is_dir($dailyReportDir)) {
            throw new Exception("uploads/daily_report ডিরেক্টরি তৈরি করা যায়নি");
        }
    }

    $fileName = $targetDate . '.pdf'; // e.g. 2026-11-05.pdf
    $filePath = $dailyReportDir . '/' . $fileName;

    if (file_put_contents($filePath, $pdfBinary) === false) {
        throw new Exception("সার্ভারে PDF ফাইল সংরক্ষণ করা যায়নি। ফোল্ডার পারমিশন চেক করুন।");
    }

    $fileSizeBytes = filesize($filePath);

    // 9. Append to Cron Execution Audit Log
    $logFile = $dailyReportDir . '/cron_history.log';
    $logEntry = sprintf(
        "[%s] DATE: %s | SIZE: %s KB | OPENING: %.2f | IN: %.2f | OUT: %.2f | CLOSING: %.2f | STATUS: SUCCESS\n",
        date("Y-m-d H:i:s"),
        $targetDate,
        number_format($fileSizeBytes / 1024, 2),
        $openingCash,
        $totalCashIn,
        $totalCashOut,
        $closingBalance
    );
    @file_put_contents($logFile, $logEntry, FILE_APPEND);

    // Dynamic web download link
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'http://';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
    if (php_sapi_name() === 'cli' || strpos($scriptName, ':\\') !== false) {
        $baseSubdir = '';
    } else {
        $baseSubdir = preg_replace('#/apis/.*$#', '', $scriptName);
    }
    $relativeDbPath = "uploads/daily_report/{$fileName}";
    $downloadUrl = rtrim("{$protocol}{$host}{$baseSubdir}", '/') . "/{$relativeDbPath}";

    echo json_encode([
        "success" => true,
        "message" => "{$targetDate} এর দৈনিক ক্যাশ রিপোর্ট সফলভাবে PDF আকারে সংরক্ষিত হয়েছে!",
        "file_name" => $fileName,
        "file_path" => $relativeDbPath,
        "file_size" => number_format($fileSizeBytes / 1024, 2) . " KB",
        "download_url" => $downloadUrl,
        "web_view_link" => $downloadUrl,
        "time" => $currentDateTime,
        "summary" => $summary
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
