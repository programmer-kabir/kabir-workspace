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
$content_id = isset($input['content_id']) ? (int)$input['content_id'] : 0;

if ($collection_id <= 0 || $content_id <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Collection ID and Content ID are required"]);
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
    // Check if it already exists
    $stmt = $mysqli->prepare("SELECT id FROM collection_items WHERE collection_id = ? AND content_id = ?");
    $stmt->bind_param("ii", $collection_id, $content_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $exists = $result->num_rows > 0;
    $stmt->close();

    if ($exists) {
        // Remove it
        $stmt = $mysqli->prepare("DELETE FROM collection_items WHERE collection_id = ? AND content_id = ?");
        $stmt->bind_param("ii", $collection_id, $content_id);
        $stmt->execute();
        $stmt->close();
        
        echo json_encode(["success" => true, "message" => "Removed from collection", "action" => "removed"]);
    } else {
        // Add it
        $stmt = $mysqli->prepare("INSERT INTO collection_items (collection_id, content_id) VALUES (?, ?)");
        $stmt->bind_param("ii", $collection_id, $content_id);
        $stmt->execute();
        $stmt->close();
        
        echo json_encode(["success" => true, "message" => "Added to collection", "action" => "added"]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
