<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->id)) {
    echo json_encode(["status" => "error", "message" => "Student ID required."]);
    exit;
}

try {
    $user_id = intval($data->id);

    // Option: soft delete / suspend user or remove student role
    $stmt = $db->prepare("UPDATE users SET status = 'inactive' WHERE id = :id");
    $stmt->execute([':id' => $user_id]);

    $up_stu = $db->prepare("UPDATE students SET status = 'dropped' WHERE user_id = :user_id");
    $up_stu->execute([':user_id' => $user_id]);

    $table_check = $db->query("SHOW TABLES LIKE 'student_enrollments'");
    if ($table_check && $table_check->rowCount() > 0) {
        $up_enr = $db->prepare("UPDATE student_enrollments SET status = 'dropped', updated_at = NOW() WHERE user_id = :user_id");
        $up_enr->execute([':user_id' => $user_id]);
    }

    echo json_encode(["status" => "success", "message" => "Student account deactivated successfully."]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
