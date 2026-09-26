<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
        $course_id = isset($_GET['course_id']) ? intval($_GET['course_id']) : 0;

        $params = [':user_id' => $user_id];
        $where_clauses = [];

        if ($course_id > 0) {
            $where_clauses[] = "a.course_id = :course_id";
            $params[':course_id'] = $course_id;
        }

        $where_sql = !empty($where_clauses) ? "WHERE " . implode(" AND ", $where_clauses) : "";

        $sql = "
            SELECT 
                a.*,
                c.title AS course_title,
                c.course_code,
                s.id AS submission_id,
                s.submission_link,
                s.notes AS student_notes,
                s.marks_obtained,
                s.feedback,
                s.status AS submission_status,
                s.submitted_at
            FROM student_assignments a
            LEFT JOIN courses c ON a.course_id = c.id
            LEFT JOIN student_submissions s ON a.id = s.assignment_id AND s.user_id = :user_id
            {$where_sql}
            ORDER BY a.due_date DESC
        ";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $assignments = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(["status" => "success", "data" => $assignments]);
    } else if ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"));
        if (!$data || !isset($data->assignment_id) || !isset($data->user_id) || !isset($data->submission_link)) {
            echo json_encode(["status" => "error", "message" => "Assignment ID, User ID, and Link are required."]);
            exit;
        }

        $chk = $db->prepare("SELECT id FROM student_submissions WHERE assignment_id = :aid AND user_id = :uid");
        $chk->execute([':aid' => $data->assignment_id, ':uid' => $data->user_id]);

        if ($chk->rowCount() > 0) {
            $up = $db->prepare("UPDATE student_submissions SET submission_link = :link, notes = :notes, status = 'submitted', submitted_at = NOW() WHERE assignment_id = :aid AND user_id = :uid");
            $up->execute([':link' => $data->submission_link, ':notes' => $data->notes ?? '', ':aid' => $data->assignment_id, ':uid' => $data->user_id]);
        } else {
            $ins = $db->prepare("INSERT INTO student_submissions (assignment_id, user_id, submission_link, notes, status) VALUES (:aid, :uid, :link, :notes, 'submitted')");
            $ins->execute([':aid' => $data->assignment_id, ':uid' => $data->user_id, ':link' => $data->submission_link, ':notes' => $data->notes ?? '']);
        }

        echo json_encode(["status" => "success", "message" => "Assignment submitted successfully!"]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
