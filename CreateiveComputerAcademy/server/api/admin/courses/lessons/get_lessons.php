<?php
require_once '../../../../config/cors.php';
require_once '../../../../config/database.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

$module_id = isset($_GET['module_id']) ? intval($_GET['module_id']) : 0;
$course_id = isset($_GET['course_id']) ? intval($_GET['course_id']) : 0;

if (!$module_id && !$course_id) {
    echo json_encode(["status" => "error", "message" => "Module ID or Course ID is required."]);
    exit;
}

try {
    if ($module_id > 0) {
        $stmt = $db->prepare("
            SELECT * FROM course_lessons 
            WHERE module_id = :mid 
            ORDER BY lesson_no ASC, order_index ASC, id ASC
        ");
        $stmt->execute([':mid' => $module_id]);
    } else {
        $stmt = $db->prepare("
            SELECT * FROM course_lessons 
            WHERE course_id = :cid 
            ORDER BY milestone_id ASC, module_id ASC, lesson_no ASC, order_index ASC
        ");
        $stmt->execute([':cid' => $course_id]);
    }

    $lessons = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => $lessons
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
