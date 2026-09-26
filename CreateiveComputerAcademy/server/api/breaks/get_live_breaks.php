<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once 'BreakDbHelper.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();
BreakDbHelper::ensureSchema($db);

$today = date('Y-m-d');

try {
    // 1. Fetch active breaks
    $actQuery = "SELECT b.id as break_id, b.user_id, b.break_type, b.start_time, b.reason, b.estimated_minutes,
                        u.name, u.profile_picture, e.employee_code, e.allocated_break_minutes 
                 FROM employee_breaks b 
                 JOIN users u ON b.user_id = u.id 
                 LEFT JOIN employees e ON u.id = e.user_id 
                 WHERE b.status = 'Active' AND b.date = :today
                 ORDER BY b.start_time ASC";
    $actStmt = $db->prepare($actQuery);
    $actStmt->execute([':today' => $today]);
    $active_breaks = $actStmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. Fetch pending requests
    $pendQuery = "SELECT b.id as break_id, b.user_id, b.break_type, b.reason, b.estimated_minutes, b.created_at,
                         u.name, u.profile_picture, e.employee_code
                  FROM employee_breaks b 
                  JOIN users u ON b.user_id = u.id 
                  LEFT JOIN employees e ON u.id = e.user_id 
                  WHERE b.status = 'Pending' AND b.date = :today
                  ORDER BY b.created_at ASC";
    $pendStmt = $db->prepare($pendQuery);
    $pendStmt->execute([':today' => $today]);
    $pending_requests = $pendStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success", 
        "data" => [
            "active_breaks" => $active_breaks,
            "pending_requests" => $pending_requests,
            "server_time" => date('Y-m-d H:i:s')
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
