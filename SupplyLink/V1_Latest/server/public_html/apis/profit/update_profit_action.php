<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';
guardManagerAdminOnly();

header("Content-Type: application/json; charset=utf-8");
date_default_timezone_set('Asia/Dhaka');

$decision_at = date('Y-m-d H:i:s');

$id          = intval($_POST['id'] ?? 0);
$action_name = strtolower(trim($_POST['action_name'] ?? ''));
$remarks     = trim($_POST['remarks'] ?? '');
$decision_by = intval($_POST['decision_by'] ?? 0);

if (!$id) { 
    echo json_encode(["success" => false, "message" => "Missing id"], JSON_UNESCAPED_UNICODE); 
    exit; 
}
if (!in_array($action_name, ['approved', 'rejected'], true)) { 
    echo json_encode(["success" => false, "message" => "Invalid action_name"], JSON_UNESCAPED_UNICODE); 
    exit; 
}
if ($remarks === '') { 
    echo json_encode(["success" => false, "message" => "Reason (remarks) is required"], JSON_UNESCAPED_UNICODE); 
    exit; 
}
if (!$decision_by) { 
    echo json_encode(["success" => false, "message" => "Missing decision_by"], JSON_UNESCAPED_UNICODE); 
    exit; 
}

// 1. Find the pending record
$find = $mysqli->prepare("SELECT * FROM profit_history WHERE id=? LIMIT 1");
$find->bind_param("i", $id);
$find->execute();
$row = $find->get_result()->fetch_assoc();
$find->close();

if (!$row) { 
    echo json_encode(["success" => false, "message" => "No record found"], JSON_UNESCAPED_UNICODE); 
    exit; 
}
if (strtolower($row['action_name']) !== 'pending') {
    echo json_encode([
        "success" => false, 
        "message" => "This request is not pending anymore", 
        "current_action" => $row['action_name']
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 2. Begin Transaction
$mysqli->begin_transaction();

try {
    // A. Update profit_history
    $up = $mysqli->prepare("
        UPDATE profit_history
        SET action_name=?, remarks=?, decision_by=?, decision_at=?
        WHERE id=? AND action_name='pending'
    ");
    $up->bind_param("ssisi", $action_name, $remarks, $decision_by, $decision_at, $id);
    if (!$up->execute() || $up->affected_rows === 0) {
        throw new Exception("Update profit_history failed or already processed");
    }
    $up->close();

    $cash_inserted_id = null;

    // B. If Approved -> Directly Hit Cash Out Ledger
    if ($action_name === 'approved') {
        $card_id = (int)$row['card_id'];
        $investor_id = (int)$row['investor_id'];
        $orig_amount = (float)$row['amount'];
        
        // 🔒 Integer without fraction (e.g. 2510.01 -> 2510) as instructed
        $cash_amount = (float)floor($orig_amount);
        if ($cash_amount <= 0 && $orig_amount > 0) {
            $cash_amount = $orig_amount;
        }

        // Fetch Investor and Card details
        $inv_name = "বিনিয়োগকারী";
        $card_name = "কার্ড #" . $card_id;

        $cStmt = $mysqli->prepare("
            SELECT ic.card_name, u.name AS investor_name
            FROM investment_cards ic
            LEFT JOIN users u ON u.id = ic.investor_id
            WHERE ic.id = ?
            LIMIT 1
        ");
        if ($cStmt) {
            $cStmt->bind_param("i", $card_id);
            $cStmt->execute();
            $cRes = $cStmt->get_result()->fetch_assoc();
            $cStmt->close();
            if ($cRes) {
                if (!empty($cRes['investor_name'])) $inv_name = $cRes['investor_name'];
                if (!empty($cRes['card_name'])) $card_name = $cRes['card_name'];
            }
        }

        // RefId for deduplication and cross-ledger tracking
        $refId = "profit_payout_" . $id;

        // Check if cash entry with this refId already exists
        $checkCash = $mysqli->prepare("SELECT id FROM cash WHERE refId = ? LIMIT 1");
        $checkCash->bind_param("s", $refId);
        $checkCash->execute();
        $existingCash = $checkCash->get_result()->fetch_assoc();
        $checkCash->close();

        if (!$existingCash) {
            $source = "বিনিয়োগ মুনাফা পরিশোধ (Profit Payout)";
            $purpose = "বিনিয়োগকারী: {$inv_name} (কার্ড #{$card_id} - {$card_name})";
            $origStr = number_format($orig_amount, 2);
            $cash_remarks = "কার্ড #{$card_id} এর অনুমোদিত মুনাফা পরিশোধ [মূল মুনাফা: ৳{$origStr}]";
            if (!empty($remarks)) {
                $cash_remarks .= " - " . $remarks;
            }
            $cDate = date('Y-m-d', strtotime($decision_at));

            $insCash = $mysqli->prepare("
                INSERT INTO cash (
                    type, source, purpose, amount, category,
                    refId, remarks, date, createdAt,
                    approval_status, approved_by, approved_at
                ) VALUES (
                    'out', ?, ?, ?, 'profit-payout',
                    ?, ?, ?, ?,
                    'approved', ?, ?
                )
            ");
            if (!$insCash) {
                throw new Exception("Prepare cash insert failed: " . $mysqli->error);
            }

            $insCash->bind_param(
                "ssdssssis",
                $source,
                $purpose,
                $cash_amount,
                $refId,
                $cash_remarks,
                $cDate,
                $decision_at,
                $decision_by,
                $decision_at
            );

            if (!$insCash->execute()) {
                throw new Exception("Cash insert failed: " . $insCash->error);
            }
            $cash_inserted_id = (int)$insCash->insert_id;
            $insCash->close();
        } else {
            $cash_inserted_id = (int)$existingCash['id'];
        }
    }

    $mysqli->commit();

    $row['action_name'] = $action_name;
    $row['remarks']     = $remarks;
    $row['decision_by'] = $decision_by;
    $row['decision_at'] = $decision_at;

    echo json_encode([
        "success" => true,
        "message" => ($action_name === 'approved') 
            ? "উত্তোলন সফলভাবে অনুমোদিত এবং ক্যাশ-আউটে অন্তর্ভুক্ত করা হয়েছে।" 
            : "উত্তোলনের আবেদন বাতিল করা হয়েছে।",
        "data" => $row,
        "cash_id" => $cash_inserted_id
    ], JSON_UNESCAPED_UNICODE);
    exit;

} catch (Exception $e) {
    $mysqli->rollback();
    echo json_encode([
        "success" => false,
        "message" => "কার্যক্রম সম্পন্ন করা যায়নি: " . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
