<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';
$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

// Required fields validation
$required = ['name', 'email', 'password', 'role'];
foreach ($required as $field) {
    if (!isset($data->$field) || trim($data->$field) === '') {
        echo json_encode(["status" => "error", "message" => "Field '$field' is required."]);
        exit;
    }
}

$name            = trim($data->name);
$email           = trim($data->email);
$password        = $data->password;
$role            = $data->role; // staff | manager | instructor
$phone           = isset($data->phone)            ? trim($data->phone)            : null;
$department_id   = isset($data->department_id)    ? intval($data->department_id)  : null;
$designation     = isset($data->designation)      ? trim($data->designation)      : null;
$employment_type = isset($data->employment_type)  ? trim($data->employment_type)  : 'Full-time';
$employment_status = isset($data->employment_status) && trim($data->employment_status) !== '' ? trim($data->employment_status) : 'active';
$status          = isset($data->status) && trim($data->status) !== '' ? trim($data->status) : 'active';
$join_date       = isset($data->joining_date) && trim($data->joining_date) !== '' ? trim($data->joining_date) : null;
$resignation_date = isset($data->resignation_date) && trim($data->resignation_date) !== '' ? trim($data->resignation_date) : null;
$shift_start     = isset($data->shift_start) && trim($data->shift_start) !== '' ? trim($data->shift_start) : '09:00:00';
$shift_end       = isset($data->shift_end) && trim($data->shift_end) !== '' ? trim($data->shift_end) : '17:00:00';
$allocated_break_minutes = isset($data->allocated_break_minutes) ? intval($data->allocated_break_minutes) : 60;

try {
    // Ensure column existence safely
    try {
        $db->exec("ALTER TABLE `employees` ADD COLUMN `resignation_date` DATE NULL DEFAULT NULL AFTER `joining_date`");
    } catch (Exception $colEx) {}

    try {
        $db->exec("ALTER TABLE `employees` MODIFY COLUMN `employment_status` VARCHAR(50) NOT NULL DEFAULT 'Active'");
    } catch (Exception $colEx) {}

    // ── Check if email already exists ────────────────────────────────────────
    $check_stmt = $db->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
    $check_stmt->bindParam(':email', $email);
    $check_stmt->execute();
    if ($check_stmt->rowCount() > 0) {
        echo json_encode(["status" => "error", "message" => "A user with this email already exists."]);
        exit;
    }

    $db->beginTransaction();

    // ── 1. Create user ────────────────────────────────────────────────────────
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    $user_stmt = $db->prepare(
        "INSERT INTO users (name, email, password, phone, status) 
         VALUES (:name, :email, :password, :phone, :status)"
    );
    $user_stmt->execute([
        ':name'     => $name,
        ':email'    => $email,
        ':password' => $hashed_password,
        ':phone'    => $phone,
        ':status'   => $status,
    ]);
    $user_id = $db->lastInsertId();

    // ── 2. Assign role ────────────────────────────────────────────────────────
    $role_stmt = $db->prepare(
        "INSERT INTO user_roles (user_id, role) VALUES (:user_id, :role)"
    );
    $role_stmt->execute([':user_id' => $user_id, ':role' => $role]);

    // Helper functions for employee code prefix
    function getRolePrefix($r) {
        switch (strtolower($r)) {
            case 'manager': return 'MGR';
            case 'instructor': return 'INS';
            default: return 'STA';
        }
    }

    function getDepartmentPrefix($database_conn, $dept_id) {
        if (!$dept_id) return '';
        $stmt = $database_conn->prepare("SELECT name FROM departments WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $dept_id]);
        $name = $stmt->fetchColumn();
        if (!$name) return '';
        
        $words = preg_split('/\s+/', trim($name));
        if (count($words) >= 2) {
            return strtoupper($words[0][0] . $words[1][0]);
        } else {
            return strtoupper(substr($words[0], 0, 2));
        }
    }

    // ── 4. Create employee record (Insert first with temporary code) ──────────
    $emp_stmt = $db->prepare(
        "INSERT INTO employees (user_id, employee_code, designation, department_id, employment_type, employment_status, joining_date, resignation_date, shift_start, shift_end, allocated_break_minutes)
         VALUES (:user_id, 'TEMP', :designation, :department_id, :employment_type, :employment_status, :joining_date, :resignation_date, :shift_start, :shift_end, :allocated_break_minutes)"
    );
    $emp_stmt->execute([
        ':user_id'          => $user_id,
        ':designation'      => $designation,
        ':department_id'    => $department_id ?: null,
        ':employment_type'  => $employment_type,
        ':employment_status' => $employment_status,
        ':joining_date'     => $join_date,
        ':resignation_date' => $resignation_date,
        ':shift_start'      => $shift_start,
        ':shift_end'        => $shift_end,
        ':allocated_break_minutes' => $allocated_break_minutes,
    ]);

    // Retrieve the newly created auto-increment primary key ID
    $employees_id = $db->lastInsertId();

    // ── 5. Generate and update final employee code based on employees table ID ──
    $role_prefix = getRolePrefix($role);
    $dept_prefix = getDepartmentPrefix($db, $department_id);
    if ($dept_prefix !== '') {
        $employee_code = $role_prefix . '-' . $dept_prefix . '-' . $employees_id;
    } else {
        $employee_code = $role_prefix . '-' . $employees_id;
    }

    $update_code_stmt = $db->prepare("UPDATE employees SET employee_code = :employee_code WHERE id = :id");
    $update_code_stmt->execute([
        ':employee_code' => $employee_code,
        ':id'            => $employees_id
    ]);

    $db->commit();

    echo json_encode([
        "status"  => "success",
        "message" => "Staff member created successfully.",
        "user_id" => $user_id,
        "employee_code" => $employee_code
    ]);

} catch (PDOException $e) {
    $db->rollBack();
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
