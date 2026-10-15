<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../helpers/cash_helper.php';

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

// 1.1 Ensure installment_payments status column allows 'Waived'
@$mysqli->query("ALTER TABLE `installment_payments` MODIFY COLUMN `status` VARCHAR(50) NOT NULL DEFAULT 'Unpaid'");

// 1.2 Auto-heal any empty or unsettled status on settled cards
@$mysqli->query("
    UPDATE `installment_payments` ip
    INNER JOIN `card_settlements` cs ON cs.card_id = ip.card_id
    SET ip.status = 'Waived'
    WHERE ip.status = '' OR ip.status IS NULL
");

// 2. GET handler (Fetch settlement info or all tracking list)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $cardId = isset($_GET['card_id']) ? (int)$_GET['card_id'] : 0;

    // Single card settlement fetch
    if ($cardId > 0) {
        $stmt = $mysqli->prepare("
            SELECT cs.*, u.name AS customer_name, u.mobile AS customer_mobile, st.name AS staff_name
            FROM card_settlements cs
            LEFT JOIN users u ON u.user_id = cs.customer_id
            LEFT JOIN users st ON st.user_id = cs.settled_by
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
            ic.product_name,
            ic.sale_price
        FROM card_settlements cs
        LEFT JOIN users u ON u.user_id = cs.customer_id
        LEFT JOIN users st ON st.user_id = cs.settled_by
        LEFT JOIN installment_cards ic ON ic.card_id = cs.card_id
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

// 3. POST handler (Process settlement)
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

    $sessionUser = (int)($_SESSION['user']['user_id'] ?? $_SESSION['user']['id'] ?? 0);
    $settled_by  = (int)($input['settled_by'] ?? $sessionUser);

    if ($card_id <= 0) {
        apiError("Invalid card ID");
    }

    if ($discount_amount < 0 || $final_settled_amount < 0) {
        apiError("Discount and settled amount cannot be negative");
    }

    // Fetch Card strictly by card_id (business card number)
    $cardStmt = $mysqli->prepare("
        SELECT id, card_id, user_id, status, sale_price, cost_price, profit
        FROM installment_cards
        WHERE card_id = ?
        LIMIT 1
    ");
    $cardStmt->bind_param("i", $card_id);
    $cardStmt->execute();
    $card = $cardStmt->get_result()->fetch_assoc();
    $cardStmt->close();

    if (!$card) {
        apiError("Installment card not found for card_id: " . $card_id);
    }

    $actualCardId = (int)$card['card_id'];
    $customerId   = (int)$card['user_id'];

    // Fetch staff name strictly by user_id
    $staffName = "Staff";
    if ($settled_by > 0) {
        $stStmt = $mysqli->prepare("SELECT name FROM users WHERE user_id = ? LIMIT 1");
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

    // Verify amounts
    if (abs(($discount_amount + $final_settled_amount) - $remainingDue) > 0.01) {
        // Tolerant check, auto adjust if small floating delta
        $final_settled_amount = max(0.0, $remainingDue - $discount_amount);
    }

    // START TRANSACTION
    $mysqli->begin_transaction();

    // 4. Update installments using Waterfall allocation
    // Allocates cash to unpaid installments sequentially:
    // Full installment paid -> keeps original due_amount, status = 'Paid'
    // Any remaining unpaid -> keeps original due_amount, status = 'Waived' (মওকুফ)
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
            // Cash exhausted -> Mark remaining installments as 'Waived' (keeping original due_amount for contract history)
            $upStmt = $mysqli->prepare("
                UPDATE installment_payments
                SET
                    status = 'Waived',
                    paid_date = NULL,
                    payment_method = NULL
                WHERE id = ?
            ");
            $upStmt->bind_param("i", $pId);
            $upStmt->execute();
            $upStmt->close();
        }
    }

    // 5. Update Card Status to Fully Paid strictly by card_id
    $cardUp = $mysqli->prepare("
        UPDATE installment_cards
        SET status = 'Fully Paid'
        WHERE card_id = ?
    ");
    $cardUp->bind_param("i", $actualCardId);
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
    if ($final_settled_amount > 0) {
        $costPrice = (float)$card['cost_price'];
        $salePrice = (float)$card['sale_price'];
        $costRatio = ($salePrice > 0) ? ($costPrice / $salePrice) : 0.8;
        $syncPrincipal = round($final_settled_amount * $costRatio, 2);
        $syncProfit = round($final_settled_amount - $syncPrincipal, 2);

        syncFullSettlementCash(
            $mysqli,
            $actualCardId,
            $final_settled_amount,
            $syncPrincipal,
            $syncProfit,
            $settlement_date
        );
    }

    // 8. Log into installment_payment_history
    $historyStmt = $mysqli->prepare("
        INSERT INTO installment_payment_history (
            payment_id, card_id, installment_no, tag, action,
            old_status, new_status, old_paid_date, new_paid_date,
            old_payment_method, new_payment_method, old_receipt_number, new_receipt_number,
            changes, edited_by_id, edited_by_name, created_at
        ) VALUES (0, ?, 0, 'অগ্রিম নিষ্পত্তি', 'কার্ড অগ্রিম নিষ্পত্তি (Early Settlement) সম্পন্ন',
            'Running', 'Fully Paid', NULL, ?,
            'Cash', ?, NULL, NULL,
            ?, ?, ?, NOW())
    ");
    $changesSummary = json_encode([
        "action"               => "Early Settlement",
        "total_original"       => $totalOriginal,
        "remaining_due"        => $remainingDue,
        "discount_amount"      => $discount_amount,
        "final_settled_amount" => $final_settled_amount,
        "note"                 => $note
    ], JSON_UNESCAPED_UNICODE);

    $historyStmt->bind_param(
        "isssis",
        $actualCardId,
        $settlement_date,
        $payment_method,
        $changesSummary,
        $settled_by,
        $staffName
    );
    $historyStmt->execute();
    $historyStmt->close();

    // Commit Transaction
    $mysqli->commit();

    echo json_encode([
        "success" => true,
        "message" => "কার্ড অগ্রিম নিষ্পত্তি (Early Settlement) সফলভাবে সম্পন্ন হয়েছে 🎉",
        "data"    => [
            "settlement_id"        => $settlementId,
            "card_id"              => $actualCardId,
            "discount_amount"      => $discount_amount,
            "final_settled_amount" => $final_settled_amount,
            "settled_by"           => $staffName
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    $mysqli->rollback();
    apiError("Settlement failed: " . $e->getMessage());
}
