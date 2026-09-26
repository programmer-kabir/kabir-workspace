<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;

try {
    $hasEnrollmentsTable = $db->query("SHOW TABLES LIKE 'student_enrollments'")->rowCount() > 0;
    $enrollmentTable = $hasEnrollmentsTable ? "student_enrollments" : "students";

    $query = "
        SELECT 
            c.*,
            (SELECT COUNT(*) FROM course_modules m WHERE m.course_id = c.id) AS total_modules_count,
            (SELECT COUNT(*) FROM {$enrollmentTable} se WHERE se.course_id = c.id AND (se.status = 'active' OR se.status IS NULL)) AS total_enrolled_students
        FROM courses c
        WHERE c.status = 'active' OR c.status IS NULL
        ORDER BY c.id ASC
    ";

    $stmt = $db->prepare($query);
    $stmt->execute();
    $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // If user_id is provided, get list of course_ids they are enrolled in
    $enrolled_course_ids = [];
    if ($user_id) {
        $en_stmt = $db->prepare("SELECT course_id FROM {$enrollmentTable} WHERE user_id = :uid AND status = 'active'");
        $en_stmt->execute([':uid' => $user_id]);
        $enrolled_course_ids = $en_stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    function slugify_course($text) {
        $text = preg_replace('~[^\pL\d]+~u', '-', $text);
        if (function_exists('iconv')) $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);
        $text = preg_replace('~[^-\w]+~', '', $text);
        $text = trim($text, '-');
        $text = preg_replace('~-+~', '-', $text);
        return empty($text) ? 'course' : strtolower($text);
    }

    foreach ($courses as &$crs) {
        $crs['slug'] = slugify_course($crs['title']);
        $crs['is_enrolled'] = in_array($crs['id'], $enrolled_course_ids);
        
        // Fetch top modules outline preview
        $m_stmt = $db->prepare("SELECT id, module_no, title, duration_classes FROM course_modules WHERE course_id = :cid ORDER BY module_no ASC");
        $m_stmt->execute([':cid' => $crs['id']]);
        $crs['modules_preview'] = $m_stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode([
        "status" => "success",
        "data" => $courses
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
