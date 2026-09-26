<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once '../../config/database.php';
$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->token) || empty($data->token)) {
    echo json_encode(["status" => "error", "message" => "Token is required."]);
    exit;
}

$token = $data->token;

try {
    $stmt = $db->prepare("DELETE FROM user_tokens WHERE token = :token");
    $stmt->bindParam(':token', $token);
    $stmt->execute();
    echo json_encode(["status" => "success", "message" => "Logged out successfully."]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
