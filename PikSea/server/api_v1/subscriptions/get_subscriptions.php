<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    // Query to fetch active subscription plans, ordered by price
    $sql = "
        SELECT * 
        FROM subscription_plans 
        WHERE is_active = 1 
        ORDER BY price ASC
    ";
    
    $result = $mysqli->query($sql);

    $plans = [];
    while ($row = $result->fetch_assoc()) {
        $plans[] = $row;
    }

    echo json_encode(["success" => true, "data" => $plans]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
