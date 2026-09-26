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
$is_public = isset($input['is_public']) ? (int)$input['is_public'] : 0;

if ($collection_id <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Collection ID is required"]);
    exit;
}

// Verify ownership
$stmt = $mysqli->prepare("SELECT id FROM user_collections WHERE id = ? AND user_id = ?");
$stmt->bind_param("ii", $collection_id, $user_id);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Forbidden: You don't own this collection"]);
    exit;
}
$stmt->close();

try {
    // Update privacy
    $stmt = $mysqli->prepare("UPDATE user_collections SET is_public = ? WHERE id = ?");
    $stmt->bind_param("ii", $is_public, $collection_id);
    if (!$stmt->execute()) {
        throw new Exception("Failed to update collection privacy");
    }
    $stmt->close();

    echo json_encode([
        "success" => true, 
        "message" => "Collection privacy updated successfully", 
        "is_public" => (bool)$is_public
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
