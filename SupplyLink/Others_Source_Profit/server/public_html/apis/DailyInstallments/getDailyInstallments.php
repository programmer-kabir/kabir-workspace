<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=UTF-8");

function apiError($message, $debug = null, $code = 500) {
    http_response_code($code);
    echo json_encode([
        "success" => false,
        "message" => $message,
        "debug"   => $debug
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$sql = "
    SELECT
        di.id,
        di.userId,
        di.cardId,
        di.amount,
        di.date,
        di.receiver,
        di.created_at,
        di.update_by,
        di.update_at,
        di.update_reason,
        CASE WHEN de.id IS NOT NULL THEN 1 ELSE 0 END AS has_pending_edit,
        de.id AS pending_edit_id,
        de.new_amount AS pending_new_amount,
        de.new_date AS pending_new_date,
        de.request_reason AS pending_request_reason
    FROM daily_installments di
    LEFT JOIN daily_installment_edits de 
        ON di.id = de.installment_id AND de.status = 'pending'
    ORDER BY di.id DESC
";

$result = $mysqli->query($sql);

if (!$result) {
    apiError("Query failed", $mysqli->error);
}

$data = [];

while ($row = $result->fetch_assoc()) {
    $row["id"]     = (int)$row["id"];
    $row["userId"] = (int)$row["userId"];
    $row["amount"] = (float)$row["amount"];
    $row["has_pending_edit"] = (bool)$row["has_pending_edit"];
    if ($row["pending_new_amount"] !== null) {
        $row["pending_new_amount"] = (float)$row["pending_new_amount"];
    }

    $data[] = $row;
}

echo json_encode([
    "success" => true,
    "total"   => count($data),
    "data"    => $data
], JSON_UNESCAPED_UNICODE);