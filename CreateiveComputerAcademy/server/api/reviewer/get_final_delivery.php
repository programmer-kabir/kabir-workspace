<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit();
}

$task_id = isset($_GET['task_id']) ? intval($_GET['task_id']) : null;
if (!$task_id) {
    echo json_encode(["status" => "error", "message" => "task_id is required."]);
    exit();
}

try {
    $query = "SELECT 
                tfd.*,
                u.name AS reviewer_name,
                u.profile_picture AS reviewer_avatar
              FROM task_final_deliveries tfd
              LEFT JOIN users u ON tfd.reviewer_id = u.id
              WHERE tfd.task_id = :task_id
              LIMIT 1";

    $stmt = $db->prepare($query);
    $stmt->execute([':task_id' => $task_id]);
    $delivery = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($delivery) {
        echo json_encode([
            "status" => "success",
            "data" => $delivery
        ]);
    } else {
        echo json_encode([
            "status" => "success",
            "data" => null,
            "message" => "No reviewer delivery found for this task."
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Error fetching final delivery: " . $e->getMessage()
    ]);
}
?>
