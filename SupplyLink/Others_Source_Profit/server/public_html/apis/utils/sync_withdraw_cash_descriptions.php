<?php
// sync_withdraw_cash_descriptions.php
// Utility script to synchronize existing invest_withdraw records in `cash` with full customer & card details
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';
guardManagerAdminOnly();

header("Content-Type: application/json; charset=UTF-8");

try {
    @$mysqli->query("SET time_zone = '+06:00'");

    $sql = "
        SELECT c.id, c.refId, c.source, c.purpose, c.amount
        FROM cash c
        WHERE c.category = 'invest_withdraw'
          AND (
            c.purpose = 'বিনিয়োগ মূলধন ফেরত ও কার্ড সমাপ্ত' 
            OR c.purpose IS NULL 
            OR c.purpose = ''
            OR c.source IS NULL 
            OR c.source = ''
          )
    ";

    $res = $mysqli->query($sql);
    if (!$res) {
        throw new Exception("Query failed: " . $mysqli->error);
    }

    $rows = $res->fetch_all(MYSQLI_ASSOC);
    $updatedCount = 0;
    $updatedDetails = [];

    $updStmt = $mysqli->prepare("
        UPDATE cash 
        SET source = ?, purpose = ? 
        WHERE id = ? 
        LIMIT 1
    ");

    foreach ($rows as $r) {
        $cashId = (int)$r['id'];
        $refId  = trim((string)$r['refId']);
        $cardId = 0;

        if (preg_match('/^inv_wth_card_(\d+)$/', $refId, $m)) {
            $cardId = (int)$m[1];
        }

        if ($cardId > 0) {
            // Fetch investor name and card name
            $cardQ = $mysqli->prepare("
                SELECT ic.id AS card_id, ic.card_name, u.name AS investor_name
                FROM investment_cards ic
                LEFT JOIN users u ON u.id = ic.investor_id
                WHERE ic.id = ?
                LIMIT 1
            ");
            $cardQ->bind_param("i", $cardId);
            $cardQ->execute();
            $cardInfo = $cardQ->get_result()->fetch_assoc();
            $cardQ->close();

            $invName  = !empty($cardInfo['investor_name']) ? $cardInfo['investor_name'] : "গ্রাহক";
            $cardName = !empty($cardInfo['card_name']) ? $cardInfo['card_name'] : "কার্ড #" . $cardId;

            $newSource  = "গ্রাহক: {$invName} - কার্ড #{$cardId} ({$cardName})";
            $newPurpose = "বিনিয়োগ মূলধন ফেরত ও কার্ড সমাপ্ত - গ্রাহক: {$invName} (কার্ড #{$cardId})";

            $updStmt->bind_param("ssi", $newSource, $newPurpose, $cashId);
            if ($updStmt->execute()) {
                $updatedCount++;
                $updatedDetails[] = [
                    "cash_id"     => $cashId,
                    "card_id"     => $cardId,
                    "new_source"  => $newSource,
                    "new_purpose" => $newPurpose
                ];
            }
        }
    }

    if ($updStmt) {
        $updStmt->close();
    }

    echo json_encode([
        "success"       => true,
        "message"       => "Successfully synchronized {$updatedCount} invest_withdraw records",
        "updated_count" => $updatedCount,
        "details"       => $updatedDetails
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error"   => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
