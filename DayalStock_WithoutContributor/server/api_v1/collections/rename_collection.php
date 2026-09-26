<?php
require_once '../config/cors.php';
require_once '../config/db.php';
require_once '../middleware/auth.php'; 

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

$user_id = (int)($GLOBALS['user']['id'] ?? 0);

if (!$user_id) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$collection_id = isset($input['collection_id']) ? (int)$input['collection_id'] : 0;
$name = isset($input['name']) ? trim($input['name']) : '';

if ($collection_id <= 0 || empty($name)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Collection ID and new name are required"]);
    exit;
}

// Verify ownership
$stmt = $mysqli->prepare("SELECT id FROM user_collections WHERE id = ? AND user_id = ?");
$stmt->bind_param("ii", $collection_id, $user_id);
$stmt->execute();
if ($stmt->get_result()->num_rows === 0) {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Forbidden: You don't own this collection"]);
    exit;
}
$stmt->close();

try {
    $stmt = $mysqli->prepare("UPDATE user_collections SET name = ? WHERE id = ?");
    $stmt->bind_param("si", $name, $collection_id);
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Collection renamed successfully"]);
    } else {
        throw new Exception("Failed to rename collection");
    }
    $stmt->close();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
