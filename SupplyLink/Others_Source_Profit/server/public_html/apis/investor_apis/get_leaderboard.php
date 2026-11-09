<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';
requireAuth();

header("Content-Type: application/json; charset=UTF-8");

$sql = "
    SELECT 
        u.id AS investor_id,
        u.name AS investor_name,
        u.photo AS investor_photo,
        ic.id AS card_id,
        ic.card_name,
        ic.investment_amount,
        ic.status,
        ic.start_date,
        ic.maturity_date,
        ic.payment_type
    FROM investment_cards ic
    LEFT JOIN users u ON u.id = ic.investor_id
    WHERE ic.status = 'running'
    ORDER BY CAST(ic.investment_amount AS DECIMAL(15,2)) DESC
    LIMIT 20
";

$res = $mysqli->query($sql);
$data = [];
if ($res) {
    while ($row = $res->fetch_assoc()) {
        if (isset($row["card_id"])) $row["card_id"] = (int)$row["card_id"];
        if (isset($row["investor_id"])) $row["investor_id"] = (int)$row["investor_id"];
        $data[] = $row;
    }
}

echo json_encode([
    "success" => true,
    "total"   => count($data),
    "data"    => $data
], JSON_UNESCAPED_UNICODE);

