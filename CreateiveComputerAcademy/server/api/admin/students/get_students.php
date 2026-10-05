<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo json_encode(["status" => "error", "message" => "Database connection error."]);
    exit;
}

try {
    // 1. Fetch distinct student users
    $query = "
        SELECT 
            u.id, u.name, u.email, u.phone, u.status AS user_status, u.profile_picture, u.cover_picture,
            ur.role,
            e.employee_code, e.designation,
            (SELECT COUNT(*) FROM attendance a WHERE a.user_id = u.id AND a.status = 'Present') AS total_present_days,
            (SELECT COUNT(*) FROM attendance a WHERE a.user_id = u.id) AS total_attendance_logs,
            (SELECT a.check_in FROM attendance a WHERE a.user_id = u.id AND a.date = CURDATE() LIMIT 1) AS today_check_in,
            (SELECT a.status FROM attendance a WHERE a.user_id = u.id AND a.date = CURDATE() LIMIT 1) AS today_attendance_status
        FROM users u
        INNER JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN employees e ON u.id = e.user_id
        WHERE ur.role = 'student' OR EXISTS (SELECT 1 FROM students s WHERE s.user_id = u.id)
        GROUP BY u.id
        ORDER BY u.id DESC, u.name ASC
    ";

    $stmt = $db->prepare($query);
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Check if student_enrollments table exists
    $table_check = $db->query("SHOW TABLES LIKE 'student_enrollments'");
    $has_enrollments_table = ($table_check && $table_check->rowCount() > 0);

    // Fetch permanent student profiles (student_code, guardian_phone)
    $profStmt = $db->query("SELECT user_id, student_code, guardian_phone, status FROM students");
    $profilesByUser = [];
    if ($profStmt) {
        while ($p = $profStmt->fetch(PDO::FETCH_ASSOC)) {
            $profilesByUser[intval($p['user_id'])] = $p;
        }
    }

    // 2. Fetch all course enrollments for all students in one fast query
    if ($has_enrollments_table) {
        $enrQuery = "
            SELECT 
                se.id AS enrollment_id, se.user_id, se.course_id,
                COALESCE(s.student_code, CONCAT('STU-', se.user_id)) AS student_code,
                s.guardian_phone,
                se.enrollment_date, se.completion_date, se.status AS enrollment_status,
                c.title AS course_name, c.course_code
            FROM student_enrollments se
            LEFT JOIN students s ON se.user_id = s.user_id
            LEFT JOIN courses c ON se.course_id = c.id
            ORDER BY se.id DESC
        ";
    } else {
        $enrQuery = "
            SELECT 
                s.id AS enrollment_id, s.user_id, NULL AS course_id, s.student_code, s.guardian_phone,
                s.enrollment_date, s.completion_date, s.status AS enrollment_status,
                'General Course' AS course_name, 'GEN' AS course_code
            FROM students s
            ORDER BY s.id DESC
        ";
    }
    $enrStmt = $db->query($enrQuery);
    $allEnrollments = $enrStmt ? $enrStmt->fetchAll(PDO::FETCH_ASSOC) : [];

    // Group enrollments by user_id
    $enrollmentsByUser = [];
    foreach ($allEnrollments as $enr) {
        $uid = intval($enr['user_id']);
        if (!isset($enrollmentsByUser[$uid])) {
            $enrollmentsByUser[$uid] = [];
        }
        $enrollmentsByUser[$uid][] = $enr;
    }

    // 3. Assemble unique student records with their enrolled courses
    $students = [];
    foreach ($users as $u) {
        $uid = intval($u['id']);
        $uEnrollments = isset($enrollmentsByUser[$uid]) ? $enrollmentsByUser[$uid] : [];
        $uProfile = isset($profilesByUser[$uid]) ? $profilesByUser[$uid] : null;

        $primaryCode = !empty($uProfile['student_code']) ? $uProfile['student_code'] : (!empty($uEnrollments[0]['student_code']) ? $uEnrollments[0]['student_code'] : 'STU-' . $uid);
        $primaryGuardian = !empty($uProfile['guardian_phone']) ? $uProfile['guardian_phone'] : (!empty($uEnrollments[0]['guardian_phone']) ? $uEnrollments[0]['guardian_phone'] : null);
        $primaryCourseName = !empty($uEnrollments[0]['course_name']) ? $uEnrollments[0]['course_name'] : 'General Student';
        $primaryEnrollDate = !empty($uEnrollments[0]['enrollment_date']) ? $uEnrollments[0]['enrollment_date'] : null;
        $primaryStatus = !empty($uEnrollments[0]['enrollment_status']) ? $uEnrollments[0]['enrollment_status'] : (!empty($uProfile['status']) ? $uProfile['status'] : $u['user_status']);

        $courseNamesList = [];
        foreach ($uEnrollments as $e) {
            if (!empty($e['course_name'])) {
                $courseNamesList[] = $e['course_name'];
            }
        }

        $formattedStudent = [
            "id" => $uid,
            "user_id" => $uid,
            "name" => $u['name'],
            "email" => $u['email'],
            "phone" => $u['phone'],
            "user_status" => $u['user_status'],
            "student_status" => $primaryStatus,
            "profile_picture" => $u['profile_picture'],
            "cover_picture" => $u['cover_picture'],
            "role" => $u['role'],
            "student_code" => $primaryCode,
            "course_id" => !empty($uEnrollments[0]['course_id']) ? intval($uEnrollments[0]['course_id']) : null,
            "course_name" => $primaryCourseName,
            "course_code" => !empty($uEnrollments[0]['course_code']) ? $uEnrollments[0]['course_code'] : null,
            "enrollment_date" => $primaryEnrollDate,
            "guardian_phone" => $primaryGuardian,
            "employee_code" => $u['employee_code'],
            "designation" => $u['designation'],
            "total_present_days" => intval($u['total_present_days']),
            "total_attendance_logs" => intval($u['total_attendance_logs']),
            "today_check_in" => $u['today_check_in'],
            "today_attendance_status" => $u['today_attendance_status'],
            "enrolled_courses" => $uEnrollments,
            "courses_count" => count($uEnrollments),
            "all_course_names" => $courseNamesList
        ];

        $students[] = $formattedStudent;
    }

    echo json_encode([
        "status" => "success",
        "data" => $students,
        "total_unique_students" => count($students)
    ]);
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
