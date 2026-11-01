<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");

$startTimer = microtime(true);

$year = isset($_GET['year']) ? intval($_GET['year']) : intval(date('Y'));
$month = isset($_GET['month']) ? intval($_GET['month']) : intval(date('m'));

// Percent parameters:
$othersInvestorPercent = isset($_GET['others_investor_percent']) ? floatval($_GET['others_investor_percent']) : 70.0;
$rentalInvestorPercent = isset($_GET['rental_investor_percent']) ? floatval($_GET['rental_investor_percent']) : $othersInvestorPercent;
$shareInvestorPercent  = isset($_GET['share_investor_percent']) ? floatval($_GET['share_investor_percent']) : $othersInvestorPercent;

if ($month < 1 || $month > 12) $month = intval(date('m'));
if ($year < 2020 || $year > 2050) $year = intval(date('Y'));

if (!function_exists('round4')) {
    function round4($n) {
        return round(floatval($n) + 0.0000000001, 4);
    }
}

$start = sprintf('%04d-%02d-01', $year, $month);
$nextMonth = ($month == 12) ? 1 : ($month + 1);
$nextYear = ($month == 12) ? ($year + 1) : $year;
$endExclusive = sprintf('%04d-%02d-01', $nextYear, $nextMonth);

$startTime = strtotime($start);
$endTime = strtotime($endExclusive);
$monthDays = intval(($endTime - $startTime) / 86400);

$COMPANY_CARD_ID = 2;
$COMPANY_PERCENT = 50;

$monthKey = sprintf('%04d-%02d', $year, $month);

