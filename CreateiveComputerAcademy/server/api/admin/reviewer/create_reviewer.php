<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

$existing_user_id = isset($data->existing_user_id) && !empty($data->existing_user_id) ? intval($data->existing_user_id) : null;

$designation       = isset($data->designation) && trim($data->designation) !== '' ? trim($data->designation) : 'Senior QA Reviewer';
$employment_type   = isset($data->employment_type) ? trim($data->employment_type) : 'Full-time';
$employment_status = isset($data->employment_status) && trim($data->employment_status) !== '' ? trim($data->employment_status) : 'Active';
$status            = isset($data->status) && trim($data->status) !== '' ? trim($data->status) : 'active';
$join_date         = isset($data->joining_date) && trim($data->joining_date) !== '' ? trim($data->joining_date) : date('Y-m-d');
$shift_start       = isset($data->shift_start) && trim($data->shift_start) !== '' ? trim($data->shift_start) : '09:00:00';
$shift_end         = isset($data->shift_end) && trim($data->shift_end) !== '' ? trim($data->shift_end) : '17:00:00';

$shift_hours = 8;
if ($shift_start && $shift_end) {
    $start_ts = strtotime($shift_start);
    $end_ts   = strtotime($shift_end);
    if ($end_ts > $start_ts) {
        $shift_hours = round(($end_ts - $start_ts) / 3600);
    }
}

