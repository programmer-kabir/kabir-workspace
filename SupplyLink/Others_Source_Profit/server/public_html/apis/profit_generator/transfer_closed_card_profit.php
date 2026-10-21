<?php

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

ini_set('display_errors', 1);
error_reporting(E_ALL);

function apiError($message, $debug = null, $code = 400)
{
    http_response_code($code);

    echo json_encode([
        "success" => false,
        "message" => $message,
        "debug"   => $debug
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

$mysqli->set_charset("utf8mb4");

$body = json_decode(file_get_contents("php://input"), true);

if (!is_array($body)) {
    apiError("Invalid JSON payload");
}

/*
|--------------------------------------------------------------------------
| INPUT
|--------------------------------------------------------------------------
*/

$profit_generator_id = (int)($body['profit_generator_id'] ?? 0);

$note = trim((string)($body['note'] ?? ''));

$signature_by = trim((string)($body['signature_by'] ?? 'client'));
$signature_by = strtolower($signature_by);

if ($profit_generator_id <= 0) {
    apiError("Invalid profit_generator_id");
}

/*
|--------------------------------------------------------------------------
| COMPANY CONFIG
|--------------------------------------------------------------------------
*/

$COMPANY_USER_ID = 1;
$COMPANY_CARD_ID = 1;
$COMPANY_BENEFICIARY_ID = 1;

$mysqli->begin_transaction();

try {

    /*
    |--------------------------------------------------------------------------
    | 1. GET PROFIT ROW
    |--------------------------------------------------------------------------
    */

    $profitStmt = $mysqli->prepare("
        SELECT *
        FROM profit_generator
        WHERE id = ?
        AND status IN ('pending','reinvest')
        FOR UPDATE
    ");

    if (!$profitStmt) {
        throw new Exception($mysqli->error);
    }

    $profitStmt->bind_param("i", $profit_generator_id);
    $profitStmt->execute();

    $profitRow = $profitStmt->get_result()->fetch_assoc();

    if (!$profitRow) {
        throw new Exception("Profit row not found");
    }

    $sourceProfitId = (int)$profitRow['id'];
    $totalProfit    = (float)$profitRow['profit_amount'];

    if ($totalProfit <= 0) {
        throw new Exception("Profit amount is zero");
    }

    /*
    |--------------------------------------------------------------------------
    | 2. NEXT INVESTMENT NO
    |--------------------------------------------------------------------------
    */

    $nextNoQuery = $mysqli->query("
        SELECT COALESCE(MAX(investment_no),0) + 1 AS next_no
        FROM investment_installments
        WHERE investment_card_no = {$COMPANY_CARD_ID}
    ");

    if (!$nextNoQuery) {
        throw new Exception($mysqli->error);
    }

    $nextInvestmentNo = (int)$nextNoQuery->fetch_assoc()['next_no'];

    /*
    |--------------------------------------------------------------------------
    | 3. DATE + ACTIVE DAYS
    |--------------------------------------------------------------------------
    */

    $investmentDate = date('Y-m-d');

    $currentDay  = (int)date('d');
    $daysInMonth = (int)date('t');

    $active_days = ($daysInMonth - $currentDay) + 1;

    if ($active_days < 1) {
        $active_days = 1;
    }

    /*
    |--------------------------------------------------------------------------
    | 4. TIME WEIGHTED VALUE
    |--------------------------------------------------------------------------
    */

    $time_weighted_value = $totalProfit * $active_days;

    /*
    |--------------------------------------------------------------------------
    | 5. INSERT COMPANY INVESTMENT
    |--------------------------------------------------------------------------
    */

    $insertInvestment = $mysqli->prepare("
        INSERT INTO investment_installments
        (
            investor_id,
            investment_no,
            investment_date,
            amount,
            signature_by,
            active_days,
            time_wighted_value,
            investment_card_no,
            source_profit_id
        )
        VALUES
        (
            ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
    ");

    if (!$insertInvestment) {
        throw new Exception($mysqli->error);
    }

    $insertInvestment->bind_param(
        "iisdsidii",
        $COMPANY_USER_ID,
        $nextInvestmentNo,
        $investmentDate,
        $totalProfit,
        $signature_by,
        $active_days,
        $time_weighted_value,
        $COMPANY_CARD_ID,
        $sourceProfitId
    );

    $insertInvestment->execute();

    $companyInvestmentId = $mysqli->insert_id;

    /*
    |--------------------------------------------------------------------------
    | 5B. UPDATE CARD 1 (COMPANY EARLY WITHDRAWAL) TOTAL BALANCE
    |--------------------------------------------------------------------------
    */
    $updateCard = $mysqli->prepare("
        UPDATE investment_cards
        SET investment_amount = COALESCE(investment_amount, 0) + ?
        WHERE id = ?
    ");
    if ($updateCard) {
        $updateCard->bind_param("di", $totalProfit, $COMPANY_CARD_ID);
        $updateCard->execute();
        $updateCard->close();
    }

    /*
    |--------------------------------------------------------------------------
    | 6. FORFEIT SOURCE PROFIT
    |--------------------------------------------------------------------------
    */

    $finalNote = $note ?: "Transferred to company investment";

    $update = $mysqli->prepare("
        UPDATE profit_generator
        SET
            status = 'forfeited',
            profit_amount = 0,
            weight_value = 0,
            percent = 0,
            beneficiary_id = ?,
            note = ?,
            action_date = NOW()
        WHERE id = ?
    ");

    if (!$update) {
        throw new Exception($mysqli->error);
    }

    $update->bind_param(
        "isi",
        $COMPANY_BENEFICIARY_ID,
        $finalNote,
        $sourceProfitId
    );

    $update->execute();

    if ($update->affected_rows <= 0) {
        throw new Exception("Profit row update failed");
    }

    /*
    |--------------------------------------------------------------------------
    | COMMIT
    |--------------------------------------------------------------------------
    */

    $mysqli->commit();

    echo json_encode([
        "success" => true,
        "message" => "Profit transferred successfully",

        "company_investment" => [
            "investment_id"   => $companyInvestmentId,
            "investment_no"   => $nextInvestmentNo,
            "amount"          => $totalProfit,
            "active_days"     => $active_days,
            "twv"             => $time_weighted_value,
            "source_profit_id"=> $sourceProfitId
        ]

    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {

    $mysqli->rollback();

    apiError(
        "Transfer failed",
        $e->getMessage(),
        500
    );
}