<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo json_encode(["status" => "error", "message" => "Database connection error."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (!$data || empty($data->user_id) || empty($data->course_id)) {
    echo json_encode(["status" => "error", "message" => "User ID and Course ID are required."]);
    exit;
}

try {
    $user_id = intval($data->user_id);
    $course_id = intval($data->course_id);

    // 1. Verify User exists
    $u_stmt = $db->prepare("SELECT id, name, email FROM users WHERE id = :uid LIMIT 1");
    $u_stmt->execute([':uid' => $user_id]);
    $user = $u_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(["status" => "error", "message" => "User account not found."]);
        exit;
    }

    // 2. Verify Course exists
    $c_stmt = $db->prepare("SELECT id, title, course_code, category FROM courses WHERE id = :cid LIMIT 1");
    $c_stmt->execute([':cid' => $course_id]);
    $course = $c_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$course) {
        echo json_encode(["status" => "error", "message" => "Course not found or inactive."]);
        exit;
    }

    // Ensure student_enrollments table exists
    $db->exec("
        CREATE TABLE IF NOT EXISTS `student_enrollments` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `user_id` INT NOT NULL,
            `course_id` INT NOT NULL,
            `enrollment_date` DATE NOT NULL,
            `completion_date` DATE DEFAULT NULL,
            `status` ENUM('active', 'completed', 'dropped', 'suspended') NOT NULL DEFAULT 'active',
            `created_at` DATETIME NOT NULL,
            `updated_at` DATETIME NOT NULL,
            UNIQUE KEY `uniq_user_course` (`user_id`, `course_id`),
            INDEX `idx_user_id` (`user_id`),
            INDEX `idx_course_id` (`course_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 3. Check existing enrollment in student_enrollments
    $chk_stmt = $db->prepare("SELECT id, status FROM student_enrollments WHERE user_id = :uid AND course_id = :cid LIMIT 1");
    $chk_stmt->execute([':uid' => $user_id, ':cid' => $course_id]);
    $existing = $chk_stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        if ($existing['status'] === 'active') {
            echo json_encode([
                "status" => "info",
                "message" => "You are already actively enrolled in " . $course['title'] . "!",
                "course" => $course
            ]);
            exit;
        } else {
            // Reactivate enrollment
            $up = $db->prepare("UPDATE student_enrollments SET status = 'active', enrollment_date = :edate, updated_at = :up_time WHERE id = :id");
            $up->execute([
                ':edate' => date('Y-m-d'),
                ':up_time' => date('Y-m-d H:i:s'),
                ':id' => $existing['id']
            ]);

            echo json_encode([
                "status" => "success",
                "message" => "Successfully re-activated enrollment in " . $course['title'] . "!",
                "course" => $course
            ]);
            exit;
        }
    }

    // 4. Ensure permanent student profile exists in students table
    $stu_prof = $db->prepare("SELECT id, student_code FROM students WHERE user_id = :uid ORDER BY id ASC LIMIT 1");
    $stu_prof->execute([':uid' => $user_id]);
    $prof_row = $stu_prof->fetch(PDO::FETCH_ASSOC);

    $now_bd = date('Y-m-d H:i:s');
    $today = date('Y-m-d');

    if ($prof_row && !empty($prof_row['student_code'])) {
        $student_code = $prof_row['student_code'];
    } else {
        // Generate a permanent student code (never changes)
        $student_code = "STU-" . str_pad($user_id, 5, '0', STR_PAD_LEFT);
        $ins_prof = $db->prepare("
            INSERT INTO students (user_id, student_code, status, created_at, updated_at)
            VALUES (:uid, :code, 'active', :ctime, :utime)
        ");
        $ins_prof->execute([
            ':uid' => $user_id,
            ':code' => $student_code,
            ':ctime' => $now_bd,
            ':utime' => $now_bd
        ]);
    }

    // 5. Insert new course enrollment into student_enrollments
    $ins = $db->prepare("
        INSERT INTO student_enrollments (user_id, course_id, enrollment_date, status, created_at, updated_at)
        VALUES (:uid, :cid, :edate, 'active', :ctime, :utime)
    ");
    $ins->execute([
        ':uid' => $user_id,
        ':cid' => $course_id,
        ':edate' => $today,
        ':ctime' => $now_bd,
        ':utime' => $now_bd
    ]);

    $new_enrollment_id = $db->lastInsertId();

    echo json_encode([
        "status" => "success",
        "message" => "🎉 Enrolled in " . $course['title'] . " successfully! You can start learning right away.",
        "enrollment_id" => $new_enrollment_id,
        "student_code" => $student_code,
        "course" => $course
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