try {
    $db->beginTransaction();

    if ($existing_user_id) {
        // ── Case A: Promote existing Staff / User to Reviewer ────────────────
        $user_check = $db->prepare("SELECT id, name, email FROM users WHERE id = :id LIMIT 1");
        $user_check->execute([':id' => $existing_user_id]);
        if ($user_check->rowCount() === 0) {
            $db->rollBack();
            echo json_encode(["status" => "error", "message" => "Selected user does not exist."]);
            exit;
        }
        $existing_user = $user_check->fetch(PDO::FETCH_ASSOC);

        // Check if already has reviewer role
        $role_check = $db->prepare("SELECT id FROM user_roles WHERE user_id = :user_id AND role = 'reviewer' LIMIT 1");
        $role_check->execute([':user_id' => $existing_user_id]);
        if ($role_check->rowCount() > 0) {
            $db->rollBack();
            echo json_encode(["status" => "error", "message" => "{$existing_user['name']} is already assigned as a Reviewer."]);
            exit;
        }

        $user_id = $existing_user_id;

        // Add 'reviewer' role
        $role_stmt = $db->prepare("INSERT INTO user_roles (user_id, role) VALUES (:user_id, 'reviewer')");
        $role_stmt->execute([':user_id' => $user_id]);

        // Check if reviewer row already exists or insert
        $rev_check = $db->prepare("SELECT id FROM reviewers WHERE user_id = :user_id LIMIT 1");
        $rev_check->execute([':user_id' => $user_id]);

        if ($rev_check->rowCount() > 0) {
            $existing_rev = $rev_check->fetch(PDO::FETCH_ASSOC);
            $rev_stmt = $db->prepare(
                "UPDATE reviewers 
                 SET designation = :designation, shift_start = :shift_start, shift_end = :shift_end, shift_hours = :shift_hours,
                     employment_type = :employment_type, employment_status = :employment_status
                 WHERE id = :id"
            );
            $rev_stmt->execute([
                ':designation'       => $designation,
                ':shift_start'       => $shift_start,
                ':shift_end'         => $shift_end,
                ':shift_hours'       => $shift_hours,
                ':employment_type'   => $employment_type,
                ':employment_status' => $employment_status,
                ':id'                => $existing_rev['id'],
            ]);
            $final_reviewer_code = 'REV-' . $existing_rev['id'];
        } else {
            $reviewer_code = 'REV-' . $user_id;
            $rev_stmt = $db->prepare(
                "INSERT INTO reviewers (user_id, reviewer_code, designation, joining_date, employment_type, employment_status, shift_start, shift_end, shift_hours)
                 VALUES (:user_id, :reviewer_code, :designation, :joining_date, :employment_type, :employment_status, :shift_start, :shift_end, :shift_hours)"
            );
            $rev_stmt->execute([
                ':user_id'           => $user_id,
                ':reviewer_code'     => $reviewer_code,
                ':designation'       => $designation,
                ':joining_date'      => $join_date,
                ':employment_type'   => $employment_type,
                ':employment_status' => $employment_status,
                ':shift_start'       => $shift_start,
                ':shift_end'         => $shift_end,
                ':shift_hours'       => $shift_hours,
            ]);
            $reviewer_id = $db->lastInsertId();
            $final_reviewer_code = 'REV-' . $reviewer_id;
            $upd_rev = $db->prepare("UPDATE reviewers SET reviewer_code = :code WHERE id = :id");
            $upd_rev->execute([':code' => $final_reviewer_code, ':id' => $reviewer_id]);
        }

        $db->commit();

        echo json_encode([
            "status"        => "success",
            "message"       => "{$existing_user['name']} has been successfully assigned as a Reviewer!",
            "user_id"       => $user_id,
            "reviewer_code" => $final_reviewer_code
        ]);
        exit;
    }

    // ── Case B: Create new user and reviewer from scratch ────────────────────
    $required = ['name', 'email', 'password'];
    foreach ($required as $field) {
        if (!isset($data->$field) || trim($data->$field) === '') {
            $db->rollBack();
            echo json_encode(["status" => "error", "message" => "Field '$field' is required."]);
            exit;
        }
    }

    $name     = trim($data->name);
    $email    = trim($data->email);
    $password = $data->password;
    $phone    = isset($data->phone) ? trim($data->phone) : null;

    // Check email
    $check_stmt = $db->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
    $check_stmt->bindParam(':email', $email);
    $check_stmt->execute();
    if ($check_stmt->rowCount() > 0) {
        $db->rollBack();
        echo json_encode(["status" => "error", "message" => "A user with this email already exists. You can assign them via 'Select Existing Staff'."]);
        exit;
    }

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

    $role_stmt = $db->prepare(
        "INSERT INTO user_roles (user_id, role) VALUES (:user_id, 'reviewer')"
    );
    $role_stmt->execute([':user_id' => $user_id]);

    $reviewer_code = 'REV-' . $user_id;
    $rev_stmt = $db->prepare(
        "INSERT INTO reviewers (user_id, reviewer_code, designation, joining_date, employment_type, employment_status, shift_start, shift_end, shift_hours)
         VALUES (:user_id, :reviewer_code, :designation, :joining_date, :employment_type, :employment_status, :shift_start, :shift_end, :shift_hours)"
    );
    $rev_stmt->execute([
        ':user_id'           => $user_id,
        ':reviewer_code'     => $reviewer_code,
        ':designation'       => $designation,
        ':joining_date'      => $join_date,
        ':employment_type'   => $employment_type,
        ':employment_status' => $employment_status,
        ':shift_start'       => $shift_start,
        ':shift_end'         => $shift_end,
        ':shift_hours'       => $shift_hours,
    ]);
    $reviewer_id = $db->lastInsertId();

    $final_reviewer_code = 'REV-' . $reviewer_id;
    $upd_rev = $db->prepare("UPDATE reviewers SET reviewer_code = :code WHERE id = :id");
    $upd_rev->execute([':code' => $final_reviewer_code, ':id' => $reviewer_id]);

    // Mirror in employees
    $emp_stmt = $db->prepare(
        "INSERT INTO employees (user_id, employee_code, designation, employment_type, employment_status, joining_date, shift_start, shift_end, allocated_break_minutes)
         VALUES (:user_id, :code, :designation, :employment_type, :employment_status, :joining_date, :shift_start, :shift_end, 60)"
    );
    $emp_stmt->execute([
        ':user_id'           => $user_id,
        ':code'              => $final_reviewer_code,
        ':designation'       => $designation,
        ':employment_type'   => $employment_type,
        ':employment_status' => $employment_status,
        ':joining_date'      => $join_date,
        ':shift_start'       => $shift_start,
        ':shift_end'         => $shift_end,
    ]);

    $db->commit();

    echo json_encode([
        "status"        => "success",
        "message"       => "Reviewer created successfully.",
        "user_id"       => $user_id,
        "reviewer_code" => $final_reviewer_code
    ]);

} catch (PDOException $e) {
    $db->rollBack();
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
