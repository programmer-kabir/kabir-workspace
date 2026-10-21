<?php
// cron_create_profit_history_cards_auto_dates_dbprofit.php
// - Uses each investment_cards.start_date and investment_cards.maturity_date
// - If maturity_date is NULL -> uses today's date (BD timezone) as end_date
// - totalProfit computed PRIMARY from DB:
//       SELECT SUM(COALESCE(profit_amount,0)) FROM installment_payments WHERE paid_date BETWEEN :start AND :end
//   (This is the value you requested: paid_date-based sum of profit_amount)
// - expenses still fetched via API (/expenses/getTotalExpenses.php) (tell me if you want DB fallback for expenses)
// - Uses card.total_time_wighted_value to distribute company profit
// - Replace-mode: update existing profit_history (investor_id+card_id+start_date+end_date) else insert
// - dryRun true by default (set false to actually write), flock lock, transactions, verbose logs

date_default_timezone_set('Asia/Dhaka');

// ---------- CONFIG ----------
$dbHost = 'localhost';
$dbName = 'u647959341_sl_db';
$dbUser = 'u647959341_sl_user';
$dbPass = '122333$upplyL';

$BASE_API = 'https://api.supplylinkbd.com/apis';
$dryRun = false; // TEST MODE: true = no DB writes. Set to false to insert/update for real.
// ----------------------------

function nowStr() {
    return (new DateTime('now', new DateTimeZone('Asia/Dhaka')))->format('Y-m-d H:i:s');
}

echo "[".nowStr()."] START (dryRun=" . ($dryRun ? 'true' : 'false') . ")\n";

