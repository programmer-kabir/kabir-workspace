<?php
require_once '../../../../config/cors.php';
require_once '../../../../config/database.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!$data || empty($data->course_id) || empty($data->module_id) || empty($data->title) || empty($data->video_url)) {
    echo json_encode(["status" => "error", "message" => "Course ID, Module ID, Title, and Video URL are required."]);
    exit;
}

$id = isset($data->id) ? intval($data->id) : 0;
$course_id = intval($data->course_id);
$module_id = intval($data->module_id);
$milestone_id = isset($data->milestone_id) && $data->milestone_id ? intval($data->milestone_id) : null;

// If milestone_id not provided, try to get from module
if (!$milestone_id) {
    $mStmt = $db->prepare("SELECT milestone_id FROM course_modules WHERE id = :mid LIMIT 1");
    $mStmt->execute([':mid' => $module_id]);
    $milestone_id = $mStmt->fetchColumn() ?: null;
}

$lesson_no = isset($data->lesson_no) ? intval($data->lesson_no) : 1;
$title = trim($data->title);
$video_type = isset($data->video_type) ? trim($data->video_type) : 'youtube';
$video_url = trim($data->video_url);
$duration_minutes = isset($data->duration_minutes) ? trim($data->duration_minutes) : '10:00';
$summary = isset($data->summary) ? trim($data->summary) : '';
$resources_json = isset($data->resources_json) ? (is_string($data->resources_json) ? $data->resources_json : json_encode($data->resources_json)) : null;
$order_index = isset($data->order_index) ? intval($data->order_index) : $lesson_no;
$is_free_preview = !empty($data->is_free_preview) ? 1 : 0;
$status = isset($data->status) ? trim($data->status) : 'active';

try {
    if ($id > 0) {
        $stmt = $db->prepare("
            UPDATE course_lessons 
            SET course_id = :course_id,
                milestone_id = :milestone_id,
                module_id = :module_id,
                lesson_no = :lesson_no,
                title = :title,
                video_type = :video_type,
                video_url = :video_url,
                duration_minutes = :duration_minutes,
                summary = :summary,
                resources_json = :resources_json,
                order_index = :order_index,
                is_free_preview = :is_free_preview,
                status = :status
            WHERE id = :id
        ");
        $stmt->execute([
            ':course_id' => $course_id,
            ':milestone_id' => $milestone_id,
            ':module_id' => $module_id,
            ':lesson_no' => $lesson_no,
            ':title' => $title,
            ':video_type' => $video_type,
            ':video_url' => $video_url,
            ':duration_minutes' => $duration_minutes,
            ':summary' => $summary,
            ':resources_json' => $resources_json,
            ':order_index' => $order_index,
            ':is_free_preview' => $is_free_preview,
            ':status' => $status,
            ':id' => $id
        ]);
        echo json_encode(["status" => "success", "message" => "Lesson updated successfully.", "id" => $id]);
    } else {
        $stmt = $db->prepare("
            INSERT INTO course_lessons (
                course_id, milestone_id, module_id, lesson_no, title, 
                video_type, video_url, duration_minutes, summary, 
                resources_json, order_index, is_free_preview, status
            ) VALUES (
                :course_id, :milestone_id, :module_id, :lesson_no, :title, 
                :video_type, :video_url, :duration_minutes, :summary, 
                :resources_json, :order_index, :is_free_preview, :status
            )
        ");
        $stmt->execute([
            ':course_id' => $course_id,
            ':milestone_id' => $milestone_id,
            ':module_id' => $module_id,
            ':lesson_no' => $lesson_no,
            ':title' => $title,
            ':video_type' => $video_type,
            ':video_url' => $video_url,
            ':duration_minutes' => $duration_minutes,
            ':summary' => $summary,
            ':resources_json' => $resources_json,
            ':order_index' => $order_index,
            ':is_free_preview' => $is_free_preview,
            ':status' => $status
        ]);
        $new_id = $db->lastInsertId();
        echo json_encode(["status" => "success", "message" => "Lesson created successfully.", "id" => $new_id]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
