<?php
/**
 * Sync Profit History Payouts to Cash Ledger (Cash Out)
 * 
 * FEATURES:
 * - Fetches approved profit payouts from `profit_history` table (status='withdraw', action_name='approved')
 * - Joins with `investment_cards` and `users` to capture exact Investor Name, Mobile & Card Name
 * - Truncates amount to pure integer (Floor): e.g., 144.09 => 144 BDT
 * - Maps directly to `cash` table as Type: 'out', Category: 'profit_payout', RefId: 'profit_payout_[id]'
 * - Detects and optionally purges previous manual/lump-sum profit cash out entries to prevent double deduction
 * - Interactive Preview Mode with discrepancy indicators & One-Click Sync
 * - Supports Web UI, REST JSON API, and CLI execution
 */

ini_set('display_errors', 1);
error_reporting(E_ALL);

if (php_sapi_name() !== 'cli') {
    require_once __DIR__ . '/../cors.php';
}
require_once __DIR__ . '/../db.php';

date_default_timezone_set('Asia/Dhaka');

// Determine request type
$isCli = (php_sapi_name() === 'cli');
$isJsonRequest = $isCli 
    || (isset($_REQUEST['format']) && $_REQUEST['format'] === 'json')
    || (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false)
    || (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest');

// 1. Parse Filter Parameters
$startDate = null;
$endDate = null;
$cardIdFilter = isset($_REQUEST['card_id']) ? (int)$_REQUEST['card_id'] : 0;
$action = 'preview'; // Default to preview
$removeOldLumps = false;
$allDates = !empty($_REQUEST['all_dates']) && ($_REQUEST['all_dates'] == '1' || $_REQUEST['all_dates'] === 'true' || $_REQUEST['all_dates'] === 'on');

if ($isCli) {
    $startDate = $argv[1] ?? date("Y-01-01");
    $endDate = $argv[2] ?? date("Y-m-d");
    $action = $argv[3] ?? 'preview';
    $removeOldLumps = !empty($argv[4]) && ($argv[4] === '1' || $argv[4] === 'true');
    if ($startDate === 'all') {
        $allDates = true;
    }
} else {
    if (isset($_REQUEST['start_date']) && trim($_REQUEST['start_date']) !== '') {
        $startDate = trim($_REQUEST['start_date']);
    } else {
        $startDate = date("Y-01-01"); // Start of current year
    }

    if (isset($_REQUEST['end_date']) && trim($_REQUEST['end_date']) !== '') {
        $endDate = trim($_REQUEST['end_date']);
    } else {
        $endDate = date("Y-m-d"); // Today
    }

    if (isset($_REQUEST['action'])) {
        $action = trim($_REQUEST['action']);
    } elseif (isset($_REQUEST['sync']) && $_REQUEST['sync'] == '1') {
        $action = 'sync';
    }

    $removeOldLumps = !empty($_REQUEST['remove_old_lumps']) && ($_REQUEST['remove_old_lumps'] == '1' || $_REQUEST['remove_old_lumps'] === 'true' || $_REQUEST['remove_old_lumps'] === 'on');
}

// Date Validation
$dateValid = $allDates || (preg_match('/^\d{4}-\d{2}-\d{2}$/', $startDate) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $endDate));
if (!$allDates && $dateValid && $startDate > $endDate) {
    $temp = $startDate;
    $startDate = $endDate;
    $endDate = $temp;
}

$executionResult = null;

