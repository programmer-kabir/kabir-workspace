<?php
/**
 * Daily Financial Report PDF Builder
 * Generates an executive, highly polished, multi-page audit report directly from the `cash` ledger.
 * Matches the design of the SupplyLink Operational System Dashboard Report.
 * Pure PHP 8, zero dependencies.
 */

class DailyReportPdf {
    private $pages = [];
    private $currentPageStream = "";
    private $y = 810;
    private $pageNumber = 1;
    private $dateStr = "";
    private $rawDate = "";

    private $categoryLabels = [
        'daily-installment' => 'Daily Installment',
        'daily_installment' => 'Daily Installment',
        'installment' => 'Regular Installment',
        'downpayment' => 'Down Payment',
        'invest' => 'Investment Acceptance',
        'investment' => 'Investment Acceptance',
        'share_dividend' => 'Share Dividend Income',
        'asset_sale' => 'Asset Sale Income',
        'rental_income' => 'Rental Income',

        'office-expense' => 'Office Expense',
        'office_expense' => 'Office Expense',
        'purchase' => 'Purchase / Inventory',
        'investor-payout' => 'Investor Capital Return',
        'profit-payout' => 'Profit Payout',
        'salary' => 'Staff Salary & Honorarium',
        'bill' => 'Utility & Office Bills',
        'rent' => 'Office & Shop Rent',
        'asset_purchase' => 'Fixed Asset Purchase',
        'share_investment' => 'Share Investment',
        'others' => 'Other Expenses / Adjustments',
    ];

    public function generateReport($summary, $cashInRows = [], $cashOutRows = [], $categoryBreakdown = []) {
        $this->pages = [];
        $this->currentPageStream = "";
        $this->pageNumber = 1;

        date_default_timezone_set('Asia/Dhaka');
        $this->rawDate = $summary['date'] ?? date("Y-m-d");
        $this->dateStr = date("F d, Y", strtotime($this->rawDate));

        // Auto-aggregate categories if not explicitly passed
        if (empty($categoryBreakdown) || !isset($categoryBreakdown['in'])) {
            $categoryBreakdown = $this->aggregateCategoriesFromRows($cashInRows, $cashOutRows);
        }

        $this->startNewPage();

        // 1. Centered Header
        $this->drawHeader();

        // 2. Executive Cash Summary Box
        $this->drawCashSummaryBox(
            $summary['openingCash'] ?? 0,
            $summary['totalCashIn'] ?? 0,
            $summary['totalCashOut'] ?? 0,
            $summary['closingBalance'] ?? 0
        );

        // 3. Category Summary Breakdown Cards (Cash In vs Cash Out side-by-side)
        $this->drawCategorySummaryBreakdown(
            $categoryBreakdown['in'] ?? [],
            $categoryBreakdown['out'] ?? [],
            $summary['totalCashIn'] ?? 0,
            $summary['totalCashOut'] ?? 0
        );

        // 4. Section 1: Approved Cash In Transactions
        $this->drawTransactionSection(
            "1. Approved Cash In Transactions (Today's Cash In)",
            ["#", "Voucher", "Source / Depositor", "Purpose / Particulars", "Category", "Amount (BDT)"],
            [25, 55, 145, 145, 80, 85],
            $cashInRows,
            $summary['totalCashIn'] ?? 0,
            "Total Approved Cash In",
            [0.024, 0.373, 0.275], // Solid Emerald #065f46
            [0.925, 0.992, 0.961], // Tint #ecfdf5
            [0.024, 0.306, 0.231]  // Deep Green
        );

        // 5. Section 2: Approved Cash Out Transactions
        $this->drawTransactionSection(
            "2. Approved Cash Out Transactions (Today's Cash Out)",
            ["#", "Voucher", "Expense Head / Source", "Purpose / Particulars", "Category", "Amount (BDT)"],
            [25, 55, 145, 145, 80, 85],
            $cashOutRows,
            $summary['totalCashOut'] ?? 0,
            "Total Approved Cash Out",
            [0.624, 0.071, 0.224], // Solid Crimson #9f1239
            [1.0, 0.945, 0.949],   // Tint #fff1f2
            [0.533, 0.075, 0.216]  // Deep Red
        );

        // 6. Signatures Block
        $this->drawSignatures();

        return $this->buildPdfBinary();
    }

