<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';
requireAuth();

header("Content-Type: application/json; charset=UTF-8");

$user = getAuthenticatedUser();
$investor_id = isset($_GET['investor_id']) ? (int)$_GET['investor_id'] : (int)($user['id'] ?? 0);
$profit_year = isset($_GET['profit_year']) ? (int)$_GET['profit_year'] : 0;
$profit_month = isset($_GET['profit_month']) ? (int)$_GET['profit_month'] : 0;
$card_id = isset($_GET['card_id']) ? (int)$_GET['card_id'] : 0;

$where = [];
$types = "";
$params = [];

if ($investor_id > 0) {
    $where[] = "pg.investor_id = ?";
    $types .= "i";
    $params[] = $investor_id;
}
if ($card_id > 0) {
    $where[] = "pg.card_id = ?";
    $types .= "i";
    $params[] = $card_id;
}
if ($profit_year > 0) {
    $where[] = "pg.profit_year = ?";
    $types .= "i";
    $params[] = $profit_year;
}
if ($profit_month >= 1 && $profit_month <= 12) {
    $where[] = "pg.profit_month = ?";
    $types .= "i";
    $params[] = $profit_month;
}

$whereSql = count($where) ? "WHERE " . implode(" AND ", $where) : "";

$sql = "
    SELECT
        pg.id,
        pg.investor_id,
        u.name AS investor_name,
        pg.card_id,
        ic.card_name,
        ic.investment_amount AS card_investment_amount,
        ic.status AS card_status,
        pg.start_date,
        pg.maturity_date,
        pg.weight_value,
        pg.percent,
        pg.amount,
        pg.profit_amount,
        pg.original_profit_amount,
        pg.status,
        pg.profit_month,
        pg.profit_year,
        pg.action_date,
        pg.created_at,
        pg.note
    FROM profit_generator pg
    LEFT JOIN users u ON u.id = pg.investor_id
    LEFT JOIN investment_cards ic ON ic.id = pg.card_id
    $whereSql
    ORDER BY pg.id DESC
";

$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    echo json_encode(["success" => false, "error" => $mysqli->error]);
    exit;
}

if (!empty($types)) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$result = $stmt->get_result();

$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode([
    "success" => true,
    "total"   => count($data),
    "data"    => $data
], JSON_UNESCAPED_UNICODE);

