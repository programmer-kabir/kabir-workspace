<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!$data || empty($data->course_id) || empty($data->title)) {
    echo json_encode(["status" => "error", "message" => "Course ID and Module Title are required."]);
    exit;
}

try {
    $course_id = intval($data->course_id);
    $milestone_id = !empty($data->milestone_id) ? intval($data->milestone_id) : null;
    $module_no = !empty($data->module_no) ? intval($data->module_no) : 1;
    $title = trim($data->title);
    $description = !empty($data->description) ? trim($data->description) : '';
    $duration_classes = !empty($data->duration_classes) ? intval($data->duration_classes) : 6;
    $status = !empty($data->status) ? $data->status : 'active';

    if (!empty($data->id)) {
        $id = intval($data->id);
        $stmt = $db->prepare("
            UPDATE course_modules SET
                milestone_id = :mid,
                module_no = :mno,
                title = :title,
                description = :desc,
                duration_classes = :dur,
                status = :status
            WHERE id = :id
        ");
        $stmt->execute([
            ':mid' => $milestone_id,
            ':mno' => $module_no,
            ':title' => $title,
            ':desc' => $description,
            ':dur' => $duration_classes,
            ':status' => $status,
            ':id' => $id
        ]);
        echo json_encode(["status" => "success", "message" => "Module updated successfully."]);
    } else {
        $stmt = $db->prepare("
            INSERT INTO course_modules (course_id, milestone_id, module_no, title, description, duration_classes, status)
            VALUES (:cid, :mid, :mno, :title, :desc, :dur, :status)
        ");
        $stmt->execute([
            ':cid' => $course_id,
            ':mid' => $milestone_id,
            ':mno' => $module_no,
            ':title' => $title,
            ':desc' => $description,
            ':dur' => $duration_classes,
            ':status' => $status
        ]);
        echo json_encode(["status" => "success", "message" => "Module added successfully.", "id" => $db->lastInsertId()]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
