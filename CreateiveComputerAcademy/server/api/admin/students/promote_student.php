<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->user_id) || !isset($data->designation)) {
    echo json_encode(["status" => "error", "message" => "User ID and Designation are required for promotion."]);
    exit;
}

try {
    $db->beginTransaction();

    $user_id = intval($data->user_id);
    $designation = trim($data->designation);
    $department_id = !empty($data->department_id) ? intval($data->department_id) : null;
    $employee_code = !empty($data->employee_code) ? trim($data->employee_code) : 'EMP-' . strtoupper(substr(uniqid(), -6));
    $employment_type = !empty($data->employment_type) ? $data->employment_type : 'Full-time';
    $employment_status = !empty($data->employment_status) ? $data->employment_status : 'active';
    $joining_date = !empty($data->joining_date) ? $data->joining_date : date('Y-m-d');
    $shift_start = !empty($data->shift_start) ? $data->shift_start : '09:00:00';
    $shift_end = !empty($data->shift_end) ? $data->shift_end : '17:00:00';
    $allocated_break_minutes = isset($data->allocated_break_minutes) ? intval($data->allocated_break_minutes) : 60;
    $has_tiffin_break = isset($data->has_tiffin_break) ? intval($data->has_tiffin_break) : 1;
    $tiffin_start_time = !empty($data->tiffin_start_time) ? $data->tiffin_start_time : '13:20';
    $tiffin_end_time = !empty($data->tiffin_end_time) ? $data->tiffin_end_time : '14:00';
    $tiffin_duration_minutes = isset($data->tiffin_duration_minutes) ? intval($data->tiffin_duration_minutes) : 40;

    // 1. Check if employee record already exists
    $chk_emp = $db->prepare("SELECT id FROM employees WHERE user_id = :user_id");
    $chk_emp->execute([':user_id' => $user_id]);

    if ($chk_emp->rowCount() > 0) {
        $up_emp = $db->prepare("
            UPDATE employees SET
                employee_code = :code,
                department_id = :dept_id,
                designation = :desig,
                employment_type = :etype,
                employment_status = :estatus,
                joining_date = :jdate,
                shift_start = :sstart,
                shift_end = :send,
                allocated_break_minutes = :bmin,
                has_tiffin_break = :htiffin,
                tiffin_start_time = :tstart,
                tiffin_end_time = :tend,
                tiffin_duration_minutes = :tdur
            WHERE user_id = :user_id
        ");
        $up_emp->execute([
            ':code' => $employee_code,
            ':dept_id' => $department_id,
            ':desig' => $designation,
            ':etype' => $employment_type,
            ':estatus' => $employment_status,
            ':jdate' => $joining_date,
            ':sstart' => $shift_start,
            ':send' => $shift_end,
            ':bmin' => $allocated_break_minutes,
            ':htiffin' => $has_tiffin_break,
            ':tstart' => $tiffin_start_time,
            ':tend' => $tiffin_end_time,
            ':tdur' => $tiffin_duration_minutes,
            ':user_id' => $user_id
        ]);
    } else {
        $ins_emp = $db->prepare("
            INSERT INTO employees (
                user_id, employee_code, department_id, designation,
                employment_type, employment_status, joining_date,
                shift_start, shift_end, allocated_break_minutes,
                has_tiffin_break, tiffin_start_time, tiffin_end_time, tiffin_duration_minutes
            ) VALUES (
                :user_id, :code, :dept_id, :desig,
                :etype, :estatus, :jdate,
                :sstart, :send, :bmin,
                :htiffin, :tstart, :tend, :tdur
            )
        ");
        $ins_emp->execute([
            ':user_id' => $user_id,
            ':code' => $employee_code,
            ':dept_id' => $department_id,
            ':desig' => $designation,
            ':etype' => $employment_type,
            ':estatus' => $employment_status,
            ':jdate' => $joining_date,
            ':sstart' => $shift_start,
            ':send' => $shift_end,
            ':bmin' => $allocated_break_minutes,
            ':htiffin' => $has_tiffin_break,
            ':tstart' => $tiffin_start_time,
            ':tend' => $tiffin_end_time,
            ':tdur' => $tiffin_duration_minutes
        ]);
    }

    // 2. Add 'staff' role if not present
    $chk_role = $db->prepare("SELECT id FROM user_roles WHERE user_id = :user_id AND role = 'staff'");
    $chk_role->execute([':user_id' => $user_id]);
    if ($chk_role->rowCount() === 0) {
        $ins_role = $db->prepare("INSERT INTO user_roles (user_id, role) VALUES (:user_id, 'staff')");
        $ins_role->execute([':user_id' => $user_id]);
    }

    // 3. Mark student record as promoted_to_staff
    $up_stu = $db->prepare("UPDATE students SET status = 'promoted_to_staff' WHERE user_id = :user_id");
    $up_stu->execute([':user_id' => $user_id]);

    $table_check = $db->query("SHOW TABLES LIKE 'student_enrollments'");
    if ($table_check && $table_check->rowCount() > 0) {
        $up_enr = $db->prepare("UPDATE student_enrollments SET status = 'completed', completion_date = CURDATE(), updated_at = NOW() WHERE user_id = :user_id AND status = 'active'");
        $up_enr->execute([':user_id' => $user_id]);
    }

    $db->commit();
    echo json_encode([
        "status" => "success",
        "message" => "Student successfully promoted to Staff member!",
        "employee_code" => $employee_code
    ]);
} catch (PDOException $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
