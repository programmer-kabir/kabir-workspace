<?php
require_once __DIR__ . '/../db.php';

/**
 * Ensures required columns exist in the cash table.
 */
function ensureCashTableColumns($mysqli) {
    static $checked = false;
    if ($checked) return;
    try {
        $mysqli->query("ALTER TABLE cash ADD COLUMN IF NOT EXISTS is_deleted TINYINT(1) DEFAULT 0");
    } catch (Throwable $t) {}
    $checked = true;
}

/**
 * Helper to get clean ordinal label for installment (e.g. 5th Installment, Down Payment)
 */
function getInstallmentOrdinalLabel($installmentNo, $tag = '') {
    $num = (int)$installmentNo;
    if ($num === 0 || stripos($tag, 'ডাউন') !== false || stripos($tag, 'down') !== false) {
        return "Down Payment";
    }

    // If num is 0 but tag contains Bengali/English digits
    if ($num <= 0) {
        $bnDigits = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
        $enDigits = ['0','1','2','3','4','5','6','7','8','9'];
        $cleanTag = str_replace($bnDigits, $enDigits, (string)$tag);
        if (preg_match('/(\d+)/', $cleanTag, $matches)) {
            $num = (int)$matches[1];
        }
    }

    $ordinals = [
        1 => "1st", 2 => "2nd", 3 => "3rd", 4 => "4th", 5 => "5th",
        6 => "6th", 7 => "7th", 8 => "8th", 9 => "9th", 10 => "10th",
        11 => "11th", 12 => "12th", 13 => "13th", 14 => "14th", 15 => "15th",
        16 => "16th", 17 => "17th", 18 => "18th", 19 => "19th", 20 => "20th",
        21 => "21st", 22 => "22nd", 23 => "23rd", 24 => "24th", 25 => "25th",
        26 => "26th", 27 => "27th", 28 => "28th", 29 => "29th", 30 => "30th"
    ];

    if ($num > 0) {
        $suffix = $ordinals[$num] ?? ($num . "th");
        return "{$suffix} Installment";
    }

    return !empty($tag) ? $tag : "Installment";
}

/**
 * Auto-syncs customer installment payment with cash in table.
 */
