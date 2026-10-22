<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=UTF-8");

$status = $_GET['status'] ?? 'pending';
$cardId = isset($_GET['card_id']) ? (int)$_GET['card_id'] : null;

$whereClauses = [];
if ($status !== 'all') {
    $whereClauses[] = "e.status = '" . $mysqli->real_escape_string($status) . "'";
}
if ($cardId) {
    $whereClauses[] = "e.card_id = $cardId";
}

$whereSQL = count($whereClauses) > 0 ? "WHERE " . implode(" AND ", $whereClauses) : "";

$sql = "
    SELECT 
        e.*,
        u.name AS customer_name,
        u.mobile AS customer_mobile,
        u.photo AS customer_photo,
        r.name AS requester_name,
        rev.name AS reviewer_name
    FROM daily_installment_edits e
    LEFT JOIN users u ON e.user_id = u.id
    LEFT JOIN users r ON e.requested_by = r.id
    LEFT JOIN users rev ON e.reviewed_by = rev.id
    $whereSQL
    ORDER BY e.id DESC
";

$result = $mysqli->query($sql);
$data = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
}

echo json_encode([
    "success" => true,
    "count" => count($data),
    "data" => $data
]);
