<?php
// =========================================================================
// SupplyLink - Developer SQL Runner & Database Inspector
// Restricted strictly to Admin and Developer
// =========================================================================

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_guard.php';
guardAdminDevOnly();

require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$input = json_decode(file_get_contents("php://input"), true) ?? $_POST;
if (!empty($input['action'])) {
    $action = $input['action'];
}

try {
    if ($action === 'get_tables') {
        $dbName = 'supplylink';
        $dbRes = $mysqli->query("SELECT DATABASE() AS current_db");
        if ($dbRes && $row = $dbRes->fetch_assoc()) {
            if (!empty($row['current_db'])) $dbName = $row['current_db'];
        }

        $sql = "
            SELECT 
                TABLE_NAME AS table_name,
                TABLE_ROWS AS table_rows,
                ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024, 2) AS size_kb,
                TABLE_COLLATION AS collation,
                UPDATE_TIME AS update_time
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = ?
            ORDER BY TABLE_NAME ASC
        ";
        $stmt = $mysqli->prepare($sql);
        $stmt->bind_param("s", $dbName);
        $stmt->execute();
        $tables = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        echo json_encode([
            "success" => true,
            "database" => $dbName,
            "total_tables" => count($tables),
            "tables" => $tables
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'browse_table') {
        $tableName = trim($input['table'] ?? $_GET['table'] ?? '');
        $page = max(1, (int)($input['page'] ?? $_GET['page'] ?? 1));
        $limit = max(10, min(200, (int)($input['limit'] ?? $_GET['limit'] ?? 50)));
        $search = trim($input['search'] ?? $_GET['search'] ?? '');
        $offset = ($page - 1) * $limit;

        if (empty($tableName)) {
            echo json_encode(["success" => false, "message" => "Table name is required"]);
            exit;
        }

        // 1. Verify table exists in current database (SQL Injection Shield)
        $chkStmt = $mysqli->prepare("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?");
        $chkStmt->bind_param("s", $tableName);
        $chkStmt->execute();
        $chkRes = $chkStmt->get_result();
        if ($chkRes->num_rows === 0) {
            echo json_encode(["success" => false, "message" => "Table '{$tableName}' not found in database"]);
            exit;
        }

        // 2. Fetch Columns and Primary Key
        $colStmt = $mysqli->prepare("
            SELECT COLUMN_NAME, DATA_TYPE, COLUMN_KEY, IS_NULLABLE
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
            ORDER BY ORDINAL_POSITION ASC
        ");
        $colStmt->bind_param("s", $tableName);
        $colStmt->execute();
        $columnsMeta = $colStmt->get_result()->fetch_all(MYSQLI_ASSOC);

        $columnNames = [];
        $searchableCols = [];
        $primaryKey = null;

        foreach ($columnsMeta as $col) {
            $cName = $col['COLUMN_NAME'];
            $columnNames[] = $cName;
            if ($col['COLUMN_KEY'] === 'PRI' && $primaryKey === null) {
                $primaryKey = $cName;
            }
            if (in_array(strtolower($col['DATA_TYPE']), ['varchar', 'text', 'char', 'int', 'bigint', 'mediumtext'])) {
                $searchableCols[] = "`" . str_replace("`", "``", $cName) . "`";
            }
        }

        if (!$primaryKey && !empty($columnNames)) {
            $primaryKey = $columnNames[0];
        }

        $safeTable = "`" . str_replace("`", "``", $tableName) . "`";
        $whereSql = "";
        $types = "";
        $params = [];

        if ($search !== '' && !empty($searchableCols)) {
            $likes = [];
            foreach ($searchableCols as $sc) {
                $likes[] = "{$sc} LIKE ?";
                $types .= "s";
                $params[] = "%{$search}%";
            }
            $whereSql = " WHERE (" . implode(" OR ", $likes) . ")";
        }

        // 3. Count Total Matching Rows
        $countSql = "SELECT COUNT(*) AS total FROM {$safeTable}" . $whereSql;
        if (!empty($params)) {
            $cntStmt = $mysqli->prepare($countSql);
            $cntStmt->bind_param($types, ...$params);
            $cntStmt->execute();
            $cntRes = $cntStmt->get_result();
            $totalRows = (int)($cntRes->fetch_assoc()['total'] ?? 0);
        } else {
            $cntRes = $mysqli->query($countSql);
            $totalRows = (int)($cntRes->fetch_assoc()['total'] ?? 0);
        }

        // 4. Fetch Paginated Records
        $orderSql = $primaryKey ? " ORDER BY `" . str_replace("`", "``", $primaryKey) . "` DESC" : "";
        $dataSql = "SELECT * FROM {$safeTable}" . $whereSql . $orderSql . " LIMIT ?, ?";
        
        $dataStmt = $mysqli->prepare($dataSql);
        if (!empty($params)) {
            $dataTypes = $types . "ii";
            $dataParams = array_merge($params, [$offset, $limit]);
            $dataStmt->bind_param($dataTypes, ...$dataParams);
        } else {
            $dataStmt->bind_param("ii", $offset, $limit);
        }
        
        $dataStmt->execute();
        $rows = $dataStmt->get_result()->fetch_all(MYSQLI_ASSOC);

        echo json_encode([
            "success" => true,
            "table" => $tableName,
            "primary_key" => $primaryKey,
            "columns" => $columnNames,
            "columns_meta" => $columnsMeta,
            "rows" => $rows,
            "total_rows" => $totalRows,
            "page" => $page,
            "limit" => $limit,
            "total_pages" => max(1, ceil($totalRows / $limit))
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'run_query') {
        $query = trim($input['query'] ?? '');
        if (empty($query)) {
            echo json_encode(["success" => false, "message" => "SQL Query cannot be empty"]);
            exit;
        }

        $startTime = microtime(true);
        $isSelect = preg_match('/^\s*(SELECT|SHOW|DESCRIBE|EXPLAIN)/i', $query);

        // Execute query
        $result = $mysqli->query($query);
        $durationMs = round((microtime(true) - $startTime) * 1000, 2);

        if ($result === false) {
            echo json_encode([
                "success" => false,
                "error" => $mysqli->error,
                "duration_ms" => $durationMs
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if ($isSelect && ($result instanceof mysqli_result)) {
            $fields = [];
            while ($f = $result->fetch_field()) {
                $fields[] = $f->name;
            }

            $rows = [];
            $limit = 500;
            $count = 0;
            while ($row = $result->fetch_assoc()) {
                $rows[] = $row;
                $count++;
                if ($count >= $limit) break;
            }

            echo json_encode([
                "success" => true,
                "is_select" => true,
                "columns" => $fields,
                "rows" => $rows,
                "row_count" => count($rows),
                "duration_ms" => $durationMs,
                "truncated" => ($result->num_rows > $limit)
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        echo json_encode([
            "success" => true,
            "is_select" => false,
            "affected_rows" => $mysqli->affected_rows,
            "duration_ms" => $durationMs,
            "message" => "Query executed successfully. Affected rows: " . $mysqli->affected_rows
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    echo json_encode(["success" => false, "message" => "Unknown action: " . $action]);
    exit;

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

