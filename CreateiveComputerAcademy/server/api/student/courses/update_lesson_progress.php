<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!$data || empty($data->user_id) || empty($data->course_id) || empty($data->lesson_id)) {
    echo json_encode(["status" => "error", "message" => "user_id, course_id, and lesson_id are required."]);
    exit;
}

$user_id = intval($data->user_id);
$course_id = intval($data->course_id);
$lesson_id = intval($data->lesson_id);
$is_completed = isset($data->is_completed) ? ($data->is_completed ? 1 : 0) : 1;
$watched_seconds = isset($data->watched_seconds) ? intval($data->watched_seconds) : 0;
$completed_at = $is_completed ? date('Y-m-d H:i:s') : null;

try {
    $stmt = $db->prepare("
        INSERT INTO student_lesson_progress (user_id, course_id, lesson_id, is_completed, watched_seconds, completed_at)
        VALUES (:uid, :cid, :lid, :comp, :watched, :cat)
        ON DUPLICATE KEY UPDATE 
            is_completed = VALUES(is_completed),
            watched_seconds = VALUES(watched_seconds),
            completed_at = VALUES(completed_at)
    ");
    $stmt->execute([
        ':uid' => $user_id,
        ':cid' => $course_id,
        ':lid' => $lesson_id,
        ':comp' => $is_completed,
        ':watched' => $watched_seconds,
        ':cat' => $completed_at
    ]);

    // Recalculate progress for student
    $totLessons = $db->query("SELECT COUNT(*) FROM course_lessons WHERE course_id = $course_id AND status = 'active'")->fetchColumn();
    $compLessons = $db->query("SELECT COUNT(*) FROM student_lesson_progress WHERE user_id = $user_id AND course_id = $course_id AND is_completed = 1")->fetchColumn();
    $progressPercent = $totLessons > 0 ? round(($compLessons / $totLessons) * 100) : 0;

    echo json_encode([
        "status" => "success",
        "message" => $is_completed ? "Lesson marked as completed!" : "Lesson progress updated.",
        "data" => [
            "lesson_id" => $lesson_id,
            "is_completed" => $is_completed === 1,
            "completed_lessons" => intval($compLessons),
            "total_lessons" => intval($totLessons),
            "progress_percent" => $progressPercent
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
