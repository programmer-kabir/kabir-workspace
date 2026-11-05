<?php
/**
 * ============================================================================
 * SupplyLink - Activity & Audit Trail Data API
 * ফাইল: server/apis/audit/get_activity_logs.php
 * ============================================================================
 */

header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

date_default_timezone_set('Asia/Dhaka');

try {
    // 1. Parse Filter Parameters
    $userId = !empty($_GET['user_id']) ? (int)$_GET['user_id'] : null;
    $category = !empty($_GET['category']) && $_GET['category'] !== 'all' ? trim($_GET['category']) : null;
    $actionType = !empty($_GET['action_type']) ? trim($_GET['action_type']) : null;
    $search = !empty($_GET['search']) ? trim($_GET['search']) : null;

    $date = !empty($_GET['date']) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $_GET['date']) ? $_GET['date'] : null;
    $dateFrom = !empty($_GET['date_from']) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $_GET['date_from']) ? $_GET['date_from'] : null;
    $dateTo = !empty($_GET['date_to']) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $_GET['date_to']) ? $_GET['date_to'] : null;

    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(200, max(10, (int)($_GET['limit'] ?? 50)));
    $offset = ($page - 1) * $limit;

    // 2. Build WHERE Clause
    $whereParts = ["1=1"];
    $types = "";
    $params = [];

    if ($userId) {
        $whereParts[] = "user_id = ?";
        $types .= "i";
        $params[] = $userId;
    }

    if ($category) {
        $whereParts[] = "category = ?";
        $types .= "s";
        $params[] = $category;
    }

    if ($actionType) {
        $whereParts[] = "action_type = ?";
        $types .= "s";
        $params[] = $actionType;
    }

    if ($date) {
        $whereParts[] = "DATE(created_at) = ?";
        $types .= "s";
        $params[] = $date;
    } elseif ($dateFrom && $dateTo) {
        $whereParts[] = "DATE(created_at) BETWEEN ? AND ?";
        $types .= "ss";
        $params[] = $dateFrom;
        $params[] = $dateTo;
    } elseif ($dateFrom) {
        $whereParts[] = "DATE(created_at) >= ?";
        $types .= "s";
        $params[] = $dateFrom;
    }

    if ($search) {
        $whereParts[] = "(description LIKE ? OR user_name LIKE ? OR entity_id LIKE ?)";
        $types .= "sss";
        $searchTerm = "%{$search}%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }

    $whereSql = implode(" AND ", $whereParts);

    // 3. Count Total Records
    $countSql = "SELECT COUNT(*) as total, IFNULL(SUM(amount), 0) as total_amount FROM `system_activity_logs` WHERE {$whereSql}";
    $countStmt = $mysqli->prepare($countSql);
    if (!empty($params)) {
        $countStmt->bind_param($types, ...$params);
    }
    $countStmt->execute();
    $countRes = $countStmt->get_result()->fetch_assoc();
    $totalRecords = (int)($countRes['total'] ?? 0);
    $totalAmountFiltered = (float)($countRes['total_amount'] ?? 0);
    $countStmt->close();

    // 4. Fetch Paginated Records
    $dataSql = "
        SELECT 
            id, user_id, user_name, user_role, action_type, category,
            entity_type, entity_id, amount, description, details_json,
            ip_address, user_agent, created_at
        FROM `system_activity_logs`
        WHERE {$whereSql}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
    ";
    $dataStmt = $mysqli->prepare($dataSql);
    $dataTypes = $types . "ii";
    $dataParams = array_merge($params, [$limit, $offset]);
    $dataStmt->bind_param($dataTypes, ...$dataParams);
    $dataStmt->execute();
    $res = $dataStmt->get_result();

    $logs = [];
    while ($row = $res->fetch_assoc()) {
        $details = null;
        if (!empty($row['details_json'])) {
            $details = json_decode($row['details_json'], true);
        }
        $row['details'] = $details;
        $row['amount'] = (float)$row['amount'];
        $logs[] = $row;
    }
    $dataStmt->close();

    // 5. Today's High-Level KPI Stats
    $today = date('Y-m-d');
    $statQuery = $mysqli->query("
        SELECT 
            COUNT(*) as total_today,
            COUNT(DISTINCT user_id) as active_users_today,
            IFNULL(SUM(CASE WHEN category = 'financial' THEN amount ELSE 0 END), 0) as financial_volume_today,
            COUNT(CASE WHEN category = 'auth' AND action_type = 'LOGIN' THEN 1 END) as logins_today
        FROM `system_activity_logs`
        WHERE DATE(created_at) = '{$today}'
    ");
    $stats = $statQuery ? $statQuery->fetch_assoc() : [];

    // 6. Distinct Users List (for frontend dropdown filter)
    $usersQuery = $mysqli->query("
        SELECT DISTINCT user_id, user_name, user_role
        FROM `system_activity_logs`
        WHERE user_id IS NOT NULL
        ORDER BY user_name ASC
        LIMIT 100
    ");
    $usersList = [];
    if ($usersQuery) {
        while ($u = $usersQuery->fetch_assoc()) {
            $usersList[] = $u;
        }
    }

    echo json_encode([
        "success" => true,
        "total" => $totalRecords,
        "page" => $page,
        "limit" => $limit,
        "total_pages" => ceil($totalRecords / $limit),
        "total_amount" => $totalAmountFiltered,
        "stats" => [
            "total_today" => (int)($stats['total_today'] ?? 0),
            "active_users_today" => (int)($stats['active_users_today'] ?? 0),
            "financial_volume_today" => (float)($stats['financial_volume_today'] ?? 0),
            "logins_today" => (int)($stats['logins_today'] ?? 0),
        ],
        "users" => $usersList,
        "logs" => $logs
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
