<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers/DailyReportPdf.php';
require_once __DIR__ . '/../helpers/google_drive_uploader.php';

date_default_timezone_set('Asia/Dhaka');
$today = date("Y-m-d");
$currentDateTime = date("d M, Y h:i A");

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

    // 3. Fetch Total IN & OUT for Hand Cash
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
    $credPath = dirname(__DIR__, 3) . '/google_drive_credentials.json';
    if (!file_exists($credPath)) {
        $credPath = 'c:/Users/CCA/Desktop/kabir-workspace/SupplyLink/Others_Source_Profit/server/google_drive_credentials.json';
    }

    $folderId = '1XLMw3dr-LJSFJYf7BnQucnQ6hLmoK7aQ';
    $fileName = 'Daily_Report_' . date("Y-m-d_h-iA") . '.pdf';

    $uploader = new GoogleDriveUploader($credPath, $folderId);
    $uploadRes = $uploader->uploadFile($fileName, $pdfBinary, 'application/pdf');

    echo json_encode([
        "success" => true,
        "message" => "আজকের রিপোর্ট সফলভাবে Google Drive-এ সেভ হয়েছে!",
        "file_id" => $uploadRes['id'] ?? null,
        "file_name" => $fileName,
        "web_view_link" => $uploadRes['webViewLink'] ?? "https://drive.google.com/drive/folders/{$folderId}",
        "time" => $currentDateTime,
        "summary" => $summary
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage(),
        "folder_id" => '1XLMw3dr-LJSFJYf7BnQucnQ6hLmoK7aQ'
    ], JSON_UNESCAPED_UNICODE);
}
