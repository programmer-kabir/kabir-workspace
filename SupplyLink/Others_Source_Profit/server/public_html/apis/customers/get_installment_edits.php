<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=UTF-8");

function apiError($message, $debug = null, $code = 400) {
  http_response_code($code);
  echo json_encode([
    "success" => false,
    "message" => $message,
    "debug"   => $debug
  ], JSON_UNESCAPED_UNICODE);
  exit;
}

$payment_id   = isset($_GET['payment_id']) ? (int)$_GET['payment_id'] : 0;
$card_id      = isset($_GET['card_id']) ? (int)$_GET['card_id'] : 0;
$pending_only = isset($_GET['pending_only']) && $_GET['pending_only'] == '1';

$status           = trim($_GET['status'] ?? '');
$action_type      = trim($_GET['action_type'] ?? '');
$installment_type = trim($_GET['installment_type'] ?? '');
$requested_by     = isset($_GET['requested_by']) ? (int)$_GET['requested_by'] : 0;
$month            = trim($_GET['month'] ?? ''); // YYYY-MM
$start_date       = trim($_GET['start_date'] ?? '');
$end_date         = trim($_GET['end_date'] ?? '');
$search           = trim($_GET['search'] ?? '');

// Case 1: Specific Payment ID or Card ID Timeline
if ($payment_id > 0 || ($card_id > 0 && !$pending_only && empty($status) && empty($month))) {
    $where = $payment_id > 0 ? "e.payment_id = ?" : "e.card_id = ?";
    $param = $payment_id > 0 ? $payment_id : $card_id;

    $sql = "
        SELECT 
            e.id,
            e.payment_id,
            e.card_id,
            e.action_type,
            e.old_status,
            e.new_status,
            e.old_paid_date,
            e.new_paid_date,
            e.amount,
            e.request_reason,
            e.status,
            e.created_at,
            e.reviewed_at,
            req_u.name AS requester_name,
            req_u.photo AS requester_photo,
            (SELECT ur.role FROM user_roles ur WHERE ur.user_id = req_u.id LIMIT 1) AS requester_role,
            rev_u.name AS reviewer_name,
            rev_u.photo AS reviewer_photo,
            (SELECT ur2.role FROM user_roles ur2 WHERE ur2.user_id = rev_u.id LIMIT 1) AS reviewer_role,
            p.tag AS installment_tag,
            p.installment_no,
            p.due_amount,
            c.product_name,
            cust_u.name AS customer_name,
            cust_u.mobile AS customer_mobile
        FROM installment_payment_edits e
        LEFT JOIN installment_payments p ON e.payment_id = p.id
        LEFT JOIN installment_cards c ON e.card_id = c.id
        LEFT JOIN users cust_u ON c.user_id = cust_u.id
        LEFT JOIN users req_u ON e.requested_by = req_u.id
        LEFT JOIN users rev_u ON e.reviewed_by = rev_u.id
        WHERE {$where}
        ORDER BY e.id DESC
    ";

    $stmt = $mysqli->prepare($sql);
    if (!$stmt) apiError("Prepare query failed", $mysqli->error);
    $stmt->bind_param("i", $param);
    $stmt->execute();
    $res = $stmt->get_result();

    $history = [];
    while ($row = $res->fetch_assoc()) {
        $row['id'] = (int)$row['id'];
        $row['payment_id'] = (int)$row['payment_id'];
        $row['card_id'] = (int)$row['card_id'];
        $row['amount'] = (float)$row['amount'];
        $row['due_amount'] = (float)($row['due_amount'] ?? 0);
        $row['installment_no'] = (int)($row['installment_no'] ?? 0);
        $history[] = $row;
    }
    $stmt->close();

    echo json_encode([
        "success" => true,
        "count"   => count($history),
        "data"    => $history
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Case 2: Comprehensive Management View (with search, category, and date/month filters)
// STRICT: Only actual requests should appear here (not normal payments or extra logs)
$whereClauses = [
    "e.action_type IN ('request_unpaid', 'unpaid_request')",
    "e.status IN ('pending', 'approved', 'rejected')"
];
$params = [];
$types = "";

if ($pending_only || $status === 'pending') {
    $whereClauses[] = "e.status = 'pending'";
} elseif (!empty($status) && $status !== 'all') {
    $whereClauses[] = "e.status = ?";
    $params[] = $status;
    $types .= "s";
}

if (!empty($action_type) && $action_type !== 'all') {
    $whereClauses[] = "e.action_type = ?";
    $params[] = $action_type;
    $types .= "s";
}

if ($requested_by > 0) {
    $whereClauses[] = "e.requested_by = ?";
    $params[] = $requested_by;
    $types .= "i";
}

if (!empty($installment_type) && $installment_type !== 'all') {
    if ($installment_type === 'down_payment') {
        $whereClauses[] = "(p.installment_no = 0 OR p.tag LIKE '%ডাউন%')";
    } elseif ($installment_type === 'regular') {
        $whereClauses[] = "p.installment_no > 0";
    }
}

if (!empty($month)) {
    $whereClauses[] = "DATE_FORMAT(e.created_at, '%Y-%m') = ?";
    $params[] = $month;
    $types .= "s";
}

if (!empty($start_date) && !empty($end_date)) {
    $whereClauses[] = "DATE(e.created_at) BETWEEN ? AND ?";
    $params[] = $start_date;
    $params[] = $end_date;
    $types .= "ss";
} elseif (!empty($start_date)) {
    $whereClauses[] = "DATE(e.created_at) >= ?";
    $params[] = $start_date;
    $types .= "s";
} elseif (!empty($end_date)) {
    $whereClauses[] = "DATE(e.created_at) <= ?";
    $params[] = $end_date;
    $types .= "s";
}

if (!empty($search)) {
    $whereClauses[] = "(
        cust_u.name LIKE ? 
        OR cust_u.mobile LIKE ? 
        OR req_u.name LIKE ? 
        OR e.card_id = ?
        OR p.tag LIKE ?
    )";
    $searchWildcard = "%" . $search . "%";
    $searchInt = (int)$search;
    $params[] = $searchWildcard;
    $params[] = $searchWildcard;
    $params[] = $searchWildcard;
    $params[] = $searchInt;
    $params[] = $searchWildcard;
    $types .= "sssis";
}

$whereSql = implode(" AND ", $whereClauses);

$sql = "
    SELECT 
        e.id,
        e.payment_id,
        e.card_id,
        e.action_type,
        e.old_status,
        e.new_status,
        e.old_paid_date,
        e.new_paid_date,
        e.amount,
        e.request_reason,
        e.status,
        e.created_at,
        e.reviewed_at,
        req_u.name AS requester_name,
        req_u.photo AS requester_photo,
        (SELECT ur.role FROM user_roles ur WHERE ur.user_id = req_u.id LIMIT 1) AS requester_role,
        rev_u.name AS reviewer_name,
        rev_u.photo AS reviewer_photo,
        (SELECT ur2.role FROM user_roles ur2 WHERE ur2.user_id = rev_u.id LIMIT 1) AS reviewer_role,
        p.installment_no,
        p.tag AS installment_tag,
        p.due_amount,
        c.product_name,
        cust_u.name AS customer_name,
        cust_u.mobile AS customer_mobile
    FROM installment_payment_edits e
    LEFT JOIN installment_payments p ON e.payment_id = p.id
    LEFT JOIN installment_cards c ON e.card_id = c.id
    LEFT JOIN users cust_u ON c.user_id = cust_u.id
    LEFT JOIN users req_u ON e.requested_by = req_u.id
    LEFT JOIN users rev_u ON e.reviewed_by = rev_u.id
    WHERE {$whereSql}
    ORDER BY e.id DESC
    LIMIT 200
";

if (!empty($params)) {
    $stmt = $mysqli->prepare($sql);
    if (!$stmt) apiError("Prepare failed", $mysqli->error);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $res = $stmt->get_result();
    $stmt->close();
} else {
    $res = $mysqli->query($sql);
}

if (!$res) apiError("Query failed", $mysqli->error);

$list = [];
$stats = [
    'pending_count' => 0,
    'approved_count' => 0,
    'rejected_count' => 0,
    'paid_count' => 0,
    'total_count' => 0,
    'pending_amount' => 0,
];

// Calculate summary stats (Strictly requests)
$statRes = $mysqli->query("
    SELECT 
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected_count,
        COUNT(*) AS total_count,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS pending_amount
    FROM installment_payment_edits
    WHERE action_type IN ('request_unpaid', 'unpaid_request')
      AND status IN ('pending', 'approved', 'rejected')
");
if ($statRes) {
    $stats = $statRes->fetch_assoc();
    $stats['pending_count'] = (int)($stats['pending_count'] ?? 0);
    $stats['approved_count'] = (int)($stats['approved_count'] ?? 0);
    $stats['rejected_count'] = (int)($stats['rejected_count'] ?? 0);
    $stats['total_count'] = (int)($stats['total_count'] ?? 0);
    $stats['pending_amount'] = (float)($stats['pending_amount'] ?? 0);
}

while ($row = $res->fetch_assoc()) {
    $row['id'] = (int)$row['id'];
    $row['payment_id'] = (int)$row['payment_id'];
    $row['card_id'] = (int)$row['card_id'];
    $row['amount'] = (float)$row['amount'];
    $row['due_amount'] = (float)($row['due_amount'] ?? 0);
    $row['installment_no'] = (int)($row['installment_no'] ?? 0);
    $list[] = $row;
}

echo json_encode([
    "success" => true,
    "count"   => count($list),
    "stats"   => $stats,
    "data"    => $list
], JSON_UNESCAPED_UNICODE);
