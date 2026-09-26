<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $table_check = $db->query("SHOW TABLES LIKE 'student_enrollments'");
    $has_enrollments = ($table_check && $table_check->rowCount() > 0);
    $enr_table = $has_enrollments ? 'student_enrollments' : 'students';

    $query = "
        SELECT 
            c.*,
            (SELECT COUNT(*) FROM course_modules m WHERE m.course_id = c.id) AS total_modules_count,
            (SELECT COUNT(*) FROM {$enr_table} se WHERE se.course_id = c.id AND (se.status = 'active' OR se.status IS NULL)) AS enrolled_students_count
        FROM courses c
        ORDER BY c.id DESC
    ";

    $stmt = $db->prepare($query);
    $stmt->execute();
    $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => $courses
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
