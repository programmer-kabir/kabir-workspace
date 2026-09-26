<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $stmt = $db->prepare("SELECT id, name FROM departments ORDER BY name ASC");
    $stmt->execute();

    $departments = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $departments[] = $row;
    }

    echo json_encode([
        "status" => "success",
        "data"   => $departments
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
