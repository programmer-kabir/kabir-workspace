<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';
require_once '../../leave/StudentLeaveHelper.php';

$database = new Database();
$db = $database->getConnection();

StudentLeaveHelper::ensureSchema($db);

try {
    // Check available columns in employees table
    $cols = [];
    try {
        $cols = $db->query("SHOW COLUMNS FROM `employees`")->fetchAll(PDO::FETCH_COLUMN);
    } catch (Throwable $e) {}

    $studentSelect = in_array('is_student', $cols) 
        ? "COALESCE(e.is_student, 0) AS is_student, COALESCE(e.student_leave_quota, 3) AS student_leave_quota, e.student_institution,"
        : "0 AS is_student, 3 AS student_leave_quota, NULL AS student_institution,";

    $query = "
        SELECT 
            u.id, u.name, u.email, u.phone, u.status, u.profile_picture, u.cover_picture,
            ur.role,
            e.employee_code, e.department_id, e.designation, e.employment_status, e.employment_type,
            e.joining_date, e.resignation_date, e.shift_start, e.shift_end, e.allocated_break_minutes,
            e.has_tiffin_break, e.tiffin_start_time, e.tiffin_end_time, e.tiffin_duration_minutes,
            {$studentSelect}
            d.name AS department_name
        FROM users u
        INNER JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN employees e ON u.id = e.user_id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE ur.role IN ('staff', 'manager', 'instructor')
        ORDER BY u.name ASC
    ";

    $stmt = $db->prepare($query);
    $stmt->execute();

    $staff_list = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $staff_list[] = $row;
    }

    echo json_encode([
        "status" => "success",
        "data" => $staff_list
    ]);
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