if ($dateValid && (isset($_REQUEST['run']) || $isCli || (isset($_REQUEST['action']) && in_array($_REQUEST['action'], ['preview', 'sync'])))) {
    try {
        // A. Fetch existing old manual entries in cash for profit payout (excluding refId LIKE 'profit_payout_%')
        $oldLumpSql = "
            SELECT id, date, source, purpose, amount, category, remarks, approval_status
            FROM cash
            WHERE type = 'out'
              AND (
                  category IN ('profit_payout', 'profit', 'investor_profit')
                  OR purpose LIKE '%মুনাফা%'
                  OR purpose LIKE '%profit%'
                  OR purpose LIKE '%লাভাংশ%'
              )
              AND (refId IS NULL OR refId = '' OR refId NOT LIKE 'profit_payout_%')
        ";
        $lumpParams = [];
        $lumpTypes = "";

        if (!$allDates) {
            $oldLumpSql .= " AND date BETWEEN ? AND ?";
            $lumpParams[] = $startDate;
            $lumpParams[] = $endDate;
            $lumpTypes .= "ss";
        }
        $oldLumpSql .= " ORDER BY date ASC, id ASC";

        $lumpStmt = $mysqli->prepare($oldLumpSql);
        if (!empty($lumpParams)) {
            $lumpStmt->bind_param($lumpTypes, ...$lumpParams);
        }
        $lumpStmt->execute();
        $oldLumpEntries = $lumpStmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $lumpStmt->close();

        $oldLumpsTotalAmount = 0.0;
        foreach ($oldLumpEntries as $ol) {
            $oldLumpsTotalAmount += (float)$ol['amount'];
        }

        // B. Fetch Profit History Records (status = 'withdraw', action_name = 'approved')
        $phSql = "
            SELECT 
                ph.id,
                ph.investor_id,
                ph.card_id,
                ph.status,
                ph.amount,
                ph.start_date,
                ph.end_date,
                ph.profit_month,
                ph.profit_year,
                ph.action_name,
                ph.requested_at,
                ph.decision_at,
                ph.decision_by,
                ph.payment_method,
                ph.remarks,
                ph.created_at,
                ic.card_name,
                ic.reference_user_id,
                u.name AS investor_name,
                u.mobile AS investor_mobile,
                st.name AS approver_name
            FROM profit_history ph
            LEFT JOIN investment_cards ic ON ph.card_id = ic.id
            LEFT JOIN users u ON ph.investor_id = u.id
            LEFT JOIN users st ON ph.decision_by = st.id
            WHERE ph.status = 'withdraw'
              AND ph.action_name = 'approved'
              AND ph.amount > 0
        ";

        $phParams = [];
        $phTypes = "";

        if (!$allDates) {
            $phSql .= " AND DATE(COALESCE(ph.decision_at, ph.requested_at, ph.created_at)) BETWEEN ? AND ?";
            $phParams[] = $startDate;
            $phParams[] = $endDate;
            $phTypes .= "ss";
        }

        if ($cardIdFilter > 0) {
            $phSql .= " AND ph.card_id = ?";
            $phParams[] = $cardIdFilter;
            $phTypes .= "i";
        }

        $phSql .= " ORDER BY DATE(COALESCE(ph.decision_at, ph.requested_at, ph.created_at)) ASC, ph.id ASC";

        $phStmt = $mysqli->prepare($phSql);
        if (!empty($phParams)) {
            $phStmt->bind_param($phTypes, ...$phParams);
        }
        $phStmt->execute();
        $allProfitRecords = $phStmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $phStmt->close();

        // C. Fetch existing refIds in cash table ('profit_payout_%')
        $refCheckSql = "SELECT id, refId, amount, date FROM cash WHERE refId LIKE 'profit_payout_%'";
        $refParams = [];
        $refTypes = "";

        if (!$allDates) {
            $refCheckSql .= " AND date BETWEEN ? AND ?";
            $refParams[] = $startDate;
            $refParams[] = $endDate;
            $refTypes .= "ss";
        }

        $rcStmt = $mysqli->prepare($refCheckSql);
        if (!empty($refParams)) {
            $rcStmt->bind_param($refTypes, ...$refParams);
        }
        $rcStmt->execute();
        $existingRefsRaw = $rcStmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $rcStmt->close();

        $existingRefMap = [];
        $alreadySyncedTotalAmount = 0.0;
        foreach ($existingRefsRaw as $r) {
            $existingRefMap[$r['refId']] = $r;
            $alreadySyncedTotalAmount += (float)$r['amount'];
        }

        // D. Build Action Items & Truncated Amounts
        $totalRecordsFound = count($allProfitRecords);
        $totalOriginalAmount = 0.0;
        $totalTargetCashAmount = 0.0;
        $toInsertList = [];
        $alreadySyncedList = [];
        $detailedRecords = [];

        foreach ($allProfitRecords as $rec) {
            $recId = (int)$rec['id'];
            $refId = "profit_payout_" . $recId;
            $originalAmount = (float)$rec['amount'];
            
            // As requested by user: e.g. 144.09 becomes integer 144
            $cashAmount = (float)floor($originalAmount);

            $totalOriginalAmount += $originalAmount;
            $totalTargetCashAmount += $cashAmount;

            // Determine payout date
            $payoutDate = !empty($rec['decision_at']) ? substr($rec['decision_at'], 0, 10) : (!empty($rec['requested_at']) ? $rec['requested_at'] : substr($rec['created_at'], 0, 10));

            $isSynced = isset($existingRefMap[$refId]);

            $entry = $rec;
            $entry['original_amount'] = $originalAmount;
            $entry['cash_amount'] = $cashAmount;
            $entry['payout_date'] = $payoutDate;
            $entry['ref_id'] = $refId;
            $entry['is_synced'] = $isSynced;
            $entry['synced_cash'] = $isSynced ? $existingRefMap[$refId] : null;

            $detailedRecords[] = $entry;

            if ($isSynced) {
                $alreadySyncedList[] = $entry;
            } else {
                $toInsertList[] = $entry;
            }
        }

        $toBeInsertedCount = count($toInsertList);
        $toBeInsertedAmount = 0.0;
        foreach ($toInsertList as $item) {
            $toBeInsertedAmount += $item['cash_amount'];
        }

        // E. EXECUTE SYNC IF ACTION === 'sync'
        $deletedLumpsCount = 0;
        $deletedLumpsAmount = 0.0;
        $insertedCashCount = 0;
        $insertedCashAmount = 0.0;

        if ($action === 'sync') {
            $mysqli->begin_transaction();

            // 1. Remove old lump sums if requested
            if ($removeOldLumps && count($oldLumpEntries) > 0) {
                $lumpIds = array_column($oldLumpEntries, 'id');
                if (!empty($lumpIds)) {
                    $inPlaceholders = implode(',', array_fill(0, count($lumpIds), '?'));
                    $delTypes = str_repeat('i', count($lumpIds));
                    $delStmt = $mysqli->prepare("DELETE FROM cash WHERE id IN ($inPlaceholders)");
                    $delStmt->bind_param($delTypes, ...$lumpIds);
                    $delStmt->execute();
                    $deletedLumpsCount = $delStmt->affected_rows;
                    $deletedLumpsAmount = $oldLumpsTotalAmount;
                    $delStmt->close();
                }
            }

            // 2. Insert Missing Cash Out Entries
            if (!empty($toInsertList)) {
                $insCashQ = $mysqli->prepare("
                    INSERT INTO cash (
                        type, source, purpose, amount, category,
                        refId, remarks, date, createdAt,
                        approval_status, approved_by, approved_at
                    ) VALUES (
                        'out', ?, ?, ?, 'profit_payout',
                        ?, ?, ?, ?,
                        'approved', ?, ?
                    )
                ");

                foreach ($toInsertList as $pItem) {
                    $cId = (int)$pItem['card_id'];
                    $phId = (int)$pItem['id'];
                    $cAmt = (float)$pItem['cash_amount'];
                    $cDate = $pItem['payout_date'];
                    $cTimestamp = !empty($pItem['decision_at']) ? $pItem['decision_at'] : ($cDate . " 12:00:00");
                    
                    $invName = !empty($pItem['investor_name']) ? $pItem['investor_name'] : "বিনিয়োগকারী";
                    $cardName = !empty($pItem['card_name']) ? $pItem['card_name'] : "কার্ড #" . $cId;
                    $refId = "profit_payout_" . $phId;
                    $staffId = (int)(!empty($pItem['decision_by']) ? $pItem['decision_by'] : (!empty($pItem['reference_user_id']) ? $pItem['reference_user_id'] : 1));

                    $source = "বিনিয়োগকারী: {$invName} (কার্ড #{$cId} - {$cardName})";
                    $purpose = "বিনিয়োগ মুনাফা পরিশোধ (Profit Payout)";
                    
                    $origStr = number_format($pItem['original_amount'], 2);
                    $remarks = "কার্ড #{$cId} এর অনুমোদিত মুনাফা পরিশোধ [মূল মুনাফা: ৳{$origStr}]";
                    if (!empty($pItem['remarks'])) {
                        $remarks .= " - " . $pItem['remarks'];
                    }

                    $insCashQ->bind_param(
                        "ssdssssis",
                        $source,
                        $purpose,
                        $cAmt,
                        $refId,
                        $remarks,
                        $cDate,
                        $cTimestamp,
                        $staffId,
                        $cTimestamp
                    );

                    $insCashQ->execute();
                    $insertedCashCount++;
                    $insertedCashAmount += $cAmt;
                }
                $insCashQ->close();
            }

            $mysqli->commit();
        }

        $executionResult = [
            "success" => true,
            "action" => $action,
            "all_dates" => $allDates,
            "start_date" => $allDates ? 'ALL' : $startDate,
            "end_date" => $allDates ? 'ALL' : $endDate,
            "card_id_filter" => $cardIdFilter,
            "summary" => [
                "total_records_found" => $totalRecordsFound,
                "total_original_profit" => round($totalOriginalAmount, 2),
                "total_target_cash_out" => round($totalTargetCashAmount, 2),
                "already_synced_count" => count($alreadySyncedList),
                "already_synced_amount" => round($alreadySyncedTotalAmount, 2),
                "to_be_inserted_count" => $toBeInsertedCount,
                "to_be_inserted_amount" => round($toBeInsertedAmount, 2),
                "old_lump_entries_found" => count($oldLumpEntries),
                "old_lumps_total_amount" => round($oldLumpsTotalAmount, 2),
                "inserted_count" => $insertedCashCount,
                "inserted_amount" => round($insertedCashAmount, 2),
                "deleted_old_lumps_count" => $deletedLumpsCount,
                "deleted_old_lumps_amount" => round($deletedLumpsAmount, 2),
            ],
            "old_lumps" => $oldLumpEntries,
            "records" => $detailedRecords
        ];

    } catch (Exception $e) {
        if ($action === 'sync') {
            @$mysqli->rollback();
        }
        $executionResult = [
            "success" => false,
            "message" => "ত্রুটি ঘটেছে: " . $e->getMessage()
        ];
    }
}

// IF JSON REQUEST, RETURN JSON OUTPUT
if ($isJsonRequest) {
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode($executionResult ?? [
        "success" => false,
        "message" => "Please submit valid parameters"
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// RENDER VISUAL HTML DASHBOARD
header("Content-Type: text/html; charset=UTF-8");
?>
<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>বিনিয়োগ মুনাফা পেআউট ও ক্যাশ আউট সিঙ্ক প্যানেল</title>
    <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #10b981;
            --primary-dark: #059669;
            --bg: #0b0f19;
            --card-bg: #111827;
            --card-border: #1f2937;
            --text-main: #f3f4f6;
            --text-muted: #9ca3af;
            --success: #10b981;
            --danger: #ef4444;
            --warning: #f59e0b;
            --info: #06b6d4;
            --purple: #8b5cf6;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Hind Siliguri', -apple-system, sans-serif;
            background: var(--bg);
            color: var(--text-main);
            padding: 30px 20px;
            display: flex;
            justify-content: center;
        }
        .container {
            width: 100%;
            max-width: 1100px;
        }
        .header-card {
            background: var(--card-bg);
            border-radius: 20px;
            padding: 26px 30px;
            border: 1px solid var(--card-border);
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            margin-bottom: 24px;
            position: relative;
            overflow: hidden;
        }
        .header-card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; height: 3px;
            background: linear-gradient(90deg, #10b981, #06b6d4, #8b5cf6);
        }
        .title {
            font-size: 24px;
            font-weight: 700;
            color: #ffffff;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .subtitle {
            font-size: 13.5px;
            color: var(--text-muted);
            margin-top: 6px;
            line-height: 1.6;
        }
        .filter-form {
            background: var(--card-bg);
            border-radius: 16px;
            padding: 20px 24px;
            border: 1px solid var(--card-border);
            margin-bottom: 24px;
        }
        .filter-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            align-items: flex-end;
        }
        .input-group label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: var(--text-muted);
            margin-bottom: 6px;
        }
        .input-group input[type="date"],
        .input-group input[type="number"],
        .input-group select {
            width: 100%;
            background: #1f2937;
            border: 1px solid #374151;
            border-radius: 10px;
            padding: 9px 12px;
            color: #fff;
            font-size: 14px;
            outline: none;
            transition: all 0.2s;
        }
        .input-group input:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
        }
        .checkbox-label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            color: #f3f4f6;
            cursor: pointer;
            margin-top: 10px;
        }
        .btn {
            border: none;
            border-radius: 10px;
            padding: 10px 20px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        .btn-preview {
            background: #374151;
            color: #fff;
        }
        .btn-preview:hover { background: #4b5563; }
        .btn-sync {
            background: var(--primary);
            color: #0b0f19;
            font-weight: 700;
        }
        .btn-sync:hover { background: var(--primary-dark); }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 14px;
            margin-bottom: 24px;
        }
        .stat-card {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: 14px;
            padding: 16px 18px;
        }
        .stat-title {
            font-size: 12px;
            color: var(--text-muted);
            text-transform: uppercase;
            font-weight: 600;
            letter-spacing: 0.5px;
        }
        .stat-val {
            font-size: 22px;
            font-weight: 700;
            color: #ffffff;
            margin-top: 4px;
        }
        .table-card {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: 16px;
            overflow: hidden;
            margin-bottom: 24px;
        }
        .table-header {
            padding: 16px 20px;
            border-bottom: 1px solid var(--card-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .table-title {
            font-size: 16px;
            font-weight: 600;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13.5px;
            text-align: left;
        }
        th {
            background: #182234;
            padding: 12px 16px;
            font-weight: 600;
            color: var(--text-muted);
            border-bottom: 1px solid var(--card-border);
        }
        td {
            padding: 12px 16px;
            border-bottom: 1px solid #1a2333;
        }
        tr:hover td {
            background: rgba(255,255,255,0.02);
        }
        tr.checked-row td {
            background: rgba(16, 185, 129, 0.08) !important;
            border-bottom-color: rgba(16, 185, 129, 0.25) !important;
        }
        .demo-checkbox {
            width: 18px;
            height: 18px;
            cursor: pointer;
            accent-color: var(--primary);
            vertical-align: middle;
        }
        .badge {
            display: inline-block;
            padding: 3px 9px;
            border-radius: 20px;
            font-size: 11.5px;
            font-weight: 600;
        }
        .badge-success { background: rgba(16, 185, 129, 0.15); color: #34d399; }
        .badge-warning { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
        .badge-danger { background: rgba(239, 68, 68, 0.15); color: #f87171; }
        .badge-info { background: rgba(6, 182, 212, 0.15); color: #38bdf8; }
        .alert-box {
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.3);
            border-radius: 12px;
            padding: 16px 20px;
            color: #34d399;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .alert-box.danger {
            background: rgba(239, 68, 68, 0.1);
            border-color: rgba(239, 68, 68, 0.3);
            color: #f87171;
        }
        .pill-amount {
            font-family: monospace;
            font-size: 14px;
            font-weight: 700;
        }
    </style>
</head>
<body>

<div class="container">
    <!-- Header -->
    <div class="header-card">
        <h1 class="title">
            <span>💸</span>
            <span>বিনিয়োগ মুনাফা পেআউট ও ক্যাশ আউট সিঙ্ক (Profit Payout Sync)</span>
        </h1>
        <p class="subtitle">
            <code>profit_history</code> টেবিল থেকে অনুমোদিত মুনাফা উত্তোলনের এন্ট্রি সংগ্রহ করে <code>cash</code> লেজারে <strong>type='out'</strong> (ক্যাশ আউট) ও <strong>category='profit_payout'</strong> হিসেবে যুক্ত করে।<br>
            নিয়ম অনুযায়ী ফ্র্যাকশন বাদ দিয়ে শুধু পূর্ণ সংখ্যায় (যেমন ৳144.09 ➔ <strong>৳144</strong>) হিসাব করা হয় এবং পুরনো ম্যানুয়াল এন্ট্রি মুছে ডুপ্লিকেট রোধ করা যায়।
        </p>
    </div>

    <!-- Execution Alert -->
    <?php if ($executionResult && isset($executionResult['success'])): ?>
        <?php if ($executionResult['success']): ?>
            <?php if ($action === 'sync'): ?>
                <div class="alert-box">
                    <span>🎉</span>
                    <div>
                        <strong>সফলভাবে সিঙ্ক সম্পন্ন হয়েছে!</strong><br>
                        মোট <strong><?= $executionResult['summary']['inserted_count'] ?></strong> টি মুনাফা পেআউট ক্যাশ খাতায় (৳<?= number_format($executionResult['summary']['inserted_amount'], 2) ?>) যুক্ত হয়েছে।
                        <?php if ($executionResult['summary']['deleted_old_lumps_count'] > 0): ?>
                            <br>পূর্বে থাকা <?= $executionResult['summary']['deleted_old_lumps_count'] ?> টি পুরনো এন্ট্রি (৳<?= number_format($executionResult['summary']['deleted_old_lumps_amount'], 2) ?>) নিরাপদভাবে মুছে ফেলা হয়েছে।
                        <?php endif; ?>
                    </div>
                </div>
            <?php endif; ?>
        <?php else: ?>
            <div class="alert-box danger">
                <span>⚠️</span>
                <div><?= htmlspecialchars($executionResult['message'] ?? 'কোনো ত্রুটি ঘটেছে') ?></div>
            </div>
        <?php endif; ?>
    <?php endif; ?>

    <!-- Filter Form -->
    <form class="filter-form" method="GET" action="">
        <input type="hidden" name="run" value="1">
        <div class="filter-grid">
            <div class="input-group">
                <label>শুরুর তারিখ (Start Date)</label>
                <input type="date" name="start_date" value="<?= htmlspecialchars($startDate) ?>">
            </div>
            <div class="input-group">
                <label>শেষের তারিখ (End Date)</label>
                <input type="date" name="end_date" value="<?= htmlspecialchars($endDate) ?>">
            </div>
            <div class="input-group">
                <label>নির্দিষ্ট কার্ড আইডি (ঐচ্ছিক)</label>
                <input type="number" name="card_id" placeholder="সব কার্ড" value="<?= $cardIdFilter > 0 ? $cardIdFilter : '' ?>">
            </div>
            <div style="display: flex; gap: 8px;">
                <button type="submit" name="action" value="preview" class="btn btn-preview" style="flex: 1;">
                    <span>🔍</span> প্রিভিউ দেখুন
                </button>
                <button type="submit" name="action" value="sync" class="btn btn-sync" style="flex: 1;" onclick="return confirm('আপনি কি নিশ্চিত যে নতুন মুনাফা পেআউট এন্ট্রিগুলো ক্যাশ খাতায় পোস্ট করতে চান?')">
                    <span>⚡</span> সিঙ্ক করুন
                </button>
            </div>
        </div>

        <div style="display: flex; gap: 24px; margin-top: 14px; flex-wrap: wrap;">
            <label class="checkbox-label">
                <input type="checkbox" name="all_dates" value="1" <?= $allDates ? 'checked' : '' ?>>
                <span>তারিখ নির্বিশেষে সব অনুমোদিত রেকর্ড দেখান (All Time)</span>
            </label>
            <label class="checkbox-label" style="color: #fca5a5;">
                <input type="checkbox" name="remove_old_lumps" value="1" <?= $removeOldLumps ? 'checked' : '' ?>>
                <span>⚠️ সিঙ্ক করার সময় পূর্বের ম্যানুয়াল/লাম্প-সাম প্রফিট ক্যাশ আউট মুছে দিন (Remove Old Lump-sums)</span>
            </label>
        </div>
    </form>

    <?php if ($executionResult && $executionResult['success']): ?>
        <!-- Summary Stats -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-title">মোট মুনাফা রেকর্ড</div>
                <div class="stat-val"><?= $executionResult['summary']['total_records_found'] ?></div>
            </div>
            <div class="stat-card">
                <div class="stat-title">মোট আসল মুনাফা</div>
                <div class="stat-val" style="color: #60a5fa;">৳<?= number_format($executionResult['summary']['total_original_profit'], 2) ?></div>
            </div>
            <div class="stat-card">
                <div class="stat-title">ক্যাশ আউট লক্ষ্যমাত্রা (পূর্ণসংখ্যা)</div>
                <div class="stat-val" style="color: var(--primary);">৳<?= number_format($executionResult['summary']['total_target_cash_out']) ?></div>
            </div>
            <div class="stat-card">
                <div class="stat-title">ইতোমধ্যে ক্যাশে আছে</div>
                <div class="stat-val" style="color: #34d399;"><?= $executionResult['summary']['already_synced_count'] ?> টি</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">নতুন ক্যাশ আউট হবে</div>
                <div class="stat-val" style="color: #f59e0b;"><?= $executionResult['summary']['to_be_inserted_count'] ?> টি</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">পুরনো ম্যানুয়াল এন্ট্রি পাওয়া গেছে</div>
                <div class="stat-val" style="color: #f87171;"><?= $executionResult['summary']['old_lump_entries_found'] ?> টি</div>
            </div>
        </div>

        <!-- Old Lump Sums Found -->
        <?php if (!empty($executionResult['old_lumps'])): ?>
            <div class="table-card" style="border-color: rgba(239, 68, 68, 0.4);">
                <div class="table-header" style="background: rgba(239, 68, 68, 0.1);">
                    <div class="table-title" style="color: #fca5a5;">
                        ⚠️ পূর্বে থাকা ম্যানুয়াল বা লাম্প-সাম প্রফিট ক্যাশ আউট তালিকা (মোট: <?= count($executionResult['old_lumps']) ?> টি | ৳<?= number_format($executionResult['summary']['old_lumps_total_amount'], 2) ?>)
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Cash ID</th>
                            <th>তারিখ</th>
                            <th>উৎস (Source)</th>
                            <th>উদ্দেশ্য (Purpose)</th>
                            <th>ক্যাটাগরি</th>
                            <th>টাকা (Amount)</th>
                            <th>স্ট্যাটাস</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($executionResult['old_lumps'] as $ol): ?>
                            <tr>
                                <td>#<?= $ol['id'] ?></td>
                                <td><?= htmlspecialchars($ol['date']) ?></td>
                                <td><?= htmlspecialchars($ol['source'] ?: 'N/A') ?></td>
                                <td><?= htmlspecialchars($ol['purpose']) ?></td>
                                <td><span class="badge badge-info"><?= htmlspecialchars($ol['category']) ?></span></td>
                                <td class="pill-amount" style="color: #f87171;">৳<?= number_format($ol['amount'], 2) ?></td>
                                <td><span class="badge badge-success"><?= htmlspecialchars($ol['approval_status']) ?></span></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>

        <!-- Detailed Profit Payout Records -->
        <div class="table-card">
            <div class="table-header">
                <div class="table-title">
                    📋 মুনাফা রেকর্ড বিস্তারিত তালিকা (Floor Integer Cash Mapping)
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span id="verify-count" style="font-size: 13px; color: #34d399; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); padding: 5px 12px; border-radius: 20px; font-weight: 600;">
                        📝 খাতা যাচাই: ০ টি
                    </span>
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 44px; text-align: center;">
                            <input type="checkbox" id="check-all-rows" class="demo-checkbox" title="সবগুলো একসাথে চেক করুন" onchange="toggleAllRows(this)">
                        </th>
                        <th>ID</th>
                        <th>কার্ড # ও নাম</th>
                        <th>বিনিয়োগকারী</th>
                        <th>আসল মুনাফা (Original)</th>
                        <th>ক্যাশ আউট এন্ট্রি (Floor)</th>
                        <th>পেআউট তারিখ</th>
                        <th>ক্যাশ স্ট্যাটাস</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($executionResult['records'])): ?>
                        <tr>
                            <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 30px;">
                                এই ফিল্টারে কোনো অনুমোদিত মুনাফা উত্তোলনের রেকর্ড পাওয়া যায়নি।
                            </td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($executionResult['records'] as $r): ?>
                            <tr id="row-<?= $r['id'] ?>">
                                <td style="text-align: center;">
                                    <input type="checkbox" class="demo-checkbox demo-checker" title="খাতার সাথে মেলাতে টিক দিন" onchange="toggleRowCheck(this)">
                                </td>
                                <td>#<?= $r['id'] ?></td>
                                <td>
                                    <strong>কার্ড #<?= $r['card_id'] ?></strong><br>
                                    <small style="color: var(--text-muted);"><?= htmlspecialchars($r['card_name'] ?: 'N/A') ?></small>
                                </td>
                                <td>
                                    <strong><?= htmlspecialchars($r['investor_name'] ?: 'N/A') ?></strong><br>
                                    <small style="color: var(--text-muted);"><?= htmlspecialchars($r['investor_mobile'] ?: '') ?></small>
                                </td>
                                <td class="pill-amount" style="color: #94a3b8;">
                                    ৳<?= number_format($r['original_amount'], 2) ?>
                                </td>
                                <td class="pill-amount" style="color: var(--primary); font-size: 15px;">
                                    ৳<?= number_format($r['cash_amount']) ?>
                                    <?php if ($r['original_amount'] != $r['cash_amount']): ?>
                                        <small style="color: #64748b; font-weight: normal;">(ছাড়: ৳<?= number_format($r['original_amount'] - $r['cash_amount'], 2) ?>)</small>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <?= htmlspecialchars($r['payout_date']) ?>
                                </td>
                                <td>
                                    <?php if ($r['is_synced']): ?>
                                        <span class="badge badge-success">✓ ইতোমধ্যে ক্যাশে আছে (#<?= $r['synced_cash']['id'] ?>)</span>
                                    <?php else: ?>
                                        <span class="badge badge-warning">⚡ নতুন যুক্ত হবে</span>
                                    <?php endif; ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    <?php endif; ?>
</div>

<script>
function toggleRowCheck(checkbox) {
    const row = checkbox.closest('tr');
    if (checkbox.checked) {
        row.classList.add('checked-row');
    } else {
        row.classList.remove('checked-row');
    }
    updateVerifyCounter();
}

function toggleAllRows(masterCheckbox) {
    const checkboxes = document.querySelectorAll('.demo-checker');
    checkboxes.forEach(cb => {
        cb.checked = masterCheckbox.checked;
        const row = cb.closest('tr');
        if (cb.checked) {
            row.classList.add('checked-row');
        } else {
            row.classList.remove('checked-row');
        }
    });
    updateVerifyCounter();
}

function updateVerifyCounter() {
    const total = document.querySelectorAll('.demo-checker').length;
    const checked = document.querySelectorAll('.demo-checker:checked').length;
    const counter = document.getElementById('verify-count');
    if (counter) {
        counter.innerHTML = `📝 খাতা যাচাই: <strong>${checked}</strong> / ${total} টি`;
    }
}
document.addEventListener('DOMContentLoaded', updateVerifyCounter);
</script>

</body>
</html>
