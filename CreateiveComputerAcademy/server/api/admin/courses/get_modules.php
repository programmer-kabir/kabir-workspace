<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$course_id = isset($_GET['course_id']) ? intval($_GET['course_id']) : 0;

if (!$course_id) {
    echo json_encode(["status" => "error", "message" => "Course ID required."]);
    exit;
}

try {
    $stmt = $db->prepare("SELECT * FROM course_modules WHERE course_id = :cid ORDER BY module_no ASC, order_index ASC");
    $stmt->execute([':cid' => $course_id]);
    $modules = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "data" => $modules]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
