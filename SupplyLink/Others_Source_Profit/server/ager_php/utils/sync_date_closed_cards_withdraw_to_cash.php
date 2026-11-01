<?php
/**
 * Sync Closed Investment Cards to Withdraw Requests & Cash Ledger Outflow
 * 
 * Usage via browser:
 *   Open http://localhost/.../apis/utils/sync_date_closed_cards_withdraw_to_cash.php
 * 
 * Usage via API (JSON):
 *   GET / POST ?start_date=2026-01-01&end_date=2026-10-24&action=sync&format=json
 * 
 * Usage via CLI:
 *   php sync_date_closed_cards_withdraw_to_cash.php 2026-01-01 2026-10-24 [preview|sync]
 */

ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

date_default_timezone_set('Asia/Dhaka');

// Determine request type
$isCli = (php_sapi_name() === 'cli');
$isJsonRequest = $isCli 
    || (isset($_REQUEST['format']) && $_REQUEST['format'] === 'json')
    || (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false)
    || (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest');

// 1. Parse Parameters
$startDate = null;
$endDate = null;
$startCardId = isset($_REQUEST['start_card_id']) ? (int)$_REQUEST['start_card_id'] : 0;
$endCardId = isset($_REQUEST['end_card_id']) ? (int)$_REQUEST['end_card_id'] : 0;
$action = 'preview'; // 'preview' or 'sync'
$removeOldLumps = !empty($_REQUEST['remove_old_lumps']) && ($_REQUEST['remove_old_lumps'] == '1' || $_REQUEST['remove_old_lumps'] === 'true' || $_REQUEST['remove_old_lumps'] === 'on');

if ($isCli) {
    $startDate = $argv[1] ?? date("Y-01-01");
    $endDate = $argv[2] ?? date("Y-m-d");
    $action = $argv[3] ?? 'preview';
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
}

// Validate Dates
$dateValid = preg_match('/^\d{4}-\d{2}-\d{2}$/', $startDate) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $endDate);
if ($dateValid && $startDate > $endDate) {
    $temp = $startDate;
    $startDate = $endDate;
    $endDate = $temp;
}

$executionResult = null;

