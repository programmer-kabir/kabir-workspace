<?php

/**
 * DayalStock — Free License PDF Generator
 * Pure PHP, no external dependencies required.
 *
 * Returns raw PDF bytes as a string.
 */
function generateDayalStockLicensePDF(
    string $contentTitle,
    string $userEmail,
    string $licenseId,
    string $downloadDate,
    bool   $isPremium = false
): string {

    $licenseType  = $isPremium ? 'Premium License' : 'Free License';
    $planLabel    = $isPremium ? 'Premium / Pro Plan' : 'Free Plan';

    // ── helper: escape PDF string ──────────────────────────────────────
    $esc = fn(string $s): string =>
        str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $s);

    // Truncate long title so it fits one line
    $titleDisplay = mb_strlen($contentTitle) > 60
        ? mb_substr($contentTitle, 0, 57) . '...'
        : $contentTitle;

    // ── PDF object builder ─────────────────────────────────────────────
    $objects = [];
    $offsets = [];

    $addObj = function (string $dict, string $stream = '') use (&$objects): int {
        $id = count($objects) + 1;
        $objects[$id] = ['dict' => $dict, 'stream' => $stream];
        return $id;
    };

    // Object 1 — Catalog
    $addObj('<< /Type /Catalog /Pages 2 0 R >>');

    // Object 2 — Pages (filled later as placeholder)
    $addObj('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');

    // Object 3 — Page (A4: 595 × 842 pt)
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

    // ── Build page content stream ──────────────────────────────────────
    // Colors: orange #FF7900 → (1 0.475 0), dark navy #05264D → (0.02 0.149 0.302)
    $stream = '';

    // ── Orange header bar ─────────────────────────────────────────────
    $stream .= "1 0.475 0 rg\n";          // fill = orange
    $stream .= "0 792 595 50 re f\n";     // x y w h rectangle fill

    // ── Header text: "DayalStock" ──────────────────────────────────────
    $stream .= "1 1 1 rg\n";              // white
    $stream .= "BT\n";
    $stream .= "/F2 22 Tf\n";
    $stream .= "30 810 Td\n";
    $stream .= "({$esc('DayalStock')}) Tj\n";
    $stream .= "ET\n";

    // Sub-heading in header
    $stream .= "BT\n";
    $stream .= "/F1 10 Tf\n";
    $stream .= "30 798 Td\n";
    $stream .= "({$esc('www.dayalstock.com')}) Tj\n";
    $stream .= "ET\n";

    // License type badge (right side of header)
    $stream .= "BT\n";
    $stream .= "/F2 11 Tf\n";
    $stream .= "440 810 Td\n";
    $stream .= "({$esc($licenseType)}) Tj\n";
    $stream .= "ET\n";

    // ── Light background body ─────────────────────────────────────────
    $stream .= "0.97 0.97 0.97 rg\n";
    $stream .= "30 100 535 680 re f\n";

    // ── Dark navy heading ─────────────────────────────────────────────
    $stream .= "0.02 0.149 0.302 rg\n";
    $stream .= "BT\n";
    $stream .= "/F2 18 Tf\n";
    $stream .= "50 748 Td\n";
    $stream .= "({$esc('License Certificate')}) Tj\n";
    $stream .= "ET\n";

    // Thin orange line under heading
    $stream .= "1 0.475 0 rg\n";
    $stream .= "50 742 200 2 re f\n";

    // ── Content info ──────────────────────────────────────────────────
    $y = 718;
    $lineH = 22;

    $rows = [
        ['Asset Name',    $esc($titleDisplay)],
        ['License ID',    $esc($licenseId)],
        ['License Type',  $esc($licenseType)],
        ['Plan',          $esc($planLabel)],
        ['Licensed To',   $esc($userEmail)],
        ['Download Date', $esc($downloadDate)],
        ['Source',        $esc('www.dayalstock.com')],
    ];

    foreach ($rows as [$label, $value]) {
        // label
        $stream .= "0.4 0.4 0.4 rg\n";
        $labelX = 55;
        $stream .= "BT /F2 9 Tf {$labelX} {$y} Td ({$esc($label)}) Tj ET\n";
        // value
        $stream .= "0.02 0.149 0.302 rg\n";
        $stream .= "BT /F1 10 Tf 200 {$y} Td ({$value}) Tj ET\n";
        $y -= $lineH;
    }

    // ── Orange divider ────────────────────────────────────────────────
    $stream .= "1 0.475 0 rg\n";
    $stream .= "50 {$y} 495 1 re f\n";
    $y -= 18;

    // ── License terms ─────────────────────────────────────────────────
    $stream .= "0.02 0.149 0.302 rg\n";
    $stream .= "BT /F2 11 Tf 50 {$y} Td ({$esc('License Terms & Permissions')}) Tj ET\n";
    $y -= 20;

    $terms = [
        '✔  Personal and commercial use is permitted.',
        '✔  You may use this asset in unlimited projects.',
        '✔  Modification of the asset is allowed.',
        '✗  Redistribution or resale of the original file is NOT permitted.',
        '✗  You may NOT claim ownership or authorship of this asset.',
        '✗  This license is non-transferable and non-sublicensable.',
    ];

    foreach ($terms as $term) {
        $stream .= "0.2 0.2 0.2 rg\n";
        $stream .= "BT /F1 9 Tf 55 {$y} Td ({$esc($term)}) Tj ET\n";
        $y -= 16;
    }

    $y -= 10;
    $stream .= "0.5 0.5 0.5 rg\n";
    $stream .= "BT /F1 8 Tf 55 {$y} Td ({$esc('This license is automatically granted upon download from DayalStock.')}) Tj ET\n";
    $y -= 14;
    $stream .= "BT /F1 8 Tf 55 {$y} Td ({$esc('For questions, contact: support@dayalstock.com')}) Tj ET\n";

    // ── Orange footer bar ─────────────────────────────────────────────
    $stream .= "1 0.475 0 rg\n";
    $stream .= "0 0 595 40 re f\n";

    $stream .= "1 1 1 rg\n";
    $stream .= "BT /F1 8 Tf 30 15 Td ({$esc('© ' . date('Y') . ' DayalStock — All rights reserved. | This certificate is system-generated.')}) Tj ET\n";

    // ── Watermark (diagonal, very light) ─────────────────────────────
    $stream .= "q\n";
    $stream .= "0.94 0.94 0.94 rg\n";
    $stream .= "BT\n";
    $stream .= "/F2 52 Tf\n";
    $stream .= "1 0 0 1 100 400 Tm\n";
    $stream .= "0.52 0 -0 0.52 0 0 Tm\n";
    // Rotate 30deg
    $cos30 = round(cos(deg2rad(30)), 6);
    $sin30 = round(sin(deg2rad(30)), 6);
    $stream .= "{$cos30} {$sin30} -{$sin30} {$cos30} 80 350 Tm\n";
    $stream .= "({$esc('DayalStock')}) Tj\n";
    $stream .= "ET\n";
    $stream .= "Q\n";

    // Object 4 — Content stream
    $addObj("<< /Length " . strlen($stream) . " >>", $stream);

    // Object 5 — Helvetica (regular)
    $addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');

    // Object 6 — Helvetica-Bold
    $addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');

    // ── Assemble PDF ──────────────────────────────────────────────────
    $pdf  = "%PDF-1.4\n";
    $pdf .= "%\xE2\xE3\xCF\xD3\n";  // binary comment (marks as binary)

    foreach ($objects as $id => $obj) {
        $offsets[$id] = strlen($pdf);
        $pdf .= "{$id} 0 obj\n";
        if ($obj['stream'] !== '') {
            $pdf .= $obj['dict'] . "\nstream\n" . $obj['stream'] . "\nendstream\n";
        } else {
            $pdf .= $obj['dict'] . "\n";
        }
        $pdf .= "endobj\n";
    }

    // Cross-reference table
    $xrefOffset = strlen($pdf);
    $count      = count($objects) + 1;
    $pdf .= "xref\n";
    $pdf .= "0 {$count}\n";
    $pdf .= "0000000000 65535 f \n";
    foreach ($offsets as $off) {
        $pdf .= str_pad($off, 10, '0', STR_PAD_LEFT) . " 00000 n \n";
    }

    $pdf .= "trailer\n";
    $pdf .= "<< /Size {$count} /Root 1 0 R >>\n";
    $pdf .= "startxref\n{$xrefOffset}\n%%EOF\n";

    return $pdf;
}
