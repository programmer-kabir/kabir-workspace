<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=UTF-8");

// ================= PREFLIGHT =================
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$mysqli->set_charset("utf8mb4");

// ================= INPUT =================
$profit_year  = isset($_GET['profit_year']) ? (int)$_GET['profit_year'] : 0;
$profit_month = isset($_GET['profit_month']) ? (int)$_GET['profit_month'] : 0;
$investor_id  = isset($_GET['investor_id']) ? (int)$_GET['investor_id'] : 0;
$card_id      = isset($_GET['card_id']) ? (int)$_GET['card_id'] : 0;

// ================= WHERE =================
$where = [];

/*
|--------------------------------------------------------------------------
| SHOW:
| - reinvest
| - forfeited but transferred to company (beneficiary_id = 1)
|--------------------------------------------------------------------------
*/

$where[] = "(
    pg.status = 'reinvest'
    OR (
        pg.status = 'forfeited'
        AND pg.beneficiary_id = 1
    )
)";

if ($profit_year > 0) {
    $where[] = "pg.profit_year = $profit_year";
}

if ($profit_month >= 1 && $profit_month <= 12) {
    $where[] = "pg.profit_month = $profit_month";
}

if ($investor_id > 0) {
    $where[] = "pg.investor_id = $investor_id";
}

if ($card_id > 0) {
    $where[] = "pg.card_id = $card_id";
}

$whereSql = "";

if (!empty($where)) {
    $whereSql = "WHERE " . implode(" AND ", $where);
}

// ================= QUERY =================
$sql = "
SELECT
    pg.id,
    pg.investor_id,
    pg.beneficiary_id,

    u.name AS investor_name,

    pg.card_id,
    ic.card_name,

    pg.start_date,
    pg.maturity_date,

    pg.weight_value,
    pg.percent,

    pg.amount,
    pg.profit_amount,

    pg.status,
    pg.profit_month,
    pg.profit_year,

    pg.created_at,
    pg.action_date,
    pg.note

FROM profit_generator pg

LEFT JOIN users u
ON u.id = pg.investor_id

LEFT JOIN investment_cards ic
ON ic.id = pg.card_id

$whereSql

ORDER BY pg.id DESC
";

// ================= EXECUTE =================
$result = $mysqli->query($sql);

if (!$result) {

    echo json_encode([
        "success" => false,
        "message" => $mysqli->error
    ]);

    exit;
}

// ================= DATA =================
$data = [];

while ($row = $result->fetch_assoc()) {

    $row['id'] = (int)$row['id'];

    $row['investor_id'] = (int)$row['investor_id'];

    $row['beneficiary_id'] = $row['beneficiary_id'] !== null
        ? (int)$row['beneficiary_id']
        : null;

    $row['card_id'] = (int)$row['card_id'];

    $row['weight_value'] = (float)$row['weight_value'];
    $row['percent'] = (float)$row['percent'];

    $row['amount'] = (float)$row['amount'];
    $row['profit_amount'] = (float)$row['profit_amount'];

    $row['profit_month'] = (int)$row['profit_month'];
    $row['profit_year'] = (int)$row['profit_year'];

    $data[] = $row;
}

// ================= RESPONSE =================
echo json_encode([
    "success" => true,
    "total"   => count($data),
    "data"    => $data
], JSON_UNESCAPED_UNICODE);