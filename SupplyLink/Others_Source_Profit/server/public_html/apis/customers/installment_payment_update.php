<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';
requireAuth();

header("Content-Type: application/json; charset=UTF-8");

function apiError($message, $debug = null, $code = 400) {
  http_response_code($code);
  echo json_encode([
    "success" => false,
    "message" => $message,
    "debug"   => $debug
  ], JSON_UNESCAPED_UNICODE);
  exit;
}

// Auto-ensure schema columns & table exist
try {
    $chk = $mysqli->query("SHOW COLUMNS FROM `installment_payments` LIKE 'extra_amount'");
    if ($chk && $chk->num_rows === 0) {
        @$mysqli->query("ALTER TABLE `installment_payments` ADD COLUMN `extra_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `due_amount`");
        @$mysqli->query("ALTER TABLE `installment_payments` ADD COLUMN `adjusted_from_extra` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `extra_amount`");
        @$mysqli->query("ALTER TABLE `installment_payments` ADD COLUMN `total_paid_cash` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `adjusted_from_extra`");
    }
    $chkCard = $mysqli->query("SHOW COLUMNS FROM `installment_cards` LIKE 'extra_balance'");
    if ($chkCard && $chkCard->num_rows === 0) {
        @$mysqli->query("ALTER TABLE `installment_cards` ADD COLUMN `extra_balance` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `per_installment_amount`");
    }
} catch (Throwable $e) {}

$input = json_decode(file_get_contents("php://input"), true);
if (!is_array($input)) apiError("Invalid JSON input");

$id                  = (int)($input['id'] ?? 0);
$paid_date           = $input['paid_date'] ?? null;
$payment_method      = $input['payment_method'] ?? null;
$receipt_number      = $input['receipt_number'] ?? null;
$status              = $input['status'] ?? null;
$reason              = $input['reason'] ?? 'পেইড কিস্তি আনপেইড করার অনুরোধ';
$extra_amount        = isset($input['extra_amount']) ? max(0, (float)$input['extra_amount']) : 0.00;
$adjusted_from_extra = isset($input['adjusted_from_extra']) ? max(0, (float)$input['adjusted_from_extra']) : 0.00;

// staff/user id who updated/collected
$collected_by   = (int)($input['signature'] ?? 0);

if ($id <= 0) apiError("Invalid installment ID");

// optional sanitize (avoid empty strings)
$paid_date = ($paid_date === "" ? null : $paid_date);
$payment_method = ($payment_method === "" ? null : $payment_method);
$receipt_number = ($receipt_number === "" ? null : $receipt_number);
$status = ($status === "" ? null : $status);

