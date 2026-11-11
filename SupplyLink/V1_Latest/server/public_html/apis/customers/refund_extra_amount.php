<?php
// refund_extra_amount.php - Refund customer's extra/advance installment balance
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';
guardEntryOnly();

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

$input = json_decode(file_get_contents("php://input"), true);
if (!is_array($input)) apiError("Invalid JSON input");

$card_id        = (int)($input['card_id'] ?? 0);
$refund_amount  = (float)($input['refund_amount'] ?? 0);
$payment_method = trim($input['payment_method'] ?? 'Cash');
$receipt_number = trim($input['receipt_number'] ?? '');
$remarks        = trim($input['remarks'] ?? 'গ্রাহককে অতিরিক্ত জমার টাকা ফেরত');
$signature      = (int)($input['signature'] ?? 0);
$refund_date    = !empty($input['refund_date']) ? $input['refund_date'] : date('Y-m-d');

if ($card_id <= 0) apiError("অবৈধ কার্ড আইডি");
if ($refund_amount <= 0) apiError("ফেরতের পরিমাণ অবশ্যই ০ এর বেশি হতে হবে");

$mysqli->begin_transaction();

try {
    // 1. Fetch current card and customer details with atomic row lock
    $cardQuery = $mysqli->prepare("
        SELECT ic.id, ic.card_number, ic.user_id, COALESCE(ic.extra_balance, 0.00) AS extra_balance,
               u.name AS customer_name, u.mobile AS customer_mobile
        FROM installment_cards ic
        LEFT JOIN users u ON u.id = ic.user_id
        WHERE ic.id = ?
        FOR UPDATE
    ");
    if (!$cardQuery) throw new Exception("Query prepare failed: " . $mysqli->error);
    $cardQuery->bind_param("i", $card_id);
    $cardQuery->execute();
    $card = $cardQuery->get_result()->fetch_assoc();
    $cardQuery->close();

    if (!$card) {
        $mysqli->rollback();
        apiError("কিস্তি কার্ড পাওয়া যায়নি", null, 404);
    }

    $prev_balance = (float)$card['extra_balance'];
    if ($refund_amount > ($prev_balance + 0.01)) {
        $mysqli->rollback();
        apiError("প্রতারণা রোধ: পর্যাপ্ত অতিরিক্ত জমা ব্যালেন্স নেই! বর্তমানে এই কার্ডে অবশিষ্ট জমা আছে ৳ " . number_format($prev_balance, 2), null, 400);
    }

    $new_balance = max(0, $prev_balance - $refund_amount);
    $customer_name = !empty($card['customer_name']) ? $card['customer_name'] : "গ্রাহক";
    $card_number = !empty($card['card_number']) ? $card['card_number'] : $card_id;
    // 2. Update card extra_balance
    $updCard = $mysqli->prepare("UPDATE installment_cards SET extra_balance = ? WHERE id = ?");
    if (!$updCard) throw new Exception("Prepare card update failed: " . $mysqli->error);
    $updCard->bind_param("di", $new_balance, $card_id);
    if (!$updCard->execute()) throw new Exception("Card balance update failed: " . $updCard->error);
    $updCard->close();

    // 3. Create Cash Out voucher in cash table
    $refId = "extra_refund_" . $card_id . "_" . time();
    $cashSource = "{$customer_name} - কার্ড #{$card_number} (অতিরিক্ত টাকা ফেরত)";
    $cashPurpose = "অতিরিক্ত কিস্তির টাকা ফেরত";
    $cashCategory = "refund";
    $remarks_text = "মাধ্যম: " . ($payment_method ?: 'Cash') . ($receipt_number ? " | রশিদ: {$receipt_number}" : "") . " | " . $remarks;
    $approver = $signature > 0 ? $signature : null;

    $insCash = $mysqli->prepare("
        INSERT INTO cash (type, source, purpose, amount, category, refId, remarks, date, createdAt, approval_status, approved_by, approved_at)
        VALUES ('out', ?, ?, ?, ?, ?, ?, ?, NOW(), 'approved', ?, NOW())
    ");
    if (!$insCash) throw new Exception("Prepare cash insert failed: " . $mysqli->error);
    $insCash->bind_param("ssdssssi", $cashSource, $cashPurpose, $refund_amount, $cashCategory, $refId, $remarks_text, $refund_date, $approver);
    if (!$insCash->execute()) throw new Exception("Cash out insert failed: " . $insCash->error);
    $cash_id = $mysqli->insert_id;
    $insCash->close();

    // 4. Log in installment_extra_logs
    $insLog = $mysqli->prepare("
        INSERT INTO installment_extra_logs
        (card_id, payment_id, customer_id, type, amount, previous_balance, current_balance, cash_id, receipt_number, created_by, remarks, created_at)
        VALUES (?, NULL, ?, 'refund', ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    if (!$insLog) throw new Exception("Prepare log insert failed: " . $mysqli->error);
    $customerId = (int)($card['user_id'] ?? 0);
    $insLog->bind_param("iidddisis", $card_id, $customerId, $refund_amount, $prev_balance, $new_balance, $cash_id, $receipt_number, $signature, $remarks);
    if (!$insLog->execute()) throw new Exception("Log insert failed: " . $insLog->error);
    $log_id = $mysqli->insert_id;
    $insLog->close();

    // 5. Create notification for admin & developer
    try {
        $staffName = "স্টাফ";
        if ($signature > 0) {
            $uQ = $mysqli->prepare("SELECT name FROM users WHERE id = ?");
            if ($uQ) {
                $uQ->bind_param("i", $signature);
                $uQ->execute();
                $uRow = $uQ->get_result()->fetch_assoc();
                if (!empty($uRow['name'])) $staffName = $uRow['name'];
                $uQ->close();
            }
        }
        $notifTitle = "অতিরিক্ত কিস্তির টাকা নগদ ফেরত";
        $notifMsg = "{$staffName} গ্রাহক {$customer_name} এর কার্ড #{$card_number} থেকে অতিরিক্ত জমার ৳" . number_format($refund_amount) . " নগদ ফেরত দিয়েছেন।";
        $notifLink = "/customer/update_installment_chart?cardId={$card_id}";
        $targetRoles = "admin,developer,manager";
        $notifType = "installment_extra_refund";

        $insNotif = $mysqli->prepare("
            INSERT INTO notifications (target_roles, type, title, message, link, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        ");
        if ($insNotif) {
            $insNotif->bind_param("sssss", $targetRoles, $notifType, $notifTitle, $notifMsg, $notifLink);
            $insNotif->execute();
            $insNotif->close();
        }
    } catch (Throwable $notifErr) {}

    $mysqli->commit();

    echo json_encode([
        "success" => true,
        "message" => "গ্রাহকের অতিরিক্ত জমার ৳ " . number_format($refund_amount) . " সফলভাবে ক্যাশ আউট করে ফেরত দেওয়া হয়েছে।",
        "card_id" => $card_id,
        "refund_amount" => $refund_amount,
        "previous_balance" => $prev_balance,
        "current_balance" => $new_balance,
        "cash_id" => $cash_id,
        "log_id" => $log_id
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    $mysqli->rollback();
    apiError("ফেরত সম্পন্ন করা যায়নি: " . $e->getMessage(), null, 500);
}

