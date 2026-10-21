<?php

date_default_timezone_set('Asia/Dhaka');

$DB_HOST = "localhost";
$DB_NAME = 'u647959341_sl_db';
$DB_USER = 'u647959341_sl_user';
$DB_PASS = '122333$upplyL';

$COMPANY_PERCENT = 50; // ✅ company cut

function ymd($d){ return (new DateTime($d))->format("Y-m-d"); }
function round4($n){ return round((float)$n, 4); }

/**
 * rounding adjust: sum(rows.profit_amount) == pool (to 4 decimals)
 * diff add to max profit row
 */
function adjustRoundingToMatchPool4(array $rows, float $pool): array {
  $sum = 0.0;
  foreach ($rows as &$r) {
    $r['profit_amount'] = round4($r['profit_amount'] ?? 0);
    $sum += $r['profit_amount'];
  }
  unset($r);

  $sum = round4($sum);
  $diff = round4(round4($pool) - $sum);

  if (!$rows || $diff == 0.0) return $rows;

  $best = 0;
  for ($i=1; $i<count($rows); $i++){
    if ((float)$rows[$i]['profit_amount'] > (float)$rows[$best]['profit_amount']) $best = $i;
  }
  $rows[$best]['profit_amount'] = round4((float)$rows[$best]['profit_amount'] + $diff);
  return $rows;
}

$dsn = "mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4";
$pdo = new PDO($dsn, $DB_USER, $DB_PASS, [
  PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
  PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);

// ✅ আজ mature হওয়া cards
$cards = $pdo->query("
  SELECT id, start_date, maturity_date
  FROM investment_cards
  WHERE maturity_date = CURDATE()
    AND status='running'
")->fetchAll();

if (!$cards) { echo "No maturity cards today\n"; exit; }

/**
 * A) investor WV (ONLY this card, date filtered)
 * weight_value এখান থেকে আসবে (চেঞ্জ করব না)
 */
$qInvWV = $pdo->prepare("
  SELECT investor_id,
         COALESCE(SUM(time_wighted_value),0) AS wv
  FROM investment_installments
  WHERE investment_card_no = :card_id
    AND investment_date BETWEEN :start_date AND :end_date
  GROUP BY investor_id
");

/**
 * B) global totalWV (ALL cards, same date range)
 * percent denominator
 */
$qGlobalTotalWV = $pdo->prepare("
  SELECT COALESCE(SUM(time_wighted_value),0) AS totalWV
  FROM investment_installments
  WHERE investment_date BETWEEN :start_date AND :end_date
");

/**
 * C) total paid profit (installment_payments) by paid_date range
 * ✅ তোমার কথামতো paid_date ধরে range
 */
$qPaidProfit = $pdo->prepare("
  SELECT COALESCE(SUM(profit_amount),0) AS total_profit
  FROM installment_payments
  WHERE status='Paid'
    AND paid_date BETWEEN :start_date AND :end_date
");

/**
 * UPSERT:
 * - weight_value update হবে না
 * - percent, total_wv, profit_amount update হবে
 */
$upsert = $pdo->prepare("
  INSERT INTO profit_generator
    (investor_id, card_id, start_date, maturity_date, weight_value, total_wv, percent, profit_amount, status)
  VALUES
    (:investor_id, :card_id, :start_date, :maturity_date, :weight_value, :total_wv, :percent, :profit_amount, 'pending')
  ON DUPLICATE KEY UPDATE
    total_wv = VALUES(total_wv),
    percent = VALUES(percent),
    profit_amount = VALUES(profit_amount),
    status = 'pending'
");

foreach ($cards as $c) {
  $cardId = (int)$c['id'];
  $startDate = ymd($c['start_date']);
  $endDate   = ymd($c['maturity_date']);

  // 1) global totalWV
  $qGlobalTotalWV->execute([':start_date'=>$startDate, ':end_date'=>$endDate]);
  $globalTotalWV = (float)$qGlobalTotalWV->fetchColumn();
  if ($globalTotalWV <= 0) {
    echo "card_id={$cardId} globalTotalWV=0 skip\n";
    continue;
  }

  // 2) total paid profit in range
  $qPaidProfit->execute([':start_date'=>$startDate, ':end_date'=>$endDate]);
  $totalProfit = (float)$qPaidProfit->fetchColumn();

  $companyProfit = ($totalProfit * $COMPANY_PERCENT) / 100.0;
  $poolProfit = $totalProfit - $companyProfit;

  $totalProfit = round4($totalProfit);
  $companyProfit = round4($companyProfit);
  $poolProfit = round4($poolProfit);

  // 3) this card investor WV list
  $qInvWV->execute([
    ':card_id'=>$cardId,
    ':start_date'=>$startDate,
    ':end_date'=>$endDate,
  ]);
  $invRows = $qInvWV->fetchAll();
  if (!$invRows) {
    echo "card_id={$cardId} no investors\n";
    continue;
  }

  // 4) compute percent + profit for each investor
  $rows = [];
  foreach ($invRows as $r) {
    $invId = (int)$r['investor_id'];
    $wv = (float)$r['wv'];

    $percent = round4(($wv / $globalTotalWV) * 100);
    $invProfit = round4($poolProfit * ($percent / 100));

    $rows[] = [
      'investor_id' => $invId,
      'weight_value' => (int)$wv, 
      'total_wv' => (int)$globalTotalWV,
      'percent' => $percent,
      'profit_amount' => $invProfit,
    ];
  }

  // ✅ rounding adjust so sum(profit_amount) == poolProfit (4 decimals)
  $rows = adjustRoundingToMatchPool4($rows, $poolProfit);

  // 5) save
  foreach ($rows as $r) {
    $upsert->execute([
      ':investor_id'   => $r['investor_id'],
      ':card_id'       => $cardId,
      ':start_date'    => $startDate,
      ':maturity_date' => $endDate,
      ':weight_value'  => $r['weight_value'],
      ':total_wv'      => $r['total_wv'],
      ':percent'       => $r['percent'],
      ':profit_amount' => $r['profit_amount'],
    ]);

    echo "card={$cardId} inv={$r['investor_id']} wv={$r['weight_value']} totalWV={$r['total_wv']} percent={$r['percent']} pool={$poolProfit} profit={$r['profit_amount']}\n";
  }

  echo "CARD={$cardId} totalProfit={$totalProfit} company={$companyProfit} pool={$poolProfit}\n";
}