function syncInstallmentPaymentCash($mysqli, $paymentId, $cardId, $amount, $paidDate, $status, $paymentMethod = 'Cash', $receiptNumber = '', $collectedBy = null, $tag = '', $category = 'installment') {
    if (!$paymentId || !$cardId) return false;
    ensureCashTableColumns($mysqli);

    $refId = "INST-PAY-" . (int)$paymentId;

    if ($status !== 'Paid') {
        // Soft delete from cash if status is unpaid/cancelled
        $delStmt = $mysqli->prepare("UPDATE cash SET is_deleted = 1 WHERE refId = ?");
        if ($delStmt) {
            $delStmt->bind_param("s", $refId);
            $delStmt->execute();
            $delStmt->close();
        }
        return true;
    }

    // 1. Fetch installment_no & tag from payment row
    $instNo = 0;
    $payStmt = $mysqli->prepare("SELECT installment_no, tag, due_amount FROM installment_payments WHERE id = ? LIMIT 1");
    if ($payStmt) {
        $payStmt->bind_param("i", $paymentId);
        $payStmt->execute();
        $pRes = $payStmt->get_result()->fetch_assoc();
        if ($pRes) {
            $instNo = (int)($pRes['installment_no'] ?? 0);
            if (empty($tag) && !empty($pRes['tag'])) {
                $tag = $pRes['tag'];
            }
            if ((!$amount || $amount <= 0) && !empty($pRes['due_amount'])) {
                $amount = (float)$pRes['due_amount'];
            }
        }
        $payStmt->close();
    }

    // 2. Fetch Customer Name strictly by joining installment_cards.user_id with users.user_id
    $custStmt = $mysqli->prepare("
        SELECT ic.card_id, ic.user_id, ic.product_name, u.name AS customer_name
        FROM installment_cards ic
        LEFT JOIN users u ON u.user_id = ic.user_id
        WHERE ic.card_id = ? OR ic.id = ?
        ORDER BY (ic.card_id = ?) DESC
        LIMIT 1
    ");
    $custStmt->bind_param("iii", $cardId, $cardId, $cardId);
    $custStmt->execute();
    $cRes = $custStmt->get_result()->fetch_assoc();
    $custStmt->close();

    $customerName = !empty($cRes['customer_name']) ? trim($cRes['customer_name']) : "Customer";
    $productName = !empty($cRes['product_name']) ? trim($cRes['product_name']) : "";
    $actualCardId = $cRes['card_id'] ?? $cardId;

    if (empty($paidDate) || $paidDate === 'None') {
        $paidDate = date("Y-m-d");
    }

    $installmentLabel = getInstallmentOrdinalLabel($instNo, $tag);

    // Format Source: e.g. "MST NURJAHAN BEGUM Down Payment Card No 39"
    $source = "{$customerName} {$installmentLabel} Card No {$actualCardId}";

    $tagDisplay = !empty($tag) ? $tag : $installmentLabel;
    $methodDisplay = !empty($paymentMethod) ? $paymentMethod : "Cash";
    $receiptDisplay = !empty($receiptNumber) ? ", রশিদ: " . $receiptNumber : "";
    $prodDisplay = !empty($productName) ? " ({$productName})" : "";

    $remarks = "কিস্তি পরিশোধ: {$tagDisplay}, কার্ড #{$actualCardId}{$prodDisplay}, মেথড: {$methodDisplay}{$receiptDisplay}";

    // Check if category should be downpayment
    if ($instNo === 0 || stripos($tagDisplay, 'ডাউন') !== false || stripos($tagDisplay, 'down') !== false) {
        $category = 'downpayment';
    }

    $amountVal = (float)$amount;

    // 3. Check if cash entry already exists
    $checkStmt = $mysqli->prepare("SELECT id FROM cash WHERE refId = ? LIMIT 1");
    $checkStmt->bind_param("s", $refId);
    $checkStmt->execute();
    $existRes = $checkStmt->get_result()->fetch_assoc();
    $checkStmt->close();

    if ($existRes && !empty($existRes['id'])) {
        $cashId = (int)$existRes['id'];
        $upStmt = $mysqli->prepare("
            UPDATE cash
            SET
                type = 'in',
                source = ?,
                amount = ?,
                category = ?,
                remarks = ?,
                date = ?,
                approval_status = 'approved',
                is_deleted = 0
            WHERE id = ?
        ");
        $upStmt->bind_param("sdsssi", $source, $amountVal, $category, $remarks, $paidDate, $cashId);
        $upStmt->execute();
        $upStmt->close();
    } else {
        $inStmt = $mysqli->prepare("
            INSERT INTO cash
            (type, source, purpose, amount, category, refId, remarks, date, createdAt, approval_status, approved_by, approved_at, is_deleted)
            VALUES
            ('in', ?, 'Installment Collection', ?, ?, ?, ?, ?, NOW(), 'approved', ?, NOW(), 0)
        ");
        $inStmt->bind_param("sdssssi", $source, $amountVal, $category, $refId, $remarks, $paidDate, $collectedBy);
        $inStmt->execute();
        $inStmt->close();
    }

    return true;
}

/**
 * Auto-syncs daily installment record with cash in table.
 */
function syncDailyInstallmentCash($mysqli, $dailyId, $cardId, $userId, $amount, $date, $receiver, $isDeleted = false) {
    if (!$dailyId) return false;
    ensureCashTableColumns($mysqli);

    $refId = "DAILY-INST-" . (int)$dailyId;

    if ($isDeleted) {
        $delStmt = $mysqli->prepare("UPDATE cash SET is_deleted = 1 WHERE refId = ?");
        if ($delStmt) {
            $delStmt->bind_param("s", $refId);
            $delStmt->execute();
            $delStmt->close();
        }
        return true;
    }

    // Fetch user name strictly by users.user_id = $userId
    $uStmt = $mysqli->prepare("SELECT name FROM users WHERE user_id = ? LIMIT 1");
    $uStmt->bind_param("i", $userId);
    $uStmt->execute();
    $uRes = $uStmt->get_result()->fetch_assoc();
    $uStmt->close();

    $customerName = !empty($uRes['name']) ? trim($uRes['name']) : "Customer #{$userId}";

    // Format Source: e.g. "MST NURJAHAN BEGUM Daily Installment Card No 39"
    $source = "{$customerName} Daily Installment Card No {$cardId}";

    $remarks = "দৈনিক কিস্তি কালেকশন - কার্ড #{$cardId}, আদায়কারী: {$receiver}";
    $category = 'daily-installment';
    $amountVal = (float)$amount;

    if (empty($date)) {
        $date = date("Y-m-d");
    }

    // Check if cash entry exists
    $checkStmt = $mysqli->prepare("SELECT id FROM cash WHERE refId = ? LIMIT 1");
    $checkStmt->bind_param("s", $refId);
    $checkStmt->execute();
    $existRes = $checkStmt->get_result()->fetch_assoc();
    $checkStmt->close();

    if ($existRes && !empty($existRes['id'])) {
        $cashId = (int)$existRes['id'];
        $upStmt = $mysqli->prepare("
            UPDATE cash
            SET
                type = 'in',
                source = ?,
                amount = ?,
                category = ?,
                remarks = ?,
                date = ?,
                approval_status = 'approved',
                is_deleted = 0
            WHERE id = ?
        ");
        $upStmt->bind_param("sdsssi", $source, $amountVal, $category, $remarks, $date, $cashId);
        $upStmt->execute();
        $upStmt->close();
    } else {
        $inStmt = $mysqli->prepare("
            INSERT INTO cash
            (type, source, purpose, amount, category, refId, remarks, date, createdAt, approval_status, approved_by, approved_at, is_deleted)
            VALUES
            ('in', ?, 'Daily Installment Collection', ?, ?, ?, ?, ?, NOW(), 'approved', NULL, NOW(), 0)
        ");
        $inStmt->bind_param("sdssss", $source, $amountVal, $category, $refId, $remarks, $date);
        $inStmt->execute();
        $inStmt->close();
    }

    return true;
}

/**
 * Auto-syncs full settlement / early close with cash in table.
 */
function syncFullSettlementCash($mysqli, $cardId, $amount, $principal, $profit, $date = null) {
    if (!$cardId) return false;
    ensureCashTableColumns($mysqli);

    $refId = "INST-CLOSE-" . (int)$cardId;

    if (empty($date)) {
        $date = date("Y-m-d");
    }

    // Fetch customer details strictly by joining installment_cards.user_id with users.user_id
    $custStmt = $mysqli->prepare("
        SELECT ic.card_id, ic.user_id, ic.product_name, u.name AS customer_name
        FROM installment_cards ic
        LEFT JOIN users u ON u.user_id = ic.user_id
        WHERE ic.card_id = ? OR ic.id = ?
        ORDER BY (ic.card_id = ?) DESC
        LIMIT 1
    ");
    $custStmt->bind_param("iii", $cardId, $cardId, $cardId);
    $custStmt->execute();
    $cRes = $custStmt->get_result()->fetch_assoc();
    $custStmt->close();

    $customerName = !empty($cRes['customer_name']) ? trim($cRes['customer_name']) : "Customer";
    $productName = !empty($cRes['product_name']) ? trim($cRes['product_name']) : "";
    $actualCardId = $cRes['card_id'] ?? $cardId;

    // Format Source: e.g. "MST NURJAHAN BEGUM Full Settlement Card No 39"
    $source = "{$customerName} Full Settlement Card No {$actualCardId}";

    $prodDisplay = !empty($productName) ? " ({$productName})" : "";
    $remarks = "ফুল সেটেলমেন্ট / কিস্তি সমাপ্ত - কার্ড #{$actualCardId}{$prodDisplay} (মূলধন: ৳{$principal}, লাভ: ৳{$profit})";
    $category = 'installment';
    $amountVal = (float)$amount;

    $checkStmt = $mysqli->prepare("SELECT id FROM cash WHERE refId = ? LIMIT 1");
    $checkStmt->bind_param("s", $refId);
    $checkStmt->execute();
    $existRes = $checkStmt->get_result()->fetch_assoc();
    $checkStmt->close();

    if ($existRes && !empty($existRes['id'])) {
        $cashId = (int)$existRes['id'];
        $upStmt = $mysqli->prepare("
            UPDATE cash
            SET
                type = 'in',
                source = ?,
                amount = ?,
                category = ?,
                remarks = ?,
                date = ?,
                approval_status = 'approved',
                is_deleted = 0
            WHERE id = ?
        ");
        $upStmt->bind_param("sdsssi", $source, $amountVal, $category, $remarks, $date, $cashId);
        $upStmt->execute();
        $upStmt->close();
    } else {
        $inStmt = $mysqli->prepare("
            INSERT INTO cash
            (type, source, purpose, amount, category, refId, remarks, date, createdAt, approval_status, approved_by, approved_at, is_deleted)
            VALUES
            ('in', ?, 'Full Settlement', ?, ?, ?, ?, ?, NOW(), 'approved', NULL, NOW(), 0)
        ");
        $inStmt->bind_param("sdssss", $source, $amountVal, $category, $refId, $remarks, $date);
        $inStmt->execute();
        $inStmt->close();
    }

    return true;
}
