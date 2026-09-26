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

$course_id = isset($_GET['course_id']) ? intval($_GET['course_id']) : 0;
$module_id = isset($_GET['module_id']) ? intval($_GET['module_id']) : 0;
$quiz_id = isset($_GET['id']) ? intval($_GET['id']) : 0;

try {
    if ($quiz_id > 0) {
        $stmt = $db->prepare("SELECT * FROM course_quizzes WHERE id = ? LIMIT 1");
        $stmt->execute([$quiz_id]);
        $quiz = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$quiz) {
            echo json_encode(["status" => "error", "message" => "Quiz not found."]);
            exit;
        }

        $questStmt = $db->prepare("SELECT * FROM course_quiz_questions WHERE quiz_id = ? ORDER BY order_index ASC, id ASC");
        $questStmt->execute([$quiz_id]);
        $quiz['questions'] = $questStmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(["status" => "success", "data" => $quiz]);
        exit;
    }

    $where = [];
    $params = [];
    if ($course_id > 0) {
        $where[] = "course_id = ?";
        $params[] = $course_id;
    }
    if ($module_id > 0) {
        $where[] = "module_id = ?";
        $params[] = $module_id;
    }

    $whereClause = !empty($where) ? "WHERE " . implode(" AND ", $where) : "";
    $stmt = $db->prepare("SELECT * FROM course_quizzes $whereClause ORDER BY module_id ASC, order_index ASC, id ASC");
    $stmt->execute($params);
    $quizzes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "data" => $quizzes]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