    private function startNewPage() {
        if (!empty($this->currentPageStream)) {
            $this->drawFooter();
            $this->pages[] = $this->currentPageStream;
        }
        $this->currentPageStream = "";
        $this->y = 810;

        // Clean white page background
        $this->currentPageStream .= "1 1 1 rg\n";
        $this->currentPageStream .= "0 0 595 842 re f\n";

        // If not first page, render a compact continuation header
        if ($this->pageNumber > 1) {
            $this->currentPageStream .= "BT\n/F2 9 Tf\n0.2 0.2 0.2 rg\n30 815 Td (SupplyLink Operational - Daily Cash Ledger Report) Tj\nET\n";
            $this->currentPageStream .= "BT\n/F1 8.5 Tf\n0.4 0.4 0.4 rg\n420 815 Td (Date: " . $this->cleanText($this->dateStr) . " | Page " . $this->pageNumber . ") Tj\nET\n";
            $this->currentPageStream .= "0.85 0.85 0.88 RG\n0.5 w\n30 808 m 565 808 l S\n";
            $this->y = 790;
        }
    }

    private function drawHeader() {
        // Centered Header Block (Matching Image 2)
        $this->drawCenteredText("SupplyLink Operational System", 297.5, 800, 15, '/F2', 0.07, 0.09, 0.15);
        $this->drawCenteredText("Daily Cash Ledger & Audit Report", 297.5, 784, 10.5, '/F2', 0.3, 0.35, 0.42);
        $this->drawCenteredText("Date: " . $this->dateStr, 297.5, 770, 9, '/F1', 0.42, 0.45, 0.5);
        $this->y = 754;
    }

    private function drawCashSummaryBox($opening, $in, $out, $closing) {
        $boxHeight = 118;
        $this->checkPageSpace($boxHeight + 15);

        $x = 30;
        $w = 535;
        $y = $this->y - $boxHeight;

        // Background (#f8fafc)
        $this->currentPageStream .= "0.972 0.980 0.988 rg\n";
        $this->currentPageStream .= "$x $y $w $boxHeight re f\n";

        // Outer crisp border
        $this->currentPageStream .= "0 0 0 RG\n1.2 w\n";
        $this->currentPageStream .= "$x $y $w $boxHeight re S\n";

        // Centered Box Title
        $this->drawCenteredText($this->dateStr . " Cash Summary", 297.5, $y + $boxHeight - 18, 12, '/F2', 0.06, 0.09, 0.16);

        // Divider line below box title
        $this->currentPageStream .= "0.82 0.85 0.89 RG\n0.8 w\n" . ($x + 15) . " " . ($y + $boxHeight - 25) . " m " . ($x + $w - 15) . " " . ($y + $boxHeight - 25) . " l S\n";

        // 1. Opening Cash Balance
        $line1Y = $y + 70;
        $this->drawLeftText("1. Opening Cash Balance", $x + 20, $line1Y, 9.5, '/F2', 0.2, 0.25, 0.33);
        $this->drawRightAlignedText("BDT " . number_format((float)$opening, 2), $x + $w - 20, $line1Y, 10, '/F2', 0.26, 0.22, 0.79);
        $this->currentPageStream .= "0.89 0.91 0.94 RG\n0.5 w\n" . ($x + 20) . " " . ($line1Y - 5) . " m " . ($x + $w - 20) . " " . ($line1Y - 5) . " l S\n";

        // 2. Today Approved Cash In
        $line2Y = $y + 48;
        $this->drawLeftText("2. Today Approved Cash In", $x + 20, $line2Y, 9.5, '/F2', 0.2, 0.25, 0.33);
        $this->drawRightAlignedText("BDT " . number_format((float)$in, 2), $x + $w - 20, $line2Y, 10, '/F2', 0.02, 0.59, 0.41);
        $this->currentPageStream .= "0.89 0.91 0.94 RG\n0.5 w\n" . ($x + 20) . " " . ($line2Y - 5) . " m " . ($x + $w - 20) . " " . ($line2Y - 5) . " l S\n";

        // 3. Today Approved Cash Out
        $line3Y = $y + 26;
        $this->drawLeftText("3. Today Approved Cash Out", $x + 20, $line3Y, 9.5, '/F2', 0.2, 0.25, 0.33);
        $this->drawRightAlignedText("BDT " . number_format((float)$out, 2), $x + $w - 20, $line3Y, 10, '/F2', 0.88, 0.11, 0.28);
        $this->currentPageStream .= "0.89 0.91 0.94 RG\n0.5 w\n" . ($x + 20) . " " . ($line3Y - 5) . " m " . ($x + $w - 20) . " " . ($line3Y - 5) . " l S\n";

        // 4. Closing Hand Cash Balance
        $line4Y = $y + 8;
        $this->drawLeftText("4. Closing Hand Cash Balance", $x + 20, $line4Y, 10.5, '/F2', 0.06, 0.09, 0.16);
        $closeR = ($closing >= 0) ? 0.11 : 0.88;
        $closeG = ($closing >= 0) ? 0.31 : 0.11;
        $closeB = ($closing >= 0) ? 0.85 : 0.28;
        $this->drawRightAlignedText("BDT " . number_format((float)$closing, 2), $x + $w - 20, $line4Y, 11, '/F2', $closeR, $closeG, $closeB);

        $this->y = $y - 18;
    }

