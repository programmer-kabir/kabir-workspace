<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
$requested_course_id = isset($_GET['course_id']) ? intval($_GET['course_id']) : 0;
$requested_enrollment_id = isset($_GET['enrollment_id']) ? intval($_GET['enrollment_id']) : 0;

if (!$user_id) {
    echo json_encode(["status" => "error", "message" => "User ID required."]);
    exit;
}

try {
    // 1. Fetch user base record
    $u_stmt = $db->prepare("SELECT id, name, email, phone, profile_picture, cover_picture, status FROM users WHERE id = :user_id LIMIT 1");
    $u_stmt->execute([':user_id' => $user_id]);
    $user_record = $u_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user_record) {
        echo json_encode(["status" => "error", "message" => "User not found."]);
        exit;
    }

    // 2. Fetch all course enrollments for this user
    $hasEnrollmentsTable = $db->query("SHOW TABLES LIKE 'student_enrollments'")->rowCount() > 0;

    if ($hasEnrollmentsTable) {
        $all_enrollments_stmt = $db->prepare("
            SELECT 
                se.id AS enrollment_id,
                se.id AS student_record_id,
                se.user_id,
                se.course_id,
                COALESCE(s.student_code, CONCAT('STU-', se.user_id)) AS student_code,
                se.enrollment_date,
                se.completion_date,
                s.guardian_phone,
                se.status AS student_status,
                COALESCE(c.title, 'General Course') AS course_name,
                c.course_code,
                c.category AS course_category,
                c.duration_months,
                c.total_classes,
                c.thumbnail_url,
                c.banner_url,
                c.description AS course_description
            FROM student_enrollments se
            LEFT JOIN students s ON se.user_id = s.user_id
            LEFT JOIN courses c ON se.course_id = c.id
            WHERE se.user_id = :user_id
            ORDER BY 
                CASE WHEN se.status = 'active' THEN 0 ELSE 1 END,
                se.id DESC
        ");
    } else {
        $all_enrollments_stmt = $db->prepare("
            SELECT 
                s.id AS enrollment_id,
                s.id AS student_record_id,
                s.user_id,
                s.course_id,
                s.student_code,
                s.enrollment_date,
                s.completion_date,
                s.guardian_phone,
                s.status AS student_status,
                COALESCE(c.title, 'General Course') AS course_name,
                c.course_code,
                c.category AS course_category,
                c.duration_months,
                c.total_classes,
                c.thumbnail_url,
                c.banner_url,
                c.description AS course_description
            FROM students s
            LEFT JOIN courses c ON s.course_id = c.id
            WHERE s.user_id = :user_id
            ORDER BY 
                CASE WHEN s.status = 'active' THEN 0 ELSE 1 END,
                s.id DESC
        ");
    }
    $all_enrollments_stmt->execute([':user_id' => $user_id]);
    $all_enrollments = $all_enrollments_stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Determine selected course
    $selected_enrollment = null;

    if (!empty($all_enrollments)) {
        if ($requested_enrollment_id > 0) {
            foreach ($all_enrollments as $enr) {
                if (intval($enr['enrollment_id']) === $requested_enrollment_id) {
                    $selected_enrollment = $enr;
                    break;
                }
            }
        } else if ($requested_course_id > 0) {
            foreach ($all_enrollments as $enr) {
                if (intval($enr['course_id']) === $requested_course_id) {
                    $selected_enrollment = $enr;
                    break;
                }
            }
        }

        if (!$selected_enrollment) {
            $selected_enrollment = $all_enrollments[0];
        }
    }

    // Fetch permanent student profile if no enrollment exists
    $stu_prof_stmt = $db->prepare("SELECT student_code, guardian_phone, status AS student_status FROM students WHERE user_id = :uid ORDER BY id ASC LIMIT 1");
    $stu_prof_stmt->execute([':uid' => $user_id]);
    $prof_row = $stu_prof_stmt->fetch(PDO::FETCH_ASSOC);

    $student = array_merge($user_record, $selected_enrollment ? $selected_enrollment : [
        'student_record_id' => null,
        'student_code' => $prof_row['student_code'] ?? ('STU-' . $user_id),
        'guardian_phone' => $prof_row['guardian_phone'] ?? null,
        'course_id' => null,
        'course_name' => 'General Course',
        'course_code' => 'GEN',
        'student_status' => $prof_row['student_status'] ?? 'active'
    ]);

    // 4. Attendance stats
    $today = date('Y-m-d');
    $att_today_stmt = $db->prepare("
        SELECT check_in, check_out, status 
        FROM attendance 
        WHERE user_id = :user_id AND (date = :today OR date = CURDATE()) 
        ORDER BY date DESC, id DESC 
        LIMIT 1
    ");
    $att_today_stmt->execute([':user_id' => $user_id, ':today' => $today]);
    $today_att = $att_today_stmt->fetch(PDO::FETCH_ASSOC);

    $tot_stmt = $db->prepare("
        SELECT 
            COUNT(*) AS total_days,
            SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS present_days,
            SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) AS late_days,
            SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS absent_days
        FROM attendance
        WHERE user_id = :user_id
    ");
    $tot_stmt->execute([':user_id' => $user_id]);
    $stats = $tot_stmt->fetch(PDO::FETCH_ASSOC);

    $rec_stmt = $db->prepare("SELECT id, date, check_in, check_out, status FROM attendance WHERE user_id = :user_id ORDER BY date DESC LIMIT 15");
    $rec_stmt->execute([':user_id' => $user_id]);
    $recent_logs = $rec_stmt->fetchAll(PDO::FETCH_ASSOC);

    // 5. Fetch Course Modules / Recorded Lessons for selected course
    $modules = [];
    $course_id = !empty($selected_enrollment['course_id']) ? intval($selected_enrollment['course_id']) : 0;

    if ($course_id > 0) {
        $m_stmt = $db->prepare("
            SELECT m.*
            FROM course_modules m
            WHERE m.course_id = :cid AND m.status = 'active'
            ORDER BY m.module_no ASC, m.order_index ASC
        ");
        $m_stmt->execute([':cid' => $course_id]);
        $modules = $m_stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // 6. Course-specific assignment stats
    $course_assignments_count = 0;
    $course_submissions_count = 0;
    if ($course_id > 0) {
        $asg_cnt_stmt = $db->prepare("SELECT COUNT(*) FROM student_assignments WHERE course_id = :cid");
        $asg_cnt_stmt->execute([':cid' => $course_id]);
        $course_assignments_count = intval($asg_cnt_stmt->fetchColumn());

        $sub_cnt_stmt = $db->prepare("
            SELECT COUNT(*) FROM student_submissions sub
            INNER JOIN student_assignments sa ON sub.assignment_id = sa.id
            WHERE sub.user_id = :uid AND sa.course_id = :cid
        ");
        $sub_cnt_stmt->execute([':uid' => $user_id, ':cid' => $course_id]);
        $course_submissions_count = intval($sub_cnt_stmt->fetchColumn());
    }

    echo json_encode([
        "status" => "success",
        "data" => [
            "student" => $student,
            "all_enrollments" => $all_enrollments,
            "selected_enrollment" => $selected_enrollment,
            "today_attendance" => $today_att ? $today_att : null,
            "modules" => $modules,
            "assignment_summary" => [
                "total" => $course_assignments_count,
                "submitted" => $course_submissions_count,
                "pending" => max(0, $course_assignments_count - $course_submissions_count)
            ],
            "stats" => [
                "total_days" => intval($stats['total_days'] ?? 0),
                "present_days" => intval($stats['present_days'] ?? 0),
                "late_days" => intval($stats['late_days'] ?? 0),
                "absent_days" => intval($stats['absent_days'] ?? 0),
                "attendance_rate" => ($stats['total_days'] > 0) ? round(($stats['present_days'] / $stats['total_days']) * 100, 1) : 100
            ],
            "recent_logs" => $recent_logs
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
