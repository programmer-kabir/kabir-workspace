<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/check_role.php';

header('Content-Type: application/json');

requireRole('admin');

// --- Fetch Data ---
$source = $_GET['source'] ?? ''; // Format: subscription, exclusive_buyout

$where_clauses = [];
$params = [];
$types = "";

if (!empty($source)) {
    $where_clauses[] = "pt.payment_source = ?";
    $params[] = $source;
    $types .= "s";
}

$filterType = $_GET['filter_type'] ?? '';
$filterValue = $_GET['filter_value'] ?? '';

if (!empty($filterType) && !empty($filterValue)) {
    if ($filterType === 'date') {
        $where_clauses[] = "DATE(pt.created_at) = ?";
        $params[] = $filterValue;
        $types .= "s";
    } elseif ($filterType === 'month') {
        $where_clauses[] = "DATE_FORMAT(pt.created_at, '%Y-%m') = ?";
        $params[] = $filterValue;
        $types .= "s";
    } elseif ($filterType === 'year') {
        $where_clauses[] = "YEAR(pt.created_at) = ?";
        $params[] = $filterValue;
        $types .= "s";
    }
}

$where_sql = count($where_clauses) > 0 ? "WHERE " . implode(" AND ", $where_clauses) : "";

$query = "
    SELECT pt.*, u.name as user_name, u.email as user_email
    FROM payment_transactions pt
    LEFT JOIN users u ON pt.user_id = u.id
    $where_sql 
    ORDER BY pt.id DESC
";

$stmt = $mysqli->prepare($query);
if ($types) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$result = $stmt->get_result();

$history = [];
while ($row = $result->fetch_assoc()) {
    $history[] = $row;
}

echo json_encode([
    "success" => true,
    "data" => $history
]);
?>
