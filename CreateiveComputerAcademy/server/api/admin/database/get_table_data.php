<?php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit();
}

$tableName = isset($_GET['table']) ? trim($_GET['table']) : (isset($_POST['table']) ? trim($_POST['table']) : '');

if (empty($tableName)) {
    echo json_encode(["status" => "error", "message" => "Table name is required"]);
    exit();
}

// Sanitize table name (only alphanumeric and underscore)
if (!preg_match('/^[a-zA-Z0-9_]+$/', $tableName)) {
    echo json_encode(["status" => "error", "message" => "Invalid table name"]);
    exit();
}

try {
    // 1. Fetch column metadata
    $colQuery = "
        SELECT 
            COLUMN_NAME as name,
            DATA_TYPE as data_type,
            COLUMN_TYPE as full_type,
            IS_NULLABLE as is_nullable,
            COLUMN_KEY as column_key,
            COLUMN_DEFAULT as default_value,
            EXTRA as extra,
            ORDINAL_POSITION as position
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table_name
        ORDER BY ORDINAL_POSITION ASC
    ";
    $colStmt = $db->prepare($colQuery);
    $colStmt->execute([':table_name' => $tableName]);
    $columns = $colStmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($columns)) {
        echo json_encode(["status" => "error", "message" => "Table not found or has no columns"]);
        exit();
    }

    $primaryKeys = [];
    $columnNames = [];
    foreach ($columns as $c) {
        $columnNames[] = $c['name'];
        if ($c['column_key'] === 'PRI') {
            $primaryKeys[] = $c['name'];
        }
    }

    // 2. Pagination & Sorting & Filtering
    $page = max(1, (int)(isset($_GET['page']) ? $_GET['page'] : (isset($_POST['page']) ? $_POST['page'] : 1)));
    $limit = max(1, min(200, (int)(isset($_GET['limit']) ? $_GET['limit'] : (isset($_POST['limit']) ? $_POST['limit'] : 25))));
    $offset = ($page - 1) * $limit;

    $search = isset($_GET['search']) ? trim($_GET['search']) : (isset($_POST['search']) ? trim($_POST['search']) : '');
    $sortCol = isset($_GET['sort_col']) ? trim($_GET['sort_col']) : (isset($_POST['sort_col']) ? trim($_POST['sort_col']) : '');
    $sortDir = strtoupper(isset($_GET['sort_dir']) ? trim($_GET['sort_dir']) : (isset($_POST['sort_dir']) ? trim($_POST['sort_dir']) : 'DESC'));
    if (!in_array($sortDir, ['ASC', 'DESC'])) {
        $sortDir = 'DESC';
    }

    // If sortCol is not in valid column names, default to first primary key or first column
    if (!in_array($sortCol, $columnNames)) {
        $sortCol = !empty($primaryKeys) ? $primaryKeys[0] : $columnNames[0];
    }

    // Build WHERE clause for search
    $whereClause = "";
    $params = [];
    if (!empty($search)) {
        $searchConditions = [];
        foreach ($columnNames as $col) {
            $searchConditions[] = "`{$col}` LIKE :search_" . preg_replace('/[^a-zA-Z0-9]/', '_', $col);
            $params[':search_' . preg_replace('/[^a-zA-Z0-9]/', '_', $col)] = '%' . $search . '%';
        }
        $whereClause = " WHERE " . implode(" OR ", $searchConditions);
    }

    // 3. Count total records
    $countSql = "SELECT COUNT(*) as total FROM `{$tableName}`" . $whereClause;
    $countStmt = $db->prepare($countSql);
    $countStmt->execute($params);
    $totalCount = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['total'];
    $totalPages = ceil($totalCount / $limit);

    // 4. Fetch records
    $dataSql = "SELECT * FROM `{$tableName}`" . $whereClause . " ORDER BY `{$sortCol}` {$sortDir} LIMIT {$limit} OFFSET {$offset}";
    $dataStmt = $db->prepare($dataSql);
    $dataStmt->execute($params);
    $rows = $dataStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "table" => $tableName,
        "columns" => $columns,
        "primary_keys" => $primaryKeys,
        "rows" => $rows,
        "pagination" => [
            "page" => $page,
            "limit" => $limit,
            "total_records" => $totalCount,
            "total_pages" => $totalPages,
            "sort_col" => $sortCol,
            "sort_dir" => $sortDir,
            "search" => $search
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
