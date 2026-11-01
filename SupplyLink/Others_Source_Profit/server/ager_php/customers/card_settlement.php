<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=UTF-8");
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$isLocal = (!isset($_SERVER['HTTPS']) || $_SERVER['HTTPS'] !== 'on') && (
    ($_SERVER['HTTP_HOST'] ?? '') === 'localhost' || 
    strpos($_SERVER['HTTP_HOST'] ?? '', '127.0.0.1') !== false ||
    strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') !== false
);

if ($isLocal) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => false,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
} else {
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => '.supplylinkbd.com',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'None',
    ]);
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function apiError($message, $debug = null, $code = 400) {
    http_response_code($code);
    echo json_encode([
        "success" => false,
        "message" => $message,
        "debug"   => $debug
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 1. Ensure Table Exists
$mysqli->query("
CREATE TABLE IF NOT EXISTS `card_settlements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `card_id` INT NOT NULL,
  `customer_id` INT NOT NULL DEFAULT 0,
  `total_original_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total_paid_before` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `remaining_due` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `final_settled_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `payment_method` VARCHAR(50) DEFAULT 'Cash',
  `settled_by` INT NOT NULL DEFAULT 0,
  `settled_by_name` VARCHAR(255) DEFAULT '',
  `settlement_date` DATE NOT NULL,
  `note` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY (`card_id`),
  KEY (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
");

// 1.0 Auto-heal tables: Fix any row with id=0 and guarantee AUTO_INCREMENT
$tablesToAutoHeal = ['card_settlements', 'cash', 'notifications', 'installment_payments', 'installment_payment_edits'];
foreach ($tablesToAutoHeal as $t) {
    try {
        $chkZero = $mysqli->query("SELECT id FROM `$t` WHERE id = 0 LIMIT 1");
        if ($chkZero && $chkZero->num_rows > 0) {
            $maxRes = $mysqli->query("SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM `$t`");
            $nextId = (int)($maxRes->fetch_assoc()['next_id'] ?? 1);
            $mysqli->query("UPDATE `$t` SET id = $nextId WHERE id = 0 LIMIT 1");
        }
        @$mysqli->query("ALTER TABLE `$t` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT");
    } catch (Throwable $e) {
        // Non-fatal if table doesn't exist yet
    }
}

// 1.1 Ensure installment_payments status column allows 'Waived'
@$mysqli->query("ALTER TABLE `installment_payments` MODIFY COLUMN `status` VARCHAR(50) NOT NULL DEFAULT 'Unpaid'");

// 1.2 Auto-heal any empty or unsettled status on settled cards
@$mysqli->query("
    UPDATE `installment_payments` ip
    INNER JOIN `card_settlements` cs ON cs.card_id = ip.card_id
    SET ip.status = 'Waived'
    WHERE (ip.status = '' OR ip.status IS NULL)
");

// 2. GET Handler (Single card settlement info OR all tracking list)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $cardId = isset($_GET['card_id']) ? (int)$_GET['card_id'] : 0;

    // Single card settlement fetch
    if ($cardId > 0) {
        $stmt = $mysqli->prepare("
            SELECT cs.*, u.name AS customer_name, u.mobile AS customer_mobile, st.name AS staff_name
            FROM card_settlements cs
            LEFT JOIN users u ON u.id = cs.customer_id
            LEFT JOIN users st ON st.id = cs.settled_by
            WHERE cs.card_id = ?
            ORDER BY cs.id DESC
            LIMIT 1
        ");
        $stmt->bind_param("i", $cardId);
        $stmt->execute();
        $settlement = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        echo json_encode([
            "success" => true,
            "settled" => !empty($settlement),
            "data"    => $settlement ?: null
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // All settled cards report / tracking list
    $stmt = $mysqli->prepare("
        SELECT 
            cs.*, 
            u.name AS customer_name, 
            u.mobile AS customer_mobile, 
            st.name AS staff_name,
            ic.card_number,
            ic.product_name,
            ic.sale_price
        FROM card_settlements cs
        LEFT JOIN users u ON u.id = cs.customer_id
        LEFT JOIN users st ON st.id = cs.settled_by
        LEFT JOIN installment_cards ic ON ic.id = cs.card_id
        ORDER BY cs.id DESC
    ");
    $stmt->execute();
    $settlements = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    $totalSettledCards = count($settlements);
    $totalOriginalDue = 0.0;
    $totalDiscountGiven = 0.0;
    $totalCashCollected = 0.0;

    foreach ($settlements as $s) {
        $totalOriginalDue += (float)$s['remaining_due'];
        $totalDiscountGiven += (float)$s['discount_amount'];
        $totalCashCollected += (float)$s['final_settled_amount'];
    }

    echo json_encode([
        "success" => true,
        "count"   => $totalSettledCards,
        "summary" => [
            "total_settled_cards"   => $totalSettledCards,
            "total_original_due"    => $totalOriginalDue,
            "total_discount_given"  => $totalDiscountGiven,
            "total_cash_collected"  => $totalCashCollected
        ],
        "data"    => $settlements
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 3. POST Handler (Process Settlement)
try {
    $input = json_decode(file_get_contents("php://input"), true);
    if (!is_array($input)) {
        apiError("Invalid JSON input");
    }

    $card_id              = (int)($input['card_id'] ?? 0);
    $discount_amount      = (float)($input['discount_amount'] ?? 0);
    $final_settled_amount = (float)($input['final_settled_amount'] ?? 0);
    $payment_method       = trim($input['payment_method'] ?? 'Cash') ?: 'Cash';
    $settlement_date      = trim($input['settlement_date'] ?? date('Y-m-d')) ?: date('Y-m-d');
    $note                 = trim($input['note'] ?? '');

    $sessionUser = (int)($_SESSION['user']['id'] ?? $_SESSION['user']['user_id'] ?? 0);
    $settled_by  = (int)($input['settled_by'] ?? $sessionUser);

    if ($card_id <= 0) {
        apiError("Invalid card ID");
    }

    if ($discount_amount < 0 || $final_settled_amount < 0) {
        apiError("Discount and settled amount cannot be negative");
    }

    // Fetch Card strictly by primary key id
    $cardStmt = $mysqli->prepare("
        SELECT id, card_number, user_id, status, sale_price, cost_price, profit, is_daily, remarks
        FROM installment_cards
        WHERE id = ?
        LIMIT 1
    ");
    $cardStmt->bind_param("i", $card_id);
    $cardStmt->execute();
    $card = $cardStmt->get_result()->fetch_assoc();
    $cardStmt->close();

    if (!$card) {
        apiError("Installment card not found for ID: " . $card_id);
    }

    $actualCardId = (int)$card['id'];
    $cardNumber   = $card['card_number'] ?: (string)$actualCardId;
    $customerId   = (int)$card['user_id'];

    // Fetch customer details
    $customerName = "গ্রাহক";
    if ($customerId > 0) {
        $cStmt = $mysqli->prepare("SELECT name FROM users WHERE id = ? LIMIT 1");
        $cStmt->bind_param("i", $customerId);
        $cStmt->execute();
        $cRow = $cStmt->get_result()->fetch_assoc();
        $cStmt->close();
        if ($cRow && !empty($cRow['name'])) {
            $customerName = $cRow['name'];
        }
    }

    // Fetch staff name
    $staffName = "Staff";
    if ($settled_by > 0) {
        $stStmt = $mysqli->prepare("SELECT name FROM users WHERE id = ? LIMIT 1");
        $stStmt->bind_param("i", $settled_by);
        $stStmt->execute();
        $stRow = $stStmt->get_result()->fetch_assoc();
        $stStmt->close();
        if ($stRow && !empty($stRow['name'])) {
            $staffName = $stRow['name'];
        }
    }

    // Fetch Installments strictly by card_id
    $payStmt = $mysqli->prepare("
        SELECT id, card_id, installment_no, tag, due_amount, principal_amount, profit_amount, status
        FROM installment_payments
        WHERE card_id = ?
        ORDER BY installment_no ASC
    ");
    $payStmt->bind_param("i", $actualCardId);
    $payStmt->execute();
    $pRes = $payStmt->get_result();

    $allPayments = [];
    $totalOriginal = 0.0;
    $totalPaidBefore = 0.0;
    $unpaidList = [];

    while ($p = $pRes->fetch_assoc()) {
        $allPayments[] = $p;
        $amt = (float)$p['due_amount'];
        $totalOriginal += $amt;
        if ($p['status'] === 'Paid') {
            $totalPaidBefore += $amt;
        } else {
            $unpaidList[] = $p;
        }
    }
    $payStmt->close();

    $remainingDue = max(0.0, $totalOriginal - $totalPaidBefore);

    // Verify amounts with tolerance
    if (abs(($discount_amount + $final_settled_amount) - $remainingDue) > 0.05) {
        $final_settled_amount = max(0.0, $remainingDue - $discount_amount);
    }

    // START TRANSACTION
    $mysqli->begin_transaction();

    // 4. Update installments using Waterfall allocation
    $costPrice = (float)$card['cost_price'];
    $salePrice = (float)$card['sale_price'];
    $costRatio = ($salePrice > 0) ? ($costPrice / $salePrice) : 0.8;

    $remainingCashToAllocate = $final_settled_amount;

    foreach ($unpaidList as $unpaidItem) {
        $pId = (int)$unpaidItem['id'];
        $originalDue = (float)$unpaidItem['due_amount'];

        if ($remainingCashToAllocate > 0) {
            if ($remainingCashToAllocate >= $originalDue) {
                $payAmount = $originalDue;
                $remainingCashToAllocate -= $originalDue;
            } else {
                $payAmount = round($remainingCashToAllocate, 2);
                $remainingCashToAllocate = 0;
            }

            $newPrincipal = round($payAmount * $costRatio, 2);
            $newProfit    = round($payAmount - $newPrincipal, 2);

            $upStmt = $mysqli->prepare("
                UPDATE installment_payments
                SET
                    due_amount = ?,
                    principal_amount = ?,
                    profit_amount = ?,
                    status = 'Paid',
                    paid_date = ?,
                    payment_method = ?,
                    collected_by = ?,
                    signature = ?
                WHERE id = ?
            ");
            $upStmt->bind_param(
                "dddssiii",
                $payAmount,
                $newPrincipal,
                $newProfit,
                $settlement_date,
                $payment_method,
                $settled_by,
                $settled_by,
                $pId
            );
            $upStmt->execute();
            $upStmt->close();
        } else {
            // Cash exhausted -> Mark remaining installments as 'Waived' (ছাড়) and zero out profit
            $upStmt = $mysqli->prepare("
                UPDATE installment_payments
                SET
                    status = 'Waived',
                    profit_amount = 0.00,
                    paid_date = NULL,
                    payment_method = NULL
                WHERE id = ?
            ");
            $upStmt->bind_param("i", $pId);
            $upStmt->execute();
            $upStmt->close();
        }
    }

    // 5. Update Card Status to Fully Paid and synchronize realized profit
    $cardUp = $mysqli->prepare("
        UPDATE installment_cards
        SET 
            status = 'Fully Paid',
            profit = (
                SELECT COALESCE(SUM(profit_amount), 0)
                FROM installment_payments
                WHERE card_id = ? AND status = 'Paid'
            )
        WHERE id = ?
    ");
    $cardUp->bind_param("ii", $actualCardId, $actualCardId);
    $cardUp->execute();
    $cardUp->close();

    // 6. Record in card_settlements
    $settleIns = $mysqli->prepare("
        INSERT INTO card_settlements (
            card_id, customer_id, total_original_amount, total_paid_before,
            remaining_due, discount_amount, final_settled_amount,
            payment_method, settled_by, settled_by_name, settlement_date, note
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $settleIns->bind_param(
        "iidddddsisss",
        $actualCardId,
        $customerId,
        $totalOriginal,
        $totalPaidBefore,
        $remainingDue,
        $discount_amount,
        $final_settled_amount,
        $payment_method,
        $settled_by,
        $staffName,
        $settlement_date,
        $note
    );
    $settleIns->execute();
    $settlementId = $settleIns->insert_id;
    $settleIns->close();

    // 7. Sync with Cash In table if actual money was collected
    $cash_synced = false;
    if ($final_settled_amount > 0) {
        $refId = "settlement_" . $actualCardId;
        $category = 'installment';
        $purpose = 'কার্ড অগ্রিম নিষ্পত্তি ও ছাড়';
        $source = "গ্রাহক: {$customerName} - কার্ড #{$cardNumber} (অগ্রিম নিষ্পত্তি)";
        $remarks_text = "মোট বকেয়া: ৳" . number_format($remainingDue, 2) . " | বিশেষ ছাড়: ৳" . number_format($discount_amount, 2) . " | নগদ আদায়: ৳" . number_format($final_settled_amount, 2) . ($note ? " | নোট: {$note}" : "");

        $chk = $mysqli->prepare("SELECT id FROM cash WHERE refId = ? LIMIT 1");
        $chk->bind_param("s", $refId);
        $chk->execute();
        $existingCash = $chk->get_result()->fetch_assoc();
        $chk->close();

        if ($existingCash) {
            $upCash = $mysqli->prepare("
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
            if ($upCash) {
                $upCash->bind_param("ssdsssii", $source, $purpose, $final_settled_amount, $category, $remarks_text, $settlement_date, $settled_by, $existingCash['id']);
                $upCash->execute();
                $upCash->close();
                $cash_synced = true;
            }
        } else {
            $inCash = $mysqli->prepare("
                INSERT INTO cash (type, source, purpose, amount, category, refId, remarks, date, createdAt, approval_status, approved_by, approved_at)
                VALUES ('in', ?, ?, ?, ?, ?, ?, ?, NOW(), 'approved', ?, NOW())
            ");
            if ($inCash) {
                $inCash->bind_param("ssdssssi", $source, $purpose, $final_settled_amount, $category, $refId, $remarks_text, $settlement_date, $settled_by);
                $inCash->execute();
                $inCash->close();
                $cash_synced = true;
            }
        }
    }

    // 8. Create Notification for Admin and Developer (Safe try-catch)
    try {
        $notifTitle = "কার্ড অগ্রিম নিষ্পত্তি সম্পন্ন";
        $notifMsg = "গ্রাহক {$customerName} এর কার্ড #{$cardNumber} বাবদ ৳" . number_format($final_settled_amount) . " আদায়ে (ছাড়: ৳" . number_format($discount_amount) . ") নিষ্পত্তি সম্পন্ন হয়েছে।";
        $notifLink = "/customers/installment_chart?cardId={$actualCardId}";
        $targetRoles = "admin,developer";
        $notifType = "card_settled";

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
        error_log("Settlement notification non-fatal error: " . $notifErr->getMessage());
    }

    // Commit Transaction
    $mysqli->commit();

    echo json_encode([
        "success" => true,
        "message" => "কার্ড অগ্রিম নিষ্পত্তি ও ছাড় সফলভাবে সম্পন্ন হয়েছে 🎉",
        "cash_synced" => $cash_synced,
        "data"    => [
            "settlement_id"        => $settlementId,
            "card_id"              => $actualCardId,
            "discount_amount"      => $discount_amount,
            "final_settled_amount" => $final_settled_amount,
            "settled_by"           => $staffName
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    if (isset($mysqli)) {
        @$mysqli->rollback();
    }
    apiError("Settlement failed: " . $e->getMessage());
}
