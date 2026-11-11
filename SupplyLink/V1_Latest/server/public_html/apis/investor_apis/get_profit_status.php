<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';
requireAuth();

header('Content-Type: application/json; charset=utf-8');

$user = getAuthenticatedUser();
$investor_id = isset($_GET['investor_id']) ? (int)$_GET['investor_id'] : (int)($user['id'] ?? 0);
$card_id = isset($_GET['card_id']) ? (int)$_GET['card_id'] : null;
$year = $_GET['year'] ?? null;
$month = $_GET['month'] ?? null;

$sql = "SELECT * FROM profit_history WHERE 1=1";
$params = [];
$types = "";

if ($investor_id > 0) {
    $sql .= " AND investor_id = ?";
    $params[] = $investor_id;
    $types .= "i";
}
if ($card_id) {
    $sql .= " AND card_id = ?";
    $params[] = $card_id;
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
    "data" => $data
], JSON_UNESCAPED_UNICODE);