// ================= CHECK IF ALREADY SAVED =================
$checkSavedStmt = $mysqli->prepare("
    SELECT COUNT(*) as count 
    FROM profit_generator 
    WHERE profit_year = ? AND profit_month = ?
");
$checkSavedStmt->bind_param("ii", $year, $month);
$checkSavedStmt->execute();
$savedCount = intval($checkSavedStmt->get_result()->fetch_assoc()['count'] ?? 0);
$checkSavedStmt->close();

if ($savedCount > 0) {
    // 1. Fetch saved records from profit_generator
    $fetchSavedStmt = $mysqli->prepare("
        SELECT 
            pg.id,
            pg.investor_id,
            pg.card_id,
            pg.start_date,
            pg.maturity_date,
            pg.weight_value,
            pg.percent,
            pg.amount AS deposit_this_month,
            pg.profit_amount AS profit,
            pg.status,
            pg.note,
            ic.card_name,
            ic.end_date,
            ic.investment_amount
        FROM profit_generator pg
        LEFT JOIN investment_cards ic ON ic.id = pg.card_id
        WHERE pg.profit_year = ? AND pg.profit_month = ?
        ORDER BY pg.card_id ASC
    ");
    $fetchSavedStmt->bind_param("ii", $year, $month);
    $fetchSavedStmt->execute();
    $savedRowsRes = $fetchSavedStmt->get_result();

    $rows = [];
    $totalSavedProfit = 0;
    $totalSavedWV = 0;
    $companyProfit = 0;

    while ($r = $savedRowsRes->fetch_assoc()) {
        $cid = intval($r['card_id']);
        $p = floatval($r['profit']);
        $wv = floatval($r['weight_value']);
        $totalSavedProfit += $p;
        $totalSavedWV += $wv;

        if ($cid === $COMPANY_CARD_ID) {
            $companyProfit = $p;
        }

        $rows[] = [
            'investor_id'        => intval($r['investor_id']),
            'name'               => ($r['card_name'] ? $r['card_name'] : "Card") . " (" . $r['investor_id'] . ")",
            'cardId'             => $cid,
            'start_date'         => $r['start_date'],
            'maturity_date'      => $r['maturity_date'],
            'active_amount'      => floatval($r['investment_amount'] ?? 0),
            'weighted_value'     => $wv,
            'percent'            => floatval($r['percent']),
            'cardProfit'         => ($cid === $COMPANY_CARD_ID) ? 0 : $p,
            'rentalProfit'       => 0,
            'shareProfit'        => 0,
            'othersProfit'       => 0,
            'profit'             => $p,
            'deposit_this_month' => floatval($r['deposit_this_month']),
            'note'               => $r['note'] ?? null
        ];
    }
    $fetchSavedStmt->close();

    // Check if other_source_monthly_distributions was recorded
    $distStmt = $mysqli->prepare("SELECT * FROM other_source_monthly_distributions WHERE billing_month = ?");
    $savedDist = null;
    if ($distStmt) {
        $distStmt->bind_param("s", $monthKey);
        $distStmt->execute();
        $savedDist = $distStmt->get_result()->fetch_assoc();
        $distStmt->close();
    }

    $cardTotalProfitRaw = $savedDist ? floatval($savedDist['card_profit']) : $totalSavedProfit;
    $cardCompanyRaw     = round4(($cardTotalProfitRaw * $COMPANY_PERCENT) / 100);
    $cardInvestorPoolRaw= round4($cardTotalProfitRaw - $cardCompanyRaw);

    $rentalTotalProfitRaw  = $savedDist ? floatval($savedDist['rental_profit']) : 0;
    $rentalInvestorPercent = ($savedDist && isset($savedDist['rental_investor_percent'])) ? floatval($savedDist['rental_investor_percent']) : 70;
    $rentalInvestorPoolRaw = $savedDist ? floatval($savedDist['rental_investor_pool']) : 0;
    $rentalCompanyRaw      = $savedDist ? floatval($savedDist['rental_company_pool']) : 0;

    $shareTotalProfitRaw  = $savedDist ? floatval($savedDist['share_profit']) : 0;
    $shareInvestorPercent = ($savedDist && isset($savedDist['share_investor_percent'])) ? floatval($savedDist['share_investor_percent']) : 70;
    $shareInvestorPoolRaw = $savedDist ? floatval($savedDist['share_investor_pool']) : 0;
    $shareCompanyRaw      = $savedDist ? floatval($savedDist['share_company_pool']) : 0;

    $othersTotalProfitRaw = round4($rentalTotalProfitRaw + $shareTotalProfitRaw);
    if ($othersTotalProfitRaw == 0 && $savedDist) {
        $othersTotalProfitRaw = floatval($savedDist['others_profit']);
    }
    $othersInvestorPoolRaw = round4($rentalInvestorPoolRaw + $shareInvestorPoolRaw);
    if ($othersInvestorPoolRaw == 0 && $savedDist) {
        $othersInvestorPoolRaw = floatval($savedDist['others_investor_pool']);
    }
    $othersCompanyRaw = round4($rentalCompanyRaw + $shareCompanyRaw);
    if ($othersCompanyRaw == 0 && $savedDist) {
        $othersCompanyRaw = floatval($savedDist['others_company_pool']);
    }
    $othersInvestorPercent = ($savedDist && isset($savedDist['others_investor_percent'])) ? floatval($savedDist['others_investor_percent']) : $rentalInvestorPercent;

    $combinedTotalProfitRaw = round4($cardTotalProfitRaw + $othersTotalProfitRaw);
    $combinedInvestorPoolRaw = $savedDist ? floatval($savedDist['total_investor_pool']) : ($cardInvestorPoolRaw + $othersInvestorPoolRaw);
    $combinedCompanyRaw = round4($cardCompanyRaw + $othersCompanyRaw);

    $durationMs = round((microtime(true) - $startTimer) * 1000, 2);

    echo json_encode([
        'success'               => true,
        'already_saved'         => true,
        'is_locked'             => true,
        'billing_month'         => $monthKey,
        'year'                  => $year,
        'month'                 => $month,
        'cardTotalProfit'       => $cardTotalProfitRaw,
        'cardCompanyProfit'     => $cardCompanyRaw,
        'cardInvestorPool'      => $cardInvestorPoolRaw,

        'rentalTotalProfit'     => $rentalTotalProfitRaw,
        'rentalInvestorPercent' => $rentalInvestorPercent,
        'rentalInvestorPool'    => $rentalInvestorPoolRaw,
        'rentalCompanyProfit'   => $rentalCompanyRaw,
        'rentalCount'           => 0,

        'shareTotalProfit'      => $shareTotalProfitRaw,
        'shareInvestorPercent'  => $shareInvestorPercent,
        'shareInvestorPool'     => $shareInvestorPoolRaw,
        'shareCompanyProfit'    => $shareCompanyRaw,
        'shareCount'            => 0,

        'othersTotalProfit'     => $othersTotalProfitRaw,
        'othersInvestorPercent' => $othersInvestorPercent,
        'othersInvestorPool'    => $othersInvestorPoolRaw,
        'othersCompanyProfit'   => $othersCompanyRaw,
        'othersCount'           => 0,

        'totalProfit'           => $combinedTotalProfitRaw,
        'companyProfit'         => $combinedCompanyRaw,
        'investorPoolProfit'    => $combinedInvestorPoolRaw,
        'totalCompanyProfit'    => $combinedCompanyRaw,
        'totalWV'               => $totalSavedWV,
        'rows'                  => $rows,
        'execution_time_ms'     => $durationMs . ' ms (Saved Ledger)'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 1. Card Product Profit
$stmt1 = $mysqli->prepare("
    SELECT COALESCE(SUM(profit_amount), 0) AS total
    FROM installment_payments
    WHERE paid_date >= ? AND paid_date < ?
      AND NOT (card_id = 241 AND installment_no = 2)
");
$stmt1->bind_param("ss", $start, $endExclusive);
$stmt1->execute();
$cardTotalProfitRaw = floatval($stmt1->get_result()->fetch_assoc()['total'] ?? 0);
$stmt1->close();

$cardCompanyRaw = round4(($cardTotalProfitRaw * $COMPANY_PERCENT) / 100);
$cardInvestorPoolRaw = round4($cardTotalProfitRaw - $cardCompanyRaw);

// 2. Others Source Profit:
// (a) Rental / Lease Assets (bike, shop, etc.)
$stmtRental = $mysqli->prepare("
    SELECT COALESCE(SUM(c.amount), 0) AS total, COUNT(c.id) AS count
    FROM other_asset_collections c
    JOIN other_assets a ON a.id = c.asset_id
    WHERE c.billing_month = ? AND c.status = 'Paid' AND (a.category != 'company_share' OR a.category IS NULL)
");
$stmtRental->bind_param("s", $monthKey);
$stmtRental->execute();
$rentalRow = $stmtRental->get_result()->fetch_assoc();
$rentalTotalProfitRaw = floatval($rentalRow['total'] ?? 0);
$rentalCount = intval($rentalRow['count'] ?? 0);
$stmtRental->close();

// (b) Business Holding / Investment Share Profit (Equity dividend)
$stmtShare = $mysqli->prepare("
    SELECT COALESCE(SUM(c.amount), 0) AS total, COUNT(c.id) AS count
    FROM other_asset_collections c
    JOIN other_assets a ON a.id = c.asset_id
    WHERE c.billing_month = ? AND c.status = 'Paid' AND a.category = 'company_share'
");
$stmtShare->bind_param("s", $monthKey);
$stmtShare->execute();
$shareRow = $stmtShare->get_result()->fetch_assoc();
$shareTotalProfitRaw = floatval($shareRow['total'] ?? 0);
$shareCount = intval($shareRow['count'] ?? 0);
$stmtShare->close();

// Check saved config for rental/share/others %
$distStmt = $mysqli->prepare("SELECT rental_investor_percent, share_investor_percent, others_investor_percent FROM other_source_monthly_distributions WHERE billing_month = ?");
if ($distStmt) {
    $distStmt->bind_param("s", $monthKey);
    $distStmt->execute();
    $savedDist = $distStmt->get_result()->fetch_assoc();
    if ($savedDist) {
        if (!isset($_GET['rental_investor_percent']) && isset($savedDist['rental_investor_percent']) && $savedDist['rental_investor_percent'] !== null) {
            $rentalInvestorPercent = floatval($savedDist['rental_investor_percent']);
        }
        if (!isset($_GET['share_investor_percent']) && isset($savedDist['share_investor_percent']) && $savedDist['share_investor_percent'] !== null) {
            $shareInvestorPercent = floatval($savedDist['share_investor_percent']);
        }
        if (!isset($_GET['others_investor_percent']) && isset($savedDist['others_investor_percent']) && $savedDist['others_investor_percent'] !== null) {
            $othersInvestorPercent = floatval($savedDist['others_investor_percent']);
        }
    }
    $distStmt->close();
}

$rentalInvestorPoolRaw = round4(($rentalTotalProfitRaw * $rentalInvestorPercent) / 100);
$rentalCompanyRaw      = round4($rentalTotalProfitRaw - $rentalInvestorPoolRaw);

$shareInvestorPoolRaw  = round4(($shareTotalProfitRaw * $shareInvestorPercent) / 100);
$shareCompanyRaw       = round4($shareTotalProfitRaw - $shareInvestorPoolRaw);

$othersTotalProfitRaw  = round4($rentalTotalProfitRaw + $shareTotalProfitRaw);
$othersInvestorPoolRaw = round4($rentalInvestorPoolRaw + $shareInvestorPoolRaw);
$othersCompanyRaw      = round4($rentalCompanyRaw + $shareCompanyRaw);

// Combined Grand Total
$combinedTotalProfitRaw  = round4($cardTotalProfitRaw + $othersTotalProfitRaw);
$combinedInvestorPoolRaw = round4($cardInvestorPoolRaw + $othersInvestorPoolRaw);
$combinedCompanyRaw      = round4($cardCompanyRaw + $othersCompanyRaw);

// 3. Fetch Investment Cards
$cardsRes = $mysqli->query("
    SELECT id, investor_id, card_name, start_date, end_date, maturity_date, investment_amount, status
    FROM investment_cards
    ORDER BY id ASC
");
$cards = [];
while ($c = $cardsRes->fetch_assoc()) {
    $cards[] = $c;
}

// 4. Fetch and Group Installments
$cardInst = [];

// Regular installments
$stmtInst = $mysqli->prepare("
    SELECT investment_card_no AS card_id, amount, investment_date
    FROM investment_installments
    WHERE investment_date < ?
");
$stmtInst->bind_param("s", $endExclusive);
$stmtInst->execute();
$resInst = $stmtInst->get_result();
while ($row = $resInst->fetch_assoc()) {
    $cid = strval($row['card_id']);
    if (!isset($cardInst[$cid])) $cardInst[$cid] = [];
    $cardInst[$cid][] = [
        'amount' => floatval($row['amount']),
        'date'   => $row['investment_date'],
        'time'   => strtotime($row['investment_date'])
    ];
}
$stmtInst->close();

// Reinvest installments
$stmtRe = $mysqli->prepare("
    SELECT profit_card_id AS card_id, amount, investment_date
    FROM investment_profit_installments
    WHERE investment_date < ?
");
$stmtRe->bind_param("s", $endExclusive);
$stmtRe->execute();
$resRe = $stmtRe->get_result();
while ($row = $resRe->fetch_assoc()) {
    $cid = strval($row['card_id']);
    if (!isset($cardInst[$cid])) $cardInst[$cid] = [];
    $cardInst[$cid][] = [
        'amount' => floatval($row['amount']),
        'date'   => $row['investment_date'],
        'time'   => strtotime($row['investment_date'])
    ];
}
$stmtRe->close();

// 5. Calculate Weighted Values per card
$cardCalculations = [];
$totalWV = 0;

foreach ($cards as $card) {
    $cid = strval($card['id']);
    $startDate = $card['start_date'];
    $endDate = $card['end_date'];

    // isCardActiveInSelectedMonth
    $isActive = true;
    if (!$startDate || $startDate >= $endExclusive) {
        $isActive = false;
    }
    if ($endDate && $endDate < $start) {
        $isActive = false;
    }

    if (!$isActive) {
        $cardCalculations[$cid] = [
            'active' => false,
            'deposit_this_month' => 0,
            'active_amount' => 0,
            'wv' => 0
        ];
        continue;
    }

    $instList = $cardInst[$cid] ?? [];
    $depositThisMonth = 0;
    $activeAmount = 0;
    $wv = 0;

    foreach ($instList as $inst) {
        $invTime = $inst['time'];
        $amount = $inst['amount'];

        if ($invTime >= $endTime) continue;

        // active days
        if ($invTime < $startTime) {
            $days = $monthDays;
        } else {
            $days = intval(($endTime - $invTime) / 86400);
            $depositThisMonth += $amount;
        }

        $activeAmount += $amount;
        $wv += ($amount * $days);
    }

    $totalWV += $wv;
    $cardCalculations[$cid] = [
        'active' => true,
        'deposit_this_month' => $depositThisMonth,
        'active_amount' => $activeAmount,
        'wv' => $wv
    ];
}

// 6. Build Final Rows
$rows = [];
foreach ($cards as $card) {
    $cid = strval($card['id']);
    $calc = $cardCalculations[$cid];

    if (!$calc['active']) {
        $rows[] = [
            'investor_id'        => intval($card['investor_id']),
            'name'               => ($card['card_name'] ? $card['card_name'] : "Card") . " (" . $card['investor_id'] . ")",
            'cardId'             => intval($card['id']),
            'start_date'         => $card['start_date'],
            'maturity_date'      => $card['maturity_date'],
            'active_amount'      => 0,
            'weighted_value'     => 0,
            'percent'            => 0,
            'cardProfit'         => 0,
            'rentalProfit'       => 0,
            'shareProfit'        => 0,
            'othersProfit'       => 0,
            'profit'             => 0,
            'deposit_this_month' => 0,
            'note'               => null
        ];
        continue;
    }

    $wv = $calc['wv'];
    $ratio = ($totalWV > 0) ? ($wv / $totalWV) : 0;
    $percent = round4($ratio * 100);

    $cardProfit = round4($cardInvestorPoolRaw * $ratio);
    $rentalProfit = round4($rentalInvestorPoolRaw * $ratio);
    $shareProfit = round4($shareInvestorPoolRaw * $ratio);
    $othersProfit = round4($rentalProfit + $shareProfit);
    $profit = round4($cardProfit + $othersProfit);

    $note = "কার্ড: ৳" . $cardProfit . " | রেন্টাল: ৳" . $rentalProfit . " | বিজনেস শেয়ার: ৳" . $shareProfit;

    if (intval($card['id']) === $COMPANY_CARD_ID) {
        $cardProfit = round4($cardProfit + $cardCompanyRaw);
        $rentalProfit = round4($rentalProfit + $rentalCompanyRaw);
        $shareProfit = round4($shareProfit + $shareCompanyRaw);
        $othersProfit = round4($rentalProfit + $shareProfit);
        $profit = round4($cardProfit + $othersProfit);
        $totalProfitAll = $combinedTotalProfitRaw;
        $percent = ($totalProfitAll > 0) ? round4(($profit / $totalProfitAll) * 100) : 0;
        $note = "কোম্পানি অংশ (কার্ড ৫০%: ৳" . $cardCompanyRaw . " + রেন্টাল " . (100 - $rentalInvestorPercent) . "%: ৳" . $rentalCompanyRaw . " + বিজনেস শেয়ার " . (100 - $shareInvestorPercent) . "%: ৳" . $shareCompanyRaw . ")";
    }

    $rows[] = [
        'investor_id'        => intval($card['investor_id']),
        'name'               => ($card['card_name'] ? $card['card_name'] : "Card") . " (" . $card['investor_id'] . ")",
        'cardId'             => intval($card['id']),
        'start_date'         => $card['start_date'],
        'maturity_date'      => $card['maturity_date'],
        'active_amount'      => round4($calc['active_amount']),
        'weighted_value'     => round4($wv),
        'percent'            => $percent,
        'cardProfit'         => $cardProfit,
        'rentalProfit'       => $rentalProfit,
        'shareProfit'        => $shareProfit,
        'othersProfit'       => $othersProfit,
        'profit'             => $profit,
        'deposit_this_month' => round4($calc['deposit_this_month']),
        'note'               => $note
    ];
}

$executionTimeMs = round((microtime(true) - $startTimer) * 1000, 2);

echo json_encode([
    'success'               => true,
    'already_saved'         => false,
    'is_locked'             => false,
    'execution_time_ms'     => $executionTimeMs . ' ms',
    'year'                  => $year,
    'month'                 => $month,
    'cardTotalProfit'       => $cardTotalProfitRaw,
    'cardCompanyProfit'     => $cardCompanyRaw,
    'cardInvestorPool'      => $cardInvestorPoolRaw,

    'rentalTotalProfit'     => $rentalTotalProfitRaw,
    'rentalInvestorPercent' => $rentalInvestorPercent,
    'rentalInvestorPool'    => $rentalInvestorPoolRaw,
    'rentalCompanyProfit'   => $rentalCompanyRaw,
    'rentalCount'           => $rentalCount,

    'shareTotalProfit'      => $shareTotalProfitRaw,
    'shareInvestorPercent'  => $shareInvestorPercent,
    'shareInvestorPool'     => $shareInvestorPoolRaw,
    'shareCompanyProfit'    => $shareCompanyRaw,
    'shareCount'            => $shareCount,

    'othersTotalProfit'     => $othersTotalProfitRaw,
    'othersInvestorPercent' => $othersInvestorPercent,
    'othersInvestorPool'    => $othersInvestorPoolRaw,
    'othersCompanyProfit'   => $othersCompanyRaw,

    'totalProfit'           => $combinedTotalProfitRaw,
    'companyProfit'         => $combinedCompanyRaw,
    'investorPoolProfit'    => $combinedInvestorPoolRaw,
    'totalWV'               => $totalWV,
    'total_cards'           => count($rows),
    'rows'                  => $rows
], JSON_UNESCAPED_UNICODE);