    private function drawCategorySummaryBreakdown($inCats, $outCats, $totalIn, $totalOut) {
        $sectionTitleHeight = 16;
        $inRowCount = max(1, count($inCats));
        $outRowCount = max(1, count($outCats));
        $maxRows = max($inRowCount, $outRowCount);

        $rowH = 16;
        $headerH = 21;
        $colHeadH = 15;
        $footerH = (count($inCats) > 0 || count($outCats) > 0) ? 16 : 0;
        $cardHeight = $headerH + $colHeadH + ($maxRows * $rowH) + $footerH;

        $this->checkPageSpace($sectionTitleHeight + $cardHeight + 15);

        // Section Title: Blue bullet square + Title
        $this->currentPageStream .= "0.15 0.39 0.92 rg\n";
        $this->currentPageStream .= "30 " . ($this->y - 9) . " 5 5 re f\n";
        $this->drawLeftText("Category Summary Breakdown", 40, $this->y - 10, 10, '/F2', 0.12, 0.16, 0.23);
        $this->y -= $sectionTitleHeight;

        $cardTopY = $this->y;
        $cardW = 260;
        $gap = 15;

        // ==================== LEFT CARD: CASH IN ====================
        $inX = 30;
        $inY = $cardTopY - $cardHeight;

        // Border & Background
        $this->currentPageStream .= "1 1 1 rg\n$inX $inY $cardW $cardHeight re f\n";
        $this->currentPageStream .= "0.43 0.90 0.72 RG\n0.8 w\n$inX $inY $cardW $cardHeight re S\n";

        // Green Header Bar
        $inHeadY = $cardTopY - $headerH;
        $this->currentPageStream .= "0.016 0.470 0.340 rg\n$inX $inHeadY $cardW $headerH re f\n";
        $this->drawLeftText("Cash In Categories", $inX + 8, $inHeadY + 6, 8.5, '/F2', 1, 1, 1);
        $this->drawRightAlignedText("Total: BDT " . number_format((float)$totalIn, 2), $inX + $cardW - 8, $inHeadY + 6, 8.5, '/F2', 1, 1, 1);

        // Column Headers
        $inColY = $inHeadY - $colHeadH;
        $this->currentPageStream .= "0.925 0.992 0.961 rg\n$inX $inColY $cardW $colHeadH re f\n";
        $this->currentPageStream .= "0.65 0.95 0.82 RG\n0.5 w\n$inX $inColY $cardW $colHeadH re S\n";
        $this->drawLeftText("Category / Source", $inX + 6, $inColY + 4, 7.5, '/F2', 0.02, 0.31, 0.23);
        $this->drawCenteredText("Vouchers", $inX + 165, $inColY + 4, 7.5, '/F2', 0.02, 0.31, 0.23);
        $this->drawRightAlignedText("Amount (BDT)", $inX + $cardW - 6, $inColY + 4, 7.5, '/F2', 0.02, 0.31, 0.23);

        // Rows
        $currRowY = $inColY;
        if (empty($inCats)) {
            $currRowY -= $rowH;
            $this->currentPageStream .= "0.9 0.9 0.9 RG\n0.4 w\n$inX $currRowY $cardW $rowH re S\n";
            $this->drawCenteredText("No Cash In Recorded Today", $inX + ($cardW / 2), $currRowY + 5, 7.5, '/F1', 0.6, 0.63, 0.68);
        } else {
            foreach ($inCats as $c) {
                $currRowY -= $rowH;
                $this->currentPageStream .= "0.92 0.94 0.96 RG\n0.3 w\n$inX $currRowY $cardW $rowH re S\n";
                $catName = $this->getCategoryLabel($c['category'] ?? '');
                $catNameTrunc = substr($this->cleanText($catName), 0, 24);
                $this->drawLeftText($catNameTrunc, $inX + 6, $currRowY + 4.5, 7.5, '/F1', 0.15, 0.18, 0.23);
                $this->drawCenteredText(($c['count'] ?? 1) . " pcs", $inX + 165, $currRowY + 4.5, 7.5, '/F1', 0.35, 0.4, 0.45);
                $this->drawRightAlignedText(number_format((float)($c['total'] ?? 0), 2), $inX + $cardW - 6, $currRowY + 4.5, 7.5, '/F2', 0.016, 0.47, 0.34);
            }
        }

        // Left Card Footer Total
        if (!empty($inCats)) {
            $footerY = $inY;
            $this->currentPageStream .= "0.925 0.992 0.961 rg\n$inX $footerY $cardW $footerH re f\n";
            $this->currentPageStream .= "0.65 0.95 0.82 RG\n0.6 w\n$inX $footerY $cardW $footerH re S\n";
            $this->drawLeftText("Total In", $inX + 6, $footerY + 4.5, 8, '/F2', 0.02, 0.31, 0.23);
            $this->drawRightAlignedText(number_format((float)$totalIn, 2), $inX + $cardW - 6, $footerY + 4.5, 8, '/F2', 0.016, 0.47, 0.34);
        }

        // ==================== RIGHT CARD: CASH OUT ====================
        $outX = $inX + $cardW + $gap;
        $outY = $cardTopY - $cardHeight;

        // Border & Background
        $this->currentPageStream .= "1 1 1 rg\n$outX $outY $cardW $cardHeight re f\n";
        $this->currentPageStream .= "0.99 0.64 0.69 RG\n0.8 w\n$outX $outY $cardW $cardHeight re S\n";

        // Crimson Header Bar
        $outHeadY = $cardTopY - $headerH;
        $this->currentPageStream .= "0.745 0.070 0.235 rg\n$outX $outHeadY $cardW $headerH re f\n";
        $this->drawLeftText("Cash Out Categories", $outX + 8, $outHeadY + 6, 8.5, '/F2', 1, 1, 1);
        $this->drawRightAlignedText("Total: BDT " . number_format((float)$totalOut, 2), $outX + $cardW - 8, $outHeadY + 6, 8.5, '/F2', 1, 1, 1);

        // Column Headers
        $outColY = $outHeadY - $colHeadH;
        $this->currentPageStream .= "1.0 0.945 0.949 rg\n$outX $outColY $cardW $colHeadH re f\n";
        $this->currentPageStream .= "0.996 0.804 0.827 RG\n0.5 w\n$outX $outColY $cardW $colHeadH re S\n";
        $this->drawLeftText("Category / Head", $outX + 6, $outColY + 4, 7.5, '/F2', 0.53, 0.07, 0.22);
        $this->drawCenteredText("Vouchers", $outX + 165, $outColY + 4, 7.5, '/F2', 0.53, 0.07, 0.22);
        $this->drawRightAlignedText("Amount (BDT)", $outX + $cardW - 6, $outColY + 4, 7.5, '/F2', 0.53, 0.07, 0.22);

        // Rows
        $currRowY = $outColY;
        if (empty($outCats)) {
            $currRowY -= $rowH;
            $this->currentPageStream .= "0.9 0.9 0.9 RG\n0.4 w\n$outX $currRowY $cardW $rowH re S\n";
            $this->drawCenteredText("No Cash Out Recorded Today", $outX + ($cardW / 2), $currRowY + 5, 7.5, '/F1', 0.6, 0.63, 0.68);
        } else {
            foreach ($outCats as $c) {
                $currRowY -= $rowH;
                $this->currentPageStream .= "0.92 0.94 0.96 RG\n0.3 w\n$outX $currRowY $cardW $rowH re S\n";
                $catName = $this->getCategoryLabel($c['category'] ?? '');
                $catNameTrunc = substr($this->cleanText($catName), 0, 24);
                $this->drawLeftText($catNameTrunc, $outX + 6, $currRowY + 4.5, 7.5, '/F1', 0.15, 0.18, 0.23);
                $this->drawCenteredText(($c['count'] ?? 1) . " pcs", $outX + 165, $currRowY + 4.5, 7.5, '/F1', 0.35, 0.4, 0.45);
                $this->drawRightAlignedText(number_format((float)($c['total'] ?? 0), 2), $outX + $cardW - 6, $currRowY + 4.5, 7.5, '/F2', 0.745, 0.07, 0.235);
            }
        }

        // Right Card Footer Total
        if (!empty($outCats)) {
            $footerY = $outY;
            $this->currentPageStream .= "1.0 0.945 0.949 rg\n$outX $footerY $cardW $footerH re f\n";
            $this->currentPageStream .= "0.996 0.804 0.827 RG\n0.6 w\n$outX $footerY $cardW $footerH re S\n";
            $this->drawLeftText("Total Out", $outX + 6, $footerY + 4.5, 8, '/F2', 0.53, 0.07, 0.22);
            $this->drawRightAlignedText(number_format((float)$totalOut, 2), $outX + $cardW - 6, $footerY + 4.5, 8, '/F2', 0.745, 0.07, 0.235);
        }

        $this->y = $cardTopY - $cardHeight - 16;
    }

