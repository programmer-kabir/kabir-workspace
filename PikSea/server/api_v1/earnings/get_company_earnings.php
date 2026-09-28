<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/check_role.php';

header('Content-Type: application/json');

requireRole('admin');

// --- Fetch Data ---
$type = $_GET['type'] ?? ''; // Format: subscription, buyout, expired_sub
$filterType = $_GET['filter_type'] ?? ''; // Format: date, month, year
$filterValue = $_GET['filter_value'] ?? ''; 

$where_clauses = [];
$params = [];
$types = "";

if (!empty($type)) {
    $where_clauses[] = "transaction_type = ?";
    $params[] = $type;
    $types .= "s";
}

if (!empty($filterType) && !empty($filterValue)) {
    if ($filterType === 'date') {
        $where_clauses[] = "DATE(created_at) = ?";
        $params[] = $filterValue;
        $types .= "s";
    } elseif ($filterType === 'month') {
        $where_clauses[] = "earning_month = ?";
        $params[] = $filterValue;
        $types .= "s";
    } elseif ($filterType === 'year') {
        $where_clauses[] = "YEAR(created_at) = ?";
        $params[] = $filterValue;
        $types .= "s";
    }
}

$where_sql = count($where_clauses) > 0 ? "WHERE " . implode(" AND ", $where_clauses) : "";

$query = "SELECT * FROM company_earnings $where_sql ORDER BY id DESC";

$stmt = $mysqli->prepare($query);
if ($types) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$result = $stmt->get_result();

$earnings = [];
$total_company_earned = 0;
while ($row = $result->fetch_assoc()) {
    $earnings[] = $row;
    $total_company_earned += (float)$row['company_earned'];
}

echo json_encode([
    "success" => true,
    "total_earned" => $total_company_earned,
    "data" => $earnings
]);
?>
