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

if (empty($tableName) || empty($primaryKeys) || !is_array($primaryKeys)) {
    echo json_encode(["status" => "error", "message" => "Table name and primary keys are required"]);
    exit();
}

if (!preg_match('/^[a-zA-Z0-9_]+$/', $tableName)) {
    echo json_encode(["status" => "error", "message" => "Invalid table name"]);
    exit();
}

try {
    // Validate primary key column names
    $colStmt = $db->prepare("
        SELECT COLUMN_NAME 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table_name
    ");
    $colStmt->execute([':table_name' => $tableName]);
    $validCols = $colStmt->fetchAll(PDO::FETCH_COLUMN);

    $whereClauses = [];
    $params = [];

    foreach ($primaryKeys as $pkCol => $pkVal) {
        if (!in_array($pkCol, $validCols)) continue;
        $pkParam = ':pk_' . preg_replace('/[^a-zA-Z0-9]/', '_', $pkCol);
        $whereClauses[] = "`{$pkCol}` = {$pkParam}";
        $params[$pkParam] = $pkVal;
    }

    if (empty($whereClauses)) {
        echo json_encode(["status" => "error", "message" => "No valid primary key identifiers found"]);
        exit();
    }

    $sql = "DELETE FROM `{$tableName}` WHERE " . implode(' AND ', $whereClauses) . " LIMIT 1";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    echo json_encode([
        "status" => "success",
        "message" => "Record deleted successfully from {$tableName}",
        "affected_rows" => $stmt->rowCount()
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