    private function drawTransactionSection($title, $columns, $colWidths, $rows, $totalAmount, $totalLabel, $bannerColor, $footerColor, $textColor) {
        $bannerHeight = 22;
        $headerHeight = 17;
        $rowHeight = 17;
        $tableW = array_sum($colWidths);
        $x = 30;

        $needed = $bannerHeight + $headerHeight + $rowHeight + 20;
        $this->checkPageSpace($needed);

        // 1. Solid Colored Banner Header (Matching Image 2)
        $bannerY = $this->y - $bannerHeight;
        $br = $bannerColor[0];
        $bg = $bannerColor[1];
        $bb = $bannerColor[2];

        $this->currentPageStream .= "$br $bg $bb rg\n";
        $this->currentPageStream .= "$x $bannerY $tableW $bannerHeight re f\n";
        $this->currentPageStream .= "0 0 0 RG\n0.4 w\n";
        $this->currentPageStream .= "$x $bannerY $tableW $bannerHeight re S\n";

        $this->drawLeftText($title, $x + 10, $bannerY + 7, 9, '/F2', 1, 1, 1);
        $this->drawRightAlignedText("Total: BDT " . number_format((float)$totalAmount, 2), $x + $tableW - 10, $bannerY + 7, 9, '/F2', 1, 1, 1);

        $this->y = $bannerY;

        // If Empty Table
        if (empty($rows)) {
            $emptyH = 28;
            $this->checkPageSpace($emptyH);
            $emptyY = $this->y - $emptyH;
            $this->currentPageStream .= "1 1 1 rg\n$x $emptyY $tableW $emptyH re f\n";
            $this->currentPageStream .= "0.82 0.84 0.86 RG\n0.6 w\n$x $emptyY $tableW $emptyH re S\n";
            $emptyText = strpos($title, "Cash In") !== false
                ? "No approved cash in transactions recorded for today."
                : "No approved cash out transactions recorded for today.";
            $this->drawCenteredText($emptyText, 297.5, $emptyY + 10, 8, '/F1', 0.5, 0.53, 0.58);
            $this->y = $emptyY - 14;
            return;
        }

        // Table Column Headers
        $headerY = $this->y - $headerHeight;
        $this->currentPageStream .= "0.96 0.97 0.98 rg\n$x $headerY $tableW $headerHeight re f\n";
        $this->currentPageStream .= "0.82 0.84 0.86 RG\n0.6 w\n$x $headerY $tableW $headerHeight re S\n";

        $currX = $x;
        foreach ($columns as $idx => $colName) {
            $w = $colWidths[$idx];
            $this->currentPageStream .= "0.82 0.84 0.86 RG\n0.4 w\n$currX $headerY 0 $headerHeight re S\n";
            if ($idx === 0) {
                $this->drawCenteredText($colName, $currX + ($w / 2), $headerY + 5, 7.5, '/F2', 0.25, 0.3, 0.38);
            } elseif ($idx === count($columns) - 1) {
                $this->drawRightAlignedText($colName, $currX + $w - 6, $headerY + 5, 7.5, '/F2', 0.25, 0.3, 0.38);
            } else {
                $this->drawLeftText($colName, $currX + 5, $headerY + 5, 7.5, '/F2', 0.25, 0.3, 0.38);
            }
            $currX += $w;
        }
        $this->y = $headerY;

        // Data Rows
        $rowIdx = 0;
        foreach ($rows as $row) {
            $this->checkPageSpace($rowHeight + 20);
            $rowY = $this->y - $rowHeight;

            // Subtle alternating background
            $bgVal = ($rowIdx % 2 === 0) ? "1 1 1" : "0.985 0.988 0.992";
            $this->currentPageStream .= "$bgVal rg\n$x $rowY $tableW $rowHeight re f\n";
            $this->currentPageStream .= "0.88 0.90 0.92 RG\n0.4 w\n$x $rowY $tableW $rowHeight re S\n";

            $currX = $x;
            foreach ($row as $idx => $cellVal) {
                $w = $colWidths[$idx];
                $this->currentPageStream .= "0.88 0.90 0.92 RG\n0.3 w\n$currX $rowY 0 $rowHeight re S\n";
                $maxChars = max(6, intval($w / 4.8));
                $cleanVal = substr($this->cleanText($cellVal), 0, $maxChars);

                if ($idx === 0) {
                    $this->drawCenteredText($cleanVal, $currX + ($w / 2), $rowY + 5, 7.5, '/F1', 0.45, 0.5, 0.55);
                } elseif ($idx === 1) {
                    // Voucher in highlight color
                    $this->drawLeftText($cleanVal, $currX + 5, $rowY + 5, 7.5, '/F2', 0.12, 0.35, 0.85);
                } elseif ($idx === count($row) - 1) {
                    // Amount in bold dark
                    $this->drawRightAlignedText($cleanVal, $currX + $w - 6, $rowY + 5, 7.5, '/F2', 0.1, 0.12, 0.15);
                } elseif ($idx === 4) {
                    // Category mapped
                    $mappedCat = substr($this->cleanText($this->getCategoryLabel($cellVal)), 0, $maxChars);
                    $this->drawLeftText($mappedCat, $currX + 5, $rowY + 5, 7.5, '/F1', 0.3, 0.35, 0.4);
                } else {
                    $this->drawLeftText($cleanVal, $currX + 5, $rowY + 5, 7.5, '/F1', 0.2, 0.22, 0.26);
                }
                $currX += $w;
            }
            $this->y = $rowY;
            $rowIdx++;
        }

        // Summary Total Row
        $this->checkPageSpace($rowHeight + 10);
        $totY = $this->y - $rowHeight;
        $fr = $footerColor[0];
        $fg = $footerColor[1];
        $fb = $footerColor[2];
        $this->currentPageStream .= "$fr $fg $fb rg\n$x $totY $tableW $rowHeight re f\n";
        $this->currentPageStream .= "0.82 0.84 0.86 RG\n0.6 w\n$x $totY $tableW $rowHeight re S\n";

        $tr = $textColor[0];
        $tg = $textColor[1];
        $tb = $textColor[2];
        $this->drawLeftText($totalLabel . ":", $x + 10, $totY + 5, 8.5, '/F2', $tr, $tg, $tb);
        $this->drawRightAlignedText("BDT " . number_format((float)$totalAmount, 2), $x + $tableW - 10, $totY + 5, 9, '/F2', $tr, $tg, $tb);

        $this->y = $totY - 16;
    }

