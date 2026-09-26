<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    $user_id = $GLOBALS['user']['id'];
    
    $stmt = $mysqli->prepare("SELECT default_payout_method, default_payout_email FROM authors WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $res = $stmt->get_result();
    
    if ($res->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Author profile not found."]);
        exit;
    }
    
    $row = $res->fetch_assoc();
    
    echo json_encode([
        "success" => true,
        "method" => $row['default_payout_method'] ?: 'paypal',
        "email" => $row['default_payout_email'] ?: ''
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
