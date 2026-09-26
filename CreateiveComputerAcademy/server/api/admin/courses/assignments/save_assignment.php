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

// Auto create course_assignments table if not exists
try {
    $db->exec("CREATE TABLE IF NOT EXISTS `course_assignments` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `course_id` INT NOT NULL,
        `milestone_id` INT DEFAULT NULL,
        `module_id` INT NOT NULL,
        `assignment_no` INT DEFAULT 1,
        `title` VARCHAR(255) NOT NULL,
        `description` TEXT DEFAULT NULL,
        `total_marks` INT DEFAULT 100,
        `pass_marks` INT DEFAULT 50,
        `resources_json` TEXT DEFAULT NULL,
        `order_index` INT DEFAULT 99,
        `status` ENUM('active', 'inactive') DEFAULT 'active',
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (`course_id`),
        INDEX (`module_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $db->exec("CREATE TABLE IF NOT EXISTS `student_submissions` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `assignment_id` INT NOT NULL,
        `course_id` INT DEFAULT NULL,
        `user_id` INT NOT NULL,
        `submission_link` TEXT NOT NULL,
        `notes` TEXT DEFAULT NULL,
        `marks_obtained` INT DEFAULT NULL,
        `feedback` TEXT DEFAULT NULL,
        `status` ENUM('submitted', 'reviewed', 'resubmit_required') DEFAULT 'submitted',
        `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `reviewed_at` DATETIME DEFAULT NULL,
        `reviewer_id` INT DEFAULT NULL,
        INDEX (`assignment_id`),
        INDEX (`user_id`),
        INDEX (`course_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
} catch (Throwable $t) {}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    echo json_encode(["status" => "error", "message" => "Invalid JSON payload."]);
    exit;
}

$id = isset($data['id']) ? intval($data['id']) : 0;
$course_id = isset($data['course_id']) ? intval($data['course_id']) : 0;
$module_id = isset($data['module_id']) ? intval($data['module_id']) : 0;
$milestone_id = isset($data['milestone_id']) && $data['milestone_id'] ? intval($data['milestone_id']) : null;
$assignment_no = isset($data['assignment_no']) ? intval($data['assignment_no']) : 1;
$title = isset($data['title']) ? trim($data['title']) : '';
$description = isset($data['description']) ? trim($data['description']) : '';
$total_marks = isset($data['total_marks']) ? intval($data['total_marks']) : 100;
$pass_marks = isset($data['pass_marks']) ? intval($data['pass_marks']) : 50;
$resources_json = isset($data['resources_json']) ? (is_string($data['resources_json']) ? $data['resources_json'] : json_encode($data['resources_json'])) : '[]';
$order_index = isset($data['order_index']) ? intval($data['order_index']) : 99;
$status = isset($data['status']) && $data['status'] === 'inactive' ? 'inactive' : 'active';

if (!$course_id || !$module_id || empty($title)) {
    echo json_encode(["status" => "error", "message" => "Course ID, Module ID, and Assignment Title are required."]);
    exit;
}

try {
    if ($id > 0) {
        $stmt = $db->prepare("
            UPDATE course_assignments 
            SET milestone_id = :milestone_id,
                module_id = :module_id,
                assignment_no = :assignment_no,
                title = :title,
                description = :description,
                total_marks = :total_marks,
                pass_marks = :pass_marks,
                resources_json = :resources_json,
                order_index = :order_index,
                status = :status
            WHERE id = :id AND course_id = :course_id
        ");
        $stmt->execute([
            ':milestone_id' => $milestone_id,
            ':module_id' => $module_id,
            ':assignment_no' => $assignment_no,
            ':title' => $title,
            ':description' => $description,
            ':total_marks' => $total_marks,
            ':pass_marks' => $pass_marks,
            ':resources_json' => $resources_json,
            ':order_index' => $order_index,
            ':status' => $status,
            ':id' => $id,
            ':course_id' => $course_id
        ]);

        echo json_encode([
            "status" => "success",
            "message" => "Course Assignment updated successfully!",
            "data" => ["id" => $id]
        ]);
    } else {
        $stmt = $db->prepare("
            INSERT INTO course_assignments 
            (course_id, milestone_id, module_id, assignment_no, title, description, total_marks, pass_marks, resources_json, order_index, status)
            VALUES 
            (:course_id, :milestone_id, :module_id, :assignment_no, :title, :description, :total_marks, :pass_marks, :resources_json, :order_index, :status)
        ");
        $stmt->execute([
            ':course_id' => $course_id,
            ':milestone_id' => $milestone_id,
            ':module_id' => $module_id,
            ':assignment_no' => $assignment_no,
            ':title' => $title,
            ':description' => $description,
            ':total_marks' => $total_marks,
            ':pass_marks' => $pass_marks,
            ':resources_json' => $resources_json,
            ':order_index' => $order_index,
            ':status' => $status
        ]);
        $newId = $db->lastInsertId();

        echo json_encode([
            "status" => "success",
            "message" => "Course Assignment created successfully!",
            "data" => ["id" => intval($newId)]
        ]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
