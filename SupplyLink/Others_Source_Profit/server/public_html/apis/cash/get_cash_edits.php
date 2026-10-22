<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=UTF-8");

$cash_id      = isset($_GET['cash_id']) ? (int)$_GET['cash_id'] : 0;
$type         = trim($_GET['type'] ?? '');
$status       = trim($_GET['status'] ?? '');
$requested_by = isset($_GET['requested_by']) ? (int)$_GET['requested_by'] : 0;
$search       = trim($_GET['search'] ?? '');
$month        = trim($_GET['month'] ?? '');
$start_date   = trim($_GET['start_date'] ?? '');
$end_date     = trim($_GET['end_date'] ?? '');

$where = ["1=1"];
$params = [];
$types = "";

if ($cash_id > 0) {
    $where[] = "e.cash_id = ?";
    $params[] = $cash_id;
    $types .= "i";
}

if (!empty($type) && in_array($type, ['in', 'out'])) {
    $where[] = "e.type = ?";
    $params[] = $type;
    $types .= "s";
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

if (!empty($month)) {
    $where[] = "DATE_FORMAT(e.new_date, '%Y-%m') = ?";
    $params[] = $month;
    $types .= "s";
}

if (!empty($start_date)) {
    $where[] = "e.new_date >= ?";
    $params[] = $start_date;
    $types .= "s";
}

if (!empty($end_date)) {
    $where[] = "e.new_date <= ?";
    $params[] = $end_date;
    $types .= "s";
}

if (!empty($search)) {
    $where[] = "(e.new_source LIKE ? OR e.new_purpose LIKE ? OR e.old_source LIKE ? OR e.old_purpose LIKE ? OR u_req.name LIKE ? OR e.cash_id LIKE ? OR e.request_reason LIKE ?)";
    $like = "%" . $search . "%";
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
    $types .= "sssssss";
}

$whereClause = implode(" AND ", $where);

$sql = "
    SELECT 
        e.id,
        e.cash_id,
        e.type,
        e.old_amount,
        e.new_amount,
        e.old_date,
        e.new_date,
        e.old_category,
        e.new_category,
        e.old_source,
        e.new_source,
        e.old_purpose,
        e.new_purpose,
        e.old_remarks,
        e.new_remarks,
        e.request_reason,
        e.requested_by,
        e.status,
        e.reviewed_by,
        e.reviewed_at,
        e.review_note,
        e.created_at,
        e.updated_at,
        c.refId AS cash_ref_id,
        c.approval_status AS current_cash_status,
        u_req.name AS requester_name,
        u_req.photo AS requester_photo,
        (SELECT ur.role FROM user_roles ur WHERE ur.user_id = u_req.id LIMIT 1) AS requester_role,
        u_rev.name AS reviewer_name,
        u_rev.photo AS reviewer_photo,
        (SELECT ur2.role FROM user_roles ur2 WHERE ur2.user_id = u_rev.id LIMIT 1) AS reviewer_role
    FROM cash_edits e
    LEFT JOIN cash c ON e.cash_id = c.id
    LEFT JOIN users u_req ON e.requested_by = u_req.id
    LEFT JOIN users u_rev ON e.reviewed_by = u_rev.id
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
    FROM cash_edits
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
