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

$data = json_decode(file_get_contents("php://input"));
$id = isset($data->id) ? intval($data->id) : (isset($_GET['id']) ? intval($_GET['id']) : 0);

if (!$id) {
    echo json_encode(["status" => "error", "message" => "Milestone ID is required."]);
    exit;
}

try {
    // Unlink modules first
    $db->prepare("UPDATE course_modules SET milestone_id = NULL WHERE milestone_id = :id")->execute([':id' => $id]);
    $db->prepare("UPDATE course_lessons SET milestone_id = NULL WHERE milestone_id = :id")->execute([':id' => $id]);

    $stmt = $db->prepare("DELETE FROM course_milestones WHERE id = :id");
    $stmt->execute([':id' => $id]);

    echo json_encode(["status" => "success", "message" => "Milestone deleted successfully."]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
