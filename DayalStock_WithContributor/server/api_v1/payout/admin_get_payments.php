<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../middleware/check_role.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    requireRole('admin');

    $status = $_GET['status'] ?? 'all';
    
    $query = "
        SELECT 
            pm.id, pm.author_id, pm.payment_method, pm.account_email, pm.account_name, 
            pm.status, pm.created_at,
            u.name as author_name, u.username, u.email as user_email
        FROM author_payout_methods pm
        JOIN authors a ON pm.author_id = a.id
        JOIN users u ON a.user_id = u.id
    ";
    
    if ($status !== 'all') {
        $query .= " WHERE pm.status = ?";
        $stmt = $mysqli->prepare($query);
        $stmt->bind_param("s", $status);
    } else {
        $stmt = $mysqli->prepare($query);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
    
    echo json_encode(["success" => true, "data" => $data]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