// 1. Fetch current installment and card details
$instQuery = $mysqli->prepare("
  SELECT p.id, p.card_id, p.installment_no, p.tag, p.due_amount, 
         COALESCE(p.extra_amount, 0.00) AS current_extra_amount,
         COALESCE(p.adjusted_from_extra, 0.00) AS current_adjusted_from_extra,
         COALESCE(p.total_paid_cash, 0.00) AS current_total_paid_cash,
         p.status AS current_status, p.paid_date AS current_paid_date,
         c.user_id, COALESCE(c.extra_balance, 0.00) AS card_extra_balance,
         u.name AS customer_name, u.email AS customer_email, c.product_name, c.is_daily, c.remarks AS card_remarks
  FROM installment_payments p
  LEFT JOIN installment_cards c ON p.card_id = c.id
  LEFT JOIN users u ON c.user_id = u.id
  WHERE p.id = ?
");
if (!$instQuery) apiError("Query prepare failed", $mysqli->error);
$instQuery->bind_param("i", $id);
$instQuery->execute();
$inst = $instQuery->get_result()->fetch_assoc();
$instQuery->close();

if (!$inst) apiError("Installment payment record not found", null, 404);

$current_status = $inst['current_status'] ?? 'Unpaid';
$current_paid_date = $inst['current_paid_date'] ?? null;
$due_amount = (float)($inst['due_amount'] ?? 0);
$card_id = (int)($inst['card_id'] ?? 0);
$customer_id = (int)($inst['user_id'] ?? 0);
$card_extra_balance = (float)($inst['card_extra_balance'] ?? 0);
$prev_extra = (float)($inst['current_extra_amount'] ?? 0);
$prev_adjusted = (float)($inst['current_adjusted_from_extra'] ?? 0);

// CASE A: User is trying to change Paid -> Unpaid (Revert)
// Requires Admin/Developer Approval!
if ($current_status === 'Paid' && $status === 'Unpaid') {
    // 1. Mark installment as having pending edit
    $updPend = $mysqli->prepare("UPDATE installment_payments SET has_pending_edit = 1 WHERE id = ?");
    if ($updPend) {
        $updPend->bind_param("i", $id);
        $updPend->execute();
        $updPend->close();
    }

    // 2. Insert into installment_payment_edits as pending request
    $insEdit = $mysqli->prepare("
        INSERT INTO installment_payment_edits
        (payment_id, card_id, action_type, old_status, new_status, old_paid_date, new_paid_date, amount, requested_by, request_reason, status, created_at)
        VALUES (?, ?, 'request_unpaid', 'Paid', 'Unpaid', ?, NULL, ?, ?, ?, 'pending', NOW())
    ");
    if (!$insEdit) apiError("Prepare edit request failed", $mysqli->error);
    $insEdit->bind_param("iisdis", $id, $card_id, $current_paid_date, $due_amount, $collected_by, $reason);
    $insEdit->execute();
    $new_edit_id = $mysqli->insert_id;
    $insEdit->close();

    // 3. Fetch Requester Name & Details for Notification
    $reqName = "স্টাফ";
    if ($collected_by > 0) {
        $uQ = $mysqli->prepare("SELECT name FROM users WHERE id = ?");
        if ($uQ) {
            $uQ->bind_param("i", $collected_by);
            $uQ->execute();
            $uRow = $uQ->get_result()->fetch_assoc();
            if ($uRow && !empty($uRow['name'])) $reqName = $uRow['name'];
            $uQ->close();
        }
    }

    $customer_name = $inst['customer_name'] ?: "গ্রাহক";
    $tag = $inst['tag'] ?: ($inst['installment_no'] == 0 ? "ডাউন পেমেন্ট" : "{$inst['installment_no']} কিস্তি");

    // 4. Create Notification for Admin and Developer with direct link to chart (Safe try-catch)
    try {
        $notifTitle = "কিস্তি আনপেইড করার অনুমোদন অনুরোধ";
        $notifMsg = "{$reqName} গ্রাহক {$customer_name} এর কার্ড #{$card_id} ({$tag}) আনপেইড করার অনুরোধ পাঠিয়েছেন।";
        $notifLink = "/customer/update_installment_chart?cardId={$card_id}";
        $targetRoles = "admin,developer";
        $notifType = "installment_unpaid_request";

        $insNotif = $mysqli->prepare("
            INSERT INTO notifications (target_roles, type, title, message, link, edit_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        if ($insNotif) {
            $insNotif->bind_param("sssssi", $targetRoles, $notifType, $notifTitle, $notifMsg, $notifLink, $new_edit_id);
            $insNotif->execute();
            $insNotif->close();
        }
    } catch (Throwable $notifErr) {
        error_log("Notification insert non-fatal error: " . $notifErr->getMessage());
    }

    echo json_encode([
        "success" => true,
        "pending_approval" => true,
        "message" => "পেইড কিস্তি আনপেইড করার অনুরোধটি সফলভাবে জমা হয়েছে এবং অ্যাডমিন/ডেভেলপার অনুমোদনের জন্য পাঠানো হয়েছে।",
        "updated_id" => $id,
        "status" => "pending"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// CASE B: User is marking as Paid (or updating payment details while Paid)
if ($status === 'Paid') {
    $eff_paid_date = $paid_date ?: date('Y-m-d');
    
    $mysqli->begin_transaction();

    try {
        // Anti-fraud: Atomic row lock on installment_cards to get fresh committed balance
        $cardLock = $mysqli->prepare("SELECT extra_balance FROM installment_cards WHERE id = ? FOR UPDATE");
        if (!$cardLock) throw new Exception("কার্ড লক কোয়েরি প্রস্তুত ব্যর্থ: " . $mysqli->error);
        $cardLock->bind_param("i", $card_id);
        $cardLock->execute();
        $cardLockRes = $cardLock->get_result()->fetch_assoc();
        $cardLock->close();

        if (!$cardLockRes) {
            throw new Exception("কিস্তি কার্ড পাওয়া যায়নি");
        }

        $fresh_card_extra_balance = (float)($cardLockRes['extra_balance'] ?? 0);

        // Balance and Extra Calculations
        $available_extra = $fresh_card_extra_balance;
        if ($current_status === 'Paid') {
            // Restore prior state for accurate recalculation if updating an already Paid row
            $available_extra = $fresh_card_extra_balance + $prev_adjusted - $prev_extra;
        }

        if ($adjusted_from_extra > ($available_extra + 0.01)) {
            $mysqli->rollback();
            apiError("প্রতারণা রোধ: পর্যাপ্ত অতিরিক্ত জমা ব্যালেন্স নেই! এই টাকা ইতিপূর্বে অন্য কিস্তিতে সমন্বয় বা ফেরত হয়ে গেছে। বর্তমান উপলব্ধ ব্যালেন্স: ৳ " . number_format($available_extra, 2), null, 400);
        }

        $delta = ($extra_amount - $adjusted_from_extra);
        if ($current_status === 'Paid') {
            $delta -= ($prev_extra - $prev_adjusted);
        }

        $new_card_extra_balance = max(0, $fresh_card_extra_balance + $delta);
        $total_paid_cash = max(0, ($due_amount + $extra_amount - $adjusted_from_extra));

        // Update installment row
        $stmt = $mysqli->prepare("
            UPDATE installment_payments SET
                paid_date = ?,
                payment_method = ?,
                receipt_number = ?,
                status = 'Paid',
                collected_by = ?,
                extra_amount = ?,
                adjusted_from_extra = ?,
                total_paid_cash = ?,
                has_pending_edit = 0
            WHERE id = ?
        ");
        if (!$stmt) throw new Exception("Prepare update failed: " . $mysqli->error);
        $stmt->bind_param("sssidddi", $eff_paid_date, $payment_method, $receipt_number, $collected_by, $extra_amount, $adjusted_from_extra, $total_paid_cash, $id);
        if (!$stmt->execute()) throw new Exception("Installment update failed: " . $stmt->error);
        $stmt->close();

        // Update card extra_balance
        $updCard = $mysqli->prepare("UPDATE installment_cards SET extra_balance = ? WHERE id = ?");
        if (!$updCard) throw new Exception("Prepare card balance update failed: " . $mysqli->error);
        $updCard->bind_param("di", $new_card_extra_balance, $card_id);
        if (!$updCard->execute()) throw new Exception("Card balance update failed: " . $updCard->error);
        $updCard->close();

        // Insert extra logs if deposit or adjustment occurred
        if ($extra_amount > 0 && ($extra_amount != $prev_extra || $current_status !== 'Paid')) {
            $logRem = "কিস্তি #{$inst['installment_no']} এর সাথে অতিরিক্ত জমা";
            $insLog = $mysqli->prepare("
                INSERT INTO installment_extra_logs
                (card_id, payment_id, customer_id, type, amount, previous_balance, current_balance, receipt_number, created_by, remarks, created_at)
                VALUES (?, ?, ?, 'deposit', ?, ?, ?, ?, ?, ?, NOW())
            ");
            if ($insLog) {
                $insLog->bind_param("iiidddsis", $card_id, $id, $customer_id, $extra_amount, $fresh_card_extra_balance, $new_card_extra_balance, $receipt_number, $collected_by, $logRem);
                $insLog->execute();
                $insLog->close();
            }
        }

        if ($adjusted_from_extra > 0 && ($adjusted_from_extra != $prev_adjusted || $current_status !== 'Paid')) {
            $logRem = "কিস্তি #{$inst['installment_no']} এ আগের জমা ফান্ড থেকে সমন্বয়";
            $insLog = $mysqli->prepare("
                INSERT INTO installment_extra_logs
                (card_id, payment_id, customer_id, type, amount, previous_balance, current_balance, receipt_number, created_by, remarks, created_at)
                VALUES (?, ?, ?, 'adjustment', ?, ?, ?, ?, ?, ?, NOW())
            ");
            if ($insLog) {
                $insLog->bind_param("iiidddsis", $card_id, $id, $customer_id, $adjusted_from_extra, $fresh_card_extra_balance, $new_card_extra_balance, $receipt_number, $collected_by, $logRem);
                $insLog->execute();
                $insLog->close();
            }
        }

    // Sync with Cash Management (Cash In -> Approved)
    $refId = "installment_" . $id;
    $cash_synced = false;

    $tag = $inst['tag'] ?: ($inst['installment_no'] == 0 ? "ডাউন পেমেন্ট" : "{$inst['installment_no']} কিস্তি");
    $customer_name = $inst['customer_name'] ?: "গ্রাহক";
    $product_name = $inst['product_name'] ?: "";

    $isDown = ((int)($inst['installment_no'] ?? -1) === 0) 
              || (stripos($tag, 'ডাউন') !== false) 
              || (stripos($tag, 'down') !== false);
    $category = $isDown ? 'downpayment' : 'installment';
    $purpose = $isDown ? 'ডাউন পেমেন্ট আদায়' : 'কিস্তি আদায়';
    $source = "{$customer_name} - কার্ড #{$card_id} ({$tag})";
    
    // Detailed remarks reflecting cash in Breakdown
    $remarksParts = ["রশিদ নং: " . ($receipt_number ?: 'N/A'), "মাধ্যম: " . ($payment_method ?: 'Cash')];
    $calcParts = ["কিস্তি: ৳" . number_format($due_amount)];
    if ($extra_amount > 0) {
        $calcParts[] = "অতিরিক্ত জমা: ৳" . number_format($extra_amount);
    }
    if ($adjusted_from_extra > 0) {
        $calcParts[] = "জমা থেকে সমন্বয়: -৳" . number_format($adjusted_from_extra);
    }
    $remarks_text = implode(" | ", $remarksParts) . " | " . implode(" + ", $calcParts) . " (মোট ক্যাশ: ৳" . number_format($total_paid_cash) . ")";
    $effective_date = $eff_paid_date;
    $approver = $collected_by > 0 ? $collected_by : null;

    $isCardDaily = ((int)($inst['is_daily'] ?? 0) === 1) || (strtolower(trim($inst['card_remarks'] ?? '')) === 'daily');

    // 🔥 RULE: Daily Card monthly installments don't enter Cash here
    if ($isCardDaily && !$isDown) {
        $delCash = $mysqli->prepare("DELETE FROM cash WHERE refId = ? LIMIT 1");
        if ($delCash) {
            $delCash->bind_param("s", $refId);
            $delCash->execute();
            $delCash->close();
        }
        $cash_synced = false;
    } else {
        // If cash received is 0 (100% paid from adjustment), delete any past cash entry
        if ($total_paid_cash <= 0) {
            $delCash = $mysqli->prepare("DELETE FROM cash WHERE refId = ? LIMIT 1");
            if ($delCash) {
                $delCash->bind_param("s", $refId);
                $delCash->execute();
                $delCash->close();
            }
            $cash_synced = true;
        } else {
            $chk = $mysqli->prepare("SELECT id FROM cash WHERE refId = ? LIMIT 1");
            $chk->bind_param("s", $refId);
            $chk->execute();
            $existingCash = $chk->get_result()->fetch_assoc();
            $chk->close();

            if ($existingCash) {
                $updateCash = $mysqli->prepare("
                    UPDATE cash SET
                        type = 'in',
                        source = ?,
                        purpose = ?,
                        amount = ?,
                        category = ?,
                        remarks = ?,
                        date = ?,
                        approval_status = 'approved',
                        approved_by = COALESCE(?, approved_by),
                        approved_at = COALESCE(approved_at, NOW())
                    WHERE id = ?
                ");
                if ($updateCash) {
                    $updateCash->bind_param("ssdsssii", $source, $purpose, $total_paid_cash, $category, $remarks_text, $effective_date, $approver, $existingCash['id']);
                    $updateCash->execute();
                    $updateCash->close();
                    $cash_synced = true;
                }
            } else {
                $insertCash = $mysqli->prepare("
                    INSERT INTO cash (type, source, purpose, amount, category, refId, remarks, date, createdAt, approval_status, approved_by, approved_at)
                    VALUES ('in', ?, ?, ?, ?, ?, ?, ?, NOW(), 'approved', ?, NOW())
                ");
                if ($insertCash) {
                    $insertCash->bind_param("ssdssssi", $source, $purpose, $total_paid_cash, $category, $refId, $remarks_text, $effective_date, $approver);
                    $insertCash->execute();
                    $insertCash->close();
                    $cash_synced = true;
                }
            }
        }
    }

    // Log payment in installment_payment_edits for full lifecycle audit
    $insEdit = $mysqli->prepare("
        INSERT INTO installment_payment_edits
        (payment_id, card_id, action_type, old_status, new_status, old_paid_date, new_paid_date, amount, requested_by, status, created_at)
        VALUES (?, ?, 'paid', ?, 'Paid', ?, ?, ?, ?, 'completed', NOW())
    ");
    if ($insEdit) {
        $insEdit->bind_param("iisssdi", $id, $card_id, $current_status, $current_paid_date, $eff_paid_date, $due_amount, $collected_by);
        $insEdit->execute();
        $insEdit->close();
    }

    // Insert Notification for Admin and Developer with direct chart link (Safe try-catch)
    try {
        $notifTitle = "কিস্তি আদায় সম্পন্ন";
        $notifMsg = "গ্রাহক {$customer_name} - কার্ড #{$card_id} ({$tag}) বাবদ ৳" . number_format($total_paid_cash) . " আদায় হয়েছে।";
        if ($extra_amount > 0) {
            $notifMsg .= " (অতিরিক্ত জমা: ৳" . number_format($extra_amount) . ")";
        }
        $notifLink = "/customer/update_installment_chart?cardId={$card_id}";
        $targetRoles = "admin,developer";
        $notifType = "installment_paid";

        $insNotif = $mysqli->prepare("
            INSERT INTO notifications (target_roles, type, title, message, link, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        ");
        if ($insNotif) {
            $insNotif->bind_param("sssss", $targetRoles, $notifType, $notifTitle, $notifMsg, $notifLink);
            $insNotif->execute();
            $insNotif->close();
        }
    } catch (Throwable $notifErr) {
        error_log("Case B Notification insert non-fatal error: " . $notifErr->getMessage());
    }

    // Commit atomic database updates
    $mysqli->commit();
    } catch (Throwable $dbErr) {
        $mysqli->rollback();
        apiError("পেমেন্ট আপডেট ও ব্যালেন্স সমন্বয় ব্যর্থ: " . $dbErr->getMessage(), null, 500);
    }

    // Automated Email Notification (Customer + Admin Copy) in isolated try-catch
    try {
        require_once __DIR__ . '/../helpers/mailer.php';
        $customerEmail = !empty($inst['customer_email']) ? trim($inst['customer_email']) : null;
        $collectorUser = "স্টাফ (ID: {$collected_by})";
        if ($collected_by > 0) {
            $colStmt = $mysqli->prepare("SELECT name FROM users WHERE id = ? LIMIT 1");
            if ($colStmt) {
                $colStmt->bind_param("i", $collected_by);
                $colStmt->execute();
                $cRow = $colStmt->get_result()->fetch_assoc();
                if ($cRow && !empty($cRow['name'])) $collectorUser = $cRow['name'];
                $colStmt->close();
            }
        }

        $emailData = [
            'title'      => 'কাস্টমার কিস্তি পরিশোধ রশিদ',
            'party_name' => "{$customer_name} (কার্ড #{$card_id})",
            'category'   => $purpose . ($product_name ? " - " . $product_name : ""),
            'amount'     => $total_paid_cash,
            'date'       => $eff_paid_date,
            'slip_no'    => $receipt_number ?: $tag,
            'card_id'    => $card_id,
            'collector'  => $collectorUser,
            'notes'      => 'কাস্টমার কিস্তির টাকা সফলভাবে পরিশোধিত ও ক্যাশ লেজারে যুক্ত হয়েছে।' . ($extra_amount > 0 ? " অতিরিক্ত জমা: ৳" . number_format($extra_amount) : "")
        ];
        $emailHtml = renderSupplyLinkEmailTemplate($emailData);
        $emailSubject = "কিস্তি পরিশোধ রশিদ - কার্ড #{$card_id} ({$tag})";
        sendSupplyLinkNotification($customerEmail, $emailSubject, $emailHtml, [
            'type'    => 'installment_paid',
            'title'   => $notifTitle,
            'message' => $notifMsg,
            'link'    => $notifLink,
            'user_id' => $inst['user_id'] ?? null
        ]);
    } catch (Throwable $mailErr) {
        error_log("Customer installment email non-fatal error: " . $mailErr->getMessage());
    }

    echo json_encode([
        "success" => true,
        "pending_approval" => false,
        "message" => "কিস্তি সফলভাবে পেইড করা হয়েছে এবং ক্যাশ ইন-এ যুক্ত হয়েছে।",
        "updated_id" => $id,
        "card_id" => $card_id,
        "due_amount" => $due_amount,
        "extra_amount" => $extra_amount,
        "adjusted_from_extra" => $adjusted_from_extra,
        "total_paid_cash" => $total_paid_cash,
        "card_extra_balance" => $new_card_extra_balance,
        "collected_by" => $collected_by,
        "cash_synced" => $cash_synced
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// CASE C: Already Unpaid and updating basic metadata (or initial un-paid update)
$stmt = $mysqli->prepare("
    UPDATE installment_payments SET
        paid_date = NULL,
        payment_method = ?,
        receipt_number = ?,
        status = 'Unpaid',
        collected_by = ?,
        extra_amount = 0.00,
        adjusted_from_extra = 0.00,
        total_paid_cash = 0.00,
        has_pending_edit = 0
    WHERE id = ?
");
if (!$stmt) apiError("Prepare update failed", $mysqli->error);
$stmt->bind_param("ssii", $payment_method, $receipt_number, $collected_by, $id);
if (!$stmt->execute()) apiError("Execute failed", $stmt->error, 500);
$stmt->close();

echo json_encode([
    "success" => true,
    "pending_approval" => false,
    "message" => "তথ্য সফলভাবে আপডেট হয়েছে।",
    "updated_id" => $id,
    "collected_by" => $collected_by
], JSON_UNESCAPED_UNICODE);
