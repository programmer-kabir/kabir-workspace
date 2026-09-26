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
    $method_id = (int) ($data['id'] ?? 0);

    if ($method_id <= 0) {
        echo json_encode(["success" => false, "message" => "Invalid method ID."]);
        exit;
    }

    $stmt = $mysqli->prepare("DELETE FROM author_payout_methods WHERE id = ? AND author_id = ?");
    $stmt->bind_param("ii", $method_id, $author_id);
    $stmt->execute();
    
    if ($stmt->affected_rows > 0) {
        echo json_encode(["success" => true, "message" => "Payout method deleted successfully."]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to delete method or it doesn't belong to you."]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
