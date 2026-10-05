<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : (isset($_POST['user_id']) ? intval($_POST['user_id']) : 0);

if (!$user_id) {
    $data = json_decode(file_get_contents("php://input"));
    if ($data && !empty($data->user_id)) {
        $user_id = intval($data->user_id);
    }
}

if (!$user_id) {
    echo json_encode(["status" => "error", "message" => "User ID is required."]);
    exit;
}

try {
    // Check if student_enrollments table exists
    $hasEnrollmentsTable = $db->query("SHOW TABLES LIKE 'student_enrollments'")->rowCount() > 0;

    if ($hasEnrollmentsTable) {
        $query = "
            SELECT 
                se.id AS enrollment_id,
                se.user_id,
                se.course_id,
                COALESCE(s.student_code, CONCAT('STU-', se.user_id)) AS student_code,
                se.enrollment_date,
                se.completion_date,
                se.status AS enrollment_status,
                s.guardian_phone,
                COALESCE(c.title, 'General Course') AS course_title,
                c.course_code,
                c.category AS course_category,
                c.duration_months,
                c.total_classes,
                c.thumbnail_url,
                c.banner_url,
                c.description AS course_description,
                (SELECT COUNT(*) FROM student_assignments sa WHERE sa.course_id = se.course_id) AS total_assignments,
                (SELECT COUNT(*) FROM student_submissions sub 
                 INNER JOIN student_assignments sa2 ON sub.assignment_id = sa2.id 
                 WHERE sub.user_id = :user_id AND sa2.course_id = se.course_id
                ) AS submitted_assignments,
                (SELECT COUNT(*) FROM course_modules cm WHERE cm.course_id = se.course_id AND cm.status = 'active') AS total_modules
            FROM student_enrollments se
            LEFT JOIN students s ON se.user_id = s.user_id
            LEFT JOIN courses c ON se.course_id = c.id
            WHERE se.user_id = :user_id
            ORDER BY se.id DESC
        ";
    } else {
        $query = "
            SELECT 
                s.id AS enrollment_id,
                s.user_id,
                NULL AS course_id,
                s.student_code,
                s.enrollment_date,
                s.completion_date,
                s.status AS enrollment_status,
                s.guardian_phone,
                'General Course' AS course_title,
                'GEN' AS course_code,
                'General' AS course_category,
                0 AS duration_months,
                0 AS total_classes,
                NULL AS thumbnail_url,
                NULL AS banner_url,
                NULL AS course_description,
                0 AS total_assignments,
                0 AS submitted_assignments,
                0 AS total_modules
            FROM students s
            WHERE s.user_id = :user_id
            ORDER BY s.id DESC
        ";
    }

    $stmt = $db->prepare($query);
    $stmt->execute([':user_id' => $user_id]);
    $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);

    function slugify_my_course($text) {
        $text = preg_replace('~[^\pL\d]+~u', '-', $text);
        if (function_exists('iconv')) $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);
        $text = preg_replace('~[^-\w]+~', '', $text);
        $text = trim($text, '-');
        $text = preg_replace('~-+~', '-', $text);
        return empty($text) ? 'course' : strtolower($text);
    }

    foreach ($courses as &$c) {
        $c['slug'] = slugify_my_course($c['course_title']);
    }

    echo json_encode([
        "status" => "success",
        "total_courses" => count($courses),
        "data" => $courses
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
