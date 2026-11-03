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

// Auto-ensure schema column
try {
    $chk = $mysqli->query("SHOW COLUMNS FROM `installment_cards` LIKE 'extra_balance'");
    if ($chk && $chk->num_rows === 0) {
        @$mysqli->query("ALTER TABLE `installment_cards` ADD COLUMN `extra_balance` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `per_installment_amount`");
    }
} catch (Throwable $e) {}

// ================= QUERY =================
$sql = "
    SELECT
        ic.id,
        ic.card_number,
        ic.user_id,
        u.name AS user_name,
        ic.product_name,
        ic.mrp,
        ic.purchase_price,
        ic.additional_cost,
        ic.cost_price,
        ic.sale_type,
        ic.sale_price,
        ic.down_payment,
        ic.total_due_amount,
        ic.installment_count,
        ic.per_installment_amount,
        COALESCE(ic.extra_balance, 0.00) AS extra_balance,
        ic.profit,
        ic.delivery_date,
        ic.first_installment_date,
        ic.supplier_id,
        ic.status,
        ic.description,
        ic.memo,
        ic.remarks,
        ic.is_daily,
        ic.reference_user_id,
        ic.created_at
    FROM installment_cards ic
    LEFT JOIN users u ON u.id = ic.user_id
    ORDER BY ic.id ASC
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
    $row["id"]                    = (int)$row["id"];
    $row["user_id"]               = (int)$row["user_id"];
    $row["supplier_id"]           = (int)$row["supplier_id"];
    $row["installment_count"]     = (int)$row["installment_count"];
    $row["is_daily"]              = (int)($row["is_daily"] ?? 0);

    $row["mrp"]                   = (float)$row["mrp"];
    $row["purchase_price"]        = (float)$row["purchase_price"];
    $row["additional_cost"]       = (float)$row["additional_cost"];
    $row["cost_price"]            = (float)$row["cost_price"];
    $row["sale_price"]            = (float)$row["sale_price"];
    $row["down_payment"]          = (float)$row["down_payment"];
    $row["total_due_amount"]      = (float)$row["total_due_amount"];
    $row["per_installment_amount"]= (float)$row["per_installment_amount"];
    $row["extra_balance"]         = (float)($row["extra_balance"] ?? 0);
    $row["profit"]                = (float)$row["profit"];

    $data[] = $row;
}
// =================================================


// ================= FINAL RESPONSE =================
echo json_encode([
    "success" => true,
    "total"   => count($data),
    "data"    => $data
], JSON_UNESCAPED_UNICODE);