    private function drawSignatures() {
        $needed = 55;
        $this->checkPageSpace($needed);

        $this->y -= 25;
        $sigY = $this->y;

        // Line 1: Prepared By
        $this->currentPageStream .= "0.55 0.58 0.62 RG\n0.6 w\n45 $sigY m 165 $sigY l S\n";
        $this->drawCenteredText("Prepared By", 105, $sigY - 12, 8, '/F2', 0.3, 0.35, 0.4);

        // Line 2: Checked By
        $this->currentPageStream .= "0.55 0.58 0.62 RG\n0.6 w\n235 $sigY m 355 $sigY l S\n";
        $this->drawCenteredText("Checked By", 295, $sigY - 12, 8, '/F2', 0.3, 0.35, 0.4);

        // Line 3: Approved By (Manager / Director)
        $this->currentPageStream .= "0.55 0.58 0.62 RG\n0.6 w\n425 $sigY m 545 $sigY l S\n";
        $this->drawCenteredText("Approved By (Manager / Director)", 485, $sigY - 12, 8, '/F2', 0.3, 0.35, 0.4);

        $this->y -= 30;
    }

    private function drawFooter() {
        $this->currentPageStream .= "0.85 0.88 0.92 RG\n0.5 w\n30 32 m 565 32 l S\n";
        $this->currentPageStream .= "BT\n/F1 7.5 Tf\n0.5 0.53 0.58 rg\n30 22 Td (SupplyLink Operational System | Confidential Official Cash Ledger Document) Tj\nET\n";
        $this->currentPageStream .= "BT\n/F1 7.5 Tf\n0.5 0.53 0.58 rg\n520 22 Td (Page " . $this->pageNumber . ") Tj\nET\n";
        $this->pageNumber++;
    }

