<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");

$page        = max(1, intval($_GET['page'] ?? 1));
$limit       = max(1, min(100, intval($_GET['limit'] ?? 20)));
$offset      = ($page - 1) * $limit;
$category    = trim($_GET['category'] ?? '');
$eventType   = trim($_GET['event_type'] ?? '');
$status      = trim($_GET['status'] ?? '');
$search      = trim($_GET['search'] ?? '');
$startDate   = trim($_GET['start_date'] ?? '');
$endDate     = trim($_GET['end_date'] ?? '');
$audience    = trim($_GET['audience'] ?? 'all'); // 'admin', 'users', 'all'

$where = ["1=1"];
$params = [];
$types  = "";

// Audience Filter: Admin vs Users/Investors
if ($audience === 'admin') {
    $where[] = "recipient = 'supplylinkb@gmail.com'";
} elseif ($audience === 'users') {
    $where[] = "recipient != 'supplylinkb@gmail.com'";
}

if ($category !== '' && $category !== 'all') {
    $where[] = "category = ?";
    $params[] = $category;
    $types .= "s";
}

if ($eventType !== '' && $eventType !== 'all') {
    $where[] = "event_type = ?";
    $params[] = $eventType;
    $types .= "s";
}

if ($status !== '' && $status !== 'all') {
    $where[] = "status = ?";
    $params[] = $status;
    $types .= "s";
}

if ($search !== '') {
    $where[] = "(subject LIKE ? OR recipient LIKE ?)";
    $like = "%{$search}%";
    $params[] = $like;
    $params[] = $like;
    $types .= "ss";
}

if ($startDate !== '') {
    $where[] = "DATE(sent_at) >= ?";
    $params[] = $startDate;
    $types .= "s";
}

if ($endDate !== '') {
    $where[] = "DATE(sent_at) <= ?";
    $params[] = $endDate;
    $types .= "s";
}

$whereSql = implode(" AND ", $where);

// 1. Overall Summary Stats
$summary = [
    'total'         => 0,
    'sent'          => 0,
    'failed'        => 0,
    'admin_mails'   => 0,
    'user_mails'    => 0,
    'others_profit' => 0,
    'withdraw'      => 0
];

$sumRes = $mysqli->query("
    SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) AS sent,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
        SUM(CASE WHEN recipient = 'supplylinkb@gmail.com' THEN 1 ELSE 0 END) AS admin_mails,
        SUM(CASE WHEN recipient != 'supplylinkb@gmail.com' THEN 1 ELSE 0 END) AS user_mails,
        SUM(CASE WHEN category = 'others_profit' THEN 1 ELSE 0 END) AS others_profit,
        SUM(CASE WHEN category = 'withdraw' THEN 1 ELSE 0 END) AS withdraw
    FROM email_logs
");
if ($sumRes && $row = $sumRes->fetch_assoc()) {
    $summary['total']         = intval($row['total'] ?? 0);
    $summary['sent']          = intval($row['sent'] ?? 0);
    $summary['failed']        = intval($row['failed'] ?? 0);
    $summary['admin_mails']   = intval($row['admin_mails'] ?? 0);
    $summary['user_mails']    = intval($row['user_mails'] ?? 0);
    $summary['others_profit'] = intval($row['others_profit'] ?? 0);
    $summary['withdraw']      = intval($row['withdraw'] ?? 0);
}

// 2. Count for pagination
$countSql = "SELECT COUNT(*) as cnt FROM email_logs WHERE {$whereSql}";
$stmtCount = $mysqli->prepare($countSql);
if (!empty($types)) {
    $stmtCount->bind_param($types, ...$params);
}
$stmtCount->execute();
$totalRecords = $stmtCount->get_result()->fetch_assoc()['cnt'] ?? 0;
$stmtCount->close();

$totalPages = $totalRecords > 0 ? ceil($totalRecords / $limit) : 1;

// 3. Fetch Data without heavy html_body for maximum speed
$dataSql = "
    SELECT 
        id, 
        recipient, 
        sender, 
        subject, 
        category, 
        event_type, 
        related_id, 
        status, 
        error_message, 
        sent_at
    FROM email_logs
    WHERE {$whereSql}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
";

$stmtData = $mysqli->prepare($dataSql);
$typesData = $types . "ii";
$paramsData = array_merge($params, [$limit, $offset]);

$stmtData->bind_param($typesData, ...$paramsData);
$stmtData->execute();
$result = $stmtData->get_result();

$logs = [];
while ($row = $result->fetch_assoc()) {
    $logs[] = $row;
}
$stmtData->close();

echo json_encode([
    "success"    => true,
    "data"       => $logs,
    "summary"    => $summary,
    "pagination" => [
        "page"          => $page,
        "limit"         => $limit,
        "total_records" => intval($totalRecords),
        "total_pages"   => intval($totalPages)
    ]
], JSON_UNESCAPED_UNICODE);
