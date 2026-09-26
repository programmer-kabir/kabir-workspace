<?php
require_once '../config/cors.php';

require_once '../config/db.php';
require_once '../middleware/FirebaseJWT.php';

$user_id = 0;
$headers = getallheaders();
if (isset($headers['Authorization'])) {
    $authHeader = trim($headers['Authorization']);
    if (str_starts_with($authHeader, 'Bearer ')) {
        $token = trim(str_replace('Bearer ', '', $authHeader));
        try {
            $payload = FirebaseJWT::verifyIdToken($token);
            $email = $payload['email'] ?? null;
            if ($email) {
                $stmt = $mysqli->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
                $stmt->bind_param("s", $email);
                $stmt->execute();
                $res = $stmt->get_result();
                if ($res->num_rows > 0) {
                    $u = $res->fetch_assoc();
                    $user_id = $u['id'];
                }
                $stmt->close();
            }
        } catch (Exception $e) {
            // Ignore invalid token, just treat as guest
        }
    }
}

$author_id = isset($_GET['author_id']) ? (int)$_GET['author_id'] : 0;

if (!$author_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing author_id']);
    exit();
}

// Check if it's the user's own profile
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
$is_own_profile = ($author_data['user_id'] == $user_id);
$stmt->close();

// Check if following
$is_following = false;
if (!$is_own_profile) {
    $stmt = $mysqli->prepare("SELECT id FROM author_followers WHERE user_id = ? AND author_id = ?");
    $stmt->bind_param("ii", $user_id, $author_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $is_following = $result->num_rows > 0;
    $stmt->close();
}

// Get followers count
$stmt = $mysqli->prepare("SELECT COUNT(id) as count FROM author_followers WHERE author_id = ?");
$stmt->bind_param("i", $author_id);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();
$followers_count = (int)$row['count'];
$stmt->close();

echo json_encode([
    'success' => true,
    'is_following' => $is_following,
    'followers_count' => $followers_count,
    'is_own_profile' => $is_own_profile
]);
?>
