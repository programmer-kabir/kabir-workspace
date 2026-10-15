<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

function ensureUsernameColumn($db) {
    static $done = false;
    if ($done || !$db) return;
    try {
        $colCheck = $db->query("SHOW COLUMNS FROM users LIKE 'username'")->fetch();
        if (!$colCheck) {
            $db->exec("ALTER TABLE users ADD COLUMN `username` VARCHAR(100) NULL UNIQUE AFTER `name`");
        }
        // Auto-seed usernames from email prefix if empty
        $emptyUsers = $db->query("SELECT id, email FROM users WHERE username IS NULL OR username = ''")->fetchAll(PDO::FETCH_ASSOC);
        if (!empty($emptyUsers)) {
            foreach ($emptyUsers as $u) {
                $base = !empty($u['email']) ? strtolower(explode('@', $u['email'])[0]) : 'user_' . $u['id'];
                $base = preg_replace('/[^a-z0-9_.]/', '', $base);
                if (empty($base)) $base = 'user_' . $u['id'];

                $chk = $db->prepare("SELECT id FROM users WHERE username = :uname AND id != :uid");
                $chk->execute([':uname' => $base, ':uid' => $u['id']]);
                if ($chk->rowCount() > 0) {
                    $uname = $base . '_' . $u['id'];
                } else {
                    $uname = $base;
                }
                $upd = $db->prepare("UPDATE users SET username = :uname WHERE id = :uid");
                $upd->execute([':uname' => $uname, ':uid' => $u['id']]);
            }
        }
        $done = true;
    } catch (Exception $ex) {
        // Table or column already set
    }
}

$rawIdentifier = trim($data->email ?? $data->identifier ?? '');
$password      = $data->password ?? '';

if (empty($rawIdentifier) || empty($password)) {
    echo json_encode(["status" => "error", "message" => "Email, username, or phone and password are required."]);
    exit;
}

try {
    ensureUsernameColumn($db);

    // Clean phone number (strip spaces, symbols, international code)
    $cleanDigits = preg_replace('/[^0-9]/', '', $rawIdentifier);
    $localPhone  = preg_replace('/^88/', '', $cleanDigits);

    // ── 1. Find user by Email, Username, or Phone ────────────────────────────
    $stmt = $db->prepare(
        "SELECT id, name, username, email, password, phone, status, profile_picture, cover_picture
         FROM users 
         WHERE email = :raw
            OR username = :raw
            OR SUBSTRING_INDEX(email, '@', 1) = :raw
            OR phone = :raw
            OR (phone IS NOT NULL AND :localPhone != '' AND REPLACE(REPLACE(phone, '+88', ''), ' ', '') = :localPhone)
         LIMIT 1"
    );
    $stmt->execute([
        ':raw' => $rawIdentifier,
        ':localPhone' => $localPhone
    ]);

    if ($stmt->rowCount() === 0) {
        echo json_encode(["status" => "error", "message" => "Invalid credentials (email, username, or phone not found)."]);
        exit;
    }

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // ── 2. Verify password ───────────────────────────────────────────────────
    if (!password_verify($password, $user['password'])) {
        echo json_encode(["status" => "error", "message" => "Incorrect password. Please try again."]);
        exit;
    }

    // ── 3. Check account status ──────────────────────────────────────────────
    if ($user['status'] !== 'active') {
        echo json_encode(["status" => "error", "message" => "Your account has been suspended. Contact the administrator."]);
        exit;
    }

    $user_id = $user['id'];

    // ── 4. Fetch roles ───────────────────────────────────────────────────────
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
        echo json_encode(["status" => "error", "message" => "Access denied. You do not have the required role for this portal."]);
        exit;
    }

    // ── 5. Fetch employee/reviewer/student details ───────────────────────────
    $student_info = null;
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
    } else if ($required_role === 'student') {
        $hasEnrollmentsTable = $db->query("SHOW TABLES LIKE 'student_enrollments'")->rowCount() > 0;
        if ($hasEnrollmentsTable) {
            $stu_stmt = $db->prepare(
                "SELECT 
                    s.student_code, s.guardian_phone, s.status AS student_status,
                    se.course_id, se.enrollment_date, se.completion_date,
                    COALESCE(c.title, 'General Course') AS course_name,
                    c.course_code, c.category AS course_category
                 FROM students s
                 LEFT JOIN student_enrollments se ON s.user_id = se.user_id AND se.status = 'active'
                 LEFT JOIN courses c ON se.course_id = c.id
                 WHERE s.user_id = :user_id 
                 ORDER BY se.id DESC LIMIT 1"
            );
        } else {
            $stu_stmt = $db->prepare(
                "SELECT 
                    s.student_code, NULL AS course_id,
                    s.guardian_phone, s.enrollment_date, s.completion_date, s.status AS student_status,
                    'General Course' AS course_name,
                    'GEN' AS course_code, 'General' AS course_category
                 FROM students s
                 WHERE s.user_id = :user_id LIMIT 1"
            );
        }
        $stu_stmt->bindParam(':user_id', $user_id);
        $stu_stmt->execute();
        $student_info = $stu_stmt->rowCount() > 0
            ? $stu_stmt->fetch(PDO::FETCH_ASSOC)
            : null;

        $emp = ['employee_code' => null, 'designation' => 'Student', 'department_name' => $student_info['course_name'] ?? 'General'];
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

    // ── 6. Generate token and save ───────────────────────────────────────────
    $token = bin2hex(random_bytes(32));
    $tok_stmt = $db->prepare(
        "INSERT INTO user_tokens (user_id, token) VALUES (:user_id, :token)"
    );
    $tok_stmt->execute([':user_id' => $user_id, ':token' => $token]);

    // ── 7. Build response ────────────────────────────────────────────────────
    unset($user['password']);
    $user['roles']           = $roles;
    $user['employee_code']   = $emp['employee_code'] ?? ($student_info['student_code'] ?? null);
    $user['designation']     = $emp['designation'] ?? null;
    $user['department_name'] = $emp['department_name'] ?? null;
    $user['shift_start']     = $emp['shift_start'] ?? null;
    $user['shift_end']       = $emp['shift_end'] ?? null;
    $user['joining_date']    = $emp['joining_date'] ?? null;
    $user['student_info']    = $student_info;
    
    $hasTiffin = isset($emp['has_tiffin_break']) ? (int)$emp['has_tiffin_break'] : 1;
    $allocBreak = isset($emp['allocated_break_minutes']) && $emp['allocated_break_minutes'] !== null ? (int)$emp['allocated_break_minutes'] : 0;
    $user['has_tiffin_break']        = $hasTiffin;
    $user['allocated_break_minutes'] = $allocBreak;
    $user['is_manual_break']         = ($hasTiffin === 0 || ($allocBreak > 0 && $hasTiffin === 0));

    echo json_encode(["status" => "success", "token" => $token, "user" => $user]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
