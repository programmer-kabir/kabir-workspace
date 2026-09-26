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

if ($id <= 0) {
    echo json_encode(["status" => "error", "message" => "Valid Quiz ID is required."]);
    exit;
}

try {
    $db->beginTransaction();

    // Delete questions first
    $delQ = $db->prepare("DELETE FROM course_quiz_questions WHERE quiz_id = ?");
    $delQ->execute([$id]);

    // Delete quiz
    $delQuiz = $db->prepare("DELETE FROM course_quizzes WHERE id = ?");
    $delQuiz->execute([$id]);

    $db->commit();
    echo json_encode(["status" => "success", "message" => "Quiz deleted successfully."]);
} catch (PDOException $e) {
    $db->rollBack();
    echo json_encode(["status" => "error", "message" => "Failed to delete quiz: " . $e->getMessage()]);
}
?>
