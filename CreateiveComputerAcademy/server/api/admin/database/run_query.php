<?php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$rawQuery = isset($input['query']) ? trim($input['query']) : '';

if (empty($rawQuery)) {
    echo json_encode(["status" => "error", "message" => "SQL query is required"]);
    exit();
}

$startTime = microtime(true);

try {
    $firstWord = strtoupper(strtok(ltrim($rawQuery), " \t\n\r\0\x0B;"));

    $isSelectType = in_array($firstWord, ['SELECT', 'SHOW', 'DESCRIBE', 'DESC', 'EXPLAIN', 'CHECK', 'ANALYZE']);

    $stmt = $db->prepare($rawQuery);
    $stmt->execute();

    $executionTimeMs = round((microtime(true) - $startTime) * 1000, 2);

    if ($isSelectType) {
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $columns = [];
        if (!empty($rows)) {
            $columns = array_keys($rows[0]);
        } else if ($stmt->columnCount() > 0) {
            for ($i = 0; $i < $stmt->columnCount(); $i++) {
                $meta = $stmt->getColumnMeta($i);
                if ($meta && isset($meta['name'])) {
                    $columns[] = $meta['name'];
                }
            }
        }

        echo json_encode([
            "status" => "success",
            "type" => "select",
            "columns" => $columns,
            "rows" => $rows,
            "row_count" => count($rows),
            "execution_time_ms" => $executionTimeMs
        ]);
    } else {
        $affectedRows = $stmt->rowCount();
        echo json_encode([
            "status" => "success",
            "type" => "mutation",
            "affected_rows" => $affectedRows,
            "message" => "Query executed successfully. Affected rows: {$affectedRows}",
            "execution_time_ms" => $executionTimeMs
        ]);
    }
} catch (PDOException $e) {
    $executionTimeMs = round((microtime(true) - $startTime) * 1000, 2);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage(),
        "execution_time_ms" => $executionTimeMs
    ]);
}
?>
