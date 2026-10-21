<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=UTF-8");

// ✅ preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

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

// charset safe
$mysqli->set_charset("utf8mb4");

// ================= INPUT (filters via GET) =================
$profit_year  = isset($_GET['profit_year'])  ? (int)$_GET['profit_year']  : 0;
$profit_month = isset($_GET['profit_month']) ? (int)$_GET['profit_month'] : 0; // 1-12
$status       = isset($_GET['status']) ? trim($_GET['status']) : "";
$investor_id  = isset($_GET['investor_id']) ? (int)$_GET['investor_id'] : 0;
$card_id      = isset($_GET['card_id']) ? (int)$_GET['card_id'] : 0;
$latest       = isset($_GET['latest']) ? (int)$_GET['latest'] : 0;

// pagination (optional)
$page  = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$limit = isset($_GET['limit']) ? max(1, min(1000, (int)$_GET['limit'])) : 200;
$offset = ($page - 1) * $limit;
// ===========================================================


// ================= BUILD WHERE =================
$where = [];
$types = "";
$params = [];

// If requested latest, automatically resolve latest profit_year and profit_month
if ($latest === 1 && $profit_year === 0 && $profit_month === 0) {
    $latestQuery = $mysqli->query("SELECT profit_year, profit_month FROM profit_generator ORDER BY profit_year DESC, profit_month DESC LIMIT 1");
    if ($latestQuery && $latestRow = $latestQuery->fetch_assoc()) {
        $profit_year  = (int)$latestRow['profit_year'];
        $profit_month = (int)$latestRow['profit_month'];
    }
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
if ($status !== "") {
    $where[] = "pg.status = ?";
    $types .= "s";
    $params[] = $status;
}
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

$whereSql = "";
if (count($where)) {
    $whereSql = "WHERE " . implode(" AND ", $where);
}
// =================================================


// ================= COUNT QUERY =================
$countSql = "SELECT COUNT(*) AS total FROM profit_generator pg $whereSql";
$countStmt = $mysqli->prepare($countSql);
if (!$countStmt) apiError("Count prepare failed", $mysqli->error);

if ($types !== "") {
    $countStmt->bind_param($types, ...$params);
}
if (!$countStmt->execute()) apiError("Count execute failed", $countStmt->error);

$countRes = $countStmt->get_result();
$totalRow = $countRes->fetch_assoc();
$total = (int)($totalRow['total'] ?? 0);
// =================================================


// ================= MAIN QUERY =================
// NOTE:
// - users table: u.id, u.name (assumed)
// - investment_cards table: ic.id, ic.card_name, ic.investment_amount, ic.start_date, ic.maturity_date, ic.status (based on your screenshots)
// তোমার investment_cards এ column name ভিন্ন হলে SELECT অংশে ঠিক করে দিবা।
$sql = "
    SELECT
        pg.id,
        pg.investor_id,
        u.name AS investor_name,

        pg.card_id,
        ic.card_name AS card_name,
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
    ORDER BY pg.id ASC
    LIMIT ? OFFSET ?
";

$stmt = $mysqli->prepare($sql);
if (!$stmt) apiError("Query prepare failed", $mysqli->error);

// bind filters + limit/offset
$types2 = $types . "ii";
$params2 = $params;
$params2[] = $limit;
$params2[] = $offset;

$stmt->bind_param($types2, ...$params2);

if (!$stmt->execute()) {
    apiError("Query execute failed", $stmt->error);
}

$result = $stmt->get_result();
if (!$result) apiError("Query result failed", $mysqli->error);
// =================================================


// ================= RESULT BUILD =================
$data = [];

while ($row = $result->fetch_assoc()) {

    // type casting (safe)
    $row["id"] = (int)$row["id"];
    $row["investor_id"] = (int)$row["investor_id"];
    $row["card_id"] = (int)$row["card_id"];

    $row["weight_value"] = (float)$row["weight_value"];
    $row["percent"] = (float)$row["percent"];

    $row["amount"] = (float)$row["amount"];
    $row["profit_amount"] = (float)$row["profit_amount"];

    $row["profit_month"] = (int)$row["profit_month"];
    $row["profit_year"] = (int)$row["profit_year"];

    // joined card data (may be null)
    if ($row["card_investment_amount"] !== null) {
        $row["card_investment_amount"] = (float)$row["card_investment_amount"];
    }

    $data[] = $row;
}
// =================================================


// ================= FINAL RESPONSE =================
echo json_encode([
    "success"      => true,
    "page"         => $page,
    "limit"        => $limit,
    "total"        => $total,
    "profit_year"  => $profit_year,
    "profit_month" => $profit_month,
    "data"         => $data
], JSON_UNESCAPED_UNICODE);
