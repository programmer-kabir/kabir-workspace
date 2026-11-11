<?php
// =========================================================================
// SupplyLink - Get Staff Activities & Audit Timeline API
// Restricted strictly to Admin and Developer
// =========================================================================

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_guard.php';
guardAdminDevOnly();

require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");

$userId = isset($_GET['user_id']) && $_GET['user_id'] !== 'all' && $_GET['user_id'] !== '' ? (int)$_GET['user_id'] : null;
$category = trim($_GET['category'] ?? 'all');
$date = trim($_GET['date'] ?? '');
$dateFrom = trim($_GET['date_from'] ?? '');
$dateTo = trim($_GET['date_to'] ?? '');
$page = max(1, (int)($_GET['page'] ?? 1));
$limit = max(10, min(100, (int)($_GET['limit'] ?? 50)));
$offset = ($page - 1) * $limit;

try {
    $whereClauses = ["1=1"];
    $types = "";
    $params = [];

    // Filter by User
    if ($userId !== null) {
        $whereClauses[] = "user_id = ?";
        $types .= "i";
        $params[] = $userId;
    }

    // Filter by Category
    if ($category !== 'all' && in_array($category, ['financial', 'navigation', 'auth', 'modification', 'system'])) {
        $whereClauses[] = "category = ?";
        $types .= "s";
        $params[] = $category;
    }

    // Filter by Date or Date Range
    if (!empty($date)) {
        $whereClauses[] = "DATE(created_at) = ?";
        $types .= "s";
        $params[] = $date;
    } elseif (!empty($dateFrom) && !empty($dateTo)) {
        $whereClauses[] = "DATE(created_at) BETWEEN ? AND ?";
        $types .= "ss";
        $params[] = $dateFrom;
        $params[] = $dateTo;
    } elseif (!empty($dateFrom)) {
        $whereClauses[] = "DATE(created_at) >= ?";
        $types .= "s";
        $params[] = $dateFrom;
    }

    $whereSql = " WHERE " . implode(" AND ", $whereClauses);

    // 1. Compute Summary KPIs for the filtered scope
    $summarySql = "
        SELECT 
            COUNT(*) AS total_actions,
            COALESCE(SUM(CASE WHEN category = 'financial' THEN 1 ELSE 0 END), 0) AS total_financial_actions,
            COALESCE(SUM(CASE WHEN action_type LIKE '%INVEST%' OR entity_type = 'investment' THEN amount ELSE 0 END), 0) AS total_investments,
            COALESCE(SUM(CASE WHEN action_type LIKE '%INSTALLMENT%' OR entity_type = 'installment' THEN amount ELSE 0 END), 0) AS total_installments,
            COALESCE(SUM(CASE WHEN action_type IN ('CASH_OUT', 'EXPENSE_ADD', 'WITHDRAW_APPROVE') THEN amount ELSE 0 END), 0) AS total_cash_out
        FROM system_activity_logs
        {$whereSql}
    ";

    $summaryStmt = $mysqli->prepare($summarySql);
    if (!empty($params)) {
        $summaryStmt->bind_param($types, ...$params);
    }
    $summaryStmt->execute();
    $summary = $summaryStmt->get_result()->fetch_assoc();

    $totalRecords = (int)($summary['total_actions'] ?? 0);

    // 2. Fetch Paginated Records
    $dataSql = "
        SELECT 
            id,
            user_id,
            user_name,
            user_role,
            action_type,
            category,
            entity_type,
            entity_id,
            amount,
            description,
            details_json,
            ip_address,
            user_agent,
            created_at
        FROM system_activity_logs
        {$whereSql}
        ORDER BY id DESC
        LIMIT ?, ?
    ";

    $dataStmt = $mysqli->prepare($dataSql);
    $dataTypes = $types . "ii";
    $dataParams = array_merge($params, [$offset, $limit]);
    $dataStmt->bind_param($dataTypes, ...$dataParams);
    $dataStmt->execute();
    $activities = $dataStmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // Format activities for easy frontend consumption
    foreach ($activities as &$act) {
        $act['amount'] = (float)($act['amount'] ?? 0);
        if (!empty($act['details_json'])) {
            $decoded = json_decode($act['details_json'], true);
            $act['details'] = $decoded ?: $act['details_json'];
        } else {
            $act['details'] = null;
        }
    }

    echo json_encode([
        "success" => true,
        "summary" => [
            "total_actions" => (int)($summary['total_actions'] ?? 0),
            "total_financial_actions" => (int)($summary['total_financial_actions'] ?? 0),
            "total_investments" => (float)($summary['total_investments'] ?? 0),
            "total_installments" => (float)($summary['total_installments'] ?? 0),
            "total_cash_out" => (float)($summary['total_cash_out'] ?? 0),
        ],
        "pagination" => [
            "total_records" => $totalRecords,
            "page" => $page,
            "limit" => $limit,
            "total_pages" => max(1, ceil($totalRecords / $limit))
        ],
        "activities" => $activities
    ], JSON_UNESCAPED_UNICODE);
    exit;

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

