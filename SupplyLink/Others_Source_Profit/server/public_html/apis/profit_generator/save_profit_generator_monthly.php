<?php

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=UTF-8");

// ✅ preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

function apiError($message, $debug = null, $code = 500) {
  http_response_code($code);
  echo json_encode([
    "success" => false,
    "message" => $message,
    "debug"   => $debug
  ], JSON_UNESCAPED_UNICODE);
  exit;
}

// ================= INPUT =================
$raw  = file_get_contents("php://input");
$body = json_decode($raw, true);

if (!is_array($body)) {
  apiError("Invalid JSON payload", $raw, 400);
}

$rows = $body['rows'] ?? [];
if (!is_array($rows) || count($rows) === 0) {
  apiError("No rows provided", null, 400);
}

// ================= CONFIG (Company row note) =================
$COMPANY_INVESTOR_ID = 1;
$COMPANY_CARD_ID     = 2;   // ✅ company card id
$COMPANY_PERCENT     = 50;

$COMPANY_NOTE_BN = "কোম্পানির নীতিমালা অনুযায়ী মোট মাসিক লাভের ৫০% কোম্পানির অংশ হিসেবে সংরক্ষিত।";

// ================= SAVE =================
$inserted = 0;
$updated  = 0;
$skipped  = 0;

$mysqli->set_charset("utf8mb4");
$mysqli->begin_transaction();

try {

  // ✅ REQUIRED (run once in DB)
  // ALTER TABLE profit_generator
  //   ADD UNIQUE KEY uniq_profit (investor_id, card_id, profit_year, profit_month);

  // ✅ REQUIRED if you want note
  // ALTER TABLE profit_generator ADD COLUMN note VARCHAR(255) NULL AFTER profit_amount;

  $sql = "
    INSERT INTO profit_generator
      (investor_id, card_id, start_date, maturity_date, profit_month, profit_year,
       weight_value, percent, amount, profit_amount, status, note)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      start_date    = VALUES(start_date),
      maturity_date = VALUES(maturity_date),
      weight_value  = VALUES(weight_value),
      percent       = VALUES(percent),
      amount        = VALUES(amount),
      profit_amount = VALUES(profit_amount),
      status        = VALUES(status),
      note          = VALUES(note)
  ";

  $stmt = $mysqli->prepare($sql);
  if (!$stmt) throw new Exception("Prepare failed: " . $mysqli->error);

  $allowedStatus = ['pending', 'withdraw', 'auto_reinvest', 'user_reinvest', 'forfeited'];

  foreach ($rows as $r) {

    $investor_id = (int)($r['investor_id'] ?? 0);
    $card_id     = (int)($r['card_id'] ?? 0);

    $start_date    = $r['start_date'] ?? null;     // 'YYYY-MM-DD'
    $maturity_date = $r['maturity_date'] ?? null;  // 'YYYY-MM-DD'

    $profit_month = (int)($r['profit_month'] ?? 0); // 1-12
    $profit_year  = (int)($r['profit_year'] ?? 0);

    $weight_value  = (float)($r['weight_value'] ?? 0);
    $percent       = (float)($r['percent'] ?? 0);
    $amount        = (float)($r['amount'] ?? 0);
    $profit_amount = (float)($r['profit_amount'] ?? 0);

    $status = (string)($r['status'] ?? 'pending');
    if (!in_array($status, $allowedStatus, true)) $status = 'pending';

    // ✅ base validation
    if ($investor_id <= 0 || $card_id <= 0 || $profit_year <= 0 || $profit_month < 1 || $profit_month > 12) {
      $skipped++;
      continue;
    }

    // ================= UPDATED SKIP RULE =================
    // company row identify
    $isCompanyRow = ($investor_id === $COMPANY_INVESTOR_ID && $card_id === $COMPANY_CARD_ID);

    // ✅ Company row: profit থাকলে কখনো skip হবে না
    if ($isCompanyRow) {
      if ($profit_amount <= 0) {
        $skipped++;
        continue;
      }
    } else {
      // ✅ Others: old rule
      // amount = 0 AND weight_value = 0 => skip
      if ($amount <= 0 && $weight_value <= 0) {
        $skipped++;
        continue;
      }
    }
    // ====================================================

    // ✅ NOTE: preserve audit note from payload if provided
    $note = !empty($r['note']) ? (string)$r['note'] : null;
    if (!$note && $isCompanyRow) {
      $note = $COMPANY_NOTE_BN;
    }

    $stmt->bind_param(
      "iissiiddddss",
      $investor_id,
      $card_id,
      $start_date,
      $maturity_date,
      $profit_month,
      $profit_year,
      $weight_value,
      $percent,
      $amount,
      $profit_amount,
      $status,
      $note
    );

    if (!$stmt->execute()) {
      throw new Exception("Execute failed: " . $stmt->error);
    }

    // UPSERT affected_rows:
    // insert => 1
    // update => 2
    // no-op update => 0
    if ($stmt->affected_rows === 1) $inserted++;
    else if ($stmt->affected_rows === 2) $updated++;
    else $skipped++;
  }

  $stmt->close();
  $mysqli->commit();

  echo json_encode([
    "success"  => true,
    "total"    => count($rows),
    "inserted" => $inserted,
    "updated"  => $updated,
    "skipped"  => $skipped
  ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
  $mysqli->rollback();
  apiError("Save failed", $e->getMessage(), 500);
}
