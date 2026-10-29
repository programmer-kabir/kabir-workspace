<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers/DailyReportPdf.php';

date_default_timezone_set('Asia/Dhaka');
$today = date("Y-m-d");
$currentDateTime = date("d M, Y h:i A");

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
        ORDER BY category ASC, id ASC
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
        ORDER BY category ASC, id ASC
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
    $baseUploadDir = dirname(__DIR__, 2) . '/uploads';
    $dailyReportDir = $baseUploadDir . '/daily_report';

    if (!is_dir($dailyReportDir)) {
        if (!mkdir($dailyReportDir, 0755, true) && !is_dir($dailyReportDir)) {
            throw new Exception("uploads/daily_report ডিরেক্টরি তৈরি করা যায়নি");
        }
    }

    $fileName = $today . '.pdf'; // e.g. 2026-10-24.pdf
    $filePath = $dailyReportDir . '/' . $fileName;

    if (file_put_contents($filePath, $pdfBinary) === false) {
        throw new Exception("Hostinger সার্ভারে PDF ফাইল সংরক্ষণ করা যায়নি। ফোল্ডার পারমিশন চেক করুন।");
    }

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
        "message" => "আজকের রিপোর্ট সফলভাবে Hostinger সার্ভারে সংরক্ষিত হয়েছে!",
        "file_name" => $fileName,
        "file_path" => $relativeDbPath,
        "download_url" => $downloadUrl,
        "web_view_link" => $downloadUrl,
        "time" => $currentDateTime,
        "summary" => $summary
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
