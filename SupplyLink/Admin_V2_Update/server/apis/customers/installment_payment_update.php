<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../helpers/cash_helper.php';

header("Content-Type: application/json; charset=UTF-8");
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

// Ensure Installment Payment History Table Exists
$mysqli->query("
CREATE TABLE IF NOT EXISTS `installment_payment_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `payment_id` INT NOT NULL,
  `card_id` INT NOT NULL,
  `installment_no` INT NOT NULL DEFAULT 0,
  `tag` VARCHAR(100) DEFAULT NULL,
  `action` VARCHAR(100) DEFAULT 'Status Updated',
  `old_status` VARCHAR(50) DEFAULT NULL,
  `new_status` VARCHAR(50) DEFAULT NULL,
  `old_paid_date` VARCHAR(50) DEFAULT NULL,
  `new_paid_date` VARCHAR(50) DEFAULT NULL,
  `old_payment_method` VARCHAR(50) DEFAULT NULL,
  `new_payment_method` VARCHAR(50) DEFAULT NULL,
  `old_receipt_number` VARCHAR(100) DEFAULT NULL,
  `new_receipt_number` VARCHAR(100) DEFAULT NULL,
  `changes` TEXT NOT NULL,
  `edited_by_id` INT DEFAULT NULL,
  `edited_by_name` VARCHAR(255) DEFAULT 'Staff/Admin',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY (`payment_id`),
  KEY (`card_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
");

function apiError($message, $debug = null, $code = 400) {
  http_response_code($code);
  echo json_encode([
    "success" => false,
    "message" => $message,
    "debug"   => $debug
  ], JSON_UNESCAPED_UNICODE);
  exit;
}

try {
  $input = json_decode(file_get_contents("php://input"), true);
  if (!is_array($input)) apiError("Invalid JSON input");

  $id             = (int)($input['id'] ?? 0);
  $paid_date      = $input['paid_date'] ?? null;
  $payment_method = $input['payment_method'] ?? null;
  $receipt_number = $input['receipt_number'] ?? null;
  $status         = $input['status'] ?? null;
  $collected_by   = (int)($input['signature'] ?? $input['collected_by'] ?? 0);

  if ($id <= 0) apiError("Invalid installment ID");

  // Sanitize
  $paid_date      = ($paid_date === "" ? null : $paid_date);
  $payment_method = ($payment_method === "" ? null : $payment_method);
  $receipt_number = ($receipt_number === "" ? null : $receipt_number);
  $status         = ($status === "" ? null : $status);

  // 1. Fetch current (old) payment record
  $fetchStmt = $mysqli->prepare("
    SELECT id, card_id, installment_no, tag, due_amount, principal_amount, profit_amount, due_date, paid_date, payment_method, receipt_number, status, collected_by
    FROM installment_payments
    WHERE id = ?
  ");
  $fetchStmt->bind_param("i", $id);
  $fetchStmt->execute();
  $oldPayment = $fetchStmt->get_result()->fetch_assoc();
  $fetchStmt->close();

  if (!$oldPayment) {
    apiError("Installment payment record not found with ID: " . $id);
  }

  // 2. Fetch updater staff name if available
  $editorName = "Staff/Admin";
  if ($collected_by > 0) {
    $userStmt = $mysqli->prepare("SELECT name FROM users WHERE id = ? OR user_id = ? LIMIT 1");
    $userStmt->bind_param("ii", $collected_by, $collected_by);
    $userStmt->execute();
    $uRes = $userStmt->get_result()->fetch_assoc();
    if ($uRes && !empty($uRes['name'])) {
      $editorName = $uRes['name'] . " (ID: #" . $collected_by . ")";
    }
    $userStmt->close();
  }

  // 3. Detect changes
  $changes = [];
  $oldStatus = $oldPayment['status'] ?? 'Unpaid';
  $newStatus = $status ?? $oldStatus;

  if ($status !== null && $oldStatus !== $newStatus) {
    $changes[] = [
      'field' => 'Status',
      'old'   => $oldStatus,
      'new'   => $newStatus
    ];
  }

  // Always accurately compare old vs new paid date (even if new is null/unpaid)
  $oldPaidDate = !empty($oldPayment['paid_date']) ? $oldPayment['paid_date'] : 'None';
  $newPaidDate = !empty($paid_date) ? $paid_date : 'None';

  if ($oldPaidDate !== $newPaidDate) {
    $changes[] = [
      'field' => 'Paid Date',
      'old'   => $oldPaidDate,
      'new'   => $newPaidDate
    ];
  }

  $oldMethod = $oldPayment['payment_method'] ?: 'Cash';
  $newMethod = $payment_method ?: 'Cash';
  if ($payment_method !== null && $oldMethod !== $newMethod) {
    $changes[] = [
      'field' => 'Payment Method',
      'old'   => $oldMethod,
      'new'   => $newMethod
    ];
  }

  $oldReceipt = $oldPayment['receipt_number'] ?: 'None';
  $newReceipt = $receipt_number ?: 'None';
  if ($receipt_number !== null && $oldReceipt !== $newReceipt) {
    $changes[] = [
      'field' => 'Receipt Number',
      'old'   => $oldReceipt,
      'new'   => $newReceipt
    ];
  }

  // 4. Update the payment record
  $mysqli->begin_transaction();

  $sql = "
    UPDATE installment_payments SET
      paid_date = ?,
      payment_method = ?,
      receipt_number = ?,
      status = ?,
      collected_by = ?
    WHERE id = ?
  ";

  $stmt = $mysqli->prepare($sql);
  if (!$stmt) apiError("Prepare failed: " . $mysqli->error);

  $stmt->bind_param(
    "ssssii",
    $paid_date,
    $payment_method,
    $receipt_number,
    $status,
    $collected_by,
    $id
  );

  $stmt->execute();
  $stmt->close();

  // 5. Log History if any changes were made
  if (!empty($changes)) {
    $changesJson = json_encode($changes, JSON_UNESCAPED_UNICODE);
    $cardId = (int)$oldPayment['card_id'];
    $installmentNo = (int)$oldPayment['installment_no'];

    $bnNumbersMap = [
      0  => "ডাউন পেমেন্ট",
      1  => "১ম কিস্তি",
      2  => "২য় কিস্তি",
      3  => "৩য় কিস্তি",
      4  => "৪র্থ কিস্তি",
      5  => "৫ম কিস্তি",
      6  => "৬ষ্ঠ কিস্তি",
      7  => "৭ম কিস্তি",
      8  => "৮ম কিস্তি",
      9  => "৯ম কিস্তি",
      10 => "১০ম কিস্তি",
      11 => "১১তম কিস্তি",
      12 => "১২তম কিস্তি",
      13 => "১৩তম কিস্তি",
      14 => "১৪তম কিস্তি",
      15 => "১৫তম কিস্তি",
      16 => "১৬তম কিস্তি",
      17 => "১৭তম কিস্তি",
      18 => "১৮তম কিস্তি",
      19 => "১৯তম কিস্তি",
      20 => "২০তম কিস্তি",
      21 => "২১তম কিস্তি",
      22 => "২২তম কিস্তি",
      23 => "২৩তম কিস্তি",
      24 => "২৪তম কিস্তি",
    ];

    $tag = $bnNumbersMap[$installmentNo] ?? ($oldPayment['tag'] && !str_contains($oldPayment['tag'], '?') ? $oldPayment['tag'] : "কিস্তি #{$installmentNo}");

    if ($oldStatus === 'Unpaid' && $newStatus === 'Paid') {
      $actionDesc = "কিস্তি পরিশোধ (Paid) হিসেবে চিহ্নিত করা হয়েছে";
    } else if ($oldStatus === 'Paid' && $newStatus === 'Unpaid') {
      $actionDesc = "কিস্তি বাতিল করে Unpaid করা হয়েছে";
    } else {
      $actionDesc = "পেমেন্টের তথ্য পরিবর্তন করা হয়েছে";
    }

    $historyStmt = $mysqli->prepare("
      INSERT INTO installment_payment_history (
        payment_id, card_id, installment_no, tag, action,
        old_status, new_status, old_paid_date, new_paid_date,
        old_payment_method, new_payment_method, old_receipt_number, new_receipt_number,
        changes, edited_by_id, edited_by_name, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");

    $oldStatusVal = $oldPayment['status'];
    $newStatusVal = $status;
    $oldPaidDateVal = $oldPayment['paid_date'];
    $newPaidDateVal = $paid_date;
    $oldMethodVal = $oldPayment['payment_method'];
    $newMethodVal = $payment_method;
    $oldReceiptVal = $oldPayment['receipt_number'];
    $newReceiptVal = $receipt_number;

    $historyStmt->bind_param(
      "iiisssssssssssis",
      $id,
      $cardId,
      $installmentNo,
      $tag,
      $actionDesc,
      $oldStatusVal,
      $newStatusVal,
      $oldPaidDateVal,
      $newPaidDateVal,
      $oldMethodVal,
      $newMethodVal,
      $oldReceiptVal,
      $newReceiptVal,
      $changesJson,
      $collected_by,
      $editorName
    );

    $historyStmt->execute();
    $historyStmt->close();
  }

  // 6. Auto-sync with Cash In table
  $cardIdForCash = (int)$oldPayment['card_id'];
  $dueAmountForCash = (float)$oldPayment['due_amount'];
  $effectivePaidDate = !empty($paid_date) ? $paid_date : (!empty($oldPayment['paid_date']) ? $oldPayment['paid_date'] : date("Y-m-d"));
  $effectiveStatus = $status !== null ? $status : ($oldPayment['status'] ?? 'Unpaid');
  $effectiveMethod = $payment_method !== null ? $payment_method : ($oldPayment['payment_method'] ?? 'Cash');
  $effectiveReceipt = $receipt_number !== null ? $receipt_number : ($oldPayment['receipt_number'] ?? '');
  $tagForCash = !empty($oldPayment['tag']) ? $oldPayment['tag'] : "কিস্তি #{$oldPayment['installment_no']}";

  syncInstallmentPaymentCash(
    $mysqli,
    $id,
    $cardIdForCash,
    $dueAmountForCash,
    $effectivePaidDate,
    $effectiveStatus,
    $effectiveMethod,
    $effectiveReceipt,
    $collected_by,
    $tagForCash
  );

  $mysqli->commit();

  echo json_encode([
    "success"       => true,
    "message"       => "Installment updated successfully",
    "updated_id"    => $id,
    "changes_count" => count($changes),
    "history_logged"=> !empty($changes),
    "collected_by"  => $collected_by,
    "editor_name"   => $editorName
  ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
  try { $mysqli->rollback(); } catch (Throwable $t) {}
  apiError("Installment update failed: " . $e->getMessage(), null, 500);
}
