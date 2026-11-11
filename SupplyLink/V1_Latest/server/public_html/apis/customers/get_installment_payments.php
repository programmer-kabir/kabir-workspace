<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';
requireAuth();

header("Content-Type: application/json");

// ================= ERROR HANDLER =================
function apiError($message, $debug = null, $code = 500) {
    http_response_code($code);
    echo json_encode([
        "success" => false,
        "message" => $message,
        "debug"   => $debug
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
// =================================================

// Auto-ensure schema columns
try {
    $chk = $mysqli->query("SHOW COLUMNS FROM `installment_payments` LIKE 'extra_amount'");
    if ($chk && $chk->num_rows === 0) {
        @$mysqli->query("ALTER TABLE `installment_payments` ADD COLUMN `extra_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `due_amount`");
        @$mysqli->query("ALTER TABLE `installment_payments` ADD COLUMN `adjusted_from_extra` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `extra_amount`");
        @$mysqli->query("ALTER TABLE `installment_payments` ADD COLUMN `total_paid_cash` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `adjusted_from_extra`");
    }
} catch (Throwable $e) {}

// ================= QUERY =================
$sql = "
    SELECT
        ip.id,
        ip.card_id,
        ic.user_id,
        ip.installment_no,
        ip.tag,
        ip.due_amount,
        COALESCE(ip.extra_amount, 0.00) AS extra_amount,
        COALESCE(ip.adjusted_from_extra, 0.00) AS adjusted_from_extra,
        COALESCE(ip.total_paid_cash, 0.00) AS total_paid_cash,
        ip.principal_amount,
        ip.profit_amount,
        ip.due_date,
        ip.paid_date,
        ip.payment_method,
        ip.receipt_number,
        ip.signature,
        ip.status,
        ip.created_at,
        ip.collected_by,
        ip.has_pending_edit,
        (SELECT COUNT(*) FROM installment_payment_edits ipe WHERE ipe.payment_id = ip.id) AS edit_count,
        (SELECT MAX(created_at) FROM installment_payment_edits ipe WHERE ipe.payment_id = ip.id) AS last_edited_at
    FROM installment_payments ip
    LEFT JOIN installment_cards ic ON ic.id = ip.card_id
    
    ORDER BY ip.id ASC
";

$result = $mysqli->query($sql);

if (!$result) {
    apiError("Query failed", $mysqli->error);
}
// =================================================

// ================= RESULT BUILD =================
$data = [];

while ($row = $result->fetch_assoc()) {

    // type casting
    $row["id"]                  = (int)$row["id"];
    $row["card_id"]             = (int)$row["card_id"];
    $row["user_id"]             = (int)($row["user_id"] ?? 0);
    $row["installment_no"]      = (int)$row["installment_no"];

    $row["due_amount"]          = (float)$row["due_amount"];
    $row["extra_amount"]        = (float)($row["extra_amount"] ?? 0);
    $row["adjusted_from_extra"] = (float)($row["adjusted_from_extra"] ?? 0);
    $row["total_paid_cash"]     = (float)($row["total_paid_cash"] ?? 0);
    $row["principal_amount"]    = (float)$row["principal_amount"];
    $row["profit_amount"]       = (float)$row["profit_amount"];
    $row["has_pending_edit"]    = (int)($row["has_pending_edit"] ?? 0);
    $row["edit_count"]          = (int)($row["edit_count"] ?? 0);

    $data[] = $row;
}
// =================================================

// ================= FINAL RESPONSE =================
echo json_encode([
    "success" => true,
    "total"   => count($data),
    "data"    => $data
], JSON_UNESCAPED_UNICODE);
