<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!$data || empty($data->user_id) || (empty($data->new_course_id) && empty($data->new_course_name))) {
    echo json_encode(["status" => "error", "message" => "User ID and New Course are required."]);
    exit;
}

try {
    $user_id = intval($data->user_id);
    $new_course_id = !empty($data->new_course_id) ? intval($data->new_course_id) : null;
    $new_course_name = !empty($data->new_course_name) ? trim($data->new_course_name) : null;

    if ($new_course_id) {
        $c_stmt = $db->prepare("SELECT id, title FROM courses WHERE id = :cid LIMIT 1");
        $c_stmt->execute([':cid' => $new_course_id]);
        $c_row = $c_stmt->fetch(PDO::FETCH_ASSOC);
        if ($c_row) {
            $new_course_name = $c_row['title'];
        }
    } else if ($new_course_name) {
        $c_stmt = $db->prepare("SELECT id, title FROM courses WHERE title = :title OR course_code = :code LIMIT 1");
        $c_stmt->execute([':title' => $new_course_name, ':code' => $new_course_name]);
        $c_row = $c_stmt->fetch(PDO::FETCH_ASSOC);
        if ($c_row) {
            $new_course_id = intval($c_row['id']);
            $new_course_name = $c_row['title'];
        }
    }

    if (!$new_course_id) {
        echo json_encode(["status" => "error", "message" => "Course not found."]);
        exit;
    }

    $now_bd = date('Y-m-d H:i:s');

    // Check if student_enrollments table exists
    $table_check = $db->query("SHOW TABLES LIKE 'student_enrollments'");
    $has_enrollments = ($table_check && $table_check->rowCount() > 0);

    if ($has_enrollments) {
        // Check if student is already enrolled in the new course
        $chk = $db->prepare("SELECT id FROM student_enrollments WHERE user_id = :uid AND course_id = :cid LIMIT 1");
        $chk->execute([':uid' => $user_id, ':cid' => $new_course_id]);
        $existing = $chk->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            $up = $db->prepare("UPDATE student_enrollments SET status = 'active', updated_at = :up WHERE id = :id");
            $up->execute([':up' => $now_bd, ':id' => $existing['id']]);
        } else {
            // Find current active enrollment to transfer
            $act = $db->prepare("SELECT id FROM student_enrollments WHERE user_id = :uid AND (status = 'active' OR status IS NULL) ORDER BY id DESC LIMIT 1");
            $act->execute([':uid' => $user_id]);
            $active_enr = $act->fetch(PDO::FETCH_ASSOC);

            if ($active_enr) {
                $up_act = $db->prepare("UPDATE student_enrollments SET course_id = :cid, updated_at = :up WHERE id = :id");
                $up_act->execute([':cid' => $new_course_id, ':up' => $now_bd, ':id' => $active_enr['id']]);
            } else {
                $ins_enr = $db->prepare("
                    INSERT INTO student_enrollments (user_id, course_id, enrollment_date, status, created_at, updated_at)
                    VALUES (:uid, :cid, CURDATE(), 'active', :cr, :up)
                ");
                $ins_enr->execute([':uid' => $user_id, ':cid' => $new_course_id, ':cr' => $now_bd, ':up' => $now_bd]);
            }
        }
    }

    // Keep students table in sync if it has course_id column
    try {
        $stmt = $db->prepare("
            UPDATE students 
            SET course_id = :cid, updated_at = :up
            WHERE user_id = :uid
        ");
        $stmt->execute([
            ':cid' => $new_course_id,
            ':up' => $now_bd,
            ':uid' => $user_id
        ]);
    } catch (Exception $ignored) {
        // If course_id column was removed from students, ignore error
    }

    echo json_encode([
        "status" => "success",
        "message" => "Student successfully transferred to " . $new_course_name . "! All past attendance and assignment logs are preserved."
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
