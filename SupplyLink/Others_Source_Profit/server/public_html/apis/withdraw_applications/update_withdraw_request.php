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

function cleanStr($v) {
  return trim((string)($v ?? ''));
}

try {
  if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    jsonFail("Invalid method. Use POST.", 405);
  }

  @$mysqli->query("SET time_zone = '+06:00'");

  $raw = file_get_contents("php://input");
  $body = json_decode($raw, true);
  if (!is_array($body)) $body = [];

  $request_id = toInt($body['request_id'] ?? 0, 0);
  $action     = strtolower(cleanStr($body['action'] ?? ''));
  $reject_reason  = cleanStr($body['reject_reason'] ?? '');
  $payment_method = cleanStr($body['payment_method'] ?? '');

  $payloadReviewer = toInt($body['reviewed_by'] ?? 0, 0);

  if (!isset($body['request_id']) || $body['request_id'] === '' || $request_id < 0) {
    jsonFail("request_id required");
  }
  if (!in_array($action, ['paid', 'rejected'], true)) {
    jsonFail("action must be 'paid' or 'rejected'");
  }
  if ($action === 'rejected' && $reject_reason === '') {
    jsonFail("reject_reason required for rejected action");
  }

  $actor_id = (int)$payloadReviewer;
  if ($actor_id <= 0) jsonFail("reviewed_by required", 401);

  // reviewer check
  $stmtChk = $mysqli->prepare("SELECT id FROM users WHERE id = ? LIMIT 1");
  $stmtChk->bind_param("i", $actor_id);
  $stmtChk->execute();
  $rv = $stmtChk->get_result()->fetch_assoc();
  if (!$rv) jsonFail("Reviewer user not found", 404);

  // ================= TRANSACTION =================
  $mysqli->begin_transaction();

  // 🔥 card_id সহ data lock
  $stmtL = $mysqli->prepare("
    SELECT id, status, card_id
    FROM investment_withdraw_requests
    WHERE id = ?
    FOR UPDATE
  ");
  $stmtL->bind_param("i", $request_id);
  $stmtL->execute();
  $row = $stmtL->get_result()->fetch_assoc();

  if (!$row) {
    $mysqli->rollback();
    jsonFail("Request not found", 404);
  }

  if (strtolower($row['status']) !== 'pending') {
    $mysqli->rollback();
    jsonFail("Only pending requests allowed", 409);
  }

  $card_id = (int)$row['card_id'];

  // ================= ACTION =================
  if ($action === 'paid') {

    // ✅ update withdraw
    $stmtU = $mysqli->prepare("
      UPDATE investment_withdraw_requests
      SET
        status = 'paid',
        reviewed_by = ?,
        reviewed_at = NOW(),
        payment_method = ?,
        reject_reason = NULL
      WHERE id = ?
      LIMIT 1
    ");
    $stmtU->bind_param("isi", $actor_id, $payment_method, $request_id);
    if (!$stmtU->execute()) {
      throw new Exception("Withdraw update failed");
    }

    // 🔥 AUTO CLOSE CARD + END DATE
    if ($card_id > 0) {
      $stmtC = $mysqli->prepare("
        UPDATE investment_cards
        SET 
          status = 'closed',
          end_date = NOW()
        WHERE id = ?
        LIMIT 1
      ");
      $stmtC->bind_param("i", $card_id);
      if (!$stmtC->execute()) {
        throw new Exception("Card close failed");
      }
    }

  } else {

    // ❌ rejected
    $stmtU = $mysqli->prepare("
      UPDATE investment_withdraw_requests
      SET
        status = 'rejected',
        reviewed_by = ?,
        reviewed_at = NOW(),
        reject_reason = ?,
        payment_method = NULL
      WHERE id = ?
      LIMIT 1
    ");
    $stmtU->bind_param("isi", $actor_id, $reject_reason, $request_id);
    if (!$stmtU->execute()) {
      throw new Exception("Reject failed");
    }
  }

  // ✅ read updated data
  $stmtR = $mysqli->prepare("
    SELECT *
    FROM investment_withdraw_requests
    WHERE id = ?
    LIMIT 1
  ");
  $stmtR->bind_param("i", $request_id);
  $stmtR->execute();
  $updated = $stmtR->get_result()->fetch_assoc();

  $mysqli->commit();

  // 🚀 Send Automated Email Notification (Admin Alert + Investor copy if email exists)
  try {
    require_once __DIR__ . '/../helpers/mailer.php';

    // 1. Fetch Investor details
    $investorId = (int)($updated['investor_id'] ?? 0);
    $investorData = null;
    if ($investorId > 0) {
      $stmtInv = $mysqli->prepare("SELECT id, name, mobile, email, address, id_number FROM users WHERE id = ? LIMIT 1");
      if ($stmtInv) {
        $stmtInv->bind_param("i", $investorId);
        $stmtInv->execute();
        $investorData = $stmtInv->get_result()->fetch_assoc();
        $stmtInv->close();
      }
    }
    if (empty($investorData)) {
      $investorData = [
        'id'     => $investorId,
        'name'   => 'Investor #' . $investorId,
        'mobile' => $updated['mobile'] ?? null,
        'email'  => null
      ];
    }

    // 2. Fetch Card details
    $cId = (int)($updated['card_id'] ?? $card_id);
    $cardData = null;
    if ($cId > 0) {
      $stmtCard = $mysqli->prepare("SELECT id, card_name, investment_amount, payment_type, start_date, maturity_date, status FROM investment_cards WHERE id = ? LIMIT 1");
      if ($stmtCard) {
        $stmtCard->bind_param("i", $cId);
        $stmtCard->execute();
        $cardData = $stmtCard->get_result()->fetch_assoc();
        $stmtCard->close();
      }
    }
    if (empty($cardData)) {
      $cardData = [
        'id'                => $cId,
        'card_name'         => 'Card #' . $cId,
        'investment_amount' => $updated['amount'] ?? 0,
        'payment_type'      => 'standard',
        'status'            => ($action === 'paid' ? 'closed' : 'active')
      ];
    }

    // 3. Fetch Reviewer details
    $reviewerData = null;
    if ($actor_id > 0) {
      $stmtRev = $mysqli->prepare("SELECT id, name, mobile, email FROM users WHERE id = ? LIMIT 1");
      if ($stmtRev) {
        $stmtRev->bind_param("i", $actor_id);
        $stmtRev->execute();
        $reviewerData = $stmtRev->get_result()->fetch_assoc();
        $stmtRev->close();
      }
    }
    if (empty($reviewerData)) {
      $reviewerData = [
        'id'   => $actor_id,
        'name' => 'Staff #' . $actor_id
      ];
    }

    $extraNotes = ($action === 'rejected') ? $reject_reason : $payment_method;
    sendWithdrawDecisionNotification($action, $updated, $investorData, $cardData, $reviewerData, $extraNotes);

  } catch (Throwable $mailErr) {
    error_log("Withdraw decision notification non-fatal error: " . $mailErr->getMessage());
  }

  echo json_encode([
    "success" => true,
    "message" => ($action === 'paid') 
        ? "Marked as paid + card closed + end_date set" 
        : "Rejected",
    "data" => $updated
  ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
  if (isset($mysqli)) $mysqli->rollback();
  jsonFail($e->getMessage(), 500);
}