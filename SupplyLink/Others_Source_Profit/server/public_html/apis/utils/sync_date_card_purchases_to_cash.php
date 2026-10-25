<?php

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

// 1. Parse Dates & Action
$startDate = null;
$endDate = null;
$action = 'preview'; // Default to preview
$removeOldLumps = false;

if ($isCli) {
    $startDate = $argv[1] ?? date("Y-m-01");
    $endDate = $argv[2] ?? $startDate;
    $action = $argv[3] ?? 'preview';
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
        // A. Fetch existing old manual entries in cash for category 'purchase'
        // (Where refId is NOT card_purchase_%)
        $oldLumpSql = "
            SELECT id, date, source, purpose, amount, category, remarks, approval_status
            FROM cash
            WHERE type = 'out'
              AND category = 'purchase'
              AND (refId IS NULL OR refId = '' OR refId NOT LIKE 'card_purchase_%')
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

        // B. Fetch Installment Cards in date range (by delivery_date)
        $cardSql = "
            SELECT 
                ic.id,
                ic.card_number,
                ic.product_name,
                ic.purchase_price,
                ic.additional_cost,
                ic.cost_price,
                ic.delivery_date,
                ic.created_at,
                u.name as customer_name
            FROM installment_cards ic
            LEFT JOIN users u ON ic.user_id = u.id
            WHERE ic.delivery_date BETWEEN ? AND ?
            ORDER BY ic.delivery_date ASC, ic.id ASC
        ";
        $cardStmt = $mysqli->prepare($cardSql);
        $cardStmt->bind_param("ss", $startDate, $endDate);
        $cardStmt->execute();
        $allCards = $cardStmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $cardStmt->close();

        // C. Fetch existing refIds in cash table (card_purchase_%)
        $refCheckSql = "SELECT refId, amount FROM cash WHERE refId LIKE 'card_purchase_%' AND date BETWEEN ? AND ?";
        $rcStmt = $mysqli->prepare($refCheckSql);
        $rcStmt->bind_param("ss", $startDate, $endDate);
        $rcStmt->execute();
        $existingRefsRaw = $rcStmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $rcStmt->close();

        $existingRefMap = [];
        $alreadySyncedTotalAmount = 0;
        foreach ($existingRefsRaw as $r) {
            $existingRefMap[$r['refId']] = (float)$r['amount'];
            $alreadySyncedTotalAmount += (float)$r['amount'];
        }

        // D. Group statistics by Date
        $dateStats = [];
        $totalFound = count($allCards);
        $alreadyExistsCount = 0;
        $toInsertList = [];
        $totalAmountToInsert = 0;
        $grandTotalAmountFound = 0;

        foreach ($allCards as $c) {
            $cardId = (int)$c['id'];
            $refId = "card_purchase_" . $cardId;
            $d = $c['delivery_date'];
            $amt = (float)$c['cost_price']; // As requested: cost_price (purchase_price + additional_cost)
            $grandTotalAmountFound += $amt;

            if (!isset($dateStats[$d])) {
                $dateStats[$d] = [
                    'date' => $d,
                    'total_count' => 0,
                    'total_amount' => 0,
                    'already_synced_count' => 0,
                    'already_synced_amount' => 0,
                    'new_to_sync_count' => 0,
                    'new_to_sync_amount' => 0,
                    'old_lump_count' => 0,
                    'old_lump_amount' => 0
                ];
            }

            $dateStats[$d]['total_count']++;
            $dateStats[$d]['total_amount'] += $amt;

            if (isset($existingRefMap[$refId])) {
                $alreadyExistsCount++;
                $dateStats[$d]['already_synced_count']++;
                $dateStats[$d]['already_synced_amount'] += $amt;
            } else {
                $toInsertList[] = $c;
                $totalAmountToInsert += $amt;
                $dateStats[$d]['new_to_sync_count']++;
                $dateStats[$d]['new_to_sync_amount'] += $amt;
            }
        }

        // Map old manual entries into dateStats
        foreach ($oldLumpEntries as $ol) {
            $d = $ol['date'];
            if (!isset($dateStats[$d])) {
                $dateStats[$d] = [
                    'date' => $d,
                    'total_count' => 0,
                    'total_amount' => 0,
                    'already_synced_count' => 0,
                    'already_synced_amount' => 0,
                    'new_to_sync_count' => 0,
                    'new_to_sync_amount' => 0,
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
            $mysqli->begin_transaction();

            // 1. Remove old manual purchase entries if requested
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

            // 2. Insert into cash
            $insertStmt = $mysqli->prepare("
                INSERT INTO cash (
                    type, source, purpose, amount, category, 
                    refId, remarks, date, createdAt, 
                    approval_status, approved_by, approved_at
                ) VALUES (
                    'out', 'পণ্য ক্রয়', ?, ?, 'purchase', 
                    ?, ?, ?, ?, 
                    'approved', 1, NOW()
                )
            ");

            foreach ($toInsertList as $c) {
                $cardId = (int)$c['id'];
                $refId = "card_purchase_" . $cardId;
                $productName = trim($c['product_name']);
                $amount = (float)$c['cost_price'];
                $paidDate = $c['delivery_date'];
                $cashRemarks = "কার্ড #{$c['card_number']} পণ্য ক্রয় খরচ (কেনা দাম: ৳{$c['purchase_price']}, অতিরিক্ত: ৳{$c['additional_cost']})";
                $createdAt = !empty($c['created_at']) ? $c['created_at'] : date("Y-m-d H:i:s");

                if ($insertStmt) {
                    $insertStmt->bind_param(
                        "sdssss",
                        $productName, // Just product name as purpose
                        $amount,      // Cost price
                        $refId,
                        $cashRemarks,
                        $paidDate,
                        $createdAt
                    );
                    $insertStmt->execute();
                    $insertedCount++;
                }
            }

            if ($insertStmt) {
                $insertStmt->close();
            }

            $mysqli->commit();

            // Refresh state after commit
            $alreadyExistsCount += $insertedCount;
            $alreadySyncedTotalAmount += $totalAmountToInsert;
            $toInsertList = [];
            $totalAmountToInsert = 0;
            if ($removeOldLumps) {
                $oldLumpEntries = [];
                $oldLumpsTotalAmount = 0;
            }
        }

        $executionResult = [
            'success' => true,
            'action' => $action,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'total_cards_found' => $totalFound,
            'grand_total_amount_found' => $grandTotalAmountFound,
            'already_synced_count' => $alreadyExistsCount,
            'already_synced_amount' => $alreadySyncedTotalAmount,
            'new_to_insert_count' => count($toInsertList),
            'new_to_insert_amount' => $totalAmountToInsert,
            'old_lump_entries_count' => count($oldLumpEntries),
            'old_lump_entries_amount' => $oldLumpsTotalAmount,
            'inserted_count' => $insertedCount,
            'deleted_lumps_count' => $deletedLumpsCount,
            'deleted_lumps_amount' => $deletedLumpsAmount,
            'date_stats' => $dateStats,
            'all_cards' => $allCards,
            'old_lump_entries' => $oldLumpEntries
        ];

    } catch (Throwable $e) {
        if ($action === 'sync') {
            @$mysqli->rollback();
        }
        $executionResult = [
            'success' => false,
            'error' => $e->getMessage()
        ];
    }
}

// Return JSON if requested
if ($isJsonRequest) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($executionResult ?: ['success' => false, 'message' => 'No action executed or invalid date parameters.'], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// CLI Output
if ($isCli) {
    if (!$executionResult || empty($executionResult['success'])) {
        echo "Error: " . ($executionResult['error'] ?? 'Unknown error') . "\n";
        exit(1);
    }
    echo "========================================================\n";
    echo " Installment Card Purchases (Cash Out) Sync Tool\n";
    echo " Range: {$startDate} to {$endDate} | Action: {$action}\n";
    echo "========================================================\n";
    echo "Total Card Purchases     : {$executionResult['total_cards_found']} (৳" . number_format($executionResult['grand_total_amount_found'], 2) . ")\n";
    echo "Already in Cash Ledger   : {$executionResult['already_synced_count']} (৳" . number_format($executionResult['already_synced_amount'], 2) . ")\n";
    echo "Old Manual Entries       : {$executionResult['old_lump_entries_count']} (৳" . number_format($executionResult['old_lump_entries_amount'], 2) . ")\n";
    echo "New to Insert            : {$executionResult['new_to_insert_count']} (৳" . number_format($executionResult['new_to_insert_amount'], 2) . ")\n";
    if ($action === 'sync') {
        echo ">>> Successfully Inserted: {$executionResult['inserted_count']} card purchases into Cash Out!\n";
        if ($executionResult['deleted_lumps_count'] > 0) {
            echo ">>> Removed {$executionResult['deleted_lumps_count']} Old Manual Entries (৳" . number_format($executionResult['deleted_lumps_amount'], 2) . ")\n";
        }
    }
    exit(0);
}

// Visual HTML UI
?>
<!DOCTYPE html>
<html lang="bn" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>কার্ড পণ্য ক্রয় (Cash Out) সিঙ্ক প্যানেল - SupplyLink Enterprise</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['"Hind Siliguri"', 'sans-serif'],
                        mono: ['"JetBrains Mono"', 'monospace']
                    }
                }
            }
        }
    </script>
    <style>
        body {
            background-color: #0b0f19;
            color: #f1f5f9;
        }
        .glass-card {
            background: rgba(17, 24, 39, 0.7);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }
    </style>
