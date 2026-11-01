<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=UTF-8");
ini_set('display_errors', 0);
error_reporting(0);

function jsonFail($msg, $code = 400) {
  http_response_code($code);
  echo json_encode(["success" => false, "message" => $msg], JSON_UNESCAPED_UNICODE);
  exit;
}

function toInt($v, $def = 0) {
  if ($v === null || $v === '') return $def;
  $n = filter_var($v, FILTER_VALIDATE_INT);
  return ($n === false) ? $def : (int)$n;
}

function toDec($v, $def = 0) {
  if ($v === null || $v === '') return $def;
  $n = filter_var($v, FILTER_VALIDATE_FLOAT);
  return ($n === false) ? $def : (float)$n;
}

function cleanStr($v) {
  return trim((string)($v ?? ''));
}

function normDate($d) {
  if (!$d) return null;
  $d = trim($d);
  if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $d)) return null;
  return $d;
}

try {
  if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    jsonFail("Invalid method. Use POST.", 405);
  }

  // ✅ BD timezone (MySQL session)
  @$mysqli->query("SET time_zone = '+06:00'");

  // ✅ Accept JSON
  $raw = file_get_contents("php://input");
  $body = json_decode($raw, true);
  if (!is_array($body)) $body = [];

  $investor_id   = toInt($body['investor_id'] ?? 0, 0);
  $card_id       = toInt($body['card_id'] ?? 0, 0);
  $withdraw_date = normDate($body['withdraw_date'] ?? '');
  $reason        = cleanStr($body['reason'] ?? '');
