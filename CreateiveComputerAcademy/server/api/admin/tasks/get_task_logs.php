<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

if(!isset($_GET['task_id'])) {
    echo json_encode(["status" => "error", "message" => "Task ID is required."]);
    exit;
}

$task_id = $_GET['task_id'];

try {
    $query = "
        SELECT 
            tl.id, tl.task_id, tl.status_from, tl.status_to, tl.changed_by, tl.created_at,
            u.name AS changed_by_name,
            u.profile_picture AS changed_by_avatar
        FROM task_logs tl
        LEFT JOIN users u ON tl.changed_by = u.id
        WHERE tl.task_id = :task_id
        ORDER BY tl.created_at DESC
    ";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();

    $logs = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $logs[] = $row;
    }

    echo json_encode([
        "status" => "success",
        "data" => $logs
    ]);
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
