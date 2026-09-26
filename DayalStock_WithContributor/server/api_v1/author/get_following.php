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

// Pagination
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
$offset = ($page - 1) * $limit;
$search = isset($_GET['search']) ? trim($_GET['search']) : '';

// Build query
$query_base = "
    FROM author_followers af
    JOIN authors a ON af.author_id = a.id
    JOIN users u ON a.user_id = u.id
    WHERE af.user_id = ?
";
$params = [$user_id];
$types = "i";

if ($search !== '') {
    $query_base .= " AND (u.name LIKE ? OR u.username LIKE ?)";
    $search_param = "%$search%";
    $params[] = $search_param;
    $params[] = $search_param;
    $types .= "ss";
}

// Get total count
$count_query = "SELECT COUNT(af.id) as total " . $query_base;
$stmt = $mysqli->prepare($count_query);
$stmt->bind_param($types, ...$params);
$stmt->execute();
$count_result = $stmt->get_result();
$total_count = $count_result->fetch_assoc()['total'];
$stmt->close();

// Get items
$select_query = "
    SELECT 
        a.id, 
        u.name, 
        u.username, 
        u.photo as photo, 
        a.bio,
        af.created_at as followed_at,
        (SELECT COUNT(id) FROM author_followers WHERE author_id = a.id) as followers_count,
        (SELECT COUNT(id) FROM contents WHERE author_id = a.id AND status = 'published') as content_count
    " . $query_base . "
    ORDER BY af.created_at DESC
    LIMIT ? OFFSET ?
";

$types .= "ii";
$params[] = $limit;
$params[] = $offset;

$stmt = $mysqli->prepare($select_query);
$stmt->bind_param($types, ...$params);
$stmt->execute();
$result = $stmt->get_result();

$authors = [];
while ($row = $result->fetch_assoc()) {
    $authors[] = [
        'id' => (int)$row['id'],
        'name' => $row['name'],
        'username' => $row['username'],
        'photo' => $row['photo'],
        'bio' => $row['bio'],
        'followed_at' => $row['followed_at'],
        'followers_count' => (int)$row['followers_count'],
        'content_count' => (int)$row['content_count']
    ];
}
$stmt->close();

echo json_encode([
    'success' => true,
    'data' => $authors,
    'pagination' => [
        'total' => $total_count,
        'page' => $page,
        'limit' => $limit,
        'total_pages' => ceil($total_count / $limit)
    ]
]);
?>
