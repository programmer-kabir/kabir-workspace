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
