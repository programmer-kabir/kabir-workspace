<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    // Get count of active tasks for each employee
    $query = "SELECT e.user_id, COUNT(t.id) as active_tasks 
              FROM employees e 
              LEFT JOIN tasks t ON e.id = t.assigned_to AND t.status IN ('To-Do', 'In Progress')
              GROUP BY e.id, e.user_id";
              
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $workloads = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $workloads[$row['user_id']] = (int)$row['active_tasks'];
    }
    
    echo json_encode(["status" => "success", "data" => $workloads]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