if ($dateValid && (isset($_REQUEST['run']) || $isCli || (isset($_REQUEST['action']) && in_array($_REQUEST['action'], ['preview', 'sync'])))) {
    try {
        // A. Fetch Closed Investment Cards strictly within date range or card range
        $sql = "
            SELECT 
                ic.id AS card_id,
                ic.card_name,
                ic.investor_id,
                ic.investment_amount,
                ic.payment_type,
                ic.start_date,
                ic.maturity_date,
                ic.end_date AS closed_date,
                ic.status,
                ic.created_at AS card_created_at,
                ic.reference_user_id,
                u.name AS investor_name,
                u.mobile AS investor_mobile,
                st.name AS ref_staff_name
            FROM investment_cards ic
            LEFT JOIN users u ON u.id = ic.investor_id
            LEFT JOIN users st ON st.id = ic.reference_user_id
            WHERE ic.status = 'closed'
              AND ic.end_date IS NOT NULL
              AND ic.investment_amount > 0
              AND DATE(ic.end_date) BETWEEN ? AND ?
        ";

        $params = [$startDate, $endDate];
        $types = "ss";

        if ($startCardId > 0 && $endCardId > 0 && $endCardId >= $startCardId) {
            $sql .= " AND ic.id BETWEEN ? AND ?";
            $params[] = $startCardId;
            $params[] = $endCardId;
            $types .= "ii";
        } elseif ($startCardId > 0) {
            $sql .= " AND ic.id >= ?";
            $params[] = $startCardId;
            $types .= "i";
        }

        $sql .= " ORDER BY ic.end_date ASC, ic.id ASC";

        $stmt = $mysqli->prepare($sql);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $closedCards = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        // B. Check Existing Withdraw Requests for these cards
        $cardIds = array_column($closedCards, 'card_id');
        $existingWithdrawMap = [];
        $existingCashMap = [];

        if (!empty($cardIds)) {
            // 1. Existing withdraw requests
            $cardPlaceholders = implode(',', array_fill(0, count($cardIds), '?'));
            $cTypes = str_repeat('i', count($cardIds));
            
            $wQ = $mysqli->prepare("
                SELECT id, card_id, withdraw_date, amount, status
                FROM investment_withdraw_requests
                WHERE card_id IN ($cardPlaceholders)
            ");
            $wQ->bind_param($cTypes, ...$cardIds);
            $wQ->execute();
            $wRows = $wQ->get_result()->fetch_all(MYSQLI_ASSOC);
            $wQ->close();

            foreach ($wRows as $wr) {
                $existingWithdrawMap[(int)$wr['card_id']] = $wr;
            }

            // 2. Existing cash out entries (by refId)
            $expectedRefIds = array_map(function($cid) {
                return "inv_wth_card_" . $cid;
            }, $cardIds);

            $refPlaceholders = implode(',', array_fill(0, count($expectedRefIds), '?'));
            $refTypes = str_repeat('s', count($expectedRefIds));

            $cq = $mysqli->prepare("
                SELECT id, refId, amount, date
                FROM cash
                WHERE refId IN ($refPlaceholders)
            ");
            $cq->bind_param($refTypes, ...$expectedRefIds);
            $cq->execute();
            $cRows = $cq->get_result()->fetch_all(MYSQLI_ASSOC);
            $cq->close();

            foreach ($cRows as $cr) {
                $existingCashMap[$cr['refId']] = $cr;
            }
        }

        // C. Check Old Lump Sums in Cash Out (category = invest_withdraw without specific refId)
        $oldLumpSql = "
            SELECT id, date, source, purpose, amount, category, remarks
            FROM cash
            WHERE type = 'out'
              AND category IN ('invest_withdraw', 'investment_withdraw', 'invest')
              AND (refId IS NULL OR refId = '' OR refId NOT LIKE 'inv_wth_card_%')
              AND date BETWEEN ? AND ?
            ORDER BY date ASC, id ASC
        ";
        $lumpStmt = $mysqli->prepare($oldLumpSql);
        $lumpStmt->bind_param("ss", $startDate, $endDate);
        $lumpStmt->execute();
        $oldLumpEntries = $lumpStmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $lumpStmt->close();

        $oldLumpsTotalAmount = 0.0;
        foreach ($oldLumpEntries as $ol) {
            $oldLumpsTotalAmount += (float)$ol['amount'];
        }

        // D. Build Breakdown & Action Lists
        $totalClosedCards = count($closedCards);
        $totalPrincipalAmount = 0.0;
        $withdrawToCreateList = [];
        $cashToInsertList = [];
        $detailedCards = [];

        foreach ($closedCards as $card) {
            $cid = (int)$card['card_id'];
            $amt = (float)$card['investment_amount'];
            $totalPrincipalAmount += $amt;

            $hasWithdraw = isset($existingWithdrawMap[$cid]);
            $refId = "inv_wth_card_" . $cid;
            $hasCashOut = isset($existingCashMap[$refId]);

            $cardDetail = $card;
            $cardDetail['has_withdraw'] = $hasWithdraw;
            $cardDetail['withdraw_record'] = $hasWithdraw ? $existingWithdrawMap[$cid] : null;
            $cardDetail['has_cash_out'] = $hasCashOut;
            $cardDetail['cash_record'] = $hasCashOut ? $existingCashMap[$refId] : null;

            $detailedCards[] = $cardDetail;

            if (!$hasWithdraw) {
                $withdrawToCreateList[] = $card;
            }
            if (!$hasCashOut) {
                $cashToInsertList[] = $card;
            }
        }

        $createdWithdrawCount = 0;
        $insertedCashCount = 0;
        $deletedLumpsCount = 0;
        $deletedLumpsAmount = 0.0;

        // E. EXECUTE SYNC IF ACTION === 'sync'
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

            // 2. Insert Missing Withdraw Requests
            if (!empty($withdrawToCreateList)) {
                $insWQ = $mysqli->prepare("
                    INSERT INTO investment_withdraw_requests (
                        investor_id, card_id, withdraw_date, maturity_date,
                        requested_at, total_profit, payable_amount, amount,
                        mobile, reason, status, requested_by, reviewed_by,
                        reviewed_at, payment_method, created_at, updated_at
                    ) VALUES (
                        ?, ?, ?, ?,
                        ?, 0.00, ?, ?,
                        ?, ?, 'paid', ?, ?,
                        ?, 'Cash', ?, ?
                    )
                ");

                foreach ($withdrawToCreateList as $wCard) {
                    $invId = (int)$wCard['investor_id'];
                    $cId = (int)$wCard['card_id'];
                    $wDate = $wCard['closed_date'];
                    $matDate = !empty($wCard['maturity_date']) ? $wCard['maturity_date'] : null;
                    $wAmt = (float)$wCard['investment_amount'];
                    $wMobile = $wCard['investor_mobile'] ?: '';
                    $wReason = "বিনিয়োগ কার্ড মেয়াদান্তে চূড়ান্ত ক্লোজ ও মূলধন পরিশোধ (কার্ড #{$cId})";
                    $staffId = (int)($wCard['reference_user_id'] ?: 1);
                    $timestamp = $wDate . " 12:00:00";

                    $insWQ->bind_param(
                        "iisssddssiisss",
                        $invId,
                        $cId,
                        $wDate,
                        $matDate,
                        $timestamp,
                        $wAmt,
                        $wAmt,
                        $wMobile,
                        $wReason,
                        $staffId,
                        $staffId,
                        $timestamp,
                        $timestamp,
                        $timestamp
                    );
                    $insWQ->execute();
                    $createdWithdrawCount++;
                }
                $insWQ->close();
            }

            // 3. Insert Missing Cash Out Entries
            if (!empty($cashToInsertList)) {
                $insCashQ = $mysqli->prepare("
                    INSERT INTO cash (
                        type, source, purpose, amount, category,
                        refId, remarks, date, createdAt,
                        approval_status, approved_by, approved_at
                    ) VALUES (
                        'out', ?, ?, ?, 'invest_withdraw',
                        ?, ?, ?, ?,
                        'approved', ?, ?
                    )
                ");

                foreach ($cashToInsertList as $cCard) {
                    $cId = (int)$cCard['card_id'];
                    $cAmt = (float)$cCard['investment_amount'];
                    $cDate = $cCard['closed_date'];
                    $cTimestamp = $cDate . " 12:00:00";
                    $invName = $cCard['investor_name'] ?: ($cCard['card_name'] ?: "গ্রাহক");
                    $cardName = $cCard['card_name'] ?: (string)$cId;
                    $refId = "inv_wth_card_" . $cId;
                    $staffId = (int)($cCard['reference_user_id'] ?: 1);

                    $source = "গ্রাহক: {$invName} - কার্ড #{$cId} ({$cardName})";
                    $purpose = "বিনিয়োগ মূলধন ফেরত ও কার্ড সমাপ্ত";
                    $remarks = "কার্ড ক্লোজড ডেট অনুযায়ী মূলধন উত্তোলন পরিশোধ";

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
                }
                $insCashQ->close();
            }

            $mysqli->commit();
        }

        $executionResult = [
            'success' => true,
            'action' => $action,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'total_closed_cards' => $totalClosedCards,
            'total_principal_amount' => $totalPrincipalAmount,
            'missing_withdraw_count' => count($withdrawToCreateList),
            'missing_cash_count' => count($cashToInsertList),
            'created_withdraw_count' => $createdWithdrawCount,
            'inserted_cash_count' => $insertedCashCount,
            'old_lumps_count' => count($oldLumpEntries),
            'old_lumps_total' => $oldLumpsTotalAmount,
            'deleted_lumps_count' => $deletedLumpsCount,
            'detailed_cards' => $detailedCards,
            'old_lumps' => $oldLumpEntries
        ];

    } catch (Throwable $e) {
        if (isset($mysqli)) {
            @$mysqli->rollback();
        }
        $executionResult = [
            'success' => false,
            'error' => $e->getMessage()
        ];
    }
}

// IF JSON REQUEST, RETURN JSON AND EXIT
if ($isJsonRequest) {
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode($executionResult ?? [
        'success' => false,
        'message' => 'Please provide valid start_date and end_date'
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// OTHERWISE RENDER CLEAN MODERN HTML INTERFACE
header("Content-Type: text/html; charset=UTF-8");
?>
<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>বিনিয়োগ ক্লোজড কার্ড উইথড্র ও ক্যাশ আউট সিঙ্ক প্যানেল</title>
    <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #d97706;
            --primary-dark: #b45309;
            --bg: #0b0f19;
            --card-bg: #111827;
            --card-border: #1f2937;
            --text-main: #f3f4f6;
            --text-muted: #9ca3af;
            --success: #10b981;
            --danger: #ef4444;
            --warning: #f59e0b;
            --info: #06b6d4;
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
            max-width: 1000px;
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
            background: linear-gradient(90deg, #f59e0b, #ef4444, #06b6d4);
        }
        .title {
            font-size: 24px;
            font-weight: 700;
            color: #ffffff;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .subtitle {
            font-size: 13px;
            color: var(--text-muted);
            margin-top: 6px;
            line-height: 1.5;
        }
        .filter-form {
            display: flex;
            flex-wrap: wrap;
            gap: 14px;
            align-items: flex-end;
            margin-top: 22px;
            padding-top: 20px;
            border-top: 1px solid var(--card-border);
        }
        .form-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .form-group label {
            font-size: 12px;
            font-weight: 600;
            color: #d1d5db;
        }
        .form-control {
            background: #090d16;
            border: 1px solid #374151;
            padding: 9px 14px;
            border-radius: 10px;
            font-family: monospace;
            font-size: 13px;
            color: #fff;
            outline: none;
            transition: border-color 0.2s;
        }
        .form-control:focus {
            border-color: var(--primary);
        }
        .btn {
            padding: 9px 20px;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            border: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
            font-family: inherit;
        }
        .btn-preview {
            background: #1f2937;
            color: #e5e7eb;
            border: 1px solid #374151;
        }
        .btn-preview:hover {
            background: #374151;
            color: #fff;
        }
        .btn-sync {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: #ffffff;
            box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35);
        }
        .btn-sync:hover {
            filter: brightness(1.1);
            transform: translateY(-1px);
        }
        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 8px;
            padding-bottom: 8px;
            cursor: pointer;
            user-select: none;
        }
        .checkbox-group input {
            cursor: pointer;
            accent-color: var(--primary);
            width: 16px;
            height: 16px;
        }
        .checkbox-group span {
            font-size: 12px;
            color: #d1d5db;
        }
        .stats-grid {
            display: grid;
            grid-cols: 1;
            gap: 14px;
            margin-bottom: 24px;
        }
        @media(min-width: 640px) {
            .stats-grid { grid-template-columns: repeat(4, 1fr); }
        }
        .stat-card {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: 14px;
            padding: 18px 20px;
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .stat-label {
            font-size: 12px;
            color: var(--text-muted);
            font-weight: 500;
        }
        .stat-value {
            font-size: 20px;
            font-weight: 700;
            color: #fff;
            font-family: monospace;
        }
        .stat-value.primary { color: var(--warning); }
        .stat-value.success { color: var(--success); }
        .stat-value.info { color: var(--info); }
        .stat-value.danger { color: var(--danger); }

        .table-card {
            background: var(--card-bg);
            border-radius: 16px;
            border: 1px solid var(--card-border);
            overflow: hidden;
            margin-bottom: 24px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.4);
        }
        .table-header {
            padding: 18px 22px;
            border-bottom: 1px solid var(--card-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .table-title {
            font-size: 16px;
            font-weight: 700;
            color: #fff;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            text-align: left;
        }
        th {
            background: #090d16;
            color: #9ca3af;
            padding: 12px 16px;
            font-weight: 600;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid var(--card-border);
        }
        td {
            padding: 12px 16px;
            border-bottom: 1px solid #1f2937;
            color: #e5e7eb;
        }
        tr:hover td {
            background: rgba(255, 255, 255, 0.02);
        }
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 3px 9px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 600;
        }
        .badge-success { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
        .badge-warning { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
        .badge-danger { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
        .badge-info { background: rgba(6, 182, 212, 0.15); color: #22d3ee; border: 1px solid rgba(6, 182, 212, 0.3); }

        .banner-success {
            background: rgba(16, 185, 129, 0.12);
            border: 1px solid rgba(16, 185, 129, 0.3);
            border-radius: 12px;
            padding: 16px 20px;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            gap: 12px;
            color: #34d399;
            font-weight: 600;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        
        <!-- Header & Filter -->
        <div class="header-card">
            <h1 class="title">
                <span>⚡</span>
                <span>বিনিয়োগ ক্লোজড কার্ড উইথড্র ও ক্যাশ আউট সিঙ্ক</span>
            </h1>
            <p class="subtitle">
                `investment_cards` টেবিলে যে সকল কার্ড ক্লোজড (`status = 'closed'`) হয়েছে এবং মেয়াদান্তে (`end_date`) মূলধন পরিশোধ করা হয়েছে, সেগুলোর উইথড্র রিকোয়েস্ট ও ক্যাশ আউট ভাউচার নিশ্চিত করুন।
            </p>

            <form method="GET" class="filter-form">
                <input type="hidden" name="run" value="1">
                
                <div class="form-group">
                    <label>শুরুর তারিখ (Start Date)</label>
                    <input type="date" name="start_date" class="form-control" value="<?= htmlspecialchars($startDate) ?>" required>
                </div>

                <div class="form-group">
                    <label>শেষ তারিখ (End Date)</label>
                    <input type="date" name="end_date" class="form-control" value="<?= htmlspecialchars($endDate) ?>" required>
                </div>

                <div class="form-group">
                    <label>শুরুর কার্ড # (ঐচ্ছিক)</label>
                    <input type="number" name="start_card_id" class="form-control" placeholder="যেমন: 1" value="<?= $startCardId > 0 ? $startCardId : '' ?>" style="width: 100px;">
                </div>

                <div class="form-group">
                    <label>শেষ কার্ড # (ঐচ্ছিক)</label>
                    <input type="number" name="end_card_id" class="form-control" placeholder="যেমন: 350" value="<?= $endCardId > 0 ? $endCardId : '' ?>" style="width: 100px;">
                </div>

                <div class="form-group">
                    <div class="checkbox-group">
                        <input type="checkbox" name="remove_old_lumps" id="remove_old_lumps" value="1" <?= $removeOldLumps ? 'checked' : '' ?>>
                        <label for="remove_old_lumps" style="cursor: pointer;">পুরোনো আন-রেফারেন্সড ক্যাশ আউট মুছুন</label>
                    </div>
                </div>

                <button type="submit" name="action" value="preview" class="btn btn-preview">
                    🔍 প্রিভিউ দেখুন
                </button>
            </form>
        </div>

        <?php if ($executionResult): ?>
            <?php if (!empty($executionResult['success'])): ?>

                <?php if ($action === 'sync'): ?>
                    <div class="banner-success">
                        <span style="font-size: 20px;">🎉</span>
                        <div>
                            <strong>সিঙ্ক সফল হয়েছে!</strong> 
                            মোট <?= (int)$executionResult['created_withdraw_count'] ?> টি উইথড্র রিকোয়েস্ট তৈরি হয়েছে এবং <?= (int)$executionResult['inserted_cash_count'] ?> টি ক্যাশ আউট এন্ট্রি সফলভাবে ক্যাশ লেজারে যুক্ত হয়েছে।
                            <?php if ($executionResult['deleted_lumps_count'] > 0): ?>
                                (পুরোনো <?= (int)$executionResult['deleted_lumps_count'] ?> টি ডুপ্লিকেট ক্যাশ এন্ট্রি মোছা হয়েছে)।
                            <?php endif; ?>
                        </div>
                    </div>
                <?php endif; ?>

                <!-- Stats Grid -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <span class="stat-label">মোট ক্লোজড কার্ড</span>
                        <span class="stat-value primary"><?= number_format($executionResult['total_closed_cards']) ?> টি</span>
                    </div>

                    <div class="stat-card">
                        <span class="stat-label">মোট পরিশোধিত মূলধন</span>
                        <span class="stat-value info">৳ <?= number_format($executionResult['total_principal_amount'], 2) ?></span>
                    </div>

                    <div class="stat-card">
                        <span class="stat-label">নতুন উইথড্র যুক্ত হবে</span>
                        <span class="stat-value <?= $executionResult['missing_withdraw_count'] > 0 ? 'warning' : 'success' ?>">
                            <?= number_format($executionResult['missing_withdraw_count']) ?> টি
                        </span>
                    </div>

                    <div class="stat-card">
                        <span class="stat-label">নতুন ক্যাশ আউট হবে</span>
                        <span class="stat-value <?= $executionResult['missing_cash_count'] > 0 ? 'warning' : 'success' ?>">
                            <?= number_format($executionResult['missing_cash_count']) ?> টি
                        </span>
                    </div>
                </div>

                <!-- Table Card -->
                <div class="table-card">
                    <div class="table-header">
                        <span class="table-title">ক্লোজড কার্ড ও পেআউট বিবরণী (<?= count($executionResult['detailed_cards']) ?> টি রেকর্ড)</span>

                        <?php if ($action === 'preview' && ($executionResult['missing_withdraw_count'] > 0 || $executionResult['missing_cash_count'] > 0)): ?>
                            <form method="GET" style="margin: 0;">
                                <input type="hidden" name="run" value="1">
                                <input type="hidden" name="start_date" value="<?= htmlspecialchars($startDate) ?>">
                                <input type="hidden" name="end_date" value="<?= htmlspecialchars($endDate) ?>">
                                <input type="hidden" name="start_card_id" value="<?= $startCardId ?>">
                                <input type="hidden" name="end_card_id" value="<?= $endCardId ?>">
                                <input type="hidden" name="remove_old_lumps" value="<?= $removeOldLumps ? '1' : '0' ?>">
                                <button type="submit" name="action" value="sync" class="btn btn-sync" onclick="return confirm('আপনি কি নিশ্চিত যে এই ক্লোজড কার্ডগুলোর উইথড্র ও ক্যাশ আউট এন্ট্রিগুলো ডাটাবেসে সিঙ্ক করতে চান?');">
                                    ⚡ সিঙ্ক সম্পন্ন করুন (Confirm & Sync)
                                </button>
                            </form>
                        <?php endif; ?>
                    </div>

                    <div style="overflow-x: auto;">
                        <table>
                            <thead>
                                <tr>
                                    <th>কার্ড #</th>
                                    <th>ইনভেস্টর নাম ও মোবাইল</th>
                                    <th>মূলধন (৳)</th>
                                    <th>শুরুর তারিখ</th>
                                    <th>ক্লোজড তারিখ (end_date)</th>
                                    <th>উইথড্র স্ট্যাটাস</th>
                                    <th>ক্যাশ আউট স্ট্যাটাস</th>
                                    <th>রেফারেন্স স্টাফ</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (empty($executionResult['detailed_cards'])): ?>
                                    <tr>
                                        <td colspan="8" style="text-align: center; padding: 30px; color: #9ca3af;">
                                            এই তারিখের মধ্যে কোনো ক্লোজড ইনভেস্টমেন্ট কার্ড পাওয়া যায়নি।
                                        </td>
                                    </tr>
                                <?php else: ?>
                                    <?php foreach ($executionResult['detailed_cards'] as $card): ?>
                                        <tr>
                                            <td>
                                                <strong style="color: #60a5fa; font-family: monospace;">#<?= $card['card_id'] ?></strong>
                                                <div style="font-size: 11px; color: #9ca3af;"><?= htmlspecialchars($card['card_name']) ?></div>
                                            </td>
                                            <td>
                                                <strong><?= htmlspecialchars($card['investor_name'] ?: 'N/A') ?></strong>
                                                <div style="font-size: 11px; color: #9ca3af; font-family: monospace;"><?= htmlspecialchars($card['investor_mobile'] ?: '—') ?></div>
                                            </td>
                                            <td>
                                                <span style="font-family: monospace; font-weight: 700; color: #34d399;">
                                                    ৳ <?= number_format((float)$card['investment_amount'], 2) ?>
                                                </span>
                                            </td>
                                            <td style="font-family: monospace; font-size: 12px; color: #9ca3af;">
                                                <?= $card['start_date'] ?: '—' ?>
                                            </td>
                                            <td style="font-family: monospace; font-size: 12px; color: #fbbf24; font-weight: 600;">
                                                <?= $card['closed_date'] ?>
                                            </td>
                                            <td>
                                                <?php if ($card['has_withdraw']): ?>
                                                    <span class="badge badge-success">✔ উইথড্র বিদ্যমান</span>
                                                <?php else: ?>
                                                    <span class="badge badge-warning">⚡ নতুন তৈরি হবে</span>
                                                <?php endif; ?>
                                            </td>
                                            <td>
                                                <?php if ($card['has_cash_out']): ?>
                                                    <span class="badge badge-success">✔ ক্যাশ আউট বিদ্যমান</span>
                                                <?php else: ?>
                                                    <span class="badge badge-danger">⚡ ক্যাশ আউট হবে</span>
                                                <?php endif; ?>
                                            </td>
                                            <td style="font-size: 12px; color: #9ca3af;">
                                                <?= htmlspecialchars($card['ref_staff_name'] ?: 'অফিস') ?>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>

                <?php if (!empty($executionResult['old_lumps'])): ?>
                    <!-- Old Lumps Card -->
                    <div class="table-card" style="border-color: rgba(239, 68, 68, 0.3);">
                        <div class="table-header" style="background: rgba(239, 68, 68, 0.08);">
                            <span class="table-title" style="color: #f87171;">
                                ⚠ পুরোনো আন-রেফারেন্সড ক্যাশ আউট এন্ট্রি (<?= count($executionResult['old_lumps']) ?> টি | মোট ৳ <?= number_format($executionResult['old_lumps_total'], 2) ?>)
                            </span>
                        </div>
                        <div style="overflow-x: auto;">
                            <table>
                                <thead>
                                    <tr>
                                        <th>আইডি</th>
                                        <th>তারিখ</th>
                                        <th>উৎস ও বিবরণ</th>
                                        <th>পরিমাণ</th>
                                        <th>ক্যাটাগরি</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($executionResult['old_lumps'] as $ol): ?>
                                        <tr>
                                            <td style="font-family: monospace;">#<?= $ol['id'] ?></td>
                                            <td style="font-family: monospace;"><?= $ol['date'] ?></td>
                                            <td>
                                                <div><?= htmlspecialchars($ol['source'] ?: 'N/A') ?></div>
                                                <div style="font-size: 11px; color: #9ca3af;"><?= htmlspecialchars($ol['purpose'] ?: '') ?></div>
                                            </td>
                                            <td style="font-family: monospace; color: #f87171; font-weight: 700;">
                                                ৳ <?= number_format((float)$ol['amount'], 2) ?>
                                            </td>
                                            <td><?= htmlspecialchars($ol['category']) ?></td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                <?php endif; ?>

            <?php else: ?>
                <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 20px; color: #f87171; font-weight: 600;">
                    ত্রুটি: <?= htmlspecialchars($executionResult['error'] ?? 'অজানা ত্রুটি ঘটেছে') ?>
                </div>
            <?php endif; ?>
        <?php endif; ?>

    </div>
</body>
</html>
