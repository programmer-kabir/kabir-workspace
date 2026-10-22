<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=UTF-8");

$card_id        = isset($_GET['card_id']) ? (int)$_GET['card_id'] : 0;
$installment_id = isset($_GET['installment_id']) ? (int)$_GET['installment_id'] : 0;
$status         = trim($_GET['status'] ?? '');
$requested_by   = isset($_GET['requested_by']) ? (int)$_GET['requested_by'] : 0;
$search         = trim($_GET['search'] ?? '');

$where = ["1=1"];
$params = [];
$types = "";

if ($card_id > 0) {
    $where[] = "e.card_id = ?";
    $params[] = $card_id;
    $types .= "i";
}

if ($installment_id > 0) {
    $where[] = "e.installment_id = ?";
    $params[] = $installment_id;
    $types .= "i";
}

if (!empty($status) && in_array($status, ['pending', 'approved', 'rejected'])) {
    $where[] = "e.status = ?";
    $params[] = $status;
    $types .= "s";
}

if ($requested_by > 0) {
    $where[] = "e.requested_by = ?";
    $params[] = $requested_by;
    $types .= "i";
}

if (!empty($search)) {
    $where[] = "(u_inv.name LIKE ? OR ic.card_name LIKE ? OR u_req.name LIKE ? OR e.card_id LIKE ?)";
    $like = "%" . $search . "%";
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
    $types .= "ssss";
}

$whereClause = implode(" AND ", $where);

$sql = "
    SELECT 
        e.id,
        e.installment_id,
        e.card_id,
        e.investor_id,
        e.old_amount,
        e.new_amount,
        e.old_date,
        e.new_date,
        e.request_reason,
        e.requested_by,
        e.status,
        e.reviewed_by,
        e.reviewed_at,
        e.created_at,
        e.updated_at,
        inst.investment_no AS installment_no,
        u_req.name AS requester_name,
        u_req.photo AS requester_photo,
        (SELECT ur.role FROM user_roles ur WHERE ur.user_id = u_req.id LIMIT 1) AS requester_role,
        u_rev.name AS reviewer_name,
        u_rev.photo AS reviewer_photo,
        (SELECT ur2.role FROM user_roles ur2 WHERE ur2.user_id = u_rev.id LIMIT 1) AS reviewer_role,
        u_inv.name AS investor_name,
        u_inv.photo AS investor_photo,
        ic.card_name
    FROM investment_installment_edits e
    LEFT JOIN investment_installments inst ON e.installment_id = inst.id
    LEFT JOIN users u_req ON e.requested_by = u_req.id
    LEFT JOIN users u_rev ON e.reviewed_by = u_rev.id
    LEFT JOIN users u_inv ON e.investor_id = u_inv.id
    LEFT JOIN investment_cards ic ON e.card_id = ic.id
    WHERE {$whereClause}
    ORDER BY e.id DESC
    LIMIT 200
";

$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    echo json_encode(["success" => false, "error" => $mysqli->error]);
    exit;
}

if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}

$stmt->execute();
$result = $stmt->get_result();

$data = [];
while ($row = $result->fetch_assoc()) {
    $row['old_amount'] = (float)$row['old_amount'];
    $row['new_amount'] = (float)$row['new_amount'];
    $data[] = $row;
}
$stmt->close();

// Stats calculation
$stats = [
    "pending_count"  => 0,
    "approved_count" => 0,
    "rejected_count" => 0,
    "total_count"    => 0,
    "pending_amount" => 0
];

$resStats = $mysqli->query("
    SELECT 
        status, 
        COUNT(*) AS count,
        SUM(new_amount) AS total_amount
    FROM investment_installment_edits
    GROUP BY status
");
if ($resStats) {
    while ($s = $resStats->fetch_assoc()) {
        $c = (int)$s['count'];
        $stats['total_count'] += $c;
        if ($s['status'] === 'pending') {
            $stats['pending_count'] = $c;
            $stats['pending_amount'] = (float)$s['total_amount'];
        } elseif ($s['status'] === 'approved') {
            $stats['approved_count'] = $c;
        } elseif ($s['status'] === 'rejected') {
            $stats['rejected_count'] = $c;
        }
    }
}

echo json_encode([
    "success" => true,
    "data"    => $data,
    "stats"   => $stats
], JSON_UNESCAPED_UNICODE);
