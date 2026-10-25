<?php
/**
 * Sync Investment Installments to Cash Ledger for a Date Range
 * 
 * Usage via browser:
 *   Open http://localhost/.../apis/utils/sync_date_investments_to_cash.php
 * 
 * Usage via API (JSON):
 *   GET / POST ?start_date=2026-10-01&end_date=2026-10-22&remove_old_lumps=1&format=json
 * 
 * Usage via CLI:
 *   php sync_date_investments_to_cash.php 2026-10-01 2026-10-22 [preview|sync] [remove_old_lumps:0|1]
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

// 1. Parse Dates & Action
$startDate = null;
$endDate = null;
$action = 'preview'; // 'preview' or 'sync'
$removeOldLumps = false;

if ($isCli) {
    $startDate = $argv[1] ?? date("Y-m-01");
    $endDate = $argv[2] ?? $startDate;
    $action = $argv[3] ?? 'sync';
    $removeOldLumps = !empty($argv[4]) && ($argv[4] === '1' || $argv[4] === 'true');
} else {
    if (isset($_REQUEST['start_date'])) {
        $startDate = trim($_REQUEST['start_date']);
    } elseif (isset($_REQUEST['date'])) {
        $startDate = trim($_REQUEST['date']);
    } else {
        $startDate = date("Y-m-01"); // 1st of current month
    }

    if (isset($_REQUEST['end_date'])) {
        $endDate = trim($_REQUEST['end_date']);
    } else {
        $endDate = isset($_REQUEST['date']) ? $startDate : date("Y-m-d");
    }

    if (isset($_REQUEST['action'])) {
        $action = trim($_REQUEST['action']);
    } elseif (isset($_REQUEST['sync']) && $_REQUEST['sync'] == '1') {
        $action = 'sync';
    }

    $removeOldLumps = !empty($_REQUEST['remove_old_lumps']) && ($_REQUEST['remove_old_lumps'] == '1' || $_REQUEST['remove_old_lumps'] === 'true' || $_REQUEST['remove_old_lumps'] === 'on');
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
        // A. Find old combined/lump-sum entries in cash for this date range
        $oldLumpSql = "
            SELECT id, date, source, purpose, amount, category, remarks, approval_status
            FROM cash
            WHERE type = 'in'
              AND category IN ('invest', 'investment')
              AND (refId IS NULL OR refId = '' OR refId NOT LIKE 'inv_inst_%')
              AND date BETWEEN ? AND ?
            ORDER BY date ASC, id ASC
        ";
        $lumpStmt = $mysqli->prepare($oldLumpSql);
        $lumpStmt->bind_param("ss", $startDate, $endDate);
        $lumpStmt->execute();
        $oldLumpEntries = $lumpStmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $lumpStmt->close();

        $oldLumpsTotalAmount = 0;
        foreach ($oldLumpEntries as $ol) {
            $oldLumpsTotalAmount += (float)$ol['amount'];
        }

        // B. Fetch all individual investment installments in this range
        $instSql = "
            SELECT ii.*, u.name AS investor_name, ic.card_name
            FROM investment_installments ii
            LEFT JOIN users u ON u.id = ii.investor_id
            LEFT JOIN investment_cards ic ON ic.id = CAST(ii.investment_card_no AS UNSIGNED)
            WHERE DATE(ii.investment_date) BETWEEN ? AND ?
              AND ii.investment_card_no NOT IN (1, 2)
            ORDER BY ii.investment_date ASC, ii.id ASC
        ";
        $instStmt = $mysqli->prepare($instSql);
        $instStmt->bind_param("ss", $startDate, $endDate);
        $instStmt->execute();
        $allInstallments = $instStmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $instStmt->close();

        // C. Fetch existing refIds already in cash table
        $refCheckSql = "SELECT refId FROM cash WHERE refId LIKE 'inv_inst_%' AND date BETWEEN ? AND ?";
        $rcStmt = $mysqli->prepare($refCheckSql);
        $rcStmt->bind_param("ss", $startDate, $endDate);
        $rcStmt->execute();
        $existingRefsRaw = $rcStmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $rcStmt->close();

        $existingRefMap = [];
        foreach ($existingRefsRaw as $r) {
            $existingRefMap[$r['refId']] = true;
        }

        // D. Group statistics by date
        $dateStats = [];
        $totalFound = count($allInstallments);
        $alreadyExistsCount = 0;
        $toInsertList = [];
        $totalAmountToInsert = 0;

        foreach ($allInstallments as $inst) {
            $instId = (int)$inst['id'];
            $refId = "inv_inst_" . $instId;
            $d = $inst['investment_date'];

            if (!isset($dateStats[$d])) {
                $dateStats[$d] = [
                    'date' => $d,
                    'total_installments' => 0,
                    'total_amount' => 0,
                    'already_synced' => 0,
                    'new_to_sync' => 0,
                    'old_lump_count' => 0,
                    'old_lump_amount' => 0
                ];
            }

            $dateStats[$d]['total_installments']++;
            $dateStats[$d]['total_amount'] += (float)$inst['amount'];

            if (isset($existingRefMap[$refId])) {
                $alreadyExistsCount++;
                $dateStats[$d]['already_synced']++;
            } else {
                $toInsertList[] = $inst;
                $totalAmountToInsert += (float)$inst['amount'];
                $dateStats[$d]['new_to_sync']++;
            }
        }

        // Map old lumps to dateStats
        foreach ($oldLumpEntries as $ol) {
            $d = $ol['date'];
            if (!isset($dateStats[$d])) {
                $dateStats[$d] = [
                    'date' => $d,
                    'total_installments' => 0,
                    'total_amount' => 0,
                    'already_synced' => 0,
                    'new_to_sync' => 0,
                    'old_lump_count' => 0,
                    'old_lump_amount' => 0
                ];
            }
            $dateStats[$d]['old_lump_count']++;
            $dateStats[$d]['old_lump_amount'] += (float)$ol['amount'];
        }

        ksort($dateStats);

        $insertedCount = 0;
        $deletedLumpsCount = 0;
        $deletedLumpsAmount = 0;

        // E. EXECUTE SYNC IF ACTION === 'sync'
        if ($action === 'sync') {
            // 1. Remove old lump sums if requested
            if ($removeOldLumps && count($oldLumpEntries) > 0) {
                $lumpIds = array_column($oldLumpEntries, 'id');
                if (!empty($lumpIds)) {
                    $inPlaceholders = implode(',', array_fill(0, count($lumpIds), '?'));
                    $types = str_repeat('i', count($lumpIds));
                    $delStmt = $mysqli->prepare("DELETE FROM cash WHERE id IN ($inPlaceholders)");
                    $delStmt->bind_param($types, ...$lumpIds);
                    $delStmt->execute();
                    $deletedLumpsCount = $delStmt->affected_rows;
                    $deletedLumpsAmount = $oldLumpsTotalAmount;
                    $delStmt->close();
                }
            }

            // 2. Insert new individual installments
            $insertStmt = $mysqli->prepare("
                INSERT INTO cash (
                    type, source, purpose, amount, category, 
                    refId, remarks, date, createdAt, 
                    approval_status, approved_by, approved_at
                ) VALUES (
                    'in', ?, ?, ?, ?, 
                    ?, ?, ?, ?, 
                    'approved', ?, NOW()
                )
            ");

            foreach ($toInsertList as $inst) {
                $instId = (int)$inst['id'];
                $refId = "inv_inst_" . $instId;
                $investorName = !empty($inst['investor_name']) ? $inst['investor_name'] : "ইনভেস্টর";
                $cardNo = $inst['investment_card_no'];
                $instNo = $inst['investment_no'];
                $amount = (float)$inst['amount'];
                $instDate = $inst['investment_date'];
                $signatureBy = (int)($inst['signature_by'] ?? 1);
                $createdAt = !empty($inst['created_at']) ? $inst['created_at'] : date("Y-m-d H:i:s");

                // Target Format: মোঃ আরফান আলী (কার্ড-290, বিনিয়োগ জমা #67)
                $cashSource = "{$investorName} (কার্ড-{$cardNo}, বিনিয়োগ জমা #{$instNo})";
                $cashPurpose = "বিনিয়োগ জমা আদায়";
                $cashCategory = "investment";
                $cashRemarks = "ইনভেস্টর আইডি #{$inst['investor_id']} - কিস্তি #{$instNo}";

                if ($insertStmt) {
                    $insertStmt->bind_param(
                        "ssdsssssi",
                        $cashSource,
                        $cashPurpose,
                        $amount,
                        $cashCategory,
                        $refId,
                        $cashRemarks,
                        $instDate,
                        $createdAt,
                        $signatureBy
                    );
                    if ($insertStmt->execute()) {
                        $insertedCount++;
                    }
                }
            }
            if ($insertStmt) {
                $insertStmt->close();
            }
        }

        $executionResult = [
            'success' => true,
            'action' => $action,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'total_installments_found' => $totalFound,
            'already_synced' => $alreadyExistsCount,
            'to_insert_count' => count($toInsertList),
            'to_insert_amount' => $totalAmountToInsert,
            'inserted_count' => $insertedCount,
            'old_lumps_found_count' => count($oldLumpEntries),
            'old_lumps_found_amount' => $oldLumpsTotalAmount,
            'old_lumps_removed' => $removeOldLumps,
            'deleted_lumps_count' => $deletedLumpsCount,
            'deleted_lumps_amount' => $deletedLumpsAmount,
            'date_stats' => array_values($dateStats),
            'old_lumps_details' => $oldLumpEntries
        ];

    } catch (Throwable $e) {
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
    <title>বিনিয়োগ কিস্তি ক্যাশ সিঙ্ক প্যানেল (Date Range)</title>
    <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #2563eb;
            --primary-dark: #1d4ed8;
            --bg: #f8fafc;
            --card-bg: #ffffff;
            --text-main: #0f172a;
            --text-muted: #64748b;
            --border: #e2e8f0;
            --success: #16a34a;
            --danger: #dc2626;
            --warning: #d97706;
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
            max-width: 950px;
        }
        .header-card {
            background: var(--card-bg);
            border-radius: 14px;
            padding: 24px 28px;
            border: 1px solid var(--border);
            box-shadow: 0 4px 12px rgba(0,0,0,0.03);
            margin-bottom: 24px;
        }
        .title {
            font-size: 24px;
            font-weight: 700;
            color: #1e293b;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .subtitle {
            font-size: 14px;
            color: var(--text-muted);
            margin-top: 6px;
        }
        .form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-top: 20px;
            align-items: end;
        }
        .form-group label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: #334155;
            margin-bottom: 6px;
        }
        .form-control {
            width: 100%;
            padding: 10px 14px;
            border: 1px solid var(--border);
            border-radius: 8px;
            font-size: 14px;
            font-family: inherit;
            outline: none;
            transition: border-color 0.2s;
        }
        .form-control:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }
        .checkbox-label {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            margin-top: 18px;
            padding: 12px 14px;
            background: #fffbeb;
            border: 1px solid #fef3c7;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            color: #92400e;
        }
        .checkbox-label input {
            margin-top: 3px;
            accent-color: var(--warning);
        }
        .btn-group {
            display: flex;
            gap: 12px;
            margin-top: 20px;
        }
        .btn {
            padding: 11px 22px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            font-family: inherit;
            cursor: pointer;
            border: none;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        .btn-secondary {
            background: #f1f5f9;
            color: #334155;
            border: 1px solid var(--border);
        }
        .btn-secondary:hover { background: #e2e8f0; }
        .btn-primary {
            background: var(--primary);
            color: white;
        }
        .btn-primary:hover { background: var(--primary-dark); }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }
        .summary-card {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 18px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.02);
        }
        .summary-card .label {
            font-size: 13px;
            color: var(--text-muted);
            font-weight: 500;
        }
        .summary-card .value {
            font-size: 22px;
            font-weight: 700;
            margin-top: 6px;
            color: #0f172a;
        }
        .table-card {
            background: var(--card-bg);
            border-radius: 14px;
            border: 1px solid var(--border);
            box-shadow: 0 4px 12px rgba(0,0,0,0.03);
            overflow: hidden;
            margin-bottom: 24px;
        }
        .table-header {
            padding: 16px 20px;
            background: #f8fafc;
            border-bottom: 1px solid var(--border);
            font-weight: 700;
            font-size: 15px;
            color: #1e293b;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }
        th, td {
            padding: 12px 18px;
            text-align: left;
            border-bottom: 1px solid var(--border);
        }
        th {
            background: #fdfdfd;
            font-weight: 600;
            color: #475569;
        }
        tr:hover td {
            background: #f8fafc;
        }
        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
        }
        .badge-success { background: #dcfce7; color: #15803d; }
        .badge-warning { background: #fef3c7; color: #b45309; }
        .badge-danger { background: #fee2e2; color: #b91c1c; }
        .alert {
            padding: 16px 20px;
            border-radius: 10px;
            margin-bottom: 24px;
            font-size: 14px;
        }
        .alert-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
        .alert-danger { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header & Form -->
        <div class="header-card">
            <h1 class="title">⚡ বিনিয়োগ কিস্তি ক্যাশ সিঙ্ক প্যানেল</h1>
            <p class="subtitle">নির্ধারিত তারিখ সীমার (Date Range) বিনিয়োগ কিস্তিগুলোকে ক্যাশ লেজারে স্বয়ংক্রিয়ভাবে সিঙ্ক করুন।</p>
            
            <form method="GET" action="">
                <input type="hidden" name="run" value="1">
                <div class="form-grid">
                    <div class="form-group">
                        <label>শুরুর তারিখ (Start Date)</label>
                        <input type="date" name="start_date" class="form-control" value="<?= htmlspecialchars($startDate) ?>" required>
                    </div>
                    <div class="form-group">
                        <label>শেষের তারিখ (End Date)</label>
                        <input type="date" name="end_date" class="form-control" value="<?= htmlspecialchars($endDate) ?>" required>
                    </div>
                </div>

                <label class="checkbox-label">
                    <input type="checkbox" name="remove_old_lumps" value="1" <?= $removeOldLumps ? 'checked' : '' ?>>
                    <div>
                        <strong>পুরোনো একমুঠো (Lump-sum) ক্যাশ এন্ট্রি স্বয়ংক্রিয়ভাবে মুছে ফেলা হবে</strong>
                        <div style="font-size:12px; margin-top:2px; color:#b45309;">
                            (যাতে ক্যাশের মোট ব্যালেন্স ডাবল না হয়। সিঙ্ক করা সিঙ্গেল নাম-কার্ড ওয়ালা এন্ট্রিগুলো তাদের জায়গা নিবে।)
                        </div>
                    </div>
                </label>

                <div class="btn-group">
                    <button type="submit" name="action" value="preview" class="btn btn-secondary">
                        🔍 প্রিভিউ দেখুন (Preview)
                    </button>
                    <button type="submit" name="action" value="sync" class="btn btn-primary" onclick="return confirm('আপনি কি নিশ্চিত যে <?= htmlspecialchars($startDate) ?> থেকে <?= htmlspecialchars($endDate) ?> তারিখের কিস্তিগুলো ক্যাশে সিঙ্ক করতে চান?');">
                        ⚡ সিঙ্ক শুরু করুন (Run Sync)
                    </button>
                </div>
            </form>
        </div>

        <?php if ($executionResult): ?>
            <?php if (!$executionResult['success']): ?>
                <div class="alert alert-danger">
                    <strong>ত্রুটি:</strong> <?= htmlspecialchars($executionResult['error']) ?>
                </div>
            <?php else: ?>
                <?php if ($action === 'sync'): ?>
                    <div class="alert alert-success">
                        <strong>সফল!</strong> <?= htmlspecialchars($startDate) ?> থেকে <?= htmlspecialchars($endDate) ?> তারিখের মোট <strong><?= $executionResult['inserted_count'] ?></strong> টি কিস্তি ক্যাশ টেবিলে সিঙ্ক হয়েছে।
                        <?php if ($executionResult['deleted_lumps_count'] > 0): ?>
                            এবং <strong><?= $executionResult['deleted_lumps_count'] ?></strong> টি পুরোনো একমুঠো এন্ট্রি (৳<?= number_format($executionResult['deleted_lumps_amount'], 2) ?>) নিরাপদভাবে সরানো হয়েছে।
                        <?php endif; ?>
                    </div>
                <?php endif; ?>

                <!-- Summary Cards -->
                <div class="summary-grid">
                    <div class="summary-card">
                        <div class="label">মোট কিস্তি পাওয়া গেছে</div>
                        <div class="value"><?= number_format($executionResult['total_installments_found']) ?> টি</div>
                    </div>
                    <div class="summary-card">
                        <div class="label">নতুন সিঙ্ক হবে / হয়েছে</div>
                        <div class="value" style="color:var(--primary);"><?= number_format($action === 'sync' ? $executionResult['inserted_count'] : $executionResult['to_insert_count']) ?> টি</div>
                        <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">৳<?= number_format($executionResult['to_insert_amount'], 2) ?></div>
                    </div>
                    <div class="summary-card">
                        <div class="label">আগে থেকেই সিঙ্ক করা আছে</div>
                        <div class="value" style="color:var(--success);"><?= number_format($executionResult['already_synced']) ?> টি</div>
                    </div>
                    <div class="summary-card">
                        <div class="label">পুরোনো একমুঠো এন্ট্রি সনাক্ত</div>
                        <div class="value" style="color:var(--warning);"><?= number_format($executionResult['old_lumps_found_count']) ?> টি</div>
                        <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">৳<?= number_format($executionResult['old_lumps_found_amount'], 2) ?></div>
                    </div>
                </div>

                <!-- Date-wise Breakdown Table -->
                <div class="table-card">
                    <div class="table-header">
                        <span>📅 তারিখ অনুযায়ী বিস্তারিত বিবরণ (Breakdown)</span>
                        <span style="font-size:12px; font-weight:normal; color:var(--text-muted);">
                            তারিখ সীমা: <?= htmlspecialchars($startDate) ?> থেকে <?= htmlspecialchars($endDate) ?>
                        </span>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>তারিখ</th>
                                <th>মোট কিস্তি</th>
                                <th>মোট টাকা</th>
                                <th>নতুন সিঙ্ক</th>
                                <th>পূর্বে সিঙ্ককৃত</th>
                                <th>পুরোনো একমুঠো এন্ট্রি</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if (empty($executionResult['date_stats'])): ?>
                                <tr>
                                    <td colspan="6" style="text-align:center; padding:30px; color:var(--text-muted);">
                                        এই তারিখ সীমার মধ্যে কোনো বিনিয়োগ কিস্তির তথ্য পাওয়া যায়নি।
                                    </td>
                                </tr>
                            <?php else: ?>
                                <?php foreach ($executionResult['date_stats'] as $row): ?>
                                    <tr>
                                        <td><strong><?= htmlspecialchars($row['date']) ?></strong></td>
                                        <td><?= $row['total_installments'] ?> টি</td>
                                        <td><strong>৳<?= number_format($row['total_amount'], 2) ?></strong></td>
                                        <td>
                                            <?php if ($row['new_to_sync'] > 0): ?>
                                                <span class="badge badge-success"><?= $row['new_to_sync'] ?> টি বাকি</span>
                                            <?php else: ?>
                                                <span class="badge" style="background:#f1f5f9; color:#64748b;">০ টি</span>
                                            <?php endif; ?>
                                        </td>
                                        <td>
                                            <?php if ($row['already_synced'] > 0): ?>
                                                <span class="badge badge-success">✓ <?= $row['already_synced'] ?> টি সম্পন্ন</span>
                                            <?php else: ?>
                                                <span style="color:#94a3b8;">-</span>
                                            <?php endif; ?>
                                        </td>
                                        <td>
                                            <?php if ($row['old_lump_count'] > 0): ?>
                                                <span class="badge badge-warning"><?= $row['old_lump_count'] ?> টি (৳<?= number_format($row['old_lump_amount']) ?>)</span>
                                            <?php else: ?>
                                                <span style="color:#94a3b8;">নেই</span>
                                            <?php endif; ?>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>

                <!-- Old Lump Sum Details if any -->
                <?php if (!empty($executionResult['old_lumps_details'])): ?>
                    <div class="table-card">
                        <div class="table-header" style="background:#fffbeb; color:#92400e;">
                            <span>⚠️ পুরোনো একমুঠো (Lump-sum) ক্যাশ এন্ট্রির তালিকা</span>
                            <span style="font-size:12px; font-weight:normal;">
                                <?= count($executionResult['old_lumps_details']) ?> টি পাওয়া গেছে
                            </span>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>আইডি</th>
                                    <th>তারিখ</th>
                                    <th>উৎস (Source)</th>
                                    <th>ক্যাটাগরি</th>
                                    <th>পরিমাণ</th>
                                    <th>স্ট্যাটাস</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($executionResult['old_lumps_details'] as $oldItem): ?>
                                    <tr>
                                        <td>#<?= $oldItem['id'] ?></td>
                                        <td><?= htmlspecialchars($oldItem['date']) ?></td>
                                        <td><?= htmlspecialchars($oldItem['source']) ?></td>
                                        <td><span class="badge" style="background:#e0f2fe; color:#0369a1;"><?= htmlspecialchars($oldItem['category']) ?></span></td>
                                        <td><strong>৳<?= number_format((float)$oldItem['amount'], 2) ?></strong></td>
                                        <td>
                                            <?php if ($action === 'sync' && $removeOldLumps): ?>
                                                <span class="badge badge-danger">মুছে ফেলা হয়েছে</span>
                                            <?php else: ?>
                                                <span class="badge badge-warning">বিদ্যমান</span>
                                            <?php endif; ?>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php endif; ?>
            <?php endif; ?>
        <?php endif; ?>
    </div>
</body>
</html>
