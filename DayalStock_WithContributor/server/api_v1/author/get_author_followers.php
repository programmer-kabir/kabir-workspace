<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods, Authorization, X-Requested-With');

require_once '../config/db.php';
// Auth is optional for viewing followers
// require_once '../middleware/auth.php';

$author_id = isset($_GET['author_id']) ? (int)$_GET['author_id'] : 0;

if (!$author_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing author_id']);
    exit();
}

try {
    // Get followers list
    $sql = "
        SELECT 
            u.id as user_id, 
            u.name, 
            u.photo, 
            af.created_at as followed_at
        FROM author_followers af
        JOIN users u ON af.user_id = u.id
        WHERE af.author_id = ?
        ORDER BY af.created_at DESC
    ";
    
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param("i", $author_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $followers = [];
    while ($row = $result->fetch_assoc()) {
        $followers[] = $row;
    }
    
    $stmt->close();
    
    echo json_encode([
        'success' => true,
        'followers_count' => count($followers),
        'followers' => $followers
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
