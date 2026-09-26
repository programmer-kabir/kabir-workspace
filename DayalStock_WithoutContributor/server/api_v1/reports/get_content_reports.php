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
        $whereConditions[] = "cr.status = ?";
        $params[] = $statusFilter;
        $types .= "s";
    }

    if (!empty($search)) {
        $whereConditions[] = "(c.title LIKE ? OR cr.reporter_name LIKE ? OR cr.reporter_email LIKE ? OR cr.reason LIKE ?)";
        $searchParam = "%$search%";
        $params[] = $searchParam;
        $params[] = $searchParam;
        $params[] = $searchParam;
        $params[] = $searchParam;
        $types .= "ssss";
    }

    $whereSql = implode(" AND ", $whereConditions);

    // Sorting Clause
    $orderBy = "cr.created_at DESC";
    if ($sortFilter === 'oldest') {
        $orderBy = "cr.created_at ASC";
    } elseif ($sortFilter === 'pending_first') {
        $orderBy = "FIELD(cr.status, 'pending', 'reviewed', 'resolved', 'dismissed'), cr.created_at DESC";
    } elseif ($sortFilter === 'most_reported') {
        $orderBy = "reports_count DESC, cr.created_at DESC";
    }

    // Get overall statistics summary
    $statsSql = "
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
            SUM(CASE WHEN status = 'dismissed' THEN 1 ELSE 0 END) as dismissed
        FROM content_reports
    ";
    $statsRes = $mysqli->query($statsSql)->fetch_assoc();

    // Total count for current filter
    $countSql = "
        SELECT COUNT(cr.id) as total
        FROM content_reports cr
        LEFT JOIN contents c ON c.id = cr.content_id
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

    // Data query with subquery for total reports per content_id
    $dataSql = "
        SELECT 
            cr.id,
            cr.content_id,
            c.title AS content_title,
            c.slug AS content_slug,
            c.preview_image AS content_preview,
            c.status AS content_status,
            COALESCE(u_author.name, u_direct_author.name, 'Contributor') AS content_author_name,
            cr.reporter_id,
            cr.reporter_name,
            cr.reporter_email,
            cr.reason,
            cr.description,
            cr.status,
            cr.admin_note,
            cr.reviewed_by,
            cr.reviewed_by_name,
            cr.reviewed_at,
            cr.action_taken,
            cr.created_at,
            (SELECT COUNT(*) FROM content_reports cr_sub WHERE cr_sub.content_id = cr.content_id) AS reports_count
        FROM content_reports cr
        LEFT JOIN contents c ON c.id = cr.content_id
        LEFT JOIN authors a ON a.id = c.author_id
        LEFT JOIN users u_author ON u_author.id = a.user_id
        LEFT JOIN users u_direct_author ON u_direct_author.id = c.author_id
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
        $row['content_id'] = (int)$row['content_id'];
        $row['reports_count'] = (int)$row['reports_count'];
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
        "message" => "Failed to fetch content reports",
        "error" => $e->getMessage()
    ]);
}
