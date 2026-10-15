<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once __DIR__ . '/developer_guard.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"), true);
$token = $data['token'] ?? ($_SERVER['HTTP_AUTHORIZATION'] ?? '');
if (strpos($token, 'Bearer ') === 0) {
    $token = substr($token, 7);
}

$devUser = verifyDeveloperAccess($db, $token);
if (!$devUser) {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Forbidden: Developer or Admin access required."]);
    exit;
}

$targetUserId = isset($data['target_user_id']) ? (int)$data['target_user_id'] : 0;
if (!$targetUserId) {
    echo json_encode(["status" => "error", "message" => "Target user ID is required."]);
    exit;
}

try {
    // 1. Fetch target user
    $uStmt = $db->prepare("SELECT id, name, username, email, phone, status, profile_picture, cover_picture FROM users WHERE id = :id LIMIT 1");
    $uStmt->execute([':id' => $targetUserId]);
    $targetUser = $uStmt->fetch(PDO::FETCH_ASSOC);

    if (!$targetUser) {
        echo json_encode(["status" => "error", "message" => "Target user not found."]);
        exit;
    }

    // 2. Fetch target user roles
    $rStmt = $db->prepare("SELECT role FROM user_roles WHERE user_id = :id");
    $rStmt->execute([':id' => $targetUserId]);
    $roles = $rStmt->fetchAll(PDO::FETCH_COLUMN);
    $targetUser['roles'] = $roles;

    // 3. Fetch employee details
    $eStmt = $db->prepare("SELECT e.employee_code, e.designation, d.name AS department_name, e.shift_start, e.shift_end, e.joining_date, e.has_tiffin_break, e.allocated_break_minutes
                           FROM employees e
                           LEFT JOIN departments d ON e.department_id = d.id
                           WHERE e.user_id = :id LIMIT 1");
    $eStmt->execute([':id' => $targetUserId]);
    $emp = $eStmt->fetch(PDO::FETCH_ASSOC);

    $targetUser['employee_code']   = $emp['employee_code'] ?? null;
    $targetUser['designation']     = $emp['designation'] ?? null;
    $targetUser['department_name'] = $emp['department_name'] ?? null;
    $targetUser['shift_start']     = $emp['shift_start'] ?? null;
    $targetUser['shift_end']       = $emp['shift_end'] ?? null;
    $targetUser['joining_date']    = $emp['joining_date'] ?? null;

    $hasTiffin = isset($emp['has_tiffin_break']) ? (int)$emp['has_tiffin_break'] : 1;
    $allocBreak = isset($emp['allocated_break_minutes']) && $emp['allocated_break_minutes'] !== null ? (int)$emp['allocated_break_minutes'] : 0;
    $targetUser['has_tiffin_break']        = $hasTiffin;
    $targetUser['allocated_break_minutes'] = $allocBreak;
    $targetUser['is_manual_break']         = ($hasTiffin === 0 || ($allocBreak > 0 && $hasTiffin === 0));

    // 4. Generate new short-lived session token (valid 2 hours)
    $newToken = bin2hex(random_bytes(32));
    $tStmt = $db->prepare("INSERT INTO user_tokens (user_id, token, expires_at, created_at) VALUES (:uid, :token, DATE_ADD(NOW(), INTERVAL 2 HOUR), NOW())");
    $tStmt->execute([
        ':uid'   => $targetUserId,
        ':token' => $newToken
    ]);

    // 5. Ensure audit log table exists and record the impersonation
    try {
        $db->exec("CREATE TABLE IF NOT EXISTS dev_impersonation_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            developer_user_id INT NOT NULL,
            impersonated_user_id INT NOT NULL,
            started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            ip_address VARCHAR(45) NULL
        )");
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $logStmt = $db->prepare("INSERT INTO dev_impersonation_logs (developer_user_id, impersonated_user_id, ip_address) VALUES (:dev_id, :target_id, :ip)");
        $logStmt->execute([
            ':dev_id'    => $devUser['id'],
            ':target_id' => $targetUserId,
            ':ip'        => $ip
        ]);
    } catch (Exception $logEx) {
        // Continue even if logging table fails
    }

    echo json_encode([
        "status"  => "success",
        "message" => "Successfully generated impersonation session for " . $targetUser['name'],
        "token"   => $newToken,
        "user"    => $targetUser
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
