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

if (!$course_id) {
    echo json_encode(["status" => "error", "message" => "Course ID is required."]);
    exit;
}

try {
    $stmt = $db->prepare("
        SELECT 
            m.*,
            (SELECT COUNT(*) FROM course_modules mod_tbl WHERE mod_tbl.milestone_id = m.id AND mod_tbl.status = 'active') AS total_modules_count,
            (SELECT COUNT(*) FROM course_lessons les_tbl WHERE les_tbl.milestone_id = m.id AND les_tbl.status = 'active') AS total_lessons_count
        FROM course_milestones m 
        WHERE m.course_id = :cid 
        ORDER BY m.milestone_no ASC, m.order_index ASC, m.id ASC
    ");
    $stmt->execute([':cid' => $course_id]);
    $milestones = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => $milestones
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
