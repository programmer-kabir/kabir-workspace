<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/PusherHelper.php';
require_once __DIR__ . '/../notifications/notification_helper.php';
require_once __DIR__ . '/CommunityDbHelper.php';

header('Content-Type: application/json; charset=UTF-8');

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"), true);
if (!$data) {
    echo json_encode(["status" => "error", "message" => "Invalid JSON payload"]);
    exit;
}

$user_id = isset($data['user_id']) ? (int)$data['user_id'] : 0;
$content = isset($data['content']) ? trim($data['content']) : '';
$category = isset($data['category']) ? trim($data['category']) : 'General';
$image_url = isset($data['image_url']) ? trim($data['image_url']) : null;

if (!$user_id) {
    echo json_encode(["status" => "error", "message" => "user_id is required."]);
    exit;
}

if (empty($content) && empty($image_url)) {
    echo json_encode(["status" => "error", "message" => "Post content or an image is required."]);
    exit;
}

try {
    CommunityDbHelper::ensureSchema($db);

    // 1. Verify author details
    $userStmt = $db->prepare("
        SELECT u.id, u.name, u.username, u.profile_picture,
               COALESCE(MIN(ur.role), 'staff') AS role,
               COALESCE(MAX(e.designation), 'Academy Member') AS designation,
               COALESCE(MAX(d.name), 'Creative Computer Academy') AS department
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN employees e ON u.id = e.user_id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE u.id = :user_id
        GROUP BY u.id
        LIMIT 1
    ");
    $userStmt->execute([':user_id' => $user_id]);
    $author = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$author) {
        echo json_encode(["status" => "error", "message" => "Author not found."]);
        exit;
    }

    $author_name = $author['name'];
    $author_username = !empty($author['username']) ? $author['username'] : ('user_' . $author['id']);

    // 2. Insert into community_posts
    $now = date('Y-m-d H:i:s');
    $stmt = $db->prepare("
        INSERT INTO community_posts (user_id, content, category, image_url, is_pinned, likes_count, comments_count, status, created_at, updated_at)
        VALUES (:user_id, :content, :category, :image_url, 0, 0, 0, 'active', :created_at, :updated_at)
    ");
    $stmt->execute([
        ':user_id' => $user_id,
        ':content' => $content,
        ':category' => $category,
        ':image_url' => $image_url,
        ':created_at' => $now,
        ':updated_at' => $now
    ]);

    $post_id = (int)$db->lastInsertId();

    // 3. Scan for @mentions
    if (!empty($content) && preg_match_all('/@([a-zA-Z0-9_.]{3,40})/', $content, $matches)) {
        $mentioned_usernames = array_unique($matches[1]);
        if (!empty($mentioned_usernames)) {
            $inClause = implode(',', array_fill(0, count($mentioned_usernames), '?'));
            $mentionStmt = $db->prepare("SELECT id, username FROM users WHERE username IN ($inClause)");
            $mentionStmt->execute(array_values($mentioned_usernames));
            $mentionedUsers = $mentionStmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($mentionedUsers as $mu) {
                $mUserId = (int)$mu['id'];
                if ($mUserId !== $user_id) {
                    NotificationHelper::sendToUser(
                        $db,
                        $mUserId,
                        $user_id,
                        'New Mention in Community Wall',
                        "{$author_name} mentioned you in a post",
                        'mention',
                        'community',
                        '/community'
                    );
                }
            }
        }
    }

    // 4. Construct response post object
    $postObject = [
        "id" => $post_id,
        "content" => $content,
        "category" => $category,
        "image_url" => $image_url,
        "is_pinned" => 0,
        "likes_count" => 0,
        "comments_count" => 0,
        "my_reaction" => null,
        "created_at" => $now,
        "author" => [
            "id" => (int)$author['id'],
            "name" => $author['name'],
            "username" => $author_username,
            "role" => $author['role'],
            "avatar" => $author['profile_picture'],
            "designation" => $author['designation'],
            "department" => $author['department']
        ],
        "latest_comments" => []
    ];

    // 5. Broadcast live via Pusher
    try {
        PusherHelper::trigger('community-channel', 'new-post', $postObject);
    } catch (Throwable $pe) {
        error_log("Pusher trigger failed: " . $pe->getMessage());
    }

    echo json_encode([
        "status" => "success",
        "message" => "Post created successfully",
        "data" => $postObject
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Failed to create post: " . $e->getMessage()
    ]);
}
