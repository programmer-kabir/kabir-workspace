<?php
require_once '../../../config/cors.php';

require_once '../../../config/database.php';
$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->user_id)) {
    echo json_encode(["status" => "error", "message" => "user_id is required."]);
    exit;
}

$user_id         = intval($data->user_id);
$name            = isset($data->name)             ? trim($data->name)             : null;
$email           = isset($data->email)            ? trim($data->email)            : null;
$phone           = isset($data->phone)            ? trim($data->phone)            : null;
$role            = isset($data->role)             ? trim($data->role)             : null;
$department_id   = isset($data->department_id)    ? intval($data->department_id)  : null;
$designation     = isset($data->designation)      ? trim($data->designation)      : null;
$employment_type = isset($data->employment_type)  ? trim($data->employment_type)  : null;
$employment_status = isset($data->employment_status) ? trim($data->employment_status) : null;
$status          = isset($data->status)           ? trim($data->status)           : null;
$new_password    = isset($data->password) && trim($data->password) !== '' ? $data->password : null;

// If employment_status is resigned or terminated, automatically make account status inactive if not specified
if ($employment_status && in_array(strtolower($employment_status), ['resigned', 'terminated', 'inactive']) && !$status) {
    $status = 'inactive';
}

try {
    // Ensure column existence & type in employees table safely
    try {
        $db->exec("ALTER TABLE `employees` ADD COLUMN `resignation_date` DATE NULL DEFAULT NULL AFTER `joining_date`");
    } catch (Exception $colEx) {}

    try {
        $db->exec("ALTER TABLE `employees` MODIFY COLUMN `employment_status` VARCHAR(50) NOT NULL DEFAULT 'Active'");
    } catch (Exception $colEx) {}

    $db->beginTransaction();

    // ── Update users table ───────────────────────────────────────────────────
    $update_fields = [];
    $params = [':user_id' => $user_id];

    if ($name)   { $update_fields[] = 'name = :name';   $params[':name']   = $name; }
    if ($email)  { $update_fields[] = 'email = :email'; $params[':email']  = $email; }
    if ($phone !== null) { $update_fields[] = 'phone = :phone'; $params[':phone'] = $phone; }
    if ($status) { $update_fields[] = 'status = :status'; $params[':status'] = $status; }
    if ($new_password) {
        $update_fields[] = 'password = :password';
        $params[':password'] = password_hash($new_password, PASSWORD_DEFAULT);
    }

    if (!empty($update_fields)) {
        $sql = "UPDATE users SET " . implode(', ', $update_fields) . " WHERE id = :user_id";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
    }

    // ── Update role ──────────────────────────────────────────────────────────
    if ($role) {
        $role_check = $db->prepare("SELECT id FROM user_roles WHERE user_id = :user_id LIMIT 1");
        $role_check->bindParam(':user_id', $user_id);
        $role_check->execute();

        if ($role_check->rowCount() > 0) {
            $role_upd = $db->prepare("UPDATE user_roles SET role = :role WHERE user_id = :user_id");
            $role_upd->execute([':role' => $role, ':user_id' => $user_id]);
        } else {
            $role_ins = $db->prepare("INSERT INTO user_roles (user_id, role) VALUES (:user_id, :role)");
            $role_ins->execute([':user_id' => $user_id, ':role' => $role]);
        }
    }

    // Helper functions for employee code prefix
    if (!function_exists('getRolePrefix')) {
        function getRolePrefix($r) {
            switch (strtolower($r)) {
                case 'manager': return 'MGR';
                case 'instructor': return 'INS';
                default: return 'STA';
            }
        }
    }

    if (!function_exists('getDepartmentPrefix')) {
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
    }

    // Fetch current info to recalculate employee_code if needed
    $stmt_current = $db->prepare("
        SELECT ur.role, e.id AS employees_id, e.department_id 
        FROM users u
        INNER JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN employees e ON u.id = e.user_id
        WHERE u.id = :user_id
        LIMIT 1
    ");
    $stmt_current->execute([':user_id' => $user_id]);
    $current_info = $stmt_current->fetch(PDO::FETCH_ASSOC);

    $final_role = $role ?: ($current_info['role'] ?? 'staff');
    $final_dept = isset($data->department_id) 
        ? (intval($data->department_id) > 0 ? intval($data->department_id) : null)
        : ($current_info['department_id'] ?? null);

    $role_prefix = getRolePrefix($final_role);
    $dept_prefix = getDepartmentPrefix($db, $final_dept);
    
    $employees_id = $current_info['employees_id'] ?? 1;

    if ($dept_prefix !== '') {
        $employee_code = $role_prefix . '-' . $dept_prefix . '-' . $employees_id;
    } else {
        $employee_code = $role_prefix . '-' . $employees_id;
    }

    // ── Update employee record ───────────────────────────────────────────────
    $emp_fields = ['employee_code = :employee_code'];
    $emp_params = [
        ':user_id' => $user_id,
        ':employee_code' => $employee_code
    ];

    if (isset($data->designation)) {
        $emp_fields[] = 'designation = :designation';
        $emp_params[':designation'] = trim($data->designation) !== '' ? trim($data->designation) : null;
    }
    if (isset($data->department_id)) {
        $emp_fields[] = 'department_id = :department_id';
        $emp_params[':department_id'] = intval($data->department_id) > 0 ? intval($data->department_id) : null;
    }
    if (isset($data->employment_type)) {
        $emp_fields[] = 'employment_type = :employment_type';
        $emp_params[':employment_type'] = trim($data->employment_type) !== '' ? trim($data->employment_type) : 'Full-time';
    }
    if (isset($data->employment_status)) {
        $emp_fields[] = 'employment_status = :employment_status';
        $emp_params[':employment_status'] = trim($data->employment_status) !== '' ? trim($data->employment_status) : 'active';
    }

    if (isset($data->joining_date)) {
        $emp_fields[] = 'joining_date = :joining_date';
        $emp_params[':joining_date'] = trim($data->joining_date) !== '' ? trim($data->joining_date) : null;
    }
    if (isset($data->resignation_date)) {
        $emp_fields[] = 'resignation_date = :resignation_date';
        $emp_params[':resignation_date'] = trim($data->resignation_date) !== '' ? trim($data->resignation_date) : null;
    }
    if (isset($data->shift_start)) {
        $emp_fields[] = 'shift_start = :shift_start';
        $emp_params[':shift_start'] = trim($data->shift_start) !== '' ? trim($data->shift_start) : '09:00:00';
    }
    if (isset($data->shift_end)) {
        $emp_fields[] = 'shift_end = :shift_end';
        $emp_params[':shift_end'] = trim($data->shift_end) !== '' ? trim($data->shift_end) : '17:00:00';
    }
    if (isset($data->allocated_break_minutes)) {
        $emp_fields[] = 'allocated_break_minutes = :allocated_break_minutes';
        $emp_params[':allocated_break_minutes'] = intval($data->allocated_break_minutes);
    }

    if (isset($data->has_tiffin_break)) {
        $emp_fields[] = 'has_tiffin_break = :has_tiffin_break';
        $emp_params[':has_tiffin_break'] = intval($data->has_tiffin_break);
    }
    if (isset($data->tiffin_start_time)) {
        $emp_fields[] = 'tiffin_start_time = :tiffin_start_time';
        $emp_params[':tiffin_start_time'] = trim($data->tiffin_start_time) !== '' ? trim($data->tiffin_start_time) : '13:20:00';
    }
    if (isset($data->tiffin_end_time)) {
        $emp_fields[] = 'tiffin_end_time = :tiffin_end_time';
        $emp_params[':tiffin_end_time'] = trim($data->tiffin_end_time) !== '' ? trim($data->tiffin_end_time) : '14:00:00';
    }
    if (isset($data->tiffin_duration_minutes)) {
        $emp_fields[] = 'tiffin_duration_minutes = :tiffin_duration_minutes';
        $emp_params[':tiffin_duration_minutes'] = intval($data->tiffin_duration_minutes);
    }

    if (!empty($emp_fields)) {
        $emp_sql = "UPDATE employees SET " . implode(', ', $emp_fields) . " WHERE user_id = :user_id";
        $emp_stmt = $db->prepare($emp_sql);
        $emp_stmt->execute($emp_params);
    }

    $db->commit();

    echo json_encode(["status" => "success", "message" => "Staff updated successfully."]);

} catch (PDOException $e) {
    $db->rollBack();
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
