<?php
require_once '../config/cors.php';

require_once '../config/db.php';
require_once '../middleware/auth.php'; // Includes Firebase JWT validation and sets $GLOBALS['user']

if (!isset($GLOBALS['user']) || !isset($GLOBALS['user']['id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$user_id = $GLOBALS['user']['id'];

// Get posted data
$data = json_decode(file_get_contents("php://input"));
if (!isset($data->author_id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing author_id']);
    exit();
}

$author_id = $data->author_id;

// Validate that author exists and prevent self follow (assuming authors table has user_id)
$stmt = $mysqli->prepare("SELECT user_id FROM authors WHERE id = ?");
$stmt->bind_param("i", $author_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Author not found']);
    exit();
}

$author_data = $result->fetch_assoc();
if ($author_data['user_id'] == $user_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'You cannot follow yourself']);
    exit();
}
$stmt->close();

// Check if already following
$stmt = $mysqli->prepare("SELECT id FROM author_followers WHERE user_id = ? AND author_id = ?");
$stmt->bind_param("ii", $user_id, $author_id);
$stmt->execute();
$result = $stmt->get_result();
$is_following = $result->num_rows > 0;
$stmt->close();

if ($is_following) {
    // Unfollow
    $stmt = $mysqli->prepare("DELETE FROM author_followers WHERE user_id = ? AND author_id = ?");
    $stmt->bind_param("ii", $user_id, $author_id);
    $stmt->execute();
    $stmt->close();
    $is_following = false;
    $message = 'Unfollowed successfully';
} else {
    // Follow
    $stmt = $mysqli->prepare("INSERT INTO author_followers (user_id, author_id) VALUES (?, ?)");
    $stmt->bind_param("ii", $user_id, $author_id);
    $stmt->execute();
    $stmt->close();
    $is_following = true;
    $message = 'Followed successfully';
}

// Get updated follower count
$stmt = $mysqli->prepare("SELECT COUNT(id) as count FROM author_followers WHERE author_id = ?");
$stmt->bind_param("i", $author_id);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();
$followers_count = (int)$row['count'];
$stmt->close();

echo json_encode([
    'success' => true,
    'message' => $message,
    'is_following' => $is_following,
    'followers_count' => $followers_count
]);
?>
