<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

$month = isset($_GET['month']) ? trim($_GET['month']) : '';
if (empty($month) || !preg_match('/^\d{4}-\d{2}$/', $month)) {
    http_response_code(400);
    echo "Invalid month format. Use YYYY-MM.";
    exit;
}

$user_id = $GLOBALS['user']['id'];
$roles = $GLOBALS['user']['roles'] ?? [];

if (!in_array('author', $roles) && !in_array('admin', $roles)) {
    http_response_code(403);
    echo "Not an author.";
    exit;
}

// Get Author profile
$stmt = $mysqli->prepare("
    SELECT a.id, u.name, u.email 
    FROM authors a
    JOIN users u ON u.id = a.user_id 
    WHERE a.user_id = ?
");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$author_res = $stmt->get_result();

if ($author_res->num_rows === 0) {
    http_response_code(404);
    echo "Author profile not found.";
    exit;
}

$author = $author_res->fetch_assoc();
$author_id = (int)$author['id'];
$author_name = $author['name'] ?: "Contributor";
$author_email = $author['email'];

// Get Earnings for that month directly from author_invoices
$earn_stmt = $mysqli->prepare("
    SELECT total_revenue, sub_revenue, buyout_revenue, rollover_revenue, total_downloads, created_at
    FROM author_invoices
    WHERE author_id = ? AND earning_month = ?
");
$earn_stmt->bind_param("is", $author_id, $month);
$earn_stmt->execute();
$earn_res = $earn_stmt->get_result();

if ($earn_res->num_rows === 0) {
    http_response_code(404);
    echo "No earnings found for $month.";
    exit;
}

$earnings = $earn_res->fetch_assoc();

$sub_revenue = (float)($earnings['sub_revenue'] ?? 0);
$buyout_revenue = (float)($earnings['buyout_revenue'] ?? 0);
$rollover_revenue = (float)($earnings['rollover_revenue'] ?? 0);
$total_revenue = (float)($earnings['total_revenue'] ?? 0);
$total_downloads = (int)($earnings['total_downloads'] ?? 0);
$created_at = $earnings['created_at'];

$invoice_id = "INV-" . strtoupper(str_replace('-', '', $month)) . "-" . str_pad($author_id, 4, '0', STR_PAD_LEFT);
$date_issued = date('Y-m-d H:i:s', strtotime($created_at));

function generateEarningsInvoicePDF($authorName, $authorEmail, $month, $totalRev, $subRev, $buyoutRev, $rolloverRev, $downloads, $invoiceId, $dateIssued) {
    $esc = fn(string $s): string => str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $s);

    $objects = [];
    $offsets = [];

    $addObj = function (string $dict, string $stream = '') use (&$objects): int {
        $id = count($objects) + 1;
        $objects[$id] = ['dict' => $dict, 'stream' => $stream];
        return $id;
    };

    $addObj('<< /Type /Catalog /Pages 2 0 R >>');
    $addObj('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    $addObj('<<
  /Type /Page
  /Parent 2 0 R
  /MediaBox [0 0 595 842]
  /Contents 4 0 R
  /Resources <<
    /Font <<
      /F1 5 0 R
      /F2 6 0 R
    >>
  >>
>>');

    $stream = '';

    // Purple header bar
    $stream .= "0.423 0.31 0.878 rg\n"; // #6C4FE0
    $stream .= "0 792 595 50 re f\n";

    // Header text
    $stream .= "1 1 1 rg\n";
    $stream .= "BT\n/F2 22 Tf\n30 810 Td\n({$esc('DayalStock')}) Tj\nET\n";
    $stream .= "BT\n/F1 10 Tf\n30 798 Td\n({$esc('Contributor Platform')}) Tj\nET\n";
    $stream .= "BT\n/F2 11 Tf\n440 810 Td\n({$esc('Earnings Statement')}) Tj\nET\n";

    // Body bg
    $stream .= "0.97 0.97 0.97 rg\n";
    $stream .= "30 100 535 680 re f\n";

    // Heading
    $stream .= "0.02 0.149 0.302 rg\n";
    $stream .= "BT\n/F2 18 Tf\n50 748 Td\n({$esc('Monthly Earnings Summary')}) Tj\nET\n";

    // Purple line
    $stream .= "0.423 0.31 0.878 rg\n";
    $stream .= "50 742 200 2 re f\n";

    $y = 718;
    $lineH = 22;

    $rows = [
        ['Statement Month', $esc($month)],
        ['Invoice ID', $esc($invoiceId)],
        ['Contributor Name', $esc($authorName)],
        ['Contributor Email', $esc($authorEmail)],
        ['Issue Date', $esc($dateIssued)],
    ];

    foreach ($rows as [$label, $value]) {
        $stream .= "0.4 0.4 0.4 rg\n";
        $stream .= "BT /F2 9 Tf 55 {$y} Td ({$esc($label)}) Tj ET\n";
        $stream .= "0.02 0.149 0.302 rg\n";
        $stream .= "BT /F1 10 Tf 200 {$y} Td ({$value}) Tj ET\n";
        $y -= $lineH;
    }

    $stream .= "0.423 0.31 0.878 rg\n";
    $stream .= "50 {$y} 495 1 re f\n";
    $y -= 30;
    
    // Earnings details
    $stream .= "0.02 0.149 0.302 rg\n";
    $stream .= "BT /F2 16 Tf 50 {$y} Td ({$esc('Earnings Breakdown')}) Tj ET\n";
    $y -= 25;

    // Draw Table Header
    $stream .= "0.9 0.9 0.9 rg\n"; // Light gray bg for header
    $stream .= "50 {$y} 495 20 re f\n"; // Header rectangle
    
    $stream .= "0.2 0.2 0.2 rg\n";
    $stream .= "BT /F2 10 Tf 55 " . ($y + 6) . " Td ({$esc('Earning Source')}) Tj ET\n";
    $stream .= "BT /F2 10 Tf 300 " . ($y + 6) . " Td ({$esc('Downloads')}) Tj ET\n";
    $stream .= "BT /F2 10 Tf 450 " . ($y + 6) . " Td ({$esc('Revenue')}) Tj ET\n";
    $y -= 20;

    // Draw Row 1: Subscriptions
    $stream .= "0.98 0.98 0.98 rg\n";
    $stream .= "50 {$y} 495 20 re f\n";
    $stream .= "0.2 0.2 0.2 rg\n";
    $stream .= "BT /F1 10 Tf 55 " . ($y + 6) . " Td ({$esc('Subscription Pool Share')}) Tj ET\n";
    $stream .= "BT /F1 10 Tf 300 " . ($y + 6) . " Td ({$esc((string)$downloads)}) Tj ET\n";
    $stream .= "BT /F1 10 Tf 450 " . ($y + 6) . " Td ({$esc('$' . number_format($subRev, 2))}) Tj ET\n";
    $y -= 20;

    // Draw Row 2: Buyouts
    $stream .= "1 1 1 rg\n";
    $stream .= "50 {$y} 495 20 re f\n";
    $stream .= "0.2 0.2 0.2 rg\n";
    $stream .= "BT /F1 10 Tf 55 " . ($y + 6) . " Td ({$esc('Exclusive Asset Sales (Buyouts)')}) Tj ET\n";
    $stream .= "BT /F1 10 Tf 300 " . ($y + 6) . " Td ({$esc('N/A')}) Tj ET\n";
    $stream .= "BT /F1 10 Tf 450 " . ($y + 6) . " Td ({$esc('$' . number_format($buyoutRev, 2))}) Tj ET\n";
    $y -= 20;

    // Draw Row 3 (Optional): Rollover
    if ($rolloverRev > 0) {
        $stream .= "0.98 0.98 0.98 rg\n";
        $stream .= "50 {$y} 495 20 re f\n";
        $stream .= "0.2 0.2 0.2 rg\n";
        $stream .= "BT /F1 10 Tf 55 " . ($y + 6) . " Td ({$esc('Rollover from previous months')}) Tj ET\n";
        $stream .= "BT /F1 10 Tf 300 " . ($y + 6) . " Td ({$esc('N/A')}) Tj ET\n";
        $stream .= "BT /F1 10 Tf 450 " . ($y + 6) . " Td ({$esc('$' . number_format($rolloverRev, 2))}) Tj ET\n";
        $y -= 20;
    }
    
    // Draw Bottom Line
    $stream .= "0.423 0.31 0.878 rg\n";
    $stream .= "50 {$y} 495 1 re f\n";
    $y -= 25;

    // Draw Total
    $stream .= "0.02 0.149 0.302 rg\n";
    $stream .= "BT /F2 12 Tf 55 {$y} Td ({$esc('Total Revenue Earned:')}) Tj ET\n";
    $stream .= "0.423 0.31 0.878 rg\n"; // Purple
    $stream .= "BT /F2 14 Tf 450 {$y} Td ({$esc('$' . number_format($totalRev, 2))}) Tj ET\n";
    $y -= 30;
    
    $stream .= "0.423 0.31 0.878 rg\n";
    $stream .= "50 {$y} 495 1 re f\n";
    $y -= 25;

    $stream .= "0.5 0.5 0.5 rg\n";
    $stream .= "BT /F1 8 Tf 55 {$y} Td ({$esc('This statement is system-generated and serves as proof of earnings for the specified month.')}) Tj ET\n";
    $y -= 14;
    $stream .= "BT /F1 8 Tf 55 {$y} Td ({$esc('To withdraw these funds, please visit the Payouts section in your dashboard.')}) Tj ET\n";

    // Footer
    $stream .= "0.423 0.31 0.878 rg\n";
    $stream .= "0 0 595 40 re f\n";
    $stream .= "1 1 1 rg\n";
    $stream .= "BT /F1 8 Tf 30 15 Td ({$esc('© ' . date('Y') . ' DayalStock — All rights reserved. | Contributor Platform')}) Tj ET\n";

    $addObj("<< /Length " . strlen($stream) . " >>", $stream);
    $addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    $addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');

    $pdf  = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
    foreach ($objects as $id => $obj) {
        $offsets[$id] = strlen($pdf);
        $pdf .= "{$id} 0 obj\n";
        $pdf .= $obj['stream'] !== '' ? $obj['dict'] . "\nstream\n" . $obj['stream'] . "\nendstream\n" : $obj['dict'] . "\n";
        $pdf .= "endobj\n";
    }

    $xrefOffset = strlen($pdf);
    $count = count($objects) + 1;
    $pdf .= "xref\n0 {$count}\n0000000000 65535 f \n";
    foreach ($offsets as $off) {
        $pdf .= str_pad($off, 10, '0', STR_PAD_LEFT) . " 00000 n \n";
    }

    $pdf .= "trailer\n<< /Size {$count} /Root 1 0 R >>\nstartxref\n{$xrefOffset}\n%%EOF\n";
    return $pdf;
}

$pdf = generateEarningsInvoicePDF($author_name, $author_email, $month, $total_revenue, $sub_revenue, $buyout_revenue, $rollover_revenue, $total_downloads, $invoice_id, $date_issued);

header('Content-Type: application/pdf');
header('Content-Disposition: attachment; filename="DayalStock_Earnings_Statement_' . $month . '.pdf"');
header('Content-Length: ' . strlen($pdf));
echo $pdf;
