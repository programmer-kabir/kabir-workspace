<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';

header('Content-Type: application/json');

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo json_encode(["status" => "error", "message" => "Database connection failed."]);
    exit();
}

$currentUserId = isset($_GET['exclude_user_id']) ? intval($_GET['exclude_user_id']) : 0;
$search = isset($_GET['q']) ? trim($_GET['q']) : '';

try {
    $query = "
        SELECT 
            u.id,
            u.name,
            u.email,
            u.profile_picture,
            e.designation,
            d.name as department_name,
            COALESCE(uc.balance, 0) as balance
        FROM users u
        LEFT JOIN employees e ON u.id = e.user_id
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN user_credits uc ON u.id = uc.user_id
        WHERE u.status = 'active'
    ";

    $params = [];

    if ($currentUserId > 0) {
        $query .= " AND u.id != :exclude_id";
        $params[':exclude_id'] = $currentUserId;
    }

    if (!empty($search)) {
        $query .= " AND (u.name LIKE :search OR u.email LIKE :search OR e.designation LIKE :search)";
        $params[':search'] = "%{$search}%";
    }

    $query .= " ORDER BY u.name ASC LIMIT 50";

    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "users" => $users
    ]);
} catch (Throwable $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Failed to fetch users: " . $e->getMessage()
    ]);
}
?>
