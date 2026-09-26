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

// Auto-create table if not exists
try {
    $db->exec("
        CREATE TABLE IF NOT EXISTS `course_milestones` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `course_id` INT NOT NULL,
            `milestone_no` INT NOT NULL DEFAULT 1,
            `title` VARCHAR(255) NOT NULL,
            `description` TEXT NULL,
            `order_index` INT NOT NULL DEFAULT 1,
            `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX `idx_course_milestones_course` (`course_id`),
            INDEX `idx_course_milestones_order` (`course_id`, `order_index`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
} catch (Throwable $e) {}

$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput);

if (!$data || empty($data->course_id) || empty($data->title)) {
    echo json_encode(["status" => "error", "message" => "Course ID and Title are required."]);
    exit;
}

$id = isset($data->id) ? intval($data->id) : 0;
$course_id = intval($data->course_id);
$milestone_no = isset($data->milestone_no) ? intval($data->milestone_no) : 1;
$title = trim($data->title);
$description = isset($data->description) ? trim($data->description) : '';
$order_index = isset($data->order_index) ? intval($data->order_index) : $milestone_no;
$status = isset($data->status) ? trim($data->status) : 'active';

try {
    if ($id > 0) {
        $stmt = $db->prepare("
            UPDATE course_milestones 
            SET milestone_no = :milestone_no,
                title = :title,
                description = :description,
                order_index = :order_index,
                status = :status
            WHERE id = :id AND course_id = :course_id
        ");
        $stmt->execute([
            ':milestone_no' => $milestone_no,
            ':title' => $title,
            ':description' => $description,
            ':order_index' => $order_index,
            ':status' => $status,
            ':id' => $id,
            ':course_id' => $course_id
        ]);
        echo json_encode(["status" => "success", "message" => "Milestone updated successfully.", "id" => $id]);
    } else {
        $stmt = $db->prepare("
            INSERT INTO course_milestones (course_id, milestone_no, title, description, order_index, status)
            VALUES (:course_id, :milestone_no, :title, :description, :order_index, :status)
        ");
        $stmt->execute([
            ':course_id' => $course_id,
            ':milestone_no' => $milestone_no,
            ':title' => $title,
            ':description' => $description,
            ':order_index' => $order_index,
            ':status' => $status
        ]);
        $new_id = $db->lastInsertId();
        echo json_encode(["status" => "success", "message" => "Milestone created successfully.", "id" => $new_id]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
