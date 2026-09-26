<?php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit();
}

try {
    // Get all tables in current database
    $query = "
        SELECT 
            TABLE_NAME as table_name,
            TABLE_ROWS as table_rows,
            DATA_LENGTH as data_length,
            INDEX_LENGTH as index_length,
            AUTO_INCREMENT as auto_increment,
            CREATE_TIME as create_time,
            UPDATE_TIME as update_time,
            TABLE_COLLATION as collation,
            ENGINE as engine
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY TABLE_NAME ASC
    ";

    $stmt = $db->prepare($query);
    $stmt->execute();
    $tables = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Calculate total rows and exact counts if needed
    $formatted_tables = [];
    foreach ($tables as $t) {
        $tableName = $t['table_name'];
        // Accurate count
        try {
            $cntStmt = $db->query("SELECT COUNT(*) as cnt FROM `{$tableName}`");
            $rowCount = (int)$cntStmt->fetch(PDO::FETCH_ASSOC)['cnt'];
        } catch (Exception $ex) {
            $rowCount = (int)$t['table_rows'];
        }

        $formatted_tables[] = [
            'name' => $tableName,
            'rows' => $rowCount,
            'data_size' => (int)$t['data_length'],
            'index_size' => (int)$t['index_length'],
            'engine' => $t['engine'] ?? 'InnoDB',
            'collation' => $t['collation'] ?? 'utf8mb4_unicode_ci',
            'created_at' => $t['create_time'],
            'updated_at' => $t['update_time']
        ];
    }

    echo json_encode([
        "status" => "success",
        "database" => "u647959341_cca_manage_db",
        "tables" => $formatted_tables,
        "total_tables" => count($formatted_tables)
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
