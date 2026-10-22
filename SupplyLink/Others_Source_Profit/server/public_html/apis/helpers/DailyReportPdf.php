<?php
/**
 * Standalone Minimal PDF 1.4 Generator for Daily Financial Reports
 * Pure PHP, zero external dependencies.
 */

class DailyReportPdf {
    private $objects = [];
    private $pageObjects = [];
    private $stream = "";

    public function generateReport($summary, $transactions) {
        date_default_timezone_set('Asia/Dhaka');
        $dateStr = date("d M, Y");
        $timeStr = date("h:i A");

        $deposit = number_format((float)($summary['todayDeposit'] ?? 0), 2);
        $withdraw = number_format((float)($summary['todayWithdraw'] ?? 0), 2);
        $net = number_format((float)($summary['todayNet'] ?? 0), 2);
        $hand = number_format((float)($summary['handCash'] ?? 0), 2);

        $stream = "";
        
        // Background Dark Slate Theme for header
        $stream .= "0.04 0.07 0.13 rg\n"; // Dark background (#0a1222)
        $stream .= "0 0 595 842 re f\n"; // Full A4 page

        // Card Container (White / Clean Slate Panel)
        $stream .= "0.07 0.11 0.18 rg\n"; // Panel background (#121d30)
        $stream .= "20 20 555 802 re f\n";

        // Top Accent Bar (Gradient Cyan/Indigo simulation)
        $stream .= "0.25 0.40 0.95 rg\n"; // Royal Blue top accent
        $stream .= "20 816 555 6 re f\n";

        // Title and Header
        $stream .= "BT\n";
        $stream .= "/F2 20 Tf\n";
        $stream .= "1 1 1 rg\n"; // White text
        $stream .= "40 782 Td\n";
        $stream .= "(SupplyLink Operational - Daily Cash Report) Tj\n";
        $stream .= "ET\n";

        // Subtitle
        $stream .= "BT\n";
        $stream .= "/F1 10 Tf\n";
        $stream .= "0.6 0.7 0.85 rg\n"; // Slate light
        $stream .= "40 765 Td\n";
        $stream .= "(Bangladesh Time: " . $dateStr . " | " . $timeStr . " [Asia/Dhaka]) Tj\n";
        $stream .= "ET\n";

        // Divider
        $stream .= "0.2 0.28 0.42 RG\n";
        $stream .= "1 w\n";
        $stream .= "40 750 m 555 750 l S\n";

        // 4 KPI Summary Cards
        // Card 1: Deposit (IN) - Emerald
        $this->drawKpiCard($stream, 40, 670, 120, 65, "TODAY DEPOSIT (IN)", "BDT " . $deposit, [0.06, 0.72, 0.50]);
        // Card 2: Withdraw (OUT) - Amber/Rose
        $this->drawKpiCard($stream, 170, 670, 120, 65, "TODAY EXPENSE (OUT)", "BDT " . $withdraw, [0.95, 0.40, 0.45]);
        // Card 3: Net Balance
        $this->drawKpiCard($stream, 300, 670, 120, 65, "TODAY NET BALANCE", "BDT " . $net, [0.30, 0.65, 1.00]);
        // Card 4: Hand Cash
        $this->drawKpiCard($stream, 430, 670, 125, 65, "TOTAL HAND CASH", "BDT " . $hand, [0.85, 0.65, 0.20]);

        // Transactions Section Title
        $stream .= "BT\n";
        $stream .= "/F2 13 Tf\n";
        $stream .= "1 1 1 rg\n";
        $stream .= "40 635 Td\n";
        $stream .= "(Approved Transactions for Today) Tj\n";
        $stream .= "ET\n";

        // Table Header
        $stream .= "0.15 0.22 0.35 rg\n";
        $stream .= "40 605 515 22 re f\n";

        $stream .= "BT\n";
        $stream .= "/F2 9 Tf\n";
        $stream .= "0.9 0.95 1 rg\n";
        $stream .= "50 612 Td (SL) Tj\n";
        $stream .= "75 612 Td (TYPE) Tj\n";
        $stream .= "135 612 Td (SOURCE / PURPOSE) Tj\n";
        $stream .= "315 612 Td (CATEGORY) Tj\n";
        $stream .= "420 612 Td (AMOUNT (BDT)) Tj\n";
        $stream .= "500 612 Td (STATUS) Tj\n";
        $stream .= "ET\n";

        // Table Rows
        $y = 585;
        $count = 0;
        foreach ($transactions as $idx => $t) {
            if ($y < 70) break; // page height guard
            $count++;
            $isEven = ($idx % 2 === 0);
            
            // Row background
            if ($isEven) {
                $stream .= "0.10 0.15 0.25 rg\n";
            } else {
                $stream .= "0.08 0.12 0.21 rg\n";
            }
            $stream .= "40 " . ($y - 5) . " 515 20 re f\n";

            // Row text
            $type = strtoupper($t['type'] ?? 'IN');
            $source = substr($this->cleanAscii($t['source'] ?? $t['purpose'] ?? 'General'), 0, 30);
            $cat = substr($this->cleanAscii($t['category'] ?? 'Regular'), 0, 18);
            $amt = number_format((float)($t['amount'] ?? 0), 2);

            $stream .= "BT\n";
            $stream .= "/F1 8.5 Tf\n";
            $stream .= "0.85 0.9 0.95 rg\n";
            $stream .= "50 $y Td (" . ($idx + 1) . ") Tj\n";
            
            // Colored Type
            if ($type === 'IN') {
                $stream .= "0.2 0.85 0.55 rg\n";
            } else {
                $stream .= "1 0.45 0.45 rg\n";
            }
            $stream .= "75 $y Td (" . $type . ") Tj\n";

            $stream .= "0.85 0.9 0.95 rg\n";
            $stream .= "135 $y Td (" . $source . ") Tj\n";
            $stream .= "315 $y Td (" . $cat . ") Tj\n";
            
            // Amount
            $stream .= "/F2 8.5 Tf\n";
            if ($type === 'IN') {
                $stream .= "0.2 0.85 0.55 rg\n";
            } else {
                $stream .= "1 0.45 0.45 rg\n";
            }
            $stream .= "420 $y Td (" . $amt . ") Tj\n";

            $stream .= "0.3 0.8 1 rg\n";
            $stream .= "/F1 7.5 Tf\n";
            $stream .= "500 $y Td (Approved) Tj\n";
            $stream .= "ET\n";

            $y -= 22;
        }

        if ($count === 0) {
            $stream .= "BT\n";
            $stream .= "/F1 9 Tf\n";
            $stream .= "0.6 0.7 0.8 rg\n";
            $stream .= "200 " . ($y - 5) . " Td (No cash transactions recorded for today.) Tj\n";
            $stream .= "ET\n";
            $y -= 25;
        }

        // Footer
        $stream .= "0.2 0.28 0.42 RG\n";
        $stream .= "40 45 m 555 45 l S\n";

        $stream .= "BT\n";
        $stream .= "/F1 8 Tf\n";
        $stream .= "0.5 0.6 0.75 rg\n";
        $stream .= "40 32 Td (Generated by SupplyLink Operational System | Confidential Financial Audit Record) Tj\n";
        $stream .= "450 32 Td (Page 1 of 1) Tj\n";
        $stream .= "ET\n";

        return $this->buildPdfBinary($stream);
    }

