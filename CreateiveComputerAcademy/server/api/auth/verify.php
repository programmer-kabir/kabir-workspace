<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->token) || empty($data->token)) {
    echo json_encode(["status" => "error", "message" => "Token is required."]);
    exit;
}

$token = $data->token;

try {
    // ── Find valid token and join user ───────────────────────────────────────
    $stmt = $db->prepare(
        "SELECT u.id, u.name, u.username, u.email, u.phone, u.status, u.profile_picture, u.cover_picture
         FROM user_tokens ut
         INNER JOIN users u ON ut.user_id = u.id
         WHERE ut.token = :token AND ut.expires_at > NOW()
         LIMIT 1"
    );
    $stmt->bindParam(':token', $token);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        echo json_encode(["status" => "error", "message" => "Invalid or expired token."]);
        exit;
    }

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user['status'] !== 'active') {
        echo json_encode(["status" => "error", "message" => "Account suspended."]);
        exit;
    }

    $user_id = $user['id'];

    // ── Fetch roles ──────────────────────────────────────────────────────────
    $role_stmt = $db->prepare("SELECT role FROM user_roles WHERE user_id = :user_id");
    $role_stmt->bindParam(':user_id', $user_id);
    $role_stmt->execute();
    $roles = [];
    while ($r = $role_stmt->fetch(PDO::FETCH_ASSOC)) {
        $roles[] = $r['role'];
    }

    // Role restriction check
    $required_role = isset($data->role) ? trim($data->role) : null;
    if ($required_role && !in_array($required_role, $roles)) {
        echo json_encode(["status" => "error", "message" => "Access denied. Role mismatch."]);
        exit;
    }

    // ── Fetch employee/reviewer details ───────────────────────────────────────
    if ($required_role === 'reviewer') {
        $rev_stmt = $db->prepare(
            "SELECT r.reviewer_code AS employee_code, r.designation, NULL AS department_name
             FROM reviewers r
             WHERE r.user_id = :user_id LIMIT 1"
        );
        $rev_stmt->bindParam(':user_id', $user_id);
        $rev_stmt->execute();
        $emp = $rev_stmt->rowCount() > 0
            ? $rev_stmt->fetch(PDO::FETCH_ASSOC)
            : ['employee_code' => null, 'designation' => null, 'department_name' => null];
    } else {
        $emp_stmt = $db->prepare(
            "SELECT e.employee_code, e.designation, d.name AS department_name, e.shift_start, e.shift_end, e.joining_date, e.has_tiffin_break, e.allocated_break_minutes
             FROM employees e
             LEFT JOIN departments d ON e.department_id = d.id
             WHERE e.user_id = :user_id LIMIT 1"
        );
        $emp_stmt->bindParam(':user_id', $user_id);
        $emp_stmt->execute();
        $emp = $emp_stmt->rowCount() > 0
            ? $emp_stmt->fetch(PDO::FETCH_ASSOC)
            : ['employee_code' => null, 'designation' => null, 'department_name' => null];
    }

    $user['roles']           = $roles;
    $user['employee_code']   = $emp['employee_code'] ?? null;
    $user['designation']     = $emp['designation'] ?? null;
    $user['department_name'] = $emp['department_name'] ?? null;
    $user['shift_start']     = $emp['shift_start'] ?? null;
    $user['shift_end']       = $emp['shift_end'] ?? null;
    $user['joining_date']    = $emp['joining_date'] ?? null;

    $hasTiffin = isset($emp['has_tiffin_break']) ? (int)$emp['has_tiffin_break'] : 1;
    $allocBreak = isset($emp['allocated_break_minutes']) && $emp['allocated_break_minutes'] !== null ? (int)$emp['allocated_break_minutes'] : 0;
    $user['has_tiffin_break']        = $hasTiffin;
    $user['allocated_break_minutes'] = $allocBreak;
    $user['is_manual_break']         = ($hasTiffin === 0 || ($allocBreak > 0 && $hasTiffin === 0));

    echo json_encode(["status" => "success", "user" => $user]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