$maturity_date = normDate($body['maturity_date'] ?? '');

  // requested_by: prefer session user if available, else accept payload
  // উদাহরণ: session_start(); $sessionUserId = $_SESSION['user_id'] ?? 0;
  $sessionUserId = 0;
  $requested_by  = toInt($sessionUserId ?: ($body['requested_by'] ?? 0), 0);

  // optional amounts (frontend পাঠাতে পারে, backend later re-check করতে পারে)
  $total_profit   = toDec($body['total_profit'] ?? 0, 0);
  $payable_amount = toDec($body['payable_amount'] ?? 0, 0);

  // ✅ new fields
  $amount = toDec($body['amount'] ?? 0, 0);     // investment amount
  $mobile = cleanStr($body['mobile'] ?? '');    // investor mobile (optional)

  // ===== validate =====
  if ($investor_id <= 0) jsonFail("investor_id required");
  if ($card_id <= 0) jsonFail("card_id required");
  if (!$withdraw_date) jsonFail("withdraw_date invalid (YYYY-MM-DD required)");
  if ($maturity_date !== null && !$maturity_date) {
    jsonFail("maturity_date invalid (YYYY-MM-DD required)");
}
  if ($reason === '') jsonFail("reason required");
  if ($requested_by <= 0) jsonFail("requested_by required");

  // Optional: mobile basic sanitize (keep digits + +)
  if ($mobile !== '') {
    $mobile = preg_replace('/[^0-9+]/', '', $mobile);
    if (strlen($mobile) > 20) $mobile = substr($mobile, 0, 20);
  }

  // ✅ Check investor exists (users table)
  $stmtU = $mysqli->prepare("SELECT id FROM users WHERE id = ? LIMIT 1");
  if (!$stmtU) jsonFail("SQL prepare failed (users): " . $mysqli->error, 500);
  $stmtU->bind_param("i", $investor_id);
  if (!$stmtU->execute()) jsonFail("DB query failed (users): " . $stmtU->error, 500);
  $u = $stmtU->get_result()->fetch_assoc();
  if (!$u) jsonFail("Investor not found", 404);

  // ✅ Check card exists + belongs to investor (investment_cards table)
  $stmtC = $mysqli->prepare("SELECT id, investor_id FROM investment_cards WHERE id = ? LIMIT 1");
  if (!$stmtC) jsonFail("SQL prepare failed (cards): " . $mysqli->error, 500);
  $stmtC->bind_param("i", $card_id);
  if (!$stmtC->execute()) jsonFail("DB query failed (cards): " . $stmtC->error, 500);
  $card = $stmtC->get_result()->fetch_assoc();
  if (!$card) jsonFail("Card not found", 404);

  if ((int)$card['investor_id'] !== (int)$investor_id) {
    jsonFail("This card does not belong to the provided investor_id", 403);
  }

  // ✅ Prevent duplicate pending request for same card
  $stmtD = $mysqli->prepare("
    SELECT id FROM investment_withdraw_requests
    WHERE card_id = ? AND status = 'pending'
    ORDER BY id DESC LIMIT 1
  ");
  if (!$stmtD) jsonFail("SQL prepare failed (duplicate): " . $mysqli->error, 500);
  $stmtD->bind_param("i", $card_id);
  if (!$stmtD->execute()) jsonFail("DB query failed (duplicate): " . $stmtD->error, 500);
  $dup = $stmtD->get_result()->fetch_assoc();
  if ($dup) {
    jsonFail("Already has a pending withdraw request for this card (request_id: ".$dup['id'].")", 409);
  }

  // ✅ Insert request (with amount + mobile)
$sql = "
INSERT INTO investment_withdraw_requests (
    investor_id,
    card_id,
    withdraw_date,
    maturity_date,
    total_profit,
    payable_amount,
    amount,
    mobile,
    reason,
    status,
    requested_by,
    requested_at,
    created_at,
    updated_at
) VALUES (
    ?, ?,
    ?, ?,
    ?, ?,
    ?, ?,
    ?,
    'pending',
    ?,
    NOW(),
    NOW(),
    NOW()
)
";
$stmt = $mysqli->prepare($sql);

if (!$stmt) {
    jsonFail("SQL prepare failed (insert): " . $mysqli->error, 500);
}

$stmt->bind_param(
    "iissdddssi",
    $investor_id,
    $card_id,
    $withdraw_date,
    $maturity_date,
    $total_profit,
    $payable_amount,
    $amount,
    $mobile,
    $reason,
    $requested_by
);
  if (!$stmt->execute()) {
    jsonFail("DB insert failed: " . $stmt->error, 500);
  }

  $requestId = $stmt->insert_id;
  $stmt->close();

  // 🚀 Send Automated Email Notification (Admin Alert + Investor copy if email exists)
  try {
    require_once __DIR__ . '/../helpers/mailer.php';

    // 1. Fetch Investor details (name, email, mobile, etc.)
    $investorData = null;
    $stmtInv = $mysqli->prepare("SELECT id, name, mobile, email, address, id_number FROM users WHERE id = ? LIMIT 1");
    if ($stmtInv) {
      $stmtInv->bind_param("i", $investor_id);
      $stmtInv->execute();
      $investorData = $stmtInv->get_result()->fetch_assoc();
      $stmtInv->close();
    }
    if (empty($investorData)) {
      $investorData = [
        'id'     => $investor_id,
        'name'   => 'Investor #' . $investor_id,
        'mobile' => $mobile,
        'email'  => null
      ];
    }

    // 2. Fetch Card details (card_name, investment_amount, payment_type, maturity_date, etc.)
    $cardData = null;
    $stmtCard = $mysqli->prepare("SELECT id, card_name, investment_amount, payment_type, start_date, maturity_date, status FROM investment_cards WHERE id = ? LIMIT 1");
    if ($stmtCard) {
      $stmtCard->bind_param("i", $card_id);
      $stmtCard->execute();
      $cardData = $stmtCard->get_result()->fetch_assoc();
      $stmtCard->close();
    }
    if (empty($cardData)) {
      $cardData = [
        'id'                => $card_id,
        'card_name'         => 'Card #' . $card_id,
        'investment_amount' => $amount,
        'payment_type'      => 'standard',
        'maturity_date'     => $maturity_date,
        'status'            => 'active'
      ];
    }

    // 3. Fetch Requester details (name, mobile, email)
    $requestedByData = null;
    $stmtReq = $mysqli->prepare("SELECT id, name, mobile, email FROM users WHERE id = ? LIMIT 1");
    if ($stmtReq) {
      $stmtReq->bind_param("i", $requested_by);
      $stmtReq->execute();
      $requestedByData = $stmtReq->get_result()->fetch_assoc();
      $stmtReq->close();
    }
    if (empty($requestedByData)) {
      $requestedByData = [
        'id'   => $requested_by,
        'name' => 'Staff #' . $requested_by
      ];
    }

    $withdrawData = [
      'id'             => $requestId,
      'investor_id'    => $investor_id,
      'card_id'        => $card_id,
      'withdraw_date'  => $withdraw_date,
      'maturity_date'  => $maturity_date,
      'amount'         => $amount > 0 ? $amount : ($cardData['investment_amount'] ?? 0),
      'total_profit'   => $total_profit,
      'payable_amount' => $payable_amount,
      'reason'         => $reason,
      'requested_by'   => $requested_by,
      'mobile'         => !empty($investorData['mobile']) ? $investorData['mobile'] : $mobile,
      'email'          => $investorData['email'] ?? null,
    ];

    sendWithdrawRequestNotification($withdrawData, $investorData, $cardData, $requestedByData);

  } catch (Throwable $mailErr) {
    error_log("Withdraw request email notification non-fatal error: " . $mailErr->getMessage());
  }

  echo json_encode([
    "success"    => true,
    "message"    => "Withdraw request created",
    "request_id" => $requestId
  ], JSON_UNESCAPED_UNICODE);
  exit;

} catch (Exception $e) {
  jsonFail($e->getMessage(), 500);
}
