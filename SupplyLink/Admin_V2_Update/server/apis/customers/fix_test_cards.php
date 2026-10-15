<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=UTF-8");

$action = $_GET['action'] ?? 'check';

if ($action === 'check') {
    // Check cards 40, 43, 46
    $resCards = $mysqli->query("
        SELECT id, card_id, user_id, status, sale_price 
        FROM installment_cards 
        WHERE card_id IN (40, 43, 46) OR id IN (40, 43, 46)
        ORDER BY id ASC
    ");
    $cards = $resCards->fetch_all(MYSQLI_ASSOC);

    // Check settlements
    $resSet = $mysqli->query("
        SELECT * FROM card_settlements ORDER BY id DESC LIMIT 10
    ");
    $settlements = $resSet->fetch_all(MYSQLI_ASSOC);

    // Check cash entries
    $resCash = $mysqli->query("
        SELECT id, refId, amount, type, date, remarks, is_deleted 
        FROM cash 
        WHERE refId LIKE 'INST-CLOSE-%' 
        ORDER BY id DESC LIMIT 10
    ");
    $cashEntries = $resCash->fetch_all(MYSQLI_ASSOC);

    echo json_encode([
        "success" => true,
        "cards" => $cards,
        "settlements" => $settlements,
        "cash_entries" => $cashEntries
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

if ($action === 'revert_43') {
    $mysqli->begin_transaction();
    try {
        // 1. Delete test settlement from card_settlements for card 43
        $mysqli->query("DELETE FROM card_settlements WHERE card_id = 43");

        // 2. Remove INST-CLOSE-43 from cash
        $mysqli->query("DELETE FROM cash WHERE refId = 'INST-CLOSE-43'");

        // 3. Reset card 43 to Running
        $mysqli->query("UPDATE installment_cards SET status = 'Running' WHERE card_id = 43");

        // 4. Reset installments of card 43 that were marked today
        $mysqli->query("
            UPDATE installment_payments 
            SET status = 'Unpaid', paid_date = NULL, payment_method = 'Cash', signature = NULL, collected_by = NULL
            WHERE card_id = 43 AND (status = 'Waived' OR paid_date = '2026-10-12')
        ");

        $mysqli->commit();
        echo json_encode(["success" => true, "message" => "Card #43 restored to Running and settlement removed successfully."]);
    } catch (Exception $e) {
        $mysqli->rollback();
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
    exit;
}
