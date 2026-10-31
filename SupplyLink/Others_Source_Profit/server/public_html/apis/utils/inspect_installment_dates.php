<?php
/**
 * Installment & Cash Date Inspection Tool (তারিখ ও ক্যাশ ভাউচার অডিট ইন্সপেক্টর)
 * 
 * Shows for every installment:
 * - Card Paid Date (কার্ডে পরিশোধের তারিখ)
 * - Cash Entry Date (ক্যাশে জমার তারিখ)
 * - Date Difference in Days (দিনের ব্যবধান)
 * - Cash Voucher (RefId)
 * - Amount in Card vs Cash
 * - Match Status (Exact Match, Settlement Date Shift, Date Mismatch, Missing)
 */

ini_set('display_errors', 0);
error_reporting(E_ALL);

if (php_sapi_name() !== 'cli') {
    require_once __DIR__ . '/../cors.php';
}
require_once __DIR__ . '/../db.php';

date_default_timezone_set('Asia/Dhaka');

$isCli = (php_sapi_name() === 'cli');
$isJson = isset($_GET['format']) && $_GET['format'] === 'json';

$startDate = $_GET['start_date'] ?? ($isCli ? ($argv[1] ?? '2026-10-01') : '2026-10-01');
$endDate = $_GET['end_date'] ?? ($isCli ? ($argv[2] ?? date('Y-m-d')) : date('Y-m-d'));
$filter = $_GET['filter'] ?? 'all'; // all | mismatch_only | settlements | missing

// Query all paid monthly installments
$sql = "
    SELECT 
        ip.id as payment_id,
        ip.card_id,
        ic.card_number,
        ic.product_name,
        u.name as customer_name,
        u.mobile as customer_mobile,
        ip.installment_no,
        ip.tag,
        ip.due_amount,
        ip.paid_date as card_paid_date,
        ip.payment_method,
        ip.receipt_number,
        cb.name as collector_name,
        cs.id as settlement_id,
        cs.settlement_date,
        cs.discount_amount,
        cs.final_settled_amount
    FROM installment_payments ip
    JOIN installment_cards ic ON ip.card_id = ic.id
    LEFT JOIN users u ON ic.user_id = u.id
    LEFT JOIN users cb ON ip.collected_by = cb.id
    LEFT JOIN card_settlements cs ON cs.card_id = ip.card_id
    WHERE ic.is_daily = 0
      AND (ic.remarks IS NULL OR LOWER(TRIM(ic.remarks)) != 'daily')
      AND ip.status = 'Paid'
      AND ip.paid_date BETWEEN ? AND ?
    ORDER BY ip.paid_date DESC, ip.id DESC
";
$stmt = $mysqli->prepare($sql);
$stmt->bind_param("ss", $startDate, $endDate);
$stmt->execute();
$payments = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

// Fetch cash rows for installment_% and settlement_%
$cashSql = "
    SELECT id, refId, amount, date, source, purpose, remarks, approval_status
    FROM cash 
    WHERE type = 'in'
      AND (refId LIKE 'installment_%' OR refId LIKE 'settlement_%')
";
$cashRes = $mysqli->query($cashSql);
$cashRows = $cashRes ? $cashRes->fetch_all(MYSQLI_ASSOC) : [];

$cashByRef = [];
$settlementCashByCard = [];
foreach ($cashRows as $c) {
    $cashByRef[$c['refId']] = $c;
    if (strpos($c['refId'], 'settlement_') === 0) {
        $cId = (int)str_replace('settlement_', '', $c['refId']);
        $settlementCashByCard[$cId] = $c;
    }
}

$results = [];
$stats = [
    'total' => count($payments),
    'exact_matches' => 0,
    'settlement_shifts' => 0,
    'date_mismatches' => 0,
    'missing_in_cash' => 0
];

