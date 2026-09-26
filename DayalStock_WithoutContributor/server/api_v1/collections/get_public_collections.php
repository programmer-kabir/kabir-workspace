<?php
require_once '../config/cors.php';
require_once '../config/db.php';

header("Content-Type: application/json; charset=UTF-8");

$username = isset($_GET['username']) ? trim($_GET['username']) : '';

if (!$username) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Username is required"]);
    exit;
}

try {
    // Get user id from username
    $stmt = $mysqli->prepare("SELECT id FROM users WHERE username = ? LIMIT 1");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode(["success" => true, "collections" => []]);
        exit;
    }
    
    $user = $result->fetch_assoc();
    $user_id = $user['id'];
    $stmt->close();

    // Fetch public collections for this user
    $sql = "
        SELECT 
            uc.id, 
            uc.name, 
            uc.is_public,
            uc.created_at,
            COUNT(ci.id) as item_count
        FROM user_collections uc
        LEFT JOIN collection_items ci ON uc.id = ci.collection_id
        WHERE uc.user_id = ? AND uc.is_public = 1
        GROUP BY uc.id
        ORDER BY uc.created_at DESC
    ";

    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $collections = [];
    while ($row = $result->fetch_assoc()) {
        $row['item_count'] = (int)$row['item_count'];
        $row['is_public'] = (bool)$row['is_public'];
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
