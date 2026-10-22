<?php
/**
 * Daily Google Drive Report Backup Cron Job
 * Schedule to run every day at 11:50 PM (23:50 BD Time)
 * Cron Expression: 50 23 * * * (Asia/Dhaka) or 50 17 * * * (UTC)
 */

ini_set('display_errors', 1);
error_reporting(E_ALL);

date_default_timezone_set('Asia/Dhaka');

require_once __DIR__ . '/../apis/db.php';
require_once __DIR__ . '/../apis/helpers/DailyReportPdf.php';
require_once __DIR__ . '/../apis/helpers/google_drive_uploader.php';

$logFile = __DIR__ . '/daily_drive_backup.log';
$timestamp = date("Y-m-d H:i:s");
$today = date("Y-m-d");

function logCron($msg, $file) {
    file_put_contents($file, $msg . PHP_EOL, FILE_APPEND);
    echo $msg . (php_sapi_name() === 'cli' ? PHP_EOL : "<br>");
}

logCron("--------------------------------------------------", $logFile);
logCron("[$timestamp] Daily Drive Backup Cron Started...", $logFile);

try {
    // 1. Fetch Today Approved Deposit (IN)
    $stmtIn = $mysqli->prepare("
        SELECT IFNULL(SUM(amount), 0) AS total 
        FROM cash 
        WHERE type='in' AND date=? AND approval_status='approved'
    ");
    $stmtIn->bind_param("s", $today);
    $stmtIn->execute();
    $deposit = (float)$stmtIn->get_result()->fetch_assoc()['total'];
    $stmtIn->close();

    // 2. Fetch Today Approved Withdraw (OUT)
    $stmtOut = $mysqli->prepare("
        SELECT IFNULL(SUM(amount), 0) AS total 
        FROM cash 
        WHERE type='out' AND date=? AND approval_status='approved'
    ");
    $stmtOut->bind_param("s", $today);
    $stmtOut->execute();
    $withdraw = (float)$stmtOut->get_result()->fetch_assoc()['total'];
    $stmtOut->close();

    // 3. Hand Cash
    $resIn = $mysqli->query("SELECT IFNULL(SUM(amount), 0) AS total FROM cash WHERE type='in' AND approval_status='approved'");
    $totalIn = (float)$resIn->fetch_assoc()['total'];

    $resOut = $mysqli->query("SELECT IFNULL(SUM(amount), 0) AS total FROM cash WHERE type='out' AND approval_status='approved'");
    $totalOut = (float)$resOut->fetch_assoc()['total'];

    $todayNet = $deposit - $withdraw;
    $handCash = $totalIn - $totalOut;

    $summary = [
        'todayDeposit' => $deposit,
        'todayWithdraw' => $withdraw,
        'todayNet' => $todayNet,
        'handCash' => $handCash
    ];

    // 4. Fetch All Approved Transactions for Today
    $stmtTxs = $mysqli->prepare("
        SELECT id, type, source, purpose, amount, category, date, createdAt
        FROM cash 
        WHERE date=? AND approval_status='approved'
        ORDER BY id ASC
    ");
    $stmtTxs->bind_param("s", $today);
    $stmtTxs->execute();
    $txsResult = $stmtTxs->get_result();
    $transactions = [];
    while ($row = $txsResult->fetch_assoc()) {
        $transactions[] = $row;
    }
    $stmtTxs->close();

    // 5. Generate PDF
    $pdfGen = new DailyReportPdf();
    $pdfBinary = $pdfGen->generateReport($summary, $transactions);

    // 6. Upload to Google Drive
    $credPath = dirname(__DIR__, 2) . '/google_drive_credentials.json';
    if (!file_exists($credPath)) {
        $credPath = 'c:/Users/CCA/Desktop/kabir-workspace/SupplyLink/Others_Source_Profit/server/google_drive_credentials.json';
    }

    $folderId = '1XLMw3dr-LJSFJYf7BnQucnQ6hLmoK7aQ';
    $fileName = 'Daily_Report_' . date("Y-m-d_h-iA") . '.pdf';

    $uploader = new GoogleDriveUploader($credPath, $folderId);
    $uploadRes = $uploader->uploadFile($fileName, $pdfBinary, 'application/pdf');

    $fileId = $uploadRes['id'] ?? 'N/A';
    logCron("[$timestamp] SUCCESS: File uploaded successfully! [File: $fileName | ID: $fileId]", $logFile);
    logCron("[$timestamp] SUMMARY: Deposit: $deposit | Withdraw: $withdraw | Net: $todayNet | Hand: $handCash", $logFile);

} catch (Throwable $e) {
    logCron("[$timestamp] ERROR: " . $e->getMessage(), $logFile);
}

logCron("[$timestamp] Daily Drive Backup Cron Completed.", $logFile);
