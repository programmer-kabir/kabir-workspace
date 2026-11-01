<?php
ob_start();

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");

// Only POST allowed
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    if (ob_get_length()) ob_clean();
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "error" => "Invalid request method"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Read JSON body
$input = json_decode(file_get_contents("php://input"), true);

// Validate required fields
$requiredFields = [
    "investment_card_no",
    "investor_id",
    "installment_no",
    "installment_date",
    "amount",
    "signature_by"
];

foreach ($requiredFields as $field) {
    if (!isset($input[$field]) || $input[$field] === "") {
        if (ob_get_length()) ob_clean();
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "error" => "Missing required field: $field"
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// Sanitize / assign
$investment_card_no = $input["investment_card_no"];
$investor_id        = (int) $input["investor_id"];
$installment_no     = (int) $input["installment_no"];
$installment_date   = trim($input["installment_date"]);
$amount             = (float) $input["amount"];
$signature_by       = (int) $input["signature_by"];

if ($amount <= 0) {
    if (ob_get_length()) ob_clean();
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => "কিস্তির পরিমাণ অবশ্যই ০ এর বেশি হতে হবে"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $mysqli->begin_transaction();

    // 1. Fetch Investor Name, Email & Card Name
    $investorName = "ইনভেস্টর";
    $investorEmail = null;
    $stmtInv = $mysqli->prepare("SELECT name, email FROM users WHERE id = ? LIMIT 1");
    if ($stmtInv) {
        $stmtInv->bind_param("i", $investor_id);
        $stmtInv->execute();
        $resInv = $stmtInv->get_result()->fetch_assoc();
        if ($resInv) {
            if (!empty($resInv['name'])) $investorName = $resInv['name'];
            if (!empty($resInv['email'])) $investorEmail = trim($resInv['email']);
        }
        $stmtInv->close();
    }

    $cardName = "কার্ড #{$investment_card_no}";
    $cardIdInt = (int)$investment_card_no;
    $stmtCard = $mysqli->prepare("SELECT card_name FROM investment_cards WHERE id = ? LIMIT 1");
    if ($stmtCard) {
        $stmtCard->bind_param("i", $cardIdInt);
        $stmtCard->execute();
        $resCard = $stmtCard->get_result()->fetch_assoc();
        if ($resCard && !empty($resCard['card_name'])) {
            $cardName = $resCard['card_name'];
        }
        $stmtCard->close();
    }

    // 2. Fetch Collector / Staff Name
    $collectorName = "কর্মী";
    if ($signature_by > 0) {
        $stmtCol = $mysqli->prepare("SELECT name FROM users WHERE id = ? LIMIT 1");
        if ($stmtCol) {
            $stmtCol->bind_param("i", $signature_by);
            $stmtCol->execute();
            $resCol = $stmtCol->get_result()->fetch_assoc();
            if ($resCol && !empty($resCol['name'])) {
                $collectorName = $resCol['name'];
            }
            $stmtCol->close();
        }
    }

    // Prepare SQL for Installment Insert
    $sql = "INSERT INTO investment_installments 
    (
        investment_card_no,
        investor_id,
        investment_no,
        investment_date,
        amount,
        signature_by
    )
    VALUES (?, ?, ?, ?, ?, ?)";

    $stmt = $mysqli->prepare($sql);
    if (!$stmt) {
        throw new Exception("Prepare failed on installments: " . $mysqli->error);
    }

    $stmt->bind_param(
        "siisss",
        $investment_card_no,
        $investor_id,
        $installment_no,
        $installment_date,
        $amount,
        $signature_by
    );

    if (!$stmt->execute()) {
        throw new Exception("Installment insert failed: " . $stmt->error);
    }

    $insertId = $stmt->insert_id;
    $stmt->close();

    // 2.5 💰 ক্যাশ ম্যানেজমেন্টে সরাসরি Cash In রেকর্ড করা (Protected inside sub-catch)
    try {
        $cashSource = "{$investorName} (কার্ড-{$investment_card_no}, বিনিয়োগ জমা #{$installment_no})";
        $cashPurpose = "বিনিয়োগ জমা আদায়";
        $cashCategory = "investment";
        $cashRefId = "inv_inst_" . $insertId;
        $cashRemarks = "ইনভেস্টর আইডি: {$investor_id}, কিস্তি: {$installment_no} (আদায়কারী: {$collectorName})";
        $approvedBy = ($signature_by > 0) ? $signature_by : null;

        $stmtCash = $mysqli->prepare("
            INSERT INTO cash (type, source, purpose, amount, category, refId, remarks, date, createdAt, approval_status, approved_by, approved_at)
            VALUES ('in', ?, ?, ?, ?, ?, ?, ?, NOW(), 'approved', ?, NOW())
        ");
        if ($stmtCash) {
            $stmtCash->bind_param("ssdssssi", $cashSource, $cashPurpose, $amount, $cashCategory, $cashRefId, $cashRemarks, $installment_date, $approvedBy);
            $stmtCash->execute();
            $stmtCash->close();
        }
    } catch (Throwable $cashErr) {
        error_log("Cash insert non-fatal error: " . $cashErr->getMessage());
    }

    // 3. Create Notification for Admin and Developer (Protected inside sub-catch)
    try {
        $formattedAmount = number_format($amount, 2);
        $notifTitle = "নতুন বিনিয়োগ কিস্তি আদায়";
        $notifMessage = "{$collectorName} ইনভেস্টর {$investorName} এর কার্ড #{$investment_card_no} ({$cardName})-এ ৳{$formattedAmount} টাকা বিনিয়োগ কিস্তি জমা করেছেন।";
        $notifLink = "/investors/investment_payments?card_id={$investment_card_no}";

        $stmtNotif = $mysqli->prepare("
            INSERT INTO notifications (target_roles, type, title, message, link, created_at)
            VALUES ('admin,developer', 'investment_deposit', ?, ?, ?, NOW())
        ");
        if ($stmtNotif) {
            $stmtNotif->bind_param("sss", $notifTitle, $notifMessage, $notifLink);
            $stmtNotif->execute();
            $stmtNotif->close();
        }
    } catch (Throwable $notifErr) {
        error_log("Notification insert non-fatal error: " . $notifErr->getMessage());
    }

    $mysqli->commit();

    // 4. Send Automated Email Notification (Investor + Admin Copy) in isolated try-catch
    try {
        require_once __DIR__ . '/../helpers/mailer.php';
        $emailData = [
            'title'      => 'বিনিয়োগ কিস্তি জমা রশিদ',
            'party_name' => "{$investorName} (কার্ড #{$investment_card_no})",
            'category'   => 'ইনভেস্টর কিস্তি আদায়',
            'amount'     => $amount,
            'date'       => $installment_date,
            'slip_no'    => $installment_no,
            'card_id'    => $investment_card_no,
            'collector'  => $collectorName,
            'notes'      => 'বিনিয়োগ কিস্তির অর্থ সফলভাবে আদায় ও ক্যাশ অ্যাকাউন্টে অন্তর্ভুক্ত হয়েছে।'
        ];
        $emailHtml = renderSupplyLinkEmailTemplate($emailData);
        $emailSubject = "বিনিয়োগ কিস্তি আদায় রশিদ - কার্ড #{$investment_card_no} (কিস্তি #{$installment_no})";
        sendSupplyLinkNotification($investorEmail, $emailSubject, $emailHtml, [
            'type'    => 'investment_deposit',
            'title'   => $notifTitle,
            'message' => $notifMessage,
            'link'    => $notifLink,
            'user_id' => $investor_id
        ]);
    } catch (Throwable $mailErr) {
        error_log("Email sending non-fatal error: " . $mailErr->getMessage());
    }

    if (ob_get_length()) ob_clean();
    echo json_encode([
        "success" => true,
        "message" => "কিস্তি সফলভাবে যোগ হয়েছে",
        "insert_id" => $insertId,
        "data" => [
            "installment_no" => $installment_no,
            "amount" => $amount,
            "investor_name" => $investorName,
            "card_name" => $cardName,
            "card_id" => $investment_card_no,
            "collector_name" => $collectorName,
            "date" => $installment_date
        ]
    ], JSON_UNESCAPED_UNICODE);
    exit;

} catch (Throwable $e) {
    if ($mysqli && $mysqli->connect_errno === 0) {
        @$mysqli->rollback();
    }
    if (ob_get_length()) ob_clean();
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "সার্ভার এরর: " . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
