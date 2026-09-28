<?php
// backend/helpers/vector_guard.php
// Obfuscates raw SVG vector payloads to protect against network scraping

define('VECTOR_OBFUSCATION_KEY', 'ib_vector_sec_2026');

/**
 * Encodes raw SVG using XOR key cipher + Base64
 * Prevents plain readable SVG XML tags from appearing in DevTools Network tab
 */
function obfuscateSvgPayload(?string $rawSvg): string {
    if (empty($rawSvg)) {
        return '';
    }
    $key = VECTOR_OBFUSCATION_KEY;
    $kLen = strlen($key);
    $len = strlen($rawSvg);
    $encoded = '';
    for ($i = 0; $i < $len; $i++) {
        $encoded .= chr(ord($rawSvg[$i]) ^ ord($key[$i % $kLen]));
    }
    return base64_encode($encoded);
}

/**
 * Decodes obfuscated payload back to raw SVG (for backend internal use/testing)
 */
function deobfuscateSvgPayload(?string $obfuscated): string {
    if (empty($obfuscated)) {
        return '';
    }
    if (strpos(trim($obfuscated), '<svg') === 0) {
        return $obfuscated;
    }
    $bin = base64_decode($obfuscated, true);
    if ($bin === false) {
        return $obfuscated;
    }
    $key = VECTOR_OBFUSCATION_KEY;
    $kLen = strlen($key);
    $len = strlen($bin);
    $decoded = '';
    for ($i = 0; $i < $len; $i++) {
        $decoded .= chr(ord($bin[$i]) ^ ord($key[$i % $kLen]));
    }
    return $decoded;
}