    private function drawKpiCard(&$stream, $x, $y, $w, $h, $title, $value, $accentColor) {
        // Box
        $stream .= "0.10 0.16 0.26 rg\n";
        $stream .= "$x $y $w $h re f\n";

        // Left accent strip
        $stream .= "{$accentColor[0]} {$accentColor[1]} {$accentColor[2]} rg\n";
        $stream .= "$x $y 3.5 $h re f\n";

        // Border outline
        $stream .= "0.18 0.25 0.38 RG\n";
        $stream .= "0.8 w\n";
        $stream .= "$x $y $w $h re S\n";

        // Text
        $stream .= "BT\n";
        $stream .= "/F1 7 Tf\n";
        $stream .= "0.65 0.75 0.85 rg\n";
        $stream .= ($x + 8) . " " . ($y + $h - 18) . " Td (" . $title . ") Tj\n";
        $stream .= "ET\n";

        $stream .= "BT\n";
        $stream .= "/F2 11.5 Tf\n";
        $stream .= "1 1 1 rg\n";
        $stream .= ($x + 8) . " " . ($y + 16) . " Td (" . $value . ") Tj\n";
        $stream .= "ET\n";
    }

    private function cleanAscii($str) {
        $str = preg_replace('/[^\x20-\x7E]/', '', $str);
        $str = str_replace(['(', ')', '\\'], ['[', ']', '/'], $str);
        return trim($str);
    }

    private function buildPdfBinary($contentStream) {
        $streamLen = strlen($contentStream);

        $out = "%PDF-1.4\n";
        $offsets = [];

        // 1: Catalog
        $offsets[1] = strlen($out);
        $out .= "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";

        // 2: Pages
        $offsets[2] = strlen($out);
        $out .= "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";

        // 3: Page
        $offsets[3] = strlen($out);
        $out .= "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n";

        // 4: Content Stream
        $offsets[4] = strlen($out);
        $out .= "4 0 obj\n<< /Length $streamLen >>\nstream\n" . $contentStream . "\nendstream\nendobj\n";

        // 5: Font F1 (Helvetica)
        $offsets[5] = strlen($out);
        $out .= "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";

        // 6: Font F2 (Helvetica-Bold)
        $offsets[6] = strlen($out);
        $out .= "6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n";

        // xref table
        $xrefOffset = strlen($out);
        $out .= "xref\n";
        $out .= "0 7\n";
        $out .= "0000000000 65535 f \n";
        for ($i = 1; $i <= 6; $i++) {
            $out .= sprintf("%010d 00000 n \n", $offsets[$i]);
        }

        // trailer
        $out .= "trailer\n<< /Size 7 /Root 1 0 R >>\n";
        $out .= "startxref\n$xrefOffset\n%%EOF\n";

        return $out;
    }
}
