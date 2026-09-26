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

$user_id           = intval($data->user_id);
$name              = isset($data->name) ? trim($data->name) : null;
$email             = isset($data->email) ? trim($data->email) : null;
$phone             = isset($data->phone) ? trim($data->phone) : null;
$designation       = isset($data->designation) ? trim($data->designation) : null;
$employment_type   = isset($data->employment_type) ? trim($data->employment_type) : null;
$employment_status = isset($data->employment_status) ? trim($data->employment_status) : null;
$status            = isset($data->status) ? trim($data->status) : null;
$new_password      = isset($data->password) && trim($data->password) !== '' ? $data->password : null;
$shift_start       = isset($data->shift_start) && trim($data->shift_start) !== '' ? trim($data->shift_start) : null;
$shift_end         = isset($data->shift_end) && trim($data->shift_end) !== '' ? trim($data->shift_end) : null;

try {
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

    // ── Update reviewers table ───────────────────────────────────────────────
    $rev_fields = [];
    $rev_params = [':user_id' => $user_id];

    if ($designation)       { $rev_fields[] = 'designation = :designation';             $rev_params[':designation']       = $designation; }
    if ($employment_type)   { $rev_fields[] = 'employment_type = :employment_type';     $rev_params[':employment_type']   = $employment_type; }
    if ($employment_status) { $rev_fields[] = 'employment_status = :employment_status'; $rev_params[':employment_status'] = $employment_status; }
    if ($shift_start)       { $rev_fields[] = 'shift_start = :shift_start';             $rev_params[':shift_start']       = $shift_start; }
    if ($shift_end)         { $rev_fields[] = 'shift_end = :shift_end';                 $rev_params[':shift_end']         = $shift_end; }

    if (!empty($rev_fields)) {
        $rev_sql = "UPDATE reviewers SET " . implode(', ', $rev_fields) . " WHERE user_id = :user_id";
        $rev_stmt = $db->prepare($rev_sql);
        $rev_stmt->execute($rev_params);

        // Also sync employees table
        $emp_sql = "UPDATE employees SET " . implode(', ', $rev_fields) . " WHERE user_id = :user_id";
        $emp_stmt = $db->prepare($emp_sql);
        $emp_stmt->execute($rev_params);
    }

    $db->commit();

    echo json_encode([
        "status"  => "success",
        "message" => "Reviewer profile updated successfully."
    ]);

} catch (PDOException $e) {
    $db->rollBack();
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