</head>
<body class="font-sans antialiased min-h-screen text-slate-100 p-4 md:p-8">

    <div class="max-w-7xl mx-auto space-y-6">

        <!-- Top Navigation Bar for All Sync Tools -->
        <header class="glass-card rounded-2xl p-5 md:p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/10">
            <div>
                <div class="flex items-center gap-2">
                    <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        ক্যাশ আউট সিঙ্ক
                    </span>
                    <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        পণ্য ক্রয় খরচ (Purchase Cost)
                    </span>
                </div>
                <h1 class="text-2xl md:text-3xl font-bold mt-2 text-white tracking-tight flex items-center gap-3">
                    <span>🛍️ কিস্তির কার্ড পণ্য ক্রয় (Cash Out) সিঙ্ক প্যানেল</span>
                </h1>
                <p class="text-sm text-slate-400 mt-1">
                    ইনস্টলমেন্ট কার্ডের কেনা মালামালকে ক্যাশ আউটে <span class="text-rose-400 font-mono font-semibold">[পণ্যের নাম]</span> ও <span class="text-rose-400 font-mono font-semibold">[ক্রয় খরচ]</span> হিসেবে জমা ও মিলকরণের নিরাপদ প্যানেল
                </p>
            </div>

            <!-- Quick Navigation Switcher -->
            <div class="flex flex-wrap items-center gap-2">
                <a href="sync_date_monthly_installments_to_cash.php" class="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-white/10 transition-all flex items-center gap-1.5">
                    <span>💳 মাসিক কিস্তি</span>
                </a>
                <a href="sync_date_downpayment_to_cash.php" class="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-white/10 transition-all flex items-center gap-1.5">
                    <span>💰 ডাউন পেমেন্ট</span>
                </a>
                <a href="sync_date_daily_installments_to_cash.php" class="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-white/10 transition-all flex items-center gap-1.5">
                    <span>⚡ দৈনিক কিস্তি</span>
                </a>
                <a href="sync_date_card_purchases_to_cash.php" class="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white shadow-lg shadow-rose-600/30 border border-rose-500/30 flex items-center gap-1.5">
                    <span>🛍️ কার্ড ক্রয় খরচ</span>
                </a>
                <a href="sync_date_investments_to_cash.php" class="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-white/10 transition-all flex items-center gap-1.5">
                    <span>📈 বিনিয়োগ সিঙ্ক</span>
                </a>
            </div>
        </header>

        <!-- Notification Banner -->
        <?php if ($executionResult && !empty($executionResult['action']) && $executionResult['action'] === 'sync'): ?>
            <div class="p-5 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 flex items-start gap-4 shadow-xl">
                <span class="text-2xl">🎉</span>
                <div>
                    <h3 class="font-bold text-lg text-emerald-300">কার্ড পণ্য ক্রয় সফলভাবে ক্যাশ আউটে সিঙ্ক সম্পন্ন হয়েছে!</h3>
                    <p class="text-sm text-emerald-400/90 mt-1">
                        মোট <span class="font-bold text-white font-mono"><?= $executionResult['inserted_count'] ?></span> টি পণ্য ক্রয় খরচ ক্যাশ আউটে এন্ট্রি করা হয়েছে।
                        <?php if ($executionResult['deleted_lumps_count'] > 0): ?>
                            এবং পুরোনো <span class="font-bold text-white font-mono"><?= $executionResult['deleted_lumps_count'] ?></span> টি ম্যানুয়াল এন্ট্রি (৳<?= number_format($executionResult['deleted_lumps_amount'], 2) ?>) মুছে নিখুঁত করা হয়েছে।
                        <?php endif; ?>
                    </p>
                </div>
            </div>
        <?php endif; ?>

        <?php if ($executionResult && empty($executionResult['success'])): ?>
            <div class="p-5 rounded-2xl bg-rose-950/60 border border-rose-500/30 text-rose-200 flex items-start gap-4 shadow-xl">
                <span class="text-2xl">⚠️</span>
                <div>
                    <h3 class="font-bold text-lg text-rose-300">ত্রুটি দেখা দিয়েছে!</h3>
                    <p class="text-sm font-mono text-rose-400 mt-1"><?= htmlspecialchars($executionResult['error'] ?? 'অজানা ত্রুটি') ?></p>
                </div>
            </div>
        <?php endif; ?>

        <!-- Date Range Filter Form -->
        <section class="glass-card rounded-2xl p-6 shadow-xl border border-white/10">
            <form method="GET" action="" class="space-y-4">
                <input type="hidden" name="run" value="1">
                
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <!-- Start Date -->
                    <div>
                        <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">শুরুর তারিখ (Start Date)</label>
                        <input type="date" name="start_date" id="start_date" value="<?= htmlspecialchars($startDate) ?>" required
                            class="w-full bg-slate-900/90 border border-white/15 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition">
                    </div>

                    <!-- End Date -->
                    <div>
                        <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">শেষ তারিখ (End Date)</label>
                        <input type="date" name="end_date" id="end_date" value="<?= htmlspecialchars($endDate) ?>" required
                            class="w-full bg-slate-900/90 border border-white/15 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition">
                    </div>

                    <!-- Quick Shortcuts -->
                    <div class="md:col-span-2">
                        <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">তারিখের শর্টকাট (Quick Ranges)</label>
                        <div class="flex flex-wrap gap-2">
                            <button type="button" onclick="setDateRange('today')" class="px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-white/5 transition">আজকের দিন</button>
                            <button type="button" onclick="setDateRange('yesterday')" class="px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-white/5 transition">গতকাল</button>
                            <button type="button" onclick="setDateRange('this_month')" class="px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-white/5 transition">চলতি মাস</button>
                            <button type="button" onclick="setDateRange('last_month')" class="px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-white/5 transition">গত মাস</button>
                            <button type="button" onclick="setDateRange('all_records')" class="px-3 py-2 text-xs font-semibold rounded-lg bg-rose-900/30 text-rose-300 hover:bg-rose-800/40 border border-rose-500/30 transition">সকল রেকর্ড (All-time)</button>
                        </div>
                    </div>
                </div>

                <div class="pt-3 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <label class="flex items-center gap-3 cursor-pointer select-none">
                        <input type="checkbox" name="remove_old_lumps" value="1" <?= $removeOldLumps ? 'checked' : '' ?>
                            class="w-5 h-5 rounded border-white/20 bg-slate-900 text-rose-600 focus:ring-rose-500 focus:ring-offset-slate-900">
                        <span class="text-sm font-medium text-slate-300">
                            পুরোনো ম্যানুয়াল ক্যাশ আউট এন্ট্রি থাকলে ডিলিট করে কার্ড অনুযায়ী ফ্রেশ এন্ট্রি বসান
                        </span>
                    </label>

                    <div class="flex items-center gap-3">
                        <button type="submit" name="action" value="preview"
                            class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-white/10 transition flex items-center gap-2">
                            <span>🔍 প্রিভিউ দেখুন (Preview)</span>
                        </button>
                        <button type="submit" name="action" value="sync" onclick="return confirmSync()"
                            class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition flex items-center gap-2">
                            <span>⚡ সিঙ্ক করুন ও ক্যাশ আউটে জমা দিন</span>
                        </button>
                    </div>
                </div>
            </form>
        </section>

        <?php if ($executionResult && !empty($executionResult['success'])): 
            $totPaid = $executionResult['grand_total_amount_found'];
            $alrSynced = $executionResult['already_synced_amount'];
            $oldLump = $executionResult['old_lump_entries_amount'];
            $newToSync = $executionResult['new_to_insert_amount'];
            $cashCovered = $alrSynced + $oldLump;
            $diffGap = $totPaid - $cashCovered;
        ?>

        <!-- KPI Summary Cards with Dedicated Difference Column -->
        <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <!-- 1. Total Card Cost -->
            <div class="glass-card rounded-2xl p-5 border border-white/10 relative overflow-hidden">
                <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">মোট কার্ড ক্রয় খরচ (Cost Price)</div>
                <div class="text-2xl font-bold font-mono text-white mt-2">
                    ৳<?= number_format($totPaid, 2) ?>
                </div>
                <div class="text-xs text-slate-400 mt-1">
                    মোট <span class="font-mono text-slate-200 font-semibold"><?= $executionResult['total_cards_found'] ?></span> টি কার্ডের পণ্য
                </div>
            </div>

            <!-- 2. Already in Cash Out -->
            <div class="glass-card rounded-2xl p-5 border border-white/10 relative overflow-hidden">
                <div class="text-xs font-semibold text-emerald-400 uppercase tracking-wider">ক্যাশ আউটে ইতিমধ্যে জমা</div>
                <div class="text-2xl font-bold font-mono text-emerald-400 mt-2">
                    ৳<?= number_format($alrSynced, 2) ?>
                </div>
                <div class="text-xs text-slate-400 mt-1">
                    ইন্ডিভিজুয়াল <span class="font-mono text-slate-200 font-semibold"><?= $executionResult['already_synced_count'] ?></span> টি এন্ট্রি
                </div>
            </div>

            <!-- 3. Old Manual Entries -->
            <div class="glass-card rounded-2xl p-5 border border-white/10 relative overflow-hidden">
                <div class="text-xs font-semibold text-amber-400 uppercase tracking-wider">পুরোনো ম্যানুয়াল এন্ট্রি</div>
                <div class="text-2xl font-bold font-mono text-amber-400 mt-2">
                    ৳<?= number_format($oldLump, 2) ?>
                </div>
                <div class="text-xs text-slate-400 mt-1">
                    <span class="font-mono text-slate-200 font-semibold"><?= $executionResult['old_lump_entries_count'] ?></span> টি ম্যানুয়াল রেকর্ড
                </div>
            </div>

            <!-- 4. New to Sync -->
            <div class="glass-card rounded-2xl p-5 border border-white/10 relative overflow-hidden">
                <div class="text-xs font-semibold text-rose-400 uppercase tracking-wider">নতুন জমা হবে</div>
                <div class="text-2xl font-bold font-mono text-rose-400 mt-2">
                    ৳<?= number_format($newToSync, 2) ?>
                </div>
                <div class="text-xs text-slate-400 mt-1">
                    নতুন <span class="font-mono text-slate-200 font-semibold"><?= $executionResult['new_to_insert_count'] ?></span> টি এন্ট্রি বাকি
                </div>
            </div>

            <!-- 5. Difference / Gap Total Card -->
            <div class="glass-card rounded-2xl p-5 border <?= abs($diffGap) < 0.01 ? 'border-emerald-500/40 bg-emerald-950/20' : ($diffGap > 0 ? 'border-amber-500/40 bg-amber-950/20' : 'border-rose-500/40 bg-rose-950/20') ?> relative overflow-hidden">
                <div class="text-xs font-semibold <?= abs($diffGap) < 0.01 ? 'text-emerald-400' : ($diffGap > 0 ? 'text-amber-400' : 'text-rose-400') ?> uppercase tracking-wider flex items-center justify-between">
                    <span>সর্বমোট পার্থক্য / গ্যাপ</span>
                    <span><?= abs($diffGap) < 0.01 ? '✓ নিখুঁত মিল' : '⚠️ গ্যাপ' ?></span>
                </div>
                <div class="text-2xl font-bold font-mono <?= abs($diffGap) < 0.01 ? 'text-emerald-300' : ($diffGap > 0 ? 'text-amber-300' : 'text-rose-300') ?> mt-2">
                    ৳<?= number_format($diffGap, 2) ?>
                </div>
                <div class="text-xs text-slate-400 mt-1">
                    <?php if (abs($diffGap) < 0.01): ?>
                        কার্ড খরচ ও ক্যাশ আউট হিসাব ১০০% সমান
                    <?php elseif ($diffGap > 0): ?>
                        কার্ডের ক্রয় খরচ ক্যাশ আউটের চেয়ে বেশি (+৳<?= number_format($diffGap, 2) ?>)
                    <?php else: ?>
                        ক্যাশ আউটে বেশি খরচ কাটা আছে (-৳<?= number_format(abs($diffGap), 2) ?>)
                    <?php endif; ?>
                </div>
            </div>
        </section>

        <!-- Date-by-Date Breakdown Table with Difference / Gap -->
        <section class="glass-card rounded-2xl p-6 shadow-xl border border-white/10 space-y-4">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-lg font-bold text-white flex items-center gap-2">
                        <span>📅 তারিখভিত্তিক ক্রয় খরচ ও গ্যাপ বিশ্লেষণ</span>
                    </h2>
                    <p class="text-xs text-slate-400">প্রতিটি তারিখে কার্ডের ক্রয় খরচ vs ক্যাশ আউটের টাকার তফাত</p>
                </div>
                <span class="text-xs font-mono px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-white/10">
                    <?= count($executionResult['date_stats']) ?> টি তারিখ
                </span>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                    <thead>
                        <tr class="border-b border-white/10 text-xs text-slate-400 uppercase font-semibold">
                            <th class="py-3 px-3">তারিখ</th>
                            <th class="py-3 px-3">পণ্য সংখ্যা</th>
                            <th class="py-3 px-3 text-right">কার্ড ক্রয় খরচ (৳)</th>
                            <th class="py-3 px-3 text-right">ক্যাশে জমা খরচ (৳)</th>
                            <th class="py-3 px-3 text-right">পুরোনো ম্যানুয়াল (৳)</th>
                            <th class="py-3 px-3 text-center">পার্থক্য / গ্যাপ</th>
                            <th class="py-3 px-3 text-center">অবস্থা</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-white/5 font-mono text-xs">
                        <?php 
                        foreach ($executionResult['date_stats'] as $d => $st): 
                            $paidAmt = (float)$st['total_amount'];
                            $cashAmt = (float)$st['already_synced_amount'] + (float)$st['old_lump_amount'];
                            $gap = $paidAmt - $cashAmt;
                            $isPerfect = abs($gap) < 0.01;
                        ?>
                            <tr class="hover:bg-white/[0.02] transition">
                                <td class="py-3 px-3 font-semibold text-slate-200"><?= $d ?></td>
                                <td class="py-3 px-3 text-slate-400">
                                    <span class="text-slate-200 font-bold"><?= $st['total_count'] ?></span> টি
                                    (নতুন: <span class="text-rose-400 font-bold"><?= $st['new_to_sync_count'] ?></span>)
                                </td>
                                <td class="py-3 px-3 text-right font-bold text-white">৳<?= number_format($paidAmt, 2) ?></td>
                                <td class="py-3 px-3 text-right text-emerald-400">৳<?= number_format($st['already_synced_amount'], 2) ?></td>
                                <td class="py-3 px-3 text-right text-amber-400">৳<?= number_format($st['old_lump_amount'], 2) ?></td>
                                
                                <!-- Difference / Gap Badge -->
                                <td class="py-3 px-3 text-center">
                                    <?php if ($isPerfect): ?>
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            ✓ ০ টাকা (নিখুঁত মিল)
                                        </span>
                                    <?php elseif ($gap > 0): ?>
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                            ⚠️ +৳<?= number_format($gap, 2) ?> বেশি
                                        </span>
                                    <?php else: ?>
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                                            ⚠️ -৳<?= number_format(abs($gap), 2) ?> কম
                                        </span>
                                    <?php endif; ?>
                                </td>

                                <td class="py-3 px-3 text-center">
                                    <?php if ($st['new_to_sync_count'] === 0): ?>
                                        <span class="text-emerald-400 font-semibold">✓ ইতিমধ্যে সম্পন্ন</span>
                                    <?php else: ?>
                                        <span class="text-rose-400 font-semibold">⚡ নতুন জমা বাকি</span>
                                    <?php endif; ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </section>

        <!-- Detailed Card Purchases List -->
        <section class="glass-card rounded-2xl p-6 shadow-xl border border-white/10 space-y-4">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-lg font-bold text-white flex items-center gap-2">
                        <span>📦 কার্ডভিত্তিক পণ্য ক্রয় বিস্তারিত তালিকা</span>
                    </h2>
                    <p class="text-xs text-slate-400">শুধুমাত্র পণ্যের নাম ও ক্রয় খরচ ক্যাশ আউটে জমা হবে (গ্রাহকের নাম বা কার্ড নং ক্যাশে যাবে না)</p>
                </div>
                <div class="text-xs font-mono text-slate-400">
                    মোট <?= count($executionResult['all_cards']) ?> টি রেকর্ড
                </div>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                    <thead>
                        <tr class="border-b border-white/10 text-xs text-slate-400 uppercase font-semibold">
                            <th class="py-3 px-3">ক্রমিক</th>
                            <th class="py-3 px-3">ডেলিভারি তারিখ</th>
                            <th class="py-3 px-3">পণ্যের নাম (Purpose)</th>
                            <th class="py-3 px-3 text-right">আসল কেনা (৳)</th>
                            <th class="py-3 px-3 text-right">অতিরিক্ত খরচ (৳)</th>
                            <th class="py-3 px-3 text-right">মোট ক্রয় খরচ (৳)</th>
                            <th class="py-3 px-3">ক্যাশ বিবরণী (Cash Out Entry)</th>
                            <th class="py-3 px-3 text-center">স্ট্যাটাস</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-white/5 font-mono text-xs">
                        <?php 
                        $i = 1;
                        foreach ($executionResult['all_cards'] as $c): 
                            $cId = (int)$c['id'];
                            $refId = "card_purchase_" . $cId;
                            $isSynced = isset($existingRefMap[$refId]);
                            $pName = trim($c['product_name']);
                            $costAmt = (float)$c['cost_price'];
                            $ppAmt = (float)$c['purchase_price'];
                            $addAmt = (float)$c['additional_cost'];
                        ?>
                            <tr class="hover:bg-white/[0.02] transition">
                                <td class="py-3 px-3 text-slate-400"><?= $i++ ?></td>
                                <td class="py-3 px-3 text-slate-300"><?= $c['delivery_date'] ?></td>
                                <td class="py-3 px-3 font-sans font-semibold text-white">
                                    <?= htmlspecialchars($pName) ?>
                                </td>
                                <td class="py-3 px-3 text-right text-slate-300">৳<?= number_format($ppAmt, 2) ?></td>
                                <td class="py-3 px-3 text-right text-slate-400">৳<?= number_format($addAmt, 2) ?></td>
                                <td class="py-3 px-3 text-right font-bold text-rose-400">৳<?= number_format($costAmt, 2) ?></td>
                                <td class="py-3 px-3 text-slate-300 font-sans text-xs">
                                    <span class="px-2 py-1 rounded bg-slate-800 border border-white/5 text-slate-200">
                                        <?= htmlspecialchars($pName) ?> &bull; ৳<?= number_format($costAmt, 2) ?>
                                    </span>
                                </td>
                                <td class="py-3 px-3 text-center">
                                    <?php if ($isSynced): ?>
                                        <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            ইতিমধ্যে ক্যাশে জমা
                                        </span>
                                    <?php else: ?>
                                        <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                            নতুন জমা হবে
                                        </span>
                                    <?php endif; ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </section>

        <?php endif; ?>

    </div>

    <script>
        function setDateRange(range) {
            const today = new Date();
            const startInput = document.getElementById('start_date');
            const endInput = document.getElementById('end_date');

            function formatDate(d) {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }

            if (range === 'today') {
                const str = formatDate(today);
                startInput.value = str;
                endInput.value = str;
            } else if (range === 'yesterday') {
                const yest = new Date(today);
                yest.setDate(yest.getDate() - 1);
                const str = formatDate(yest);
                startInput.value = str;
                endInput.value = str;
            } else if (range === 'this_month') {
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                startInput.value = formatDate(firstDay);
                endInput.value = formatDate(lastDay);
            } else if (range === 'last_month') {
                const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
                startInput.value = formatDate(firstDay);
                endInput.value = formatDate(lastDay);
            } else if (range === 'all_records') {
                startInput.value = '2025-01-01';
                endInput.value = '2027-12-31';
            }
        }

        function confirmSync() {
            return confirm("আপনি কি নিশ্চিত যে নির্বাচিত তারিখের কার্ডের পণ্য ক্রয় খরচগুলো ক্যাশ আউটে জমা (Sync) করতে চান?\n\nযদি 'পুরোনো ম্যানুয়াল ক্যাশ আউট এন্ট্রি ডিলিট' টিক দেওয়া থাকে, তবে পুরোনো এন্ট্রি মুছে নিখুঁত কার্ড অনুযায়ী ফ্রেশ এন্ট্রি যোগ করা হবে।");
        }
    </script>
</body>
</html>
