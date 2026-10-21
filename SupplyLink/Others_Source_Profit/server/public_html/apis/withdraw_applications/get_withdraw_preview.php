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

try {
  if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    jsonFail("Invalid method. Use GET.", 405);
  }

  // ✅ BD timezone (MySQL session)
  @$mysqli->query("SET time_zone = '+06:00'");

  // ✅ No params/query required (fixed default limit)
  $LIMIT = 200;

  $sql = "
    SELECT
      r.id,
      r.investor_id,
      inv.name AS investor_name,
      r.card_id,
      c.card_name,
      c.status AS card_status,

      r.withdraw_date,
      r.requested_at,

      r.total_profit,
      r.payable_amount,
      r.amount,
      r.mobile,
    r.maturity_date,
      r.reason,
      r.status,

      r.requested_by,
      req.name AS requested_by_name,

      r.reviewed_by,
      rev.name AS reviewed_by_name,

      r.reviewed_at,
      r.reject_reason,

      r.payment_method,

      r.created_at,
      r.updated_at
    FROM investment_withdraw_requests r
    LEFT JOIN users inv ON inv.id = r.investor_id
    LEFT JOIN users req ON req.id = r.requested_by
    LEFT JOIN users rev ON rev.id = r.reviewed_by
    LEFT JOIN investment_cards c ON c.id = r.card_id
    ORDER BY r.id DESC
    LIMIT ?
  ";

  $stmt = $mysqli->prepare($sql);
  if (!$stmt) jsonFail("SQL prepare failed: " . $mysqli->error, 500);

  $stmt->bind_param("i", $LIMIT);
  if (!$stmt->execute()) jsonFail("DB query failed: " . $stmt->error, 500);

  $res = $stmt->get_result();
  $rows = [];
  while ($row = $res->fetch_assoc()) {
    // ✅ normalize numeric fields as string/float safe (optional)
    // keep as-is if you prefer exact decimals from DB
    $rows[] = $row;
  }

  echo json_encode([
    "success" => true,
    "count" => count($rows),
    "data" => $rows
  ], JSON_UNESCAPED_UNICODE);
  exit;

} catch (Exception $e) {
  jsonFail($e->getMessage(), 500);
}
