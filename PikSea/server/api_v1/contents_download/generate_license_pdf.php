<?php

/**
 * PikSea — Official License Certificate PDF Generator
 * Pure PHP, zero external dependencies.
 * Generates an ultra-crisp vector PDF certificate.
 *
 * Returns raw PDF bytes as a string.
 */
function generatePikSeaLicensePDF(
    string $contentTitle,
    string $userEmail,
    string $licenseId,
    string $downloadDate,
    bool   $isPremium = false
): string {

    $licenseType  = $isPremium ? 'Commercial Pro License' : 'Standard Free License';
    $planLabel    = $isPremium ? 'Premium / Studio Pro Plan' : 'Standard Free Plan';

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

    // Object 2 — Pages
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
    // Theme colors: Cyan #00D4FF -> (0.0 0.83 1.0), Deep Navy #0F172A -> (0.059 0.09 0.165)
    $stream = '';

    // ── Deep Navy header bar ───────────────────────────────────────────
    $stream .= "0.059 0.09 0.165 rg\n";     // fill = deep navy
    $stream .= "0 782 595 60 re f\n";        // x y w h rectangle fill

    // Cyan accent top bar
    $stream .= "0.0 0.83 1.0 rg\n";          // cyan
    $stream .= "0 838 595 4 re f\n";

    // ── Header text: "PikSea" ──────────────────────────────────────────
    $stream .= "1 1 1 rg\n";                 // white
    $stream .= "BT\n";
    $stream .= "/F2 24 Tf\n";
    $stream .= "30 802 Td\n";
    $stream .= "({$esc('PikSea')}) Tj\n";
    $stream .= "ET\n";

    // Sub-heading in header
    $stream .= "0.0 0.83 1.0 rg\n";
    $stream .= "BT\n";
    $stream .= "/F1 9 Tf\n";
    $stream .= "30 790 Td\n";
    $stream .= "({$esc('www.piksea.com  |  Pure Stock Photography')}) Tj\n";
    $stream .= "ET\n";

    // License type badge (right side of header)
    $stream .= "1 1 1 rg\n";
    $stream .= "BT\n";
    $stream .= "/F2 11 Tf\n";
    $stream .= "420 802 Td\n";
    $stream .= "({$esc($licenseType)}) Tj\n";
    $stream .= "ET\n";

    // ── Light background body ─────────────────────────────────────────
    $stream .= "0.98 0.98 0.99 rg\n";
    $stream .= "30 90 535 675 re f\n";

    // Border around card
    $stream .= "0.88 0.90 0.94 RG\n";
    $stream .= "1 w\n";
    $stream .= "30 90 535 675 re S\n";

    // ── Deep Navy heading ─────────────────────────────────────────────
    $stream .= "0.059 0.09 0.165 rg\n";
    $stream .= "BT\n";
    $stream .= "/F2 18 Tf\n";
    $stream .= "50 735 Td\n";
    $stream .= "({$esc('Official License Certificate')}) Tj\n";
    $stream .= "ET\n";

    // Thin cyan line under heading
    $stream .= "0.0 0.83 1.0 rg\n";
    $stream .= "50 727 220 2 re f\n";

    // ── Content info ──────────────────────────────────────────────────
    $y = 700;
    $lineH = 22;

    $rows = [
        ['Asset Name',    $esc($titleDisplay)],
        ['License ID',    $esc($licenseId)],
        ['License Type',  $esc($licenseType)],
        ['Plan Level',    $esc($planLabel)],
        ['Licensed To',   $esc($userEmail)],
        ['Issue Date',    $esc($downloadDate)],
        ['Issuer',        $esc('PikSea Studio (www.piksea.com)')],
    ];

    foreach ($rows as [$label, $value]) {
        // label
        $stream .= "0.45 0.50 0.58 rg\n";
        $labelX = 55;
        $stream .= "BT /F2 9 Tf {$labelX} {$y} Td ({$esc($label)}) Tj ET\n";
        // value
        $stream .= "0.08 0.12 0.20 rg\n";
        $stream .= "BT /F1 10 Tf 190 {$y} Td ({$value}) Tj ET\n";
        $y -= $lineH;
    }

    // ── Divider ───────────────────────────────────────────────────────
    $stream .= "0.88 0.90 0.94 rg\n";
    $stream .= "50 {$y} 495 1 re f\n";
    $y -= 20;

    // ── License terms ─────────────────────────────────────────────────
    $stream .= "0.059 0.09 0.165 rg\n";
    $stream .= "BT /F2 11 Tf 50 {$y} Td ({$esc('Permitted Uses & Rights Granted')}) Tj ET\n";
    $y -= 20;

    $terms = [
        '✔  Worldwide, perpetual, royalty-free usage rights.',
        '✔  Unlimited personal, editorial, and commercial client projects.',
        '✔  Full rights to crop, edit, retouch, composite, and color-grade.',
        '✗  Strictly prohibited to resell, redistribute, sub-license, or share raw files.',
        '✗  You may NOT use this asset to train AI or machine learning models.',
        '✗  You may NOT register trademark or copyright over the original photographic work.',
    ];

    foreach ($terms as $term) {
        $stream .= "0.25 0.30 0.38 rg\n";
        $stream .= "BT /F1 9 Tf 55 {$y} Td ({$esc($term)}) Tj ET\n";
        $y -= 16;
    }

    $y -= 12;
    $stream .= "0.50 0.55 0.62 rg\n";
    $stream .= "BT /F1 8 Tf 55 {$y} Td ({$esc('This certificate verifies lawful acquisition and valid licensing from PikSea.')}) Tj ET\n";
    $y -= 14;
    $stream .= "BT /F1 8 Tf 55 {$y} Td ({$esc('For verification or licensing questions: support@piksea.com')}) Tj ET\n";

    // ── Footer bar ────────────────────────────────────────────────────
    $stream .= "0.059 0.09 0.165 rg\n";
    $stream .= "0 0 595 40 re f\n";

    $stream .= "0.0 0.83 1.0 rg\n";
    $stream .= "0 38 595 2 re f\n";

    $stream .= "1 1 1 rg\n";
    $stream .= "BT /F1 8 Tf 30 15 Td ({$esc('© ' . date('Y') . ' PikSea — Pure Stock Photography. All rights reserved. | Cryptographically verifiable system certificate.')}) Tj ET\n";

    // ── Watermark (diagonal, subtle) ──────────────────────────────────
    $stream .= "q\n";
    $stream .= "0.93 0.94 0.96 rg\n";
    $stream .= "BT\n";
    $stream .= "/F2 64 Tf\n";
    $cos30 = round(cos(deg2rad(30)), 6);
    $sin30 = round(sin(deg2rad(30)), 6);
    $stream .= "{$cos30} {$sin30} -{$sin30} {$cos30} 120 330 Tm\n";
    $stream .= "({$esc('PikSea')}) Tj\n";
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
    $pdf .= "%\xE2\xE3\xCF\xD3\n";  // binary comment

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
        $pdf .= str_pad((string)$off, 10, '0', STR_PAD_LEFT) . " 00000 n \n";
    }

    $pdf .= "trailer\n";
    $pdf .= "<< /Size {$count} /Root 1 0 R >>\n";
    $pdf .= "startxref\n{$xrefOffset}\n%%EOF\n";

    return $pdf;
}

// Backwards compatibility alias
function generateDayalStockLicensePDF(
    string $contentTitle,
    string $userEmail,
    string $licenseId,
    string $downloadDate,
    bool   $isPremium = false
): string {
    return generatePikSeaLicensePDF($contentTitle, $userEmail, $licenseId, $downloadDate, $isPremium);
}
