<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=UTF-8");
ini_set('display_errors', 0);
error_reporting(0);

// ✅ BD time
date_default_timezone_set("Asia/Dhaka");

function jsonFail($msg, $code = 400) {
  http_response_code($code);
  echo json_encode(["success" => false, "message" => $msg], JSON_UNESCAPED_UNICODE);
  exit;
}

try {
  if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    jsonFail("Invalid method. Use POST.", 405);
  }

  $raw = file_get_contents("php://input");
  $body = json_decode($raw, true);
  if (!is_array($body)) jsonFail("Invalid JSON body");

  $id = (int)($body['id'] ?? 0);
  $action = trim((string)($body['action'] ?? '')); // approve | reject
  $reject_reason = trim((string)($body['reject_reason'] ?? ''));

  if ($id <= 0) jsonFail("Invalid id");
  if (!in_array($action, ["approve", "reject"], true)) jsonFail("Invalid action");

  // ✅ reviewer id: session -> body reviewed_by
  $reviewed_by = (int)($_SESSION['user_id'] ?? 0);
  if ($reviewed_by <= 0) {
    $reviewed_by = (int)($body['reviewed_by'] ?? 0);
  }
  if ($reviewed_by <= 0) jsonFail("Unauthorized: reviewer id not found", 401);

  // ✅ Only pending update (safe)
  $check = $mysqli->prepare("SELECT status FROM customer_applications WHERE id = ? LIMIT 1");
  if (!$check) jsonFail("SQL prepare failed: " . $mysqli->error, 500);
  $check->bind_param("i", $id);
  if (!$check->execute()) jsonFail("DB query failed: " . $check->error, 500);

  $row = $check->get_result()->fetch_assoc();
  if (!$row) jsonFail("Application not found", 404);

  $currentStatus = $row['status'] ?? '';
  if ($currentStatus !== "pending") {
    jsonFail("Only pending applications can be updated. Current: $currentStatus", 409);
  }

  $now = date("Y-m-d H:i:s"); // BD time

  if ($action === "approve") {
    $status = "approved";

    // ✅ reject_reason null, reviewed_by/at set
    $stmt = $mysqli->prepare("
      UPDATE customer_applications
      SET status = ?,
          reviewed_by = ?,
          reviewed_at = ?,
          reject_reason = NULL
      WHERE id = ?
      LIMIT 1
    ");
    if (!$stmt) jsonFail("SQL prepare failed: " . $mysqli->error, 500);

    $stmt->bind_param("sisi", $status, $reviewed_by, $now, $id);

    if (!$stmt->execute()) jsonFail("DB update failed: " . $stmt->error, 500);

    echo json_encode([
      "success" => true,
      "message" => "Application approved",
      "id" => $id,
      "status" => $status,
      "reviewed_by" => $reviewed_by,
      "reviewed_at" => $now
    ], JSON_UNESCAPED_UNICODE);
    exit;
  }

  // ✅ reject
  if ($reject_reason === "") {
    jsonFail("Reject reason is required");
  }

  $status = "rejected";

  $stmt = $mysqli->prepare("
    UPDATE customer_applications
    SET status = ?,
        reviewed_by = ?,
        reviewed_at = ?,
        reject_reason = ?
    WHERE id = ?
    LIMIT 1
  ");
  if (!$stmt) jsonFail("SQL prepare failed: " . $mysqli->error, 500);

  $stmt->bind_param("sissi", $status, $reviewed_by, $now, $reject_reason, $id);

  if (!$stmt->execute()) jsonFail("DB update failed: " . $stmt->error, 500);

  echo json_encode([
    "success" => true,
    "message" => "Application rejected",
    "id" => $id,
    "status" => $status,
    "reviewed_by" => $reviewed_by,
    "reviewed_at" => $now,
    "reject_reason" => $reject_reason
  ], JSON_UNESCAPED_UNICODE);
  exit;

} catch (Exception $e) {
  jsonFail($e->getMessage(), 500);
}
