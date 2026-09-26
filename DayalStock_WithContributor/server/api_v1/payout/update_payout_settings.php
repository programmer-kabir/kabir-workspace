<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(["success" => false, "message" => "Invalid request method."]);
        exit;
    }

    $user_id = $GLOBALS['user']['id'];
    
    $data = json_decode(file_get_contents("php://input"), true);
    $method = trim($data['method'] ?? '');
    $email = trim($data['email'] ?? '');

    if (empty($method) || empty($email)) {
        echo json_encode(["success" => false, "message" => "Payment method and email are required."]);
        exit;
    }

    if (!in_array($method, ['paypal', 'payoneer', 'bank'])) {
        echo json_encode(["success" => false, "message" => "Invalid payment method."]);
        exit;
    }

    $stmt = $mysqli->prepare("UPDATE authors SET default_payout_method = ?, default_payout_email = ? WHERE user_id = ?");
    $stmt->bind_param("ssi", $method, $email, $user_id);
    $stmt->execute();
    
    if ($stmt->affected_rows >= 0) {
        echo json_encode(["success" => true, "message" => "Payout settings updated successfully!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to update settings."]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
