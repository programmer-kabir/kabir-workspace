<?php
require_once '../config/cors.php';
require_once '../config/db.php';
require_once '../middleware/auth.php'; 

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

// Auth is optional here because public collections can be viewed by anyone
$user_id = (int)($GLOBALS['user']['id'] ?? 0);

$collection_id = isset($_GET['collection_id']) ? (int)$_GET['collection_id'] : 0;

if ($collection_id <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Collection ID is required"]);
    exit;
}

// Verify ownership and get collection details
$stmt = $mysqli->prepare("SELECT name, user_id, is_public FROM user_collections WHERE id = ?");
$stmt->bind_param("i", $collection_id);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) {
    http_response_code(404);
    echo json_encode(["success" => false, "message" => "Collection not found"]);
    exit;
}

$collection = $res->fetch_assoc();
$collection_name = $collection['name'];
$is_public = (bool)$collection['is_public'];
$owner_id = (int)$collection['user_id'];
$is_owner = ($user_id === $owner_id);

$stmt->close();

if (!$is_public && !$is_owner) {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Forbidden: This collection is private"]);
    exit;
}

try {
    $sql = "
        SELECT 
            c.id, c.title, c.slug, c.preview_image, c.thumbnail_url, c.content_type, c.is_premium,
            'PikSea Studio' as author_name, '' as author_avatar,
            cat.slug as category_slug
        FROM collection_items ci
        JOIN contents c ON ci.content_id = c.id
        LEFT JOIN categories cat ON c.main_category_id = cat.id
        WHERE ci.collection_id = ?
        ORDER BY ci.added_at DESC
    ";
    
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param("i", $collection_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $contents = [];
    while ($row = $result->fetch_assoc()) {
        $row['is_premium'] = (bool)$row['is_premium'];
        $contents[] = $row;
    }
    
    echo json_encode([
        "success" => true,
        "collection_name" => $collection_name,
        "is_public" => $is_public,
        "is_owner" => $is_owner,
        "contents" => $contents
    ]);
    
    $stmt->close();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