// ---------- DB connect ----------
try {
    $pdo = new PDO("mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4",$dbUser,$dbPass,[
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    echo "[".nowStr()."] Connected DB: " . $pdo->query("select database()")->fetchColumn() . "\n";
} catch (Exception $e) {
    echo "[".nowStr()."] DB connect error: " . $e->getMessage() . "\n";
    exit(1);
}

// ---------- lock ----------
$lockFile = __DIR__ . '/cron_create_profit_history_cards_auto_dates_dbprofit.lock';
$fp = fopen($lockFile, 'c');
if (!$fp) {
    echo "[".nowStr()."] Unable to open lock file. Exiting.\n";
    exit(1);
}
if (!flock($fp, LOCK_EX | LOCK_NB)) {
    echo "[".nowStr()."] Another process is running. Exiting.\n";
    fclose($fp);
    exit(0);
}
ftruncate($fp, 0);
fwrite($fp, getmypid() . "\n");

// helper: call internal API and parse JSON safely (POST)
function callApi($url, $params = []) {
    $opts = ['http' => [
        'method' => 'POST',
        'header' => "Content-type: application/x-www-form-urlencoded\r\n",
        'content' => http_build_query($params),
        'timeout' => 60
    ]];
    $ctx = stream_context_create($opts);
    $res = @file_get_contents($url, false, $ctx);
    if ($res === false) return null;
    $j = json_decode($res, true);
    return $j;
}
function parseMoney($v) {
    if ($v === null) return 0.0;
    if (is_numeric($v)) return floatval($v);
    $s = preg_replace('/[^\d\.\-]/', '', (string)$v);
    if ($s === '') return 0.0;
    return floatval($s);
}

// today BD date (used when maturity_date is NULL)
$processDate = (new DateTime('now', new DateTimeZone('Asia/Dhaka')))->format('Y-m-d');
echo "[".nowStr()."] processDate (BD) = {$processDate}\n";

// ---------- fetch running cards ----------
$sqlCards = "SELECT * FROM investment_cards WHERE status = 'running'";
$st = $pdo->prepare($sqlCards);
$st->execute();
$cards = $st->fetchAll(PDO::FETCH_ASSOC);

if (!$cards) {
    echo "[".nowStr()."] No running cards to process.\n";
    flock($fp, LOCK_UN);
    fclose($fp);
    exit(0);
}

// ---------- get company total weight from cards ----------
$qTotal = "SELECT SUM(COALESCE(total_time_wighted_value,0)) AS total_weight_all
           FROM investment_cards
           WHERE status = 'running'";
$stmtTotal = $pdo->query($qTotal);
$totalWeightAll = floatval($stmtTotal->fetchColumn() ?: 0.0);
echo "[".nowStr()."] COMPANY totalWeightAll={$totalWeightAll}\n";

if ($totalWeightAll <= 0) {
    echo "[".nowStr()."] Company total weight is zero. Exiting.\n";
    flock($fp, LOCK_UN);
    fclose($fp);
    exit(0);
}

// Prepare statement to compute totalProfit from installment_payments by paid_date
$profitFromDbStmt = $pdo->prepare("SELECT SUM(COALESCE(profit_amount,0)) AS s FROM installment_payments WHERE paid_date BETWEEN :s AND :e");

// For each card compute profit share using card dates (or processDate if maturity NULL)
foreach ($cards as $card) {
    $cardId = $card['id'];
    $cardName = $card['card_name'] ?? 'N/A';
    echo "[".nowStr()."] PROCESS Card id={$cardId} name=\"{$cardName}\"\n";

    // choose date range from card
    $start = $card['start_date'] ?? $processDate;
    $end   = (!empty($card['maturity_date'])) ? $card['maturity_date'] : $processDate;

    // verify dates
    if (!$start || !$end) {
        echo "[".nowStr()."]  -> missing start or end for card {$cardId}. skipping.\n";
        continue;
    }

    // -----------------------
    // totalProfit: PRIMARY from DB (paid_date sum)
    try {
        $profitFromDbStmt->execute([':s' => $start, ':e' => $end]);
        $totalProfit = floatval($profitFromDbStmt->fetchColumn() ?: 0.0);
        echo "[".nowStr()."]  totalProfit from DB (installment_payments.profit_amount by paid_date) = {$totalProfit}\n";
    } catch (Exception $e) {
        echo "[".nowStr()."]  ERROR computing totalProfit from DB: ".$e->getMessage()."\n";
        continue;
    }

    // -----------------------
    // expenses via API (you can ask to add DB fallback for expenses too)
    $expApi = rtrim($BASE_API, '/') . '/expenses/getTotalExpenses.php';
    $expResp = callApi($expApi, ['start_date' => $start, 'end_date' => $end]);
    $totalExpenses = ($expResp && isset($expResp['total'])) ? parseMoney($expResp['total']) : 0.0;
    echo "[".nowStr()."]  totalExpenses={$totalExpenses}\n";

    $net = $totalProfit - $totalExpenses;
    echo "[".nowStr()."]  net={$net}\n";

    if ($net <= 0) {
        echo "[".nowStr()."]  -> net <= 0, skipping card {$cardId}\n";
        continue;
    }

    // investorsProfit = half of net
    $investorsProfit = $net / 2.0;
    $investorsProfitRounded = round($investorsProfit, 2);

    // card weight (from investment_cards.total_time_wighted_value)
    $cardWeight = floatval($card['total_time_wighted_value'] ?? 0.0);
    if ($cardWeight <= 0) {
        echo "[".nowStr()."]  -> cardWeight is zero for card {$cardId}, skipping\n";
        continue;
    }

    // percent of company weight & cardShare
    $cardPct = $cardWeight / $totalWeightAll;
    $cardShare = round($investorsProfit * $cardPct, 2);

    echo "[".nowStr()."]   cardWeight={$cardWeight} cardPct=" . round($cardPct*100,4) . "% cardShare={$cardShare}\n";

    // Determine target investor (investment_cards.investor_id)
    $investorId = $card['investor_id'];

    // Insert/update into profit_history for this investor/card with start/end from card
    echo "[".nowStr()."] MARKER-INSERT: starting insert/update for card {$cardId} investor={$investorId} (start={$start} end={$end})\n";

    try {
        if ($dryRun) {
            echo "[".nowStr()."]    DRYRUN skip update investor={$investorId} card={$cardId} amt={$cardShare} start={$start} end={$end}\n";
        } else {
            $pdo->beginTransaction();

            // check existing row (same investor/card/start/end)
            $chk = $pdo->prepare("SELECT id FROM profit_history
                                  WHERE investor_id = :inv AND card_id = :card AND start_date = :s AND end_date = :e
                                  LIMIT 1");
            $chk->execute([
                ':inv' => $investorId,
                ':card' => $cardId,
                ':s' => $start,
                ':e' => $end
            ]);
            $existing = $chk->fetch(PDO::FETCH_ASSOC);

            if ($existing) {
                // overwrite & set status NULL
                $upd = $pdo->prepare("UPDATE profit_history SET amount = :amt, status = NULL WHERE id = :id");
                $upd->execute([':amt' => $cardShare, ':id' => $existing['id']]);
                echo "[".nowStr()."]    -> UPDATED id={$existing['id']} newAmt={$cardShare}\n";
            } else {
                $ins = $pdo->prepare("INSERT INTO profit_history (investor_id, card_id, status, amount, start_date, end_date, created_at)
                                      VALUES (:inv, :card, NULL, :amt, :s, :e, NOW())");
                $ins->execute([
                    ':inv' => $investorId,
                    ':card' => $cardId,
                    ':amt' => $cardShare,
                    ':s' => $start,
                    ':e' => $end
                ]);
                $lid = $pdo->lastInsertId();
                echo "[".nowStr()."]    -> INSERTED id={$lid} amt={$cardShare}\n";
            }

            $pdo->commit();
        }
    } catch (Exception $ex) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        echo "[".nowStr()."] ERROR: Insert/Update failed for card {$cardId}: " . $ex->getMessage() . "\n";
        flock($fp, LOCK_UN);
        fclose($fp);
        exit(1);
    }
}

// finished
echo "[".nowStr()."] FINISHED\n";
flock($fp, LOCK_UN);
fclose($fp);
exit(0);
