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

try {
    // Fetch users with their employee details
    $query = "SELECT 
                u.id, 
                u.name, 
                u.username, 
                u.email, 
                u.phone, 
                u.status, 
                u.profile_picture,
                e.employee_code,
                e.designation,
                d.name AS department_name
              FROM users u
              LEFT JOIN employees e ON u.id = e.user_id
              LEFT JOIN departments d ON e.department_id = d.id
              ORDER BY u.id ASC";

    $stmt = $db->query($query);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Fetch all roles grouped by user_id
    $roleQuery = "SELECT user_id, role FROM user_roles";
    $roleStmt = $db->query($roleQuery);
    $userRoles = [];
    while ($r = $roleStmt->fetch(PDO::FETCH_ASSOC)) {
        $userRoles[$r['user_id']][] = $r['role'];
    }

    foreach ($users as &$user) {
        $user['roles'] = $userRoles[$user['id']] ?? [];
        if (!$user['employee_code'] && in_array('student', $user['roles'])) {
            $user['employee_code'] = 'STU-' . str_pad($user['id'], 4, '0', STR_PAD_LEFT);
        }
    }

    echo json_encode([
        "status" => "success",
        "total" => count($users),
        "users" => $users
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
