<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->user_id) || !isset($data->course_id)) {
    echo json_encode(["status" => "error", "message" => "User ID and Course ID are required."]);
    exit;
}

$user_id = intval($data->user_id);
$course_id = intval($data->course_id);
$enrollment_date = !empty($data->enrollment_date) ? $data->enrollment_date : date('Y-m-d');

try {
    // Ensure student_enrollments table exists (WITHOUT batch_id)
    $db->exec("
        CREATE TABLE IF NOT EXISTS `student_enrollments` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `user_id` INT NOT NULL,
            `course_id` INT NOT NULL,
            `enrollment_date` DATE NOT NULL,
            `completion_date` DATE NULL DEFAULT NULL,
            `status` ENUM('active', 'completed', 'dropped') DEFAULT 'active',
            `created_at` DATETIME NOT NULL,
            `updated_at` DATETIME NOT NULL,
            UNIQUE KEY `uniq_user_course` (`user_id`, `course_id`),
            INDEX `idx_user_id` (`user_id`),
            INDEX `idx_course_id` (`course_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 1. Verify user exists
    $u_chk = $db->prepare("SELECT id, name, email FROM users WHERE id = :uid LIMIT 1");
    $u_chk->execute([':uid' => $user_id]);
    $user = $u_chk->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        echo json_encode(["status" => "error", "message" => "Student user account not found."]);
        exit;
    }

    // 2. Fetch course details
    $c_stmt = $db->prepare("SELECT id, title, course_code FROM courses WHERE id = :cid LIMIT 1");
    $c_stmt->execute([':cid' => $course_id]);
    $course = $c_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$course) {
        echo json_encode(["status" => "error", "message" => "Selected course does not exist."]);
        exit;
    }

    $course_title = $course['title'];
    $course_code = $course['course_code'];
    $now_bd = date('Y-m-d H:i:s');

    // 3. Ensure permanent student profile exists in students table
    $stu_prof = $db->prepare("SELECT id, student_code, guardian_phone FROM students WHERE user_id = :uid ORDER BY id ASC LIMIT 1");
    $stu_prof->execute([':uid' => $user_id]);
    $existing_profile = $stu_prof->fetch(PDO::FETCH_ASSOC);

    if ($existing_profile && !empty($existing_profile['student_code'])) {
        $student_code = $existing_profile['student_code'];
    } else {
        // Generate clean permanent student code (e.g. STU-0014)
        $student_code = 'STU-' . str_pad($user_id, 4, '0', STR_PAD_LEFT);
        if ($existing_profile) {
            $up_prof = $db->prepare("UPDATE students SET student_code = :code, updated_at = :up WHERE id = :id");
            $up_prof->execute([':code' => $student_code, ':up' => $now_bd, ':id' => $existing_profile['id']]);
        } else {
            $ins_prof = $db->prepare("
                INSERT INTO students (user_id, student_code, status, created_at, updated_at)
                VALUES (:uid, :code, 'active', :cr, :up)
            ");
            $ins_prof->execute([
                ':uid' => $user_id,
                ':code' => $student_code,
                ':cr' => $now_bd,
                ':up' => $now_bd
            ]);
        }
    }

    // 4. Check if already enrolled in this exact course
    $enr_chk = $db->prepare("SELECT id FROM student_enrollments WHERE user_id = :uid AND course_id = :cid LIMIT 1");
    $enr_chk->execute([':uid' => $user_id, ':cid' => $course_id]);
    if ($enr_chk->rowCount() > 0) {
        echo json_encode(["status" => "error", "message" => "Student is already enrolled in {$course_title} ({$course_code})."]);
        exit;
    }

    // 5. Insert clean course enrollment record in student_enrollments
    $ins = $db->prepare("
        INSERT INTO student_enrollments (
            user_id, course_id, enrollment_date, status, created_at, updated_at
        ) VALUES (
            :user_id, :course_id, :edate, 'active', :cr_time, :up_time
        )
    ");
    $ins->execute([
        ':user_id' => $user_id,
        ':course_id' => $course_id,
        ':edate' => $enrollment_date,
        ':cr_time' => $now_bd,
        ':up_time' => $now_bd
    ]);

    $enrollment_id = $db->lastInsertId();

    // 6. Ensure student role is present in user_roles
    $r_chk = $db->prepare("SELECT id FROM user_roles WHERE user_id = :uid AND role = 'student' LIMIT 1");
    $r_chk->execute([':uid' => $user_id]);
    if ($r_chk->rowCount() === 0) {
        $r_ins = $db->prepare("INSERT INTO user_roles (user_id, role) VALUES (:uid, 'student')");
        $r_ins->execute([':uid' => $user_id]);
    }

    echo json_encode([
        "status" => "success",
        "message" => "Successfully enrolled student in {$course_title}!",
        "enrollment_id" => $enrollment_id,
        "student_code" => $student_code
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
