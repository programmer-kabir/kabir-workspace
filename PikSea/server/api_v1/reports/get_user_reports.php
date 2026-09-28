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

    $statusFilter = isset($_GET['status']) ? trim($_GET['status']) : 'all';
    $sortFilter = isset($_GET['sort']) ? trim($_GET['sort']) : 'newest';
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';

    $whereConditions = ["1=1"];
    $params = [];
    $types = "";

    if (!empty($statusFilter) && $statusFilter !== 'all') {
        $whereConditions[] = "ur.status = ?";
        $params[] = $statusFilter;
        $types .= "s";
    }

    if (!empty($search)) {
        $whereConditions[] = "(u_target.name LIKE ? OR u_target.email LIKE ? OR ur.reporter_name LIKE ? OR ur.reason LIKE ?)";
        $searchParam = "%$search%";
        $params[] = $searchParam;
        $params[] = $searchParam;
        $params[] = $searchParam;
        $params[] = $searchParam;
        $types .= "ssss";
    }

    $whereSql = implode(" AND ", $whereConditions);

    // Sorting Clause
    $orderBy = "ur.created_at DESC";
    if ($sortFilter === 'oldest') {
        $orderBy = "ur.created_at ASC";
    } elseif ($sortFilter === 'pending_first') {
        $orderBy = "FIELD(ur.status, 'pending', 'reviewed', 'resolved', 'dismissed'), ur.created_at DESC";
    } elseif ($sortFilter === 'most_reported') {
        $orderBy = "reports_count DESC, ur.created_at DESC";
    }

    // Get overall statistics summary
    $statsSql = "
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
            SUM(CASE WHEN status = 'dismissed' THEN 1 ELSE 0 END) as dismissed
        FROM user_reports
    ";
    $statsRes = $mysqli->query($statsSql)->fetch_assoc();

    // Total count for current filter
    $countSql = "
        SELECT COUNT(ur.id) as total
        FROM user_reports ur
        LEFT JOIN users u_target ON u_target.id = ur.target_user_id
        WHERE $whereSql
    ";

    $countStmt = $mysqli->prepare($countSql);
    if (!empty($types)) {
        $countStmt->bind_param($types, ...$params);
    }
    $countStmt->execute();
    $totalFiltered = $countStmt->get_result()->fetch_assoc()['total'];
    $countStmt->close();

    $totalPages = max(1, ceil($totalFiltered / $limit));

    // Data query with subquery for total reports per user
    $dataSql = "
        SELECT 
            ur.id,
            ur.target_user_id,
            u_target.name AS target_user_name,
            u_target.username AS target_user_username,
            u_target.email AS target_user_email,
            u_target.photo AS target_user_photo,
            ur.reporter_id,
            ur.reporter_name,
            ur.reporter_email,
            ur.reason,
            ur.description,
            ur.status,
            ur.admin_note,
            ur.reviewed_by,
            ur.reviewed_by_name,
            ur.reviewed_at,
            ur.action_taken,
            ur.created_at,
            (SELECT COUNT(*) FROM user_reports ur_sub WHERE ur_sub.target_user_id = ur.target_user_id) AS reports_count,
            (SELECT COUNT(*) FROM user_reports ur_sub WHERE ur_sub.target_user_id = ur.target_user_id AND ur_sub.action_taken = 'warn_user') AS warning_count,
            (SELECT COUNT(*) FROM user_reports ur_sub WHERE ur_sub.target_user_id = ur.target_user_id AND ur_sub.action_taken = 'suspend_user') AS suspension_count
        FROM user_reports ur
        LEFT JOIN users u_target ON u_target.id = ur.target_user_id
        WHERE $whereSql
        ORDER BY $orderBy
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

    $reports = [];
    while ($row = $result->fetch_assoc()) {
        $row['id'] = (int)$row['id'];
        $row['target_user_id'] = (int)$row['target_user_id'];
        $row['reports_count'] = (int)$row['reports_count'];
        $row['warning_count'] = (int)$row['warning_count'];
        $row['suspension_count'] = (int)$row['suspension_count'];
        $reports[] = $row;
    }
    $dataStmt->close();

    echo json_encode([
        "success" => true,
        "data" => $reports,
        "page" => $page,
        "limit" => $limit,
        "total" => (int)$totalFiltered,
        "totalPages" => (int)$totalPages,
        "stats" => [
            "total" => (int)($statsRes['total'] ?? 0),
            "pending" => (int)($statsRes['pending'] ?? 0),
            "resolved" => (int)($statsRes['resolved'] ?? 0),
            "dismissed" => (int)($statsRes['dismissed'] ?? 0)
        ]
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to fetch user reports",
        "error" => $e->getMessage()
    ]);
}
