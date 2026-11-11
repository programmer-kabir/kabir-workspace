<?php
require_once __DIR__ . '/server/public_html/apis/db.php';

$res1 = $mysqli->query("DELETE FROM cash WHERE source = 'TEST_COPY_NOV'");
$affectedCash = $mysqli->affected_rows;

$res2 = $mysqli->query("DELETE FROM daily_bank_deposits WHERE collection_date IN ('2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04')");
$affectedDeposits = $mysqli->affected_rows;

echo json_encode([
    "success" => true,
    "message" => "টেস্ট ডাটা সম্পূর্ণ মুছে ফেলা হয়েছে।",
    "deleted_cash_entries" => $affectedCash,
    "deleted_daily_deposits" => $affectedDeposits
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
