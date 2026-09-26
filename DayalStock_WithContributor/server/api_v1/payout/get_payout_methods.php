<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    $user_id = $GLOBALS['user']['id'];
    
    // Get author id first
    $stmt = $mysqli->prepare("SELECT id FROM authors WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $res = $stmt->get_result();
    
    if ($res->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Author profile not found."]);
        exit;
    }
    
    $author = $res->fetch_assoc();
    $author_id = (int) $author['id'];
    
    // Get payout methods
    $stmt = $mysqli->prepare("SELECT id, payment_method, account_email, account_name, status, created_at, updated_at FROM author_payout_methods WHERE author_id = ? ORDER BY created_at DESC");
    $stmt->bind_param("i", $author_id);
    $stmt->execute();
    $methods_res = $stmt->get_result();
    
    $methods = [];
    while ($row = $methods_res->fetch_assoc()) {
        $methods[] = $row;
    }
    
    echo json_encode([
        "success" => true,
        "methods" => $methods
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
