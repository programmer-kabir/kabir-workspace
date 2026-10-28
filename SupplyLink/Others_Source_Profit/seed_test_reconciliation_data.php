<?php
require_once __DIR__ . '/server/public_html/apis/db.php';

// Mapping: Source October Date => Target November Date
$dateMap = [
    '2026-10-10' => '2026-11-01', // In: 109,600 | Out: 23,605 (Salaries, rent, bills)
    '2026-10-14' => '2026-11-02', // In: 10,050  | Out: 872    (Office paper, payout)
    '2026-10-18' => '2026-11-03', // In: 78,400  | Out: 100,150(Large Investor payout)
    '2026-10-26' => '2026-11-04', // In: 106,510 | Out: 285,000(Large investment/bank withdraw)
];

// Clean existing test records first
$mysqli->query("DELETE FROM cash WHERE source = 'TEST_COPY_NOV'");
$mysqli->query("DELETE FROM daily_bank_deposits WHERE collection_date IN ('2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04')");

$totalCopied = 0;

foreach ($dateMap as $srcDate => $destDate) {
    $sel = $mysqli->prepare("
        SELECT type, purpose, amount, category, refId, remarks, approval_status, approved_by
        FROM cash
        WHERE date = ? AND approval_status = 'approved'
    ");
    $sel->bind_param("s", $srcDate);
    $sel->execute();
    $rows = $sel->get_result()->fetch_all(MYSQLI_ASSOC);
    $sel->close();

    $ins = $mysqli->prepare("
        INSERT INTO cash 
        (type, source, purpose, amount, category, refId, remarks, date, createdAt, approval_status, approved_by, approved_at)
        VALUES (?, 'TEST_COPY_NOV', ?, ?, ?, ?, ?, ?, NOW(), 'approved', ?, NOW())
    ");

    foreach ($rows as $r) {
        $type = $r['type'];
        $purpose = $r['purpose'] . " [টেস্ট ডাটা]";
        $amount = floatval($r['amount']);
        $cat = $r['category'];
        $ref = $r['refId'];
        $rem = "কপি করা টেস্ট ডাটা (মূল তারিখ: {$srcDate})";
        $appBy = intval($r['approved_by'] ?? 290);

        $ins->bind_param("ssdssssi", $type, $purpose, $amount, $cat, $ref, $rem, $destDate, $appBy);
        if ($ins->execute()) {
            $totalCopied++;
        }
    }
    $ins->close();
}

echo json_encode([
    "success" => true,
    "message" => "সফলভাবে {$totalCopied} টি টেস্ট এন্ট্রি নভেম্বর ১ থেকে ৪ তারিখে কপি করা হয়েছে।",
    "dates" => array_values($dateMap)
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
