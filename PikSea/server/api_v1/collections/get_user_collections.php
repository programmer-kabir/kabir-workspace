<?php
require_once '../config/cors.php';
require_once '../config/db.php';
require_once '../middleware/auth.php'; 

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
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

// Optional param to check if a specific content is in the collections
$content_id = isset($_GET['content_id']) ? (int)$_GET['content_id'] : 0;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (isset($input['content_id'])) {
        $content_id = (int)$input['content_id'];
    }
}

// Fetch all collections for the user with item count
$sql = "
    SELECT 
        uc.id, 
        uc.name, 
        uc.is_public,
        uc.created_at,
        COUNT(ci.id) as item_count
";

if ($content_id > 0) {
    $sql .= ", (SELECT COUNT(*) FROM collection_items WHERE collection_id = uc.id AND content_id = ?) as is_saved ";
}

$sql .= "
    FROM user_collections uc
    LEFT JOIN collection_items ci ON uc.id = ci.collection_id
    WHERE uc.user_id = ?
    GROUP BY uc.id
    ORDER BY uc.created_at DESC
";

try {
    $stmt = $mysqli->prepare($sql);
    
    if ($content_id > 0) {
        $stmt->bind_param("ii", $content_id, $user_id);
    } else {
        $stmt->bind_param("i", $user_id);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $collections = [];
    while ($row = $result->fetch_assoc()) {
        $row['item_count'] = (int)$row['item_count'];
        $row['is_public'] = (bool)$row['is_public'];
        if ($content_id > 0) {
            $row['is_saved'] = $row['is_saved'] > 0;
        }
        $row['cover_images'] = [];
        $collections[] = $row;
    }
    $stmt->close();

    // Now fetch up to 4 images for each collection
    if (count($collections) > 0) {
        $img_stmt = $mysqli->prepare("
            SELECT c.thumbnail_url 
            FROM collection_items ci 
            JOIN contents c ON ci.content_id = c.id 
            WHERE ci.collection_id = ? 
            ORDER BY ci.added_at DESC 
            LIMIT 4
        ");
        foreach ($collections as &$col) {
            $img_stmt->bind_param("i", $col['id']);
            $img_stmt->execute();
            $img_result = $img_stmt->get_result();
            while ($img_row = $img_result->fetch_assoc()) {
                if ($img_row['thumbnail_url']) {
                    $col['cover_images'][] = $img_row['thumbnail_url'];
                }
            }
        }
        $img_stmt->close();
    }
    
    echo json_encode([
        "success" => true,
        "collections" => $collections
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