    private function checkPageSpace($neededHeight) {
        if ($this->y - $neededHeight < 45) {
            $this->startNewPage();
        }
    }

    private function estimateTextWidth($text, $fontSize, $isBold = false) {
        $multiplier = $isBold ? 0.55 : 0.50;
        return strlen((string)$text) * $fontSize * $multiplier;
    }

    private function drawLeftText($text, $leftX, $y, $fontSize, $font = '/F1', $r = 0, $g = 0, $b = 0) {
        $clean = $this->cleanText($text);
        $this->currentPageStream .= "BT\n$font $fontSize Tf\n" . sprintf("%.3f %.3f %.3f", $r, $g, $b) . " rg\n" . sprintf("%.2f %.2f", $leftX, $y) . " Td (" . $clean . ") Tj\nET\n";
    }

    private function drawCenteredText($text, $centerX, $y, $fontSize, $font = '/F2', $r = 0, $g = 0, $b = 0) {
        $clean = $this->cleanText($text);
        $width = $this->estimateTextWidth($clean, $fontSize, $font === '/F2');
        $startX = $centerX - ($width / 2);
        $this->currentPageStream .= "BT\n$font $fontSize Tf\n" . sprintf("%.3f %.3f %.3f", $r, $g, $b) . " rg\n" . sprintf("%.2f %.2f", $startX, $y) . " Td (" . $clean . ") Tj\nET\n";
    }

