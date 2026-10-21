<?php
// require_once __DIR__ . '/../db.php';
// require_once __DIR__ . '/../cors.php';

// header("Content-Type: application/json; charset=UTF-8");
// ini_set('display_errors', 0);
// error_reporting(0);

// function jsonFail($msg, $code = 400) {
//   http_response_code($code);
//   echo json_encode(["success" => false, "message" => $msg], JSON_UNESCAPED_UNICODE);
//   exit;
// }

// function toInt($v, $def = 0) {
//   if ($v === null || $v === '') return $def;
//   $n = filter_var($v, FILTER_VALIDATE_INT);
//   return ($n === false) ? $def : (int)$n;
// }

// function cleanStr($v) {
//   return trim((string)($v ?? ''));
// }

// try {
//   if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
//     jsonFail("Invalid method. Use POST.", 405);
//   }

//   // ✅ BD timezone
//   @$mysqli->query("SET time_zone = '+06:00'");

//   // ✅ Accept JSON
//   $raw = file_get_contents("php://input");
//   $body = json_decode($raw, true);
//   if (!is_array($body)) $body = [];

//   $request_id = toInt($body['request_id'] ?? 0, 0);
//   $action     = strtolower(cleanStr($body['action'] ?? '')); // 'paid' | 'rejected'
//   $reject_reason  = cleanStr($body['reject_reason'] ?? '');
//   $payment_method = cleanStr($body['payment_method'] ?? '');

//   // ✅ accept reviewed_by from payload (fallback)
//   $payloadReviewer = toInt($body['reviewed_by'] ?? 0, 0);

//   if ($request_id <= 0) jsonFail("request_id required");
//   if (!in_array($action, ['paid', 'rejected'], true)) {
//     jsonFail("action must be 'paid' or 'rejected'");
//   }
//   if ($action === 'rejected' && $reject_reason === '') {
//     jsonFail("reject_reason required for rejected action");
//   }

//   // ✅ reviewer id: session first, else payload
//   // --- যদি তোমার প্রোজেক্টে session থাকে, এখানে বসাও ---
//   // session_start();
//   // $sessionUserId = $_SESSION['user_id'] ?? 0;
//   $sessionUserId = 0;

//   $actor_id = (int)($sessionUserId ?: $payloadReviewer);
//   if ($actor_id <= 0) jsonFail("reviewed_by required (no session user)", 401);

//   // ✅ optional: verify reviewer exists
//   $stmtChk = $mysqli->prepare("SELECT id FROM users WHERE id = ? LIMIT 1");
//   if (!$stmtChk) jsonFail("Prepare failed (reviewer check): " . $mysqli->error, 500);
//   $stmtChk->bind_param("i", $actor_id);
//   if (!$stmtChk->execute()) jsonFail("DB failed (reviewer check): " . $stmtChk->error, 500);
//   $rv = $stmtChk->get_result()->fetch_assoc();
//   if (!$rv) jsonFail("Reviewer user not found", 404);

//   // ===== transaction + row lock =====
//   $mysqli->begin_transaction();

//   $stmtL = $mysqli->prepare("
//     SELECT id, status
//     FROM investment_withdraw_requests
//     WHERE id = ?
//     FOR UPDATE
//   ");
//   if (!$stmtL) throw new Exception("Prepare failed (lock): " . $mysqli->error);
//   $stmtL->bind_param("i", $request_id);
//   if (!$stmtL->execute()) throw new Exception("Query failed (lock): " . $stmtL->error);
//   $row = $stmtL->get_result()->fetch_assoc();

//   if (!$row) {
//     $mysqli->rollback();
//     jsonFail("Request not found", 404);
//   }

//   $currentStatus = strtolower((string)$row['status']);
//   if ($currentStatus !== 'pending') {
//     $mysqli->rollback();
//     jsonFail("Only pending requests can be updated. Current: {$currentStatus}", 409);
//   }

//   if ($action === 'paid') {
//     $stmtU = $mysqli->prepare("
//       UPDATE investment_withdraw_requests
//       SET
//         status = 'paid',
//         reviewed_by = ?,
//         reviewed_at = NOW(),
//         payment_method = ?,
//         reject_reason = NULL
//       WHERE id = ?
//       LIMIT 1
//     ");
//     if (!$stmtU) throw new Exception("Prepare failed (paid): " . $mysqli->error);
//     $stmtU->bind_param("isi", $actor_id, $payment_method, $request_id);
//     if (!$stmtU->execute()) throw new Exception("Update failed (paid): " . $stmtU->error);
//   } else {
//     $stmtU = $mysqli->prepare("
//       UPDATE investment_withdraw_requests
//       SET
//         status = 'rejected',
//         reviewed_by = ?,
//         reviewed_at = NOW(),
//         reject_reason = ?,
//         payment_method = NULL
//       WHERE id = ?
//       LIMIT 1
//     ");
//     if (!$stmtU) throw new Exception("Prepare failed (reject): " . $mysqli->error);
//     $stmtU->bind_param("isi", $actor_id, $reject_reason, $request_id);
//     if (!$stmtU->execute()) throw new Exception("Update failed (reject): " . $stmtU->error);
//   }

//   $stmtR = $mysqli->prepare("
//     SELECT
//       id, investor_id, card_id, withdraw_date, requested_at,
//       total_profit, payable_amount, reason, status,
//       requested_by, reviewed_by, reviewed_at, reject_reason, payment_method,
//       created_at, updated_at
//     FROM investment_withdraw_requests
//     WHERE id = ?
//     LIMIT 1
//   ");
//   if (!$stmtR) throw new Exception("Prepare failed (readback): " . $mysqli->error);
//   $stmtR->bind_param("i", $request_id);
//   if (!$stmtR->execute()) throw new Exception("Query failed (readback): " . $stmtR->error);
//   $updated = $stmtR->get_result()->fetch_assoc();

//   $mysqli->commit();

//   echo json_encode([
//     "success" => true,
//     "message" => ($action === 'paid') ? "Marked as paid" : "Rejected",
//     "data" => $updated
//   ], JSON_UNESCAPED_UNICODE);
//   exit;

// } catch (Exception $e) {
//   if (isset($mysqli)) { @ $mysqli->rollback(); }
//   jsonFail($e->getMessage(), 500);
// }

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

  if ($request_id <= 0) jsonFail("request_id required");
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