foreach ($payments as $p) {
    $payId = (int)$p['payment_id'];
    $cardId = (int)$p['card_id'];
    $refId = "installment_" . $payId;
    $cardDate = $p['card_paid_date'];

    $directCash = $cashByRef[$refId] ?? null;
    $settleCash = $settlementCashByCard[$cardId] ?? null;

    $cashDate = null;
    $cashAmount = null;
    $cashRef = null;
    $statusType = null;
    $statusLabel = null;
    $dayDiff = 0;
    $notes = "";

    if ($directCash) {
        $cashDate = $directCash['date'];
        $cashAmount = (float)$directCash['amount'];
        $cashRef = $directCash['refId'];
        $dayDiff = (int)(strtotime($cashDate) - strtotime($cardDate)) / 86400;

        if ($cashDate === $cardDate) {
            $statusType = 'exact_match';
            $statusLabel = 'হুবহু মিল 🟢';
            $stats['exact_matches']++;
            $notes = "কার্ড ও ক্যাশের তারিখ হুবহু একই ({$cardDate})";
        } else {
            $statusType = 'date_mismatch';
            $statusLabel = 'তারিখের অমিল 🟡';
            $stats['date_mismatches']++;
            $notes = "কার্ডে {$cardDate} কিন্তু ক্যাশে {$cashDate} (" . ($dayDiff > 0 ? "+{$dayDiff}" : "{$dayDiff}") . " দিন)";
        }
    } elseif ($settleCash) {
        $cashDate = $settleCash['date'];
        $cashAmount = (float)$settleCash['amount'];
        $cashRef = $settleCash['refId'];
        $dayDiff = (int)(strtotime($cashDate) - strtotime($cardDate)) / 86400;

        $statusType = 'settlement_shift';
        $statusLabel = 'সেটেলমেন্ট সমন্বয় 🔵';
        $stats['settlement_shifts']++;
        $notes = "কার্ডে কিস্তির তারিখ {$cardDate}, কিন্তু কার্ডটি {$cashDate} তারিখে নিষ্পত্তি হয়ে এককালীন ৳" . number_format($cashAmount, 2) . " ক্যাশে জমা হয়েছে।";
    } else {
        $statusType = 'missing_in_cash';
        $statusLabel = 'ক্যাশে নেই 🔴';
        $stats['missing_in_cash']++;
        $notes = "কার্ডে পেইড কিন্তু ক্যাশে কোনো এন্ট্রি নেই";
    }

    $item = [
        'payment_id' => $payId,
        'card_id' => $cardId,
        'card_number' => $p['card_number'],
        'customer_name' => $p['customer_name'],
        'customer_mobile' => $p['customer_mobile'],
        'installment_no' => $p['installment_no'],
        'tag' => $p['tag'],
        'due_amount' => (float)$p['due_amount'],
        'card_paid_date' => $cardDate,
        'cash_date' => $cashDate,
        'cash_amount' => $cashAmount,
        'cash_ref' => $cashRef,
        'day_diff' => $dayDiff,
        'status_type' => $statusType,
        'status_label' => $statusLabel,
        'notes' => $notes,
        'is_settled' => !empty($p['settlement_id']),
        'settlement_discount' => (float)($p['discount_amount'] ?? 0),
        'settlement_final_amount' => (float)($p['final_settled_amount'] ?? 0)
    ];

    // Apply Filter
    if ($filter === 'mismatch_only' && !in_array($statusType, ['date_mismatch', 'settlement_shift', 'missing_in_cash'])) {
        continue;
    }
    if ($filter === 'settlements' && $statusType !== 'settlement_shift') {
        continue;
    }
    if ($filter === 'missing' && $statusType !== 'missing_in_cash') {
        continue;
    }

    $results[] = $item;
}