    private function drawRightAlignedText($text, $rightX, $y, $fontSize, $font = '/F2', $r = 0, $g = 0, $b = 0) {
        $clean = $this->cleanText($text);
        $width = $this->estimateTextWidth($clean, $fontSize, $font === '/F2');
        $startX = $rightX - $width;
        $this->currentPageStream .= "BT\n$font $fontSize Tf\n" . sprintf("%.3f %.3f %.3f", $r, $g, $b) . " rg\n" . sprintf("%.2f %.2f", $startX, $y) . " Td (" . $clean . ") Tj\nET\n";
    }

    private function getCategoryLabel($rawCat) {
        $key = strtolower(trim((string)$rawCat));
        if (isset($this->categoryLabels[$key])) {
            return $this->categoryLabels[$key];
        }
        if (empty($key) || $key === 'others') {
            return 'General / Others';
        }
        return ucwords(str_replace(['-', '_'], ' ', $key));
    }

    private function aggregateCategoriesFromRows($cashInRows, $cashOutRows) {
        $inMap = [];
        foreach ($cashInRows as $r) {
            $cat = !empty($r[4]) ? $r[4] : 'others';
            $amt = (float)str_replace(',', '', $r[5] ?? '0');
            if (!isset($inMap[$cat])) {
                $inMap[$cat] = ['category' => $cat, 'count' => 0, 'total' => 0.0];
            }
            $inMap[$cat]['count']++;
            $inMap[$cat]['total'] += $amt;
        }

        $outMap = [];
        foreach ($cashOutRows as $r) {
            $cat = !empty($r[4]) ? $r[4] : 'others';
            $amt = (float)str_replace(',', '', $r[5] ?? '0');
            if (!isset($outMap[$cat])) {
                $outMap[$cat] = ['category' => $cat, 'count' => 0, 'total' => 0.0];
            }
            $outMap[$cat]['count']++;
            $outMap[$cat]['total'] += $amt;
        }

        return [
            'in' => array_values($inMap),
            'out' => array_values($outMap)
        ];
    }

