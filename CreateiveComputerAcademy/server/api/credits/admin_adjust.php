<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once __DIR__ . '/CreditHelper.php';

header('Content-Type: application/json');

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo json_encode(["status" => "error", "message" => "Database connection failed."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->admin_id) || !isset($data->user_id) || !isset($data->amount) || !isset($data->type)) {
    echo json_encode(["status" => "error", "message" => "Missing required fields (admin_id, user_id, amount, type)."]);
    exit();
}

$adminId = intval($data->admin_id);
$userId = intval($data->user_id);
$amount = intval($data->amount);
$type = trim($data->type); // 'admin_grant', 'admin_deduct', 'bonus'
$reason = isset($data->reason) ? trim($data->reason) : 'Admin adjustment';

if (!in_array($type, ['admin_grant', 'admin_deduct', 'bonus'])) {
    echo json_encode(["status" => "error", "message" => "Invalid adjustment type."]);
    exit();
}

try {
    CreditHelper::ensureUserWallet($db, $userId);

    $effectiveAmount = ($type === 'admin_deduct') ? -abs($amount) : abs($amount);
    $descPrefix = ($effectiveAmount > 0) ? "+{$effectiveAmount} Credits" : "{$effectiveAmount} Credits";
    $description = "{$descPrefix} — " . ($type === 'bonus' ? 'Performance Bonus' : ($type === 'admin_grant' ? 'Admin Grant' : 'Admin Deduction')) . " (\"{$reason}\")";

    $eventKey = "admin_adj_" . time() . "_" . uniqid();

    $stmtTx = $db->prepare("
        INSERT INTO credit_transactions 
        (user_id, sender_id, receiver_id, amount, type, reference_id, event_key, description, meta_data, created_at)
        VALUES 
        (:user_id, :admin_id, :user_id, :amount, :type, NULL, :event_key, :description, :meta_data, NOW())
    ");
    $stmtTx->execute([
        ':user_id'     => $userId,
        ':admin_id'    => $adminId,
        ':amount'      => $effectiveAmount,
        ':type'        => $type,
        ':event_key'   => $eventKey,
        ':description' => $description,
        ':meta_data'   => json_encode(['admin_id' => $adminId, 'reason' => $reason])
    ]);

    $updQuery = ($effectiveAmount > 0)
        ? "UPDATE user_credits SET balance = balance + :amount, total_earned = total_earned + :amount, updated_at = NOW() WHERE user_id = :user_id"
        : "UPDATE user_credits SET balance = balance + :amount, total_penalties = total_penalties + :abs_amount, updated_at = NOW() WHERE user_id = :user_id";

    $stmtUpd = $db->prepare($updQuery);
    if ($effectiveAmount > 0) {
        $stmtUpd->execute([':amount' => $effectiveAmount, ':user_id' => $userId]);
    } else {
        $stmtUpd->execute([':amount' => $effectiveAmount, ':abs_amount' => abs($effectiveAmount), ':user_id' => $userId]);
    }

    $balStmt = $db->prepare("SELECT balance FROM user_credits WHERE user_id = :user_id");
    $balStmt->execute([':user_id' => $userId]);
    $newBal = intval($balStmt->fetchColumn() ?: 0);

    echo json_encode([
        "status" => "success",
        "message" => "Credit adjusted successfully.",
        "new_balance" => $newBal
    ]);

} catch (Throwable $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Adjustment failed: " . $e->getMessage()
    ]);
}
?>
