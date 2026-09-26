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

$tableName = isset($input['table']) ? trim($input['table']) : '';
$primaryKeys = isset($input['primary_keys']) ? $input['primary_keys'] : [];
$rowData = isset($input['data']) ? $input['data'] : [];

if (empty($tableName) || empty($primaryKeys) || empty($rowData) || !is_array($rowData)) {
    echo json_encode(["status" => "error", "message" => "Table, primary keys, and updated data are required"]);
    exit();
}

if (!preg_match('/^[a-zA-Z0-9_]+$/', $tableName)) {
    echo json_encode(["status" => "error", "message" => "Invalid table name"]);
    exit();
}

try {
    // Fetch valid column names for the table
    $colStmt = $db->prepare("
        SELECT COLUMN_NAME, IS_NULLABLE 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table_name
    ");
    $colStmt->execute([':table_name' => $tableName]);
    $validCols = $colStmt->fetchAll(PDO::FETCH_ASSOC);

    $allowedMap = [];
    foreach ($validCols as $vc) {
        $allowedMap[$vc['COLUMN_NAME']] = $vc;
    }

    $setClauses = [];
    $params = [];

    foreach ($rowData as $col => $val) {
        if (!isset($allowedMap[$col])) continue;

        $paramKey = ':set_' . preg_replace('/[^a-zA-Z0-9]/', '_', $col);
        $setClauses[] = "`{$col}` = {$paramKey}";

        if ($val === '' && $allowedMap[$col]['IS_NULLABLE'] === 'YES') {
            $params[$paramKey] = null;
        } else {
            $params[$paramKey] = $val;
        }
    }

    if (empty($setClauses)) {
        echo json_encode(["status" => "error", "message" => "No valid columns provided for update"]);
        exit();
    }

    // Build WHERE clause with primary keys
    $whereClauses = [];
    foreach ($primaryKeys as $pkCol => $pkVal) {
        if (!isset($allowedMap[$pkCol])) continue;
        $pkParam = ':pk_' . preg_replace('/[^a-zA-Z0-9]/', '_', $pkCol);
        $whereClauses[] = "`{$pkCol}` = {$pkParam}";
        $params[$pkParam] = $pkVal;
    }

    if (empty($whereClauses)) {
        echo json_encode(["status" => "error", "message" => "No valid primary key identifiers provided"]);
        exit();
    }

    $sql = "UPDATE `{$tableName}` SET " . implode(', ', $setClauses) . " WHERE " . implode(' AND ', $whereClauses) . " LIMIT 1";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    echo json_encode([
        "status" => "success",
        "message" => "Record updated successfully in {$tableName}",
        "affected_rows" => $stmt->rowCount()
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
