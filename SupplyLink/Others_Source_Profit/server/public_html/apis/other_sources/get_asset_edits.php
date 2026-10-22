<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=UTF-8");

$asset_id     = isset($_GET['asset_id']) ? (int)$_GET['asset_id'] : 0;
$category     = trim($_GET['category'] ?? '');
$status       = trim($_GET['status'] ?? '');
$requested_by = isset($_GET['requested_by']) ? (int)$_GET['requested_by'] : 0;
$search       = trim($_GET['search'] ?? '');
$month        = trim($_GET['month'] ?? '');
$start_date   = trim($_GET['start_date'] ?? '');
$end_date     = trim($_GET['end_date'] ?? '');

$where = ["1=1"];
$params = [];
$types = "";

if ($asset_id > 0) {
    $where[] = "e.asset_id = ?";
    $params[] = $asset_id;
    $types .= "i";
}

if (!empty($category) && $category !== 'all') {
    $where[] = "e.new_category = ?";
    $params[] = $category;
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
    $where[] = "DATE_FORMAT(e.new_purchase_date, '%Y-%m') = ?";
    $params[] = $month;
    $types .= "s";
}

if (!empty($start_date)) {
    $where[] = "e.new_purchase_date >= ?";
    $params[] = $start_date;
    $types .= "s";
}

if (!empty($end_date)) {
    $where[] = "e.new_purchase_date <= ?";
    $params[] = $end_date;
    $types .= "s";
}

if (!empty($search)) {
    $where[] = "(e.new_asset_name LIKE ? OR e.new_vendor_info LIKE ? OR e.new_reg_no LIKE ? OR e.new_contact_person LIKE ? OR u_req.name LIKE ? OR e.asset_id LIKE ? OR e.request_reason LIKE ?)";
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
        e.*,
        a.status AS current_asset_status,
        a.purchase_price AS current_purchase_price,
        u_req.name AS requester_name,
        u_req.photo AS requester_photo,
        (SELECT ur.role FROM user_roles ur WHERE ur.user_id = u_req.id LIMIT 1) AS requester_role,
        u_rev.name AS reviewer_name,
        u_rev.photo AS reviewer_photo,
        (SELECT ur2.role FROM user_roles ur2 WHERE ur2.user_id = u_rev.id LIMIT 1) AS reviewer_role
    FROM other_asset_edits e
    LEFT JOIN other_assets a ON e.asset_id = a.id
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
    $row['old_purchase_price'] = (float)$row['old_purchase_price'];
    $row['new_purchase_price'] = (float)$row['new_purchase_price'];
    $row['old_amount'] = $row['old_purchase_price'];
    $row['new_amount'] = $row['new_purchase_price'];
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
        SUM(new_purchase_price) AS total_amount
    FROM other_asset_edits
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
