<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';

header('Content-Type: application/json; charset=UTF-8');

try {
    $database = new Database();
    $db = $database->getConnection();

    if (!$db) {
        throw new Exception("Database connection failed");
    }

    $stmt = $db->query("
        SELECT u.id, u.name, u.email,
               COALESCE(u.username, CONCAT('user_', u.id)) AS username, 
               u.profile_picture AS avatar,
               CASE 
                   WHEN SUM(ur.role = 'admin') > 0 THEN 'admin'
                   WHEN SUM(ur.role = 'staff') > 0 THEN 'staff'
                   WHEN SUM(ur.role = 'reviewer') > 0 THEN 'staff'
                   ELSE 'staff'
               END AS role
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        WHERE u.status = 'active'
        GROUP BY u.id
        HAVING (SUM(ur.role = 'student') = 0 OR SUM(ur.role IN ('staff', 'reviewer', 'admin')) > 0)
        ORDER BY u.name ASC
    ");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'users' => $users
    ]);

} catch (Throwable $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
