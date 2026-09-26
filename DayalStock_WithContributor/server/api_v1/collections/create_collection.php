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
$name = isset($input['name']) ? trim($input['name']) : '';
$content_id = isset($input['content_id']) ? (int)$input['content_id'] : 0;
$is_public = isset($input['is_public']) ? (int)$input['is_public'] : 0;

if (empty($name)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Collection name is required"]);
    exit;
}

$mysqli->begin_transaction();

try {
    // Create the collection
    $stmt = $mysqli->prepare("INSERT INTO user_collections (user_id, name, is_public) VALUES (?, ?, ?)");
    $stmt->bind_param("isi", $user_id, $name, $is_public);
    if (!$stmt->execute()) {
        throw new Exception("Failed to create collection");
    }
    $collection_id = $stmt->insert_id;
    $stmt->close();

    // Optionally save a content directly into it
    if ($content_id > 0) {
        $stmt = $mysqli->prepare("INSERT IGNORE INTO collection_items (collection_id, content_id) VALUES (?, ?)");
        $stmt->bind_param("ii", $collection_id, $content_id);
        $stmt->execute();
        $stmt->close();
    }

    $mysqli->commit();
    echo json_encode([
        "success" => true, 
        "message" => "Collection created successfully", 
        "collection" => [
            "id" => $collection_id,
            "name" => $name
        ]
    ]);

} catch (Exception $e) {
    $mysqli->rollback();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
