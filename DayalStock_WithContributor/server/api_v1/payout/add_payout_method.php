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
    
    // Get author id
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
    
    $data = json_decode(file_get_contents("php://input"), true);
    $method = trim($data['payment_method'] ?? '');
    $email = trim($data['account_email'] ?? '');
    $name = trim($data['account_name'] ?? '');

    if (empty($method) || empty($email) || empty($name)) {
        echo json_encode(["success" => false, "message" => "All payment method details are required."]);
        exit;
    }

    if (!in_array($method, ['paypal', 'payoneer', 'skrill'])) {
        echo json_encode(["success" => false, "message" => "Invalid payment method."]);
        exit;
    }

    $stmt = $mysqli->prepare("INSERT INTO author_payout_methods (author_id, payment_method, account_email, account_name, status) VALUES (?, ?, ?, ?, 'pending')");
    $stmt->bind_param("isss", $author_id, $method, $email, $name);
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Payout method added successfully and is pending verification."]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to add method."]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
