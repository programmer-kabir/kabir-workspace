<?php

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/check_role.php'; // auth.php ও এর ভেতরে আছে

header("Content-Type: application/json; charset=UTF-8");

// 🔒 শুধু admin দেখতে পারবে
requireRole('admin');

try {

    // Added LEFT JOIN for user_subscriptions and subscription_plans
    // And selected MAX(sp.name) AS plan
    $sql = "
        SELECT
            u.id,
            u.name,
            u.username,
            u.email,
            u.photo,
            COALESCE(u.status, 'active') AS status,
            u.created_at,
            GROUP_CONCAT(DISTINCT ur.role ORDER BY ur.role SEPARATOR ',') AS roles,
            MAX(sp.name) AS plan
        FROM users u
        LEFT JOIN user_roles ur ON ur.user_id = u.id
        LEFT JOIN user_subscriptions us ON us.user_id = u.id AND us.status = 'active'
        LEFT JOIN subscription_plans sp ON sp.id = us.plan_id
        GROUP BY u.id, u.name, u.username, u.email, u.photo, u.status, u.created_at
        ORDER BY u.id ASC
    ";

    $result = $mysqli->query($sql);

    $users = [];

    while ($row = $result->fetch_assoc()) {
        $row['roles'] = $row['roles'] ? explode(',', $row['roles']) : [];
        // If the user has no active plan, we set it to 'Free' by default
        $row['plan'] = $row['plan'] ? $row['plan'] : 'Free'; 
        
        $users[] = $row;
    }

    echo json_encode([
        "success" => true,
        "message" => "Users fetched successfully",
        "data" => $users
    ]);

} catch (Exception $e) {

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
