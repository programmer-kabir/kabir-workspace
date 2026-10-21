<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json");

// Get parameters
$months     = isset($_GET["months"]) ? (int)$_GET["months"] : 0;
$year       = isset($_GET["year"])   ? (int)$_GET["year"]   : 0;
$start_date = isset($_GET["start_date"]) ? $_GET["start_date"] : null;
$end_date   = isset($_GET["end_date"])   ? $_GET["end_date"]   : null;

// Base query
$sql = "
    SELECT COALESCE(SUM(profit_amount), 0) AS total_profit
    FROM installment_payments
    WHERE 1 = 1
";

$params = [];
$types  = "";
$range_type = "all";


// 1️⃣ Date range filter
if ($start_date && $end_date) {
    $sql .= " AND paid_date >= ? AND paid_date <= ?";
    $types .= "ss";
    $params[] = $start_date;
    $params[] = $end_date;
    $range_type = "date_range";
}

// 2️⃣ Year = 2025, 2026, etc.
elseif ($year > 0) {
    $sql .= " AND YEAR(paid_date) = ?";
    $types .= "i";
    $params[] = $year;
    $range_type = "year";
}

// 3️⃣ Last X months
elseif ($months > 0) {
    $sql .= " AND paid_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)";
    $types .= "i";
    $params[] = $months;
    $range_type = "months";
}


// Prepare
$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    echo json_encode([
        "success" => false,
        "error" => "Prepare failed: " . $mysqli->error
    ]);
    exit;
}

// Bind parameters
if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}

$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();

// Response
echo json_encode([
    "success"      => true,
    "range_type"   => $range_type,
    "year"         => $year,
    "months"       => $months,
    "start_date"   => $start_date,
    "end_date"     => $end_date,
    "total_profit" => (float)$row["total_profit"]
], JSON_UNESCAPED_UNICODE);
