<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/check_role.php';

header("Content-Type: application/json; charset=UTF-8");

// Protect endpoint: Only admin role can access
requireRole('admin');

try {
    $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? min(50, max(1, (int)$_GET['limit'])) : 10;
    $offset = ($page - 1) * $limit;

    $typeFilter = isset($_GET['type']) ? trim($_GET['type']) : 'all';
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';

    $whereConditions = ["1=1"];
    $params = [];
    $types = "";

    if (!empty($typeFilter) && $typeFilter !== 'all') {
        $whereConditions[] = "email_type = ?";
        $params[] = $typeFilter;
        $types .= "s";
    }

    if (!empty($search)) {
        $whereConditions[] = "(recipient_email LIKE ? OR recipient_name LIKE ? OR subject LIKE ? OR message_title LIKE ?)";
        $searchParam = "%$search%";
        $params[] = $searchParam;
        $params[] = $searchParam;
        $params[] = $searchParam;
        $params[] = $searchParam;
        $types .= "ssss";
    }

    $whereSql = implode(" AND ", $whereConditions);

    // Get statistics summary
    $statsSql = "
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN email_type = 'warning' THEN 1 ELSE 0 END) as warning_count,
            SUM(CASE WHEN email_type = 'suspension' THEN 1 ELSE 0 END) as suspension_count,
            SUM(CASE WHEN email_type = 'content_unpublished' OR email_type = 'content_removal' THEN 1 ELSE 0 END) as removal_count
        FROM email_logs
    ";
    $statsRes = $mysqli->query($statsSql)->fetch_assoc();

    // Total filtered count
    $countSql = "SELECT COUNT(*) as total FROM email_logs WHERE $whereSql";
    $countStmt = $mysqli->prepare($countSql);
    if (!empty($types)) {
        $countStmt->bind_param($types, ...$params);
    }
    $countStmt->execute();
    $totalFiltered = $countStmt->get_result()->fetch_assoc()['total'];
    $countStmt->close();

    $totalPages = max(1, ceil($totalFiltered / $limit));

    // Data query
    $dataSql = "
        SELECT 
            id,
            recipient_user_id,
            recipient_name,
            recipient_email,
            email_type,
            subject,
            message_title,
            message_body,
            status,
            sent_by_id,
            sent_by_name,
            created_at
        FROM email_logs
        WHERE $whereSql
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    ";

    $dataStmt = $mysqli->prepare($dataSql);
    $bindParams = $params;
    $bindTypes = $types . "ii";
    $bindParams[] = $limit;
    $bindParams[] = $offset;

    $dataStmt->bind_param($bindTypes, ...$bindParams);
    $dataStmt->execute();
    $result = $dataStmt->get_result();

    $logs = [];
    while ($row = $result->fetch_assoc()) {
        $row['id'] = (int)$row['id'];
        $row['recipient_user_id'] = (int)$row['recipient_user_id'];
        $logs[] = $row;
    }
    $dataStmt->close();

    echo json_encode([
        "success" => true,
        "data" => $logs,
        "page" => $page,
        "limit" => $limit,
        "total" => (int)$totalFiltered,
        "totalPages" => (int)$totalPages,
        "stats" => [
            "total" => (int)($statsRes['total'] ?? 0),
            "warning" => (int)($statsRes['warning_count'] ?? 0),
            "suspension" => (int)($statsRes['suspension_count'] ?? 0),
            "content_removal" => (int)($statsRes['removal_count'] ?? 0)
        ]
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to fetch email logs",
        "error" => $e->getMessage()
    ]);
}
