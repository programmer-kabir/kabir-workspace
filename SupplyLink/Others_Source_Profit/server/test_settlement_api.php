<?php
$_SESSION['user'] = ['id' => 1];
$_SERVER['REQUEST_METHOD'] = 'GET';
ob_start();
include __DIR__ . '/public_html/apis/settlement/get_company_settlement.php';
$out = ob_get_clean();
$json = json_decode($out, true);
echo "Success: " . ($json['success'] ? 'YES' : 'NO') . PHP_EOL;
echo "Card breakdown count: " . count($json['card_breakdown'] ?? []) . PHP_EOL;
echo "Investor breakdown count: " . count($json['investor_breakdown'] ?? []) . PHP_EOL;
if (!empty($json['card_breakdown'])) {
    echo "First card: " . json_encode($json['card_breakdown'][0], JSON_UNESCAPED_UNICODE) . PHP_EOL;
    echo "Last card: " . json_encode(end($json['card_breakdown']), JSON_UNESCAPED_UNICODE) . PHP_EOL;
}

