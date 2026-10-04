<?php
// server/api/admin/payroll/get_eligible_users.php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';

$database = new Database();
$pdo = $database->getConnection();

if (!$pdo) {
    echo json_encode(["status" => "error", "message" => "Database connection failed."]);
    exit();
}

try {
    // Search / list all active users across all roles (students, staff, reviewers, instructors)
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $roleFilter = isset($_GET['role']) ? trim($_GET['role']) : '';

    $sql = "
        SELECT 
            u.id AS user_id,
            u.name,
            u.email,
            u.profile_picture,
            GROUP_CONCAT(DISTINCT ur.role SEPARATOR ', ') AS roles,
            e.designation,
            d.name AS department_name,
            s.student_code,
            s.student_type,
            ps.id AS active_scheme_id,
            ps.scheme_type,
            ps.contract_amount,
            ps.salary_amount,
            ps.hourly_rate,
            ps.status AS scheme_status
        FROM users u
        INNER JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN employees e ON u.id = e.user_id
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN students s ON u.id = s.user_id
        LEFT JOIN staff_pay_schemes ps ON ps.id = (
            SELECT id FROM staff_pay_schemes WHERE user_id = u.id AND status = 'active' ORDER BY id DESC LIMIT 1
        )
        WHERE u.status = 'active'
          AND (ur.role = 'staff' OR e.id IS NOT NULL)
    ";

    $params = [];
    if (!empty($search)) {
        $sql .= " AND (u.name LIKE :search OR u.email LIKE :search)";
        $params[':search'] = "%{$search}%";
    }

    if (!empty($roleFilter) && $roleFilter !== 'ALL') {
        $sql .= " AND ur.role = :role";
        $params[':role'] = $roleFilter;
    }

    $sql .= " GROUP BY u.id ORDER BY u.name ASC LIMIT 200";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'data' => $users
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
