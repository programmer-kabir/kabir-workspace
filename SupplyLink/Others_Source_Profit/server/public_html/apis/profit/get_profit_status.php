<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

$card_id     = $_GET['card_id'] ?? null;
$investor_id = $_GET['investor_id'] ?? null;
$year        = $_GET['year'] ?? null;
$month       = $_GET['month'] ?? null;

$sql = "SELECT * FROM profit_history WHERE 1=1";
$params = [];
$types  = "";

if ($card_id) {
    $sql .= " AND card_id = ?";
    $params[] = $card_id;
    $types .= "i";
}

if ($investor_id) {
    $sql .= " AND investor_id = ?";
    $params[] = $investor_id;
    $types .= "i";
}

if ($year) {
    $sql .= " AND profit_year = ?";
    $params[] = $year;
    $types .= "i";
}

if ($month) {
    $sql .= " AND profit_month = ?";
    $params[] = $month;
    $types .= "i";
}

$sql .= " ORDER BY created_at DESC";

$stmt = $mysqli->prepare($sql);

if (!$stmt) {
    echo json_encode([
        'success' => false,
        'message' => 'Prepare failed',
        'error' => $mysqli->error,
    ]);
    exit;
}

if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}

$stmt->execute();
$result = $stmt->get_result();

$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

$stmt->close();

echo json_encode([
    'success' => true,
    'count'   => count($data),
    'data'    => $data,
]);
