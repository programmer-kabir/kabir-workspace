<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!$data || empty($data->title)) {
    echo json_encode(["status" => "error", "message" => "Course Title is required."]);
    exit;
}

try {
    $title = trim($data->title);
    $category = !empty($data->category) ? trim($data->category) : 'General';
    $course_code = !empty($data->course_code) ? strtoupper(trim($data->course_code)) : 'CRS-' . strtoupper(substr(uniqid(), -4));
    $description = !empty($data->description) ? trim($data->description) : '';
    $duration_months = !empty($data->duration_months) ? intval($data->duration_months) : 3;
    $total_classes = !empty($data->total_classes) ? intval($data->total_classes) : 36;
    $fee_amount = isset($data->fee_amount) ? floatval($data->fee_amount) : 0.00;
    $status = !empty($data->status) ? $data->status : 'active';

    $thumbnail_url = !empty($data->thumbnail_url) ? trim($data->thumbnail_url) : null;
    $banner_url = !empty($data->banner_url) ? trim($data->banner_url) : null;

    $now_bd = date('Y-m-d H:i:s');

    if (!empty($data->id)) {
        $id = intval($data->id);
        $stmt = $db->prepare("
            UPDATE courses SET
                title = :title,
                category = :cat,
                thumbnail_url = :thumb,
                banner_url = :banner,
                course_code = :code,
                description = :desc,
                duration_months = :dur,
                total_classes = :tot,
                fee_amount = :fee,
                status = :status,
                updated_at = :up_time
            WHERE id = :id
        ");
        $stmt->execute([
            ':title' => $title,
            ':cat' => $category,
            ':thumb' => $thumbnail_url,
            ':banner' => $banner_url,
            ':code' => $course_code,
            ':desc' => $description,
            ':dur' => $duration_months,
            ':tot' => $total_classes,
            ':fee' => $fee_amount,
            ':status' => $status,
            ':up_time' => $now_bd,
            ':id' => $id
        ]);

        echo json_encode(["status" => "success", "message" => "Course updated successfully."]);
    } else {
        $stmt = $db->prepare("
            INSERT INTO courses (
                title, category, thumbnail_url, banner_url, course_code, description, duration_months, total_classes, fee_amount, status,
                created_at, updated_at
            ) VALUES (
                :title, :cat, :thumb, :banner, :code, :desc, :dur, :tot, :fee, :status,
                :cr_time, :up_time
            )
        ");
        $stmt->execute([
            ':title' => $title,
            ':cat' => $category,
            ':thumb' => $thumbnail_url,
            ':banner' => $banner_url,
            ':code' => $course_code,
            ':desc' => $description,
            ':dur' => $duration_months,
            ':tot' => $total_classes,
            ':fee' => $fee_amount,
            ':status' => $status,
            ':cr_time' => $now_bd,
            ':up_time' => $now_bd
        ]);

        echo json_encode(["status" => "success", "message" => "Course created successfully.", "id" => $db->lastInsertId()]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
