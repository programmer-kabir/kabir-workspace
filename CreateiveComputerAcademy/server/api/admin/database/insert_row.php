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
$rowData = isset($input['data']) ? $input['data'] : [];

if (empty($tableName) || empty($rowData) || !is_array($rowData)) {
    echo json_encode(["status" => "error", "message" => "Table name and data are required"]);
    exit();
}

if (!preg_match('/^[a-zA-Z0-9_]+$/', $tableName)) {
    echo json_encode(["status" => "error", "message" => "Invalid table name"]);
    exit();
}

try {
    // Fetch valid column names for the table
    $colStmt = $db->prepare("
        SELECT COLUMN_NAME, EXTRA, IS_NULLABLE, DATA_TYPE 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table_name
    ");
    $colStmt->execute([':table_name' => $tableName]);
    $validCols = $colStmt->fetchAll(PDO::FETCH_ASSOC);

    $allowedMap = [];
    foreach ($validCols as $vc) {
        $allowedMap[$vc['COLUMN_NAME']] = $vc;
    }

    $colsToInsert = [];
    $placeholders = [];
    $params = [];

    foreach ($rowData as $col => $val) {
        if (!isset($allowedMap[$col])) continue;

        // Skip auto increment if empty or null
        if (strpos(strtolower($allowedMap[$col]['EXTRA']), 'auto_increment') !== false && ($val === '' || $val === null)) {
            continue;
        }

        $paramKey = ':val_' . preg_replace('/[^a-zA-Z0-9]/', '_', $col);
        $colsToInsert[] = "`{$col}`";
        $placeholders[] = $paramKey;

        // Handle empty string as NULL if column is nullable
        if ($val === '' && $allowedMap[$col]['IS_NULLABLE'] === 'YES') {
            $params[$paramKey] = null;
        } else {
            $params[$paramKey] = $val;
        }
    }

    if (empty($colsToInsert)) {
        echo json_encode(["status" => "error", "message" => "No valid column data provided to insert"]);
        exit();
    }

    $sql = "INSERT INTO `{$tableName}` (" . implode(', ', $colsToInsert) . ") VALUES (" . implode(', ', $placeholders) . ")";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    $insertedId = $db->lastInsertId();

    echo json_encode([
        "status" => "success",
        "message" => "Record inserted successfully into {$tableName}",
        "inserted_id" => $insertedId ?: null
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
