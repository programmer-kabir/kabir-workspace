<?php
require_once '../../../../config/cors.php';
require_once '../../../../config/database.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));
$id = isset($data->id) ? intval($data->id) : (isset($_GET['id']) ? intval($_GET['id']) : 0);

if (!$id) {
    echo json_encode(["status" => "error", "message" => "Lesson ID is required."]);
    exit;
}

try {
    $db->prepare("DELETE FROM student_lesson_progress WHERE lesson_id = :id")->execute([':id' => $id]);
    $stmt = $db->prepare("DELETE FROM course_lessons WHERE id = :id");
    $stmt->execute([':id' => $id]);

    echo json_encode(["status" => "success", "message" => "Lesson deleted successfully."]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