    private function cleanText($str) {
        // Strip non-printable or high bytes for standard Helvetica ASCII compatibility
        $str = preg_replace('/[^\x20-\x7E]/', ' ', (string)$str);
        // Escape special PDF literal characters
        $str = str_replace('\\', '\\\\', $str);
        $str = str_replace('(', '\\(', $str);
        $str = str_replace(')', '\\)', $str);
        $str = preg_replace('/\s+/', ' ', $str);
        return trim($str);
    }

    private function buildPdfBinary() {
        if (!empty($this->currentPageStream)) {
            $this->drawFooter();
            $this->pages[] = $this->currentPageStream;
            $this->currentPageStream = "";
        }

        $pageCount = max(1, count($this->pages));
        $out = "%PDF-1.4\n";
        $offsets = [];

        // 1: Catalog
        $offsets[1] = strlen($out);
        $out .= "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";

        // 2: Pages
        $kids = [];
        for ($i = 0; $i < $pageCount; $i++) {
            $pageObjNum = 3 + ($i * 2);
            $kids[] = "$pageObjNum 0 R";
        }
        $offsets[2] = strlen($out);
        $out .= "2 0 obj\n<< /Type /Pages /Kids [" . implode(" ", $kids) . "] /Count $pageCount >>\nendobj\n";

        // Fonts
        $f1Obj = 3 + ($pageCount * 2);
        $f2Obj = $f1Obj + 1;

        // Output Pages and Content streams
        for ($i = 0; $i < $pageCount; $i++) {
            $pageObj = 3 + ($i * 2);
            $contentObj = $pageObj + 1;
            $streamData = $this->pages[$i];
            $streamLen = strlen($streamData);

            $offsets[$pageObj] = strlen($out);
            $out .= "$pageObj 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents $contentObj 0 R /Resources << /Font << /F1 $f1Obj 0 R /F2 $f2Obj 0 R >> >> >>\nendobj\n";

            $offsets[$contentObj] = strlen($out);
            $out .= "$contentObj 0 obj\n<< /Length $streamLen >>\nstream\n" . $streamData . "\nendstream\nendobj\n";
        }

        // Font F1 (Helvetica)
        $offsets[$f1Obj] = strlen($out);
        $out .= "$f1Obj 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";

        // Font F2 (Helvetica-Bold)
        $offsets[$f2Obj] = strlen($out);
        $out .= "$f2Obj 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n";

        $totalObjs = $f2Obj;
        $xrefOffset = strlen($out);
        $out .= "xref\n0 " . ($totalObjs + 1) . "\n";
        $out .= "0000000000 65535 f \n";
        for ($i = 1; $i <= $totalObjs; $i++) {
            $out .= sprintf("%010d 00000 n \n", $offsets[$i]);
        }
        $out .= "trailer\n<< /Size " . ($totalObjs + 1) . " /Root 1 0 R >>\n";
        $out .= "startxref\n$xrefOffset\n%%EOF\n";

        return $out;
    }
}
