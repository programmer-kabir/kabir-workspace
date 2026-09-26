<?php
require_once '../../../../config/cors.php';
require_once '../../../../config/database.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo json_encode(["status" => "error", "message" => "Database connection error."]);
    exit;
}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

$id = isset($data['id']) ? intval($data['id']) : (isset($_GET['id']) ? intval($_GET['id']) : 0);

if (!$id) {
    echo json_encode(["status" => "error", "message" => "Assignment ID is required."]);
    exit;
}

try {
    $stmt = $db->prepare("DELETE FROM course_assignments WHERE id = :id");
    $stmt->execute([':id' => $id]);

    echo json_encode([
        "status" => "success",
        "message" => "Assignment deleted successfully."
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
