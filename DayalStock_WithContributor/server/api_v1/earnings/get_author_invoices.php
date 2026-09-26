<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/check_role.php';

header('Content-Type: application/json');

requireRole('admin');

// Filters
$filterType = $_GET['filter_type'] ?? ''; // Format: date, month, year
$filterValue = $_GET['filter_value'] ?? ''; 
$status = $_GET['status'] ?? '';

$where_clauses = [];
$params = [];
$types = "";

if (!empty($status)) {
    $where_clauses[] = "ai.status = ?";
    $params[] = $status;
    $types .= "s";
}

if (!empty($filterType) && !empty($filterValue)) {
    if ($filterType === 'date') {
        $where_clauses[] = "DATE(ai.created_at) = ?";
        $params[] = $filterValue;
        $types .= "s";
    } elseif ($filterType === 'month') {
        $where_clauses[] = "ai.earning_month = ?";
        $params[] = $filterValue;
        $types .= "s";
    } elseif ($filterType === 'year') {
        $where_clauses[] = "YEAR(ai.created_at) = ?";
        $params[] = $filterValue;
        $types .= "s";
    }
}

$where_sql = count($where_clauses) > 0 ? "WHERE " . implode(" AND ", $where_clauses) : "";

$query = "
    SELECT 
        ai.*, 
        u.name as author_name, 
        u.email as author_email
    FROM author_invoices ai
    LEFT JOIN authors a ON ai.author_id = a.id
    LEFT JOIN users u ON a.user_id = u.id
    $where_sql 
    ORDER BY ai.id DESC
";

$stmt = $mysqli->prepare($query);
if ($types) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$result = $stmt->get_result();

$invoices = [];
$total_revenue = 0;
while ($row = $result->fetch_assoc()) {
    $invoices[] = $row;
    $total_revenue += (float)$row['total_revenue'];
}

echo json_encode([
    "success" => true,
    "data" => $invoices,
    "total_payouts" => $total_revenue
]);