// JSON Output
if ($isJson) {
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode([
        'success' => true,
        'start_date' => $startDate,
        'end_date' => $endDate,
        'stats' => $stats,
        'data' => $results
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// CLI Output
if ($isCli) {
    echo "\n========================================================================================\n";
    echo "  INSTALLMENT & CASH DATE INSPECTOR ({$startDate} to {$endDate})\n";
    echo "========================================================================================\n";
    echo "Total Installments: {$stats['total']} | Exact Match: {$stats['exact_matches']} | Settlement Shifts: {$stats['settlement_shifts']} | Date Mismatch: {$stats['date_mismatches']} | Missing: {$stats['missing_in_cash']}\n\n";
    printf("%-8s | %-12s | %-20s | %-8s | %-12s | %-12s | %-10s | %-16s | %s\n", 
        "Pay ID", "Card #", "Customer", "Amount", "Card Date", "Cash Date", "Diff(Days)", "Cash Voucher", "Status & Notes");
    echo str_repeat("-", 125) . "\n";
    foreach ($results as $r) {
        printf("%-8s | %-12s | %-20s | ৳%-7s | %-12s | %-12s | %-10s | %-16s | %s\n",
            $r['payment_id'],
            $r['card_number'],
            mb_substr($r['customer_name'] ?? 'N/A', 0, 18),
            number_format($r['due_amount']),
            $r['card_paid_date'],
            $r['cash_date'] ?? 'N/A',
            ($r['day_diff'] > 0 ? "+{$r['day_diff']}" : $r['day_diff']),
            $r['cash_ref'] ?? 'N/A',
            $r['status_label'] . " (" . mb_substr($r['notes'], 0, 30) . ")"
        );
    }
    echo "\n";
    exit;
}

// HTML OUTPUT (Modern Dark Dashboard)
?>
<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>কিস্তি বনাম ক্যাশ তারিখ অডিট ইন্সপেক্টর</title>
    <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #060a14;
            --surface: #091224;
            --surface-hover: #0f1e38;
            --border: rgba(255, 255, 255, 0.1);
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --emerald: #10b981;
            --cyan: #06b6d4;
            --amber: #f59e0b;
            --rose: #f43f5e;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Hind Siliguri', sans-serif;
            background: var(--bg);
            color: var(--text-main);
            padding: 30px 20px;
            display: flex;
            justify-content: center;
        }
        .container {
            width: 100%;
            max-width: 1500px;
        }
        .header {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 24px 28px;
            margin-bottom: 20px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.4);
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
        }
        h1 {
            font-size: 22px;
            font-weight: 800;
            color: #fff;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .sub {
            font-size: 13px;
            color: var(--text-muted);
            margin-top: 4px;
        }
        .filter-form {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 16px 20px;
            margin-bottom: 20px;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
        }
        .date-inputs {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        input[type="date"], select {
            background: #030712;
            border: 1px solid var(--border);
            color: #fff;
            padding: 8px 14px;
            border-radius: 10px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            outline: none;
        }
        button, .btn {
            background: linear-gradient(135deg, #0284c7, #0369a1);
            color: #fff;
            border: none;
            padding: 8px 18px;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        button:hover { opacity: 0.9; transform: translateY(-1px); }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 14px;
            margin-bottom: 20px;
        }
        .stat-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 16px 20px;
        }
        .stat-title {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-muted);
            font-weight: 700;
        }
        .stat-value {
            font-size: 24px;
            font-weight: 800;
            font-family: 'JetBrains Mono', monospace;
            margin-top: 6px;
        }
        .table-wrap {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 20px;
            overflow-x: auto;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            text-align: left;
        }
        th {
            background: #030712;
            color: var(--text-muted);
            font-weight: 700;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.6px;
            padding: 14px 16px;
            border-bottom: 1px solid var(--border);
        }
        td {
            padding: 14px 16px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.04);
            vertical-align: middle;
        }
        tr:hover { background: var(--surface-hover); }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 3px 10px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 700;
        }
        .badge-green { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
        .badge-blue { background: rgba(6, 182, 212, 0.15); color: #22d3ee; border: 1px solid rgba(6, 182, 212, 0.3); }
        .badge-amber { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
        .badge-rose { background: rgba(244, 63, 94, 0.15); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.3); }
        .pills {
            display: flex;
            gap: 6px;
        }
        .pill {
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: 600;
            color: var(--text-muted);
            text-decoration: none;
            background: rgba(255,255,255,0.04);
            border: 1px solid var(--border);
            transition: all 0.2s;
        }
        .pill.active, .pill:hover {
            color: #fff;
            background: rgba(255,255,255,0.12);
        }
    </style>
</head>
<body>
<div class="container">
    <!-- Header -->
    <div class="header">
        <div>
            <h1>📅 কিস্তি বনাম ক্যাশ তারিখ অডিট ইন্সপেক্টর (Date Inspector)</h1>
            <p class="sub">গ্রাহক কার্ডে পরিশোধের তারিখ (Card Paid Date) বনাম ক্যাশে জমার তারিখ (Cash Ledger Date) এর নিখুঁত মিল ও ব্যবধান যাচাই</p>
        </div>
        <div>
            <a href="sync_date_monthly_installments_to_cash.php?format=json&start_date=<?= $startDate ?>&end_date=<?= $endDate ?>" class="btn">
                <span>⚡ JSON API আউটপুট</span>
            </a>
        </div>
    </div>

    <!-- Filter Bar -->
    <form class="filter-form" method="GET">
        <div class="date-inputs">
            <span style="font-size:12px; font-weight:600; color:var(--text-muted);">তারিখ নির্বাচন:</span>
            <input type="date" name="start_date" value="<?= htmlspecialchars($startDate) ?>">
            <span style="font-size:12px; color:var(--text-muted);">থেকে</span>
            <input type="date" name="end_date" value="<?= htmlspecialchars($endDate) ?>">
            <button type="submit">অডিট লোড করুন</button>
        </div>

        <div class="pills">
            <a href="?start_date=<?= $startDate ?>&end_date=<?= $endDate ?>&filter=all" class="pill <?= $filter === 'all' ? 'active' : '' ?>">সব কিস্তি (<?= $stats['total'] ?>)</a>
            <a href="?start_date=<?= $startDate ?>&end_date=<?= $endDate ?>&filter=settlements" class="pill <?= $filter === 'settlements' ? 'active' : '' ?>">সেটেলমেন্ট শিফট (<?= $stats['settlement_shifts'] ?>)</a>
            <a href="?start_date=<?= $startDate ?>&end_date=<?= $endDate ?>&filter=mismatch_only" class="pill <?= $filter === 'mismatch_only' ? 'active' : '' ?>">তারিখের অমিল (<?= $stats['date_mismatches'] + $stats['settlement_shifts'] ?>)</a>
            <a href="?start_date=<?= $startDate ?>&end_date=<?= $endDate ?>&filter=missing" class="pill <?= $filter === 'missing' ? 'active' : '' ?>">মিসিং (<?= $stats['missing_in_cash'] ?>)</a>
        </div>
    </form>

    <!-- KPI Summary Grid -->
    <div class="stats-grid">
        <div class="stat-card" style="border-color: rgba(255,255,255,0.15);">
            <div class="stat-title">মোট কিস্তি সংখ্যা</div>
            <div class="stat-value" style="color: #fff;"><?= $stats['total'] ?></div>
        </div>
        <div class="stat-card" style="border-color: rgba(16, 185, 129, 0.3);">
            <div class="stat-title" style="color:#34d399;">হুবহু তারিখ মিল 🟢</div>
            <div class="stat-value" style="color: #34d399;"><?= $stats['exact_matches'] ?></div>
        </div>
        <div class="stat-card" style="border-color: rgba(6, 182, 212, 0.3);">
            <div class="stat-title" style="color:#22d3ee;">সেটেলমেন্ট শিফট 🔵</div>
            <div class="stat-value" style="color: #22d3ee;"><?= $stats['settlement_shifts'] ?></div>
        </div>
        <div class="stat-card" style="border-color: rgba(245, 158, 11, 0.3);">
            <div class="stat-title" style="color:#fbbf24;">তারিখ অমিল 🟡</div>
            <div class="stat-value" style="color: #fbbf24;"><?= $stats['date_mismatches'] ?></div>
        </div>
        <div class="stat-card" style="border-color: rgba(244, 63, 94, 0.3);">
            <div class="stat-title" style="color:#fb7185;">ক্যাশে মিসিং 🔴</div>
            <div class="stat-value" style="color: #fb7185;"><?= $stats['missing_in_cash'] ?></div>
        </div>
    </div>

    <!-- Table -->
    <div class="table-wrap">
        <table>
            <thead>
                <tr>
                    <th>আইডি</th>
                    <th>গ্রাহকের নাম ও কার্ড</th>
                    <th>কিস্তি নং</th>
                    <th style="text-align:right;">টাকা</th>
                    <th style="color:#38bdf8;">কার্ডে পরিশোধের তারিখ</th>
                    <th style="color:#34d399;">ক্যাশে জমার তারিখ</th>
                    <th style="text-align:center;">দিনের ব্যবধান</th>
                    <th>ক্যাশ ভাউচার</th>
                    <th>স্ট্যাটাস</th>
                    <th>বিশ্লেষণ ও নোট</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($results)): ?>
                    <tr>
                        <td colspan="10" style="text-align:center; padding:40px; color:var(--text-muted);">
                            কোনো তথ্য পাওয়া যায়নি।
                        </td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($results as $row): ?>
                        <tr>
                            <td class="mono" style="color:var(--text-muted);">#<?= $row['payment_id'] ?></td>
                            <td>
                                <strong style="color:#fff;"><?= htmlspecialchars($row['customer_name'] ?? 'N/A') ?></strong>
                                <div style="font-size:11px; color:var(--text-muted); font-family:'JetBrains Mono';">কার্ড #<?= $row['card_number'] ?></div>
                            </td>
                            <td>
                                <strong>#<?= $row['installment_no'] ?></strong>
                                <?php if (!empty($row['tag'])): ?>
                                    <span style="font-size:10px; color:var(--text-muted);">(<?= htmlspecialchars($row['tag']) ?>)</span>
                                <?php endif; ?>
                            </td>
                            <td class="mono" style="text-align:right; font-weight:700; color:#34d399;">
                                ৳ <?= number_format($row['due_amount']) ?>
                            </td>
                            <td class="mono" style="color:#38bdf8; font-weight:700;">
                                <?= $row['card_paid_date'] ?>
                            </td>
                            <td class="mono" style="color:#34d399; font-weight:700;">
                                <?= $row['cash_date'] ?? '<span style="color:var(--rose)">ক্যাশে নেই</span>' ?>
                            </td>
                            <td class="mono" style="text-align:center; font-weight:700;">
                                <?php if ($row['cash_date']): ?>
                                    <?php if ($row['day_diff'] == 0): ?>
                                        <span style="color:var(--emerald)">০ দিন</span>
                                    <?php elseif ($row['day_diff'] > 0): ?>
                                        <span style="color:var(--cyan)">+<?= $row['day_diff'] ?> দিন</span>
                                    <?php else: ?>
                                        <span style="color:var(--amber)"><?= $row['day_diff'] ?> দিন</span>
                                    <?php endif; ?>
                                <?php else: ?>
                                    —
                                <?php endif; ?>
                            </td>
                            <td class="mono" style="font-size:11px;">
                                <?php if ($row['cash_ref']): ?>
                                    <span style="color:#fff; background:rgba(255,255,255,0.06); padding:2px 6px; border-radius:6px;">
                                        <?= $row['cash_ref'] ?>
                                    </span>
                                <?php else: ?>
                                    <span style="color:var(--text-muted)">N/A</span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <?php if ($row['status_type'] === 'exact_match'): ?>
                                    <span class="badge badge-green"><?= $row['status_label'] ?></span>
                                <?php elseif ($row['status_type'] === 'settlement_shift'): ?>
                                    <span class="badge badge-blue"><?= $row['status_label'] ?></span>
                                <?php elseif ($row['status_type'] === 'date_mismatch'): ?>
                                    <span class="badge badge-amber"><?= $row['status_label'] ?></span>
                                <?php else: ?>
                                    <span class="badge badge-rose"><?= $row['status_label'] ?></span>
                                <?php endif; ?>
                            </td>
                            <td style="color:var(--text-muted); font-size:11px; max-width:320px; line-height:1.4;">
                                <?= htmlspecialchars($row['notes']) ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>
</body>
</html>

