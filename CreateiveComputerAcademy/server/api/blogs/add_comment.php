<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../config/PusherHelper.php';
require_once 'BlogDbHelper.php';

date_default_timezone_set('Asia/Dhaka');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database connection error."]);
    exit;
}

try {
    BlogDbHelper::ensureSchema($db);
} catch (Throwable $t) {}

$data = json_decode(file_get_contents("php://input"));

if (!$data || empty($data->blog_id) || empty($data->user_id) || empty($data->comment)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Blog ID, user ID, and comment text are required."]);
    exit;
}

$blog_id = (int)$data->blog_id;
$user_id = (int)$data->user_id;
$comment = trim($data->comment);
$parent_comment_id = !empty($data->parent_comment_id) ? (int)$data->parent_comment_id : null;
$now = date('Y-m-d H:i:s');

try {
    $stmt = $db->prepare("INSERT INTO blog_comments (blog_id, user_id, parent_comment_id, comment, created_at, updated_at) 
                          VALUES (:blog_id, :user_id, :parent_id, :comment, :now, :now)");
    $stmt->execute([
        ':blog_id' => $blog_id,
        ':user_id' => $user_id,
        ':parent_id' => $parent_comment_id,
        ':comment' => $comment,
        ':now' => $now
    ]);

    $comment_id = $db->lastInsertId();

    // Fetch user details for real-time comment payload
    $uStmt = $db->prepare("SELECT u.name as user_name, 
                                  u.profile_picture as user_avatar, 
                                  COALESCE((SELECT role FROM user_roles WHERE user_id = u.id LIMIT 1), 'staff') as user_role 
                           FROM users u WHERE u.id = :id LIMIT 1");
    $uStmt->execute([':id' => $user_id]);
    $user = $uStmt->fetch(PDO::FETCH_ASSOC);

    $commentData = [
        'id' => (int)$comment_id,
        'blog_id' => $blog_id,
        'user_id' => $user_id,
        'parent_comment_id' => $parent_comment_id,
        'comment' => $comment,
        'created_at' => $now,
        'user_name' => $user['user_name'] ?? 'Staff',
        'user_avatar' => $user['user_avatar'] ?? null,
        'user_role' => $user['user_role'] ?? 'staff'
    ];

    try {
        PusherHelper::trigger("blog-{$blog_id}", 'new-comment', $commentData);
    } catch (Throwable $pe) {}

    echo json_encode([
        "status" => "success",
        "message" => "Comment posted successfully.",
        "data" => $commentData
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Server error: " . $e->getMessage()]);
}
?>
