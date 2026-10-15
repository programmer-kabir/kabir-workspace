<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/PusherHelper.php';
require_once __DIR__ . '/../notifications/notification_helper.php';

header('Content-Type: application/json; charset=UTF-8');

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"), true);
if (!$data) {
    echo json_encode(["status" => "error", "message" => "Invalid JSON payload"]);
    exit;
}

$post_id = isset($data['post_id']) ? (int)$data['post_id'] : 0;
$user_id = isset($data['user_id']) ? (int)$data['user_id'] : 0;
$comment_text = isset($data['comment']) ? trim($data['comment']) : '';
$parent_id = !empty($data['parent_id']) ? (int)$data['parent_id'] : null;

if (!$post_id || !$user_id || empty($comment_text)) {
    echo json_encode(["status" => "error", "message" => "post_id, user_id, and non-empty comment are required."]);
    exit;
}

try {
    // 1. Fetch post and author
    $pStmt = $db->prepare("SELECT id, user_id, content FROM community_posts WHERE id = :post_id AND status = 'active' LIMIT 1");
    $pStmt->execute([':post_id' => $post_id]);
    $post = $pStmt->fetch(PDO::FETCH_ASSOC);

    if (!$post) {
        echo json_encode(["status" => "error", "message" => "Post not found or inactive."]);
        exit;
    }

    $post_author_id = (int)$post['user_id'];

    // 2. Fetch commenter author details
    $uStmt = $db->prepare("
        SELECT u.id, u.name, u.username, u.profile_picture,
               COALESCE(MIN(ur.role), 'staff') AS role
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        WHERE u.id = :user_id
        GROUP BY u.id
        LIMIT 1
    ");
    $uStmt->execute([':user_id' => $user_id]);
    $commenter = $uStmt->fetch(PDO::FETCH_ASSOC);

    if (!$commenter) {
        echo json_encode(["status" => "error", "message" => "User not found."]);
        exit;
    }

    $commenter_name = $commenter['name'];
    $commenter_username = !empty($commenter['username']) ? $commenter['username'] : ('user_' . $commenter['id']);
    $now = date('Y-m-d H:i:s');

    // 3. Insert comment
    $insStmt = $db->prepare("
        INSERT INTO community_comments (post_id, user_id, parent_id, comment, created_at, updated_at)
        VALUES (:post_id, :user_id, :parent_id, :comment, :created_at, :updated_at)
    ");
    $insStmt->execute([
        ':post_id' => $post_id,
        ':user_id' => $user_id,
        ':parent_id' => $parent_id,
        ':comment' => $comment_text,
        ':created_at' => $now,
        ':updated_at' => $now
    ]);

    $comment_id = (int)$db->lastInsertId();

    // 4. Update comments_count in community_posts
    $cntStmt = $db->prepare("SELECT COUNT(*) FROM community_comments WHERE post_id = :post_id");
    $cntStmt->execute([':post_id' => $post_id]);
    $new_comments_count = (int)$cntStmt->fetchColumn();

    $upPost = $db->prepare("UPDATE community_posts SET comments_count = :cnt WHERE id = :post_id");
    $upPost->execute([':cnt' => $new_comments_count, ':post_id' => $post_id]);

    // 5. Send notification to post author (if not self)
    if ($post_author_id !== $user_id) {
        $preview = mb_substr($comment_text, 0, 60);
        NotificationHelper::sendToUser(
            $db,
            $post_author_id,
            $user_id,
            'New Comment on Community Wall',
            "{$commenter_name} commented: \"{$preview}\"",
            'comment',
            'community',
            '/community'
        );
    }

    // 6. Handle @mentions in comment
    if (preg_match_all('/@([a-zA-Z0-9_.]{3,40})/', $comment_text, $matches)) {
        $mentioned_usernames = array_unique($matches[1]);
        if (!empty($mentioned_usernames)) {
            $inClause = implode(',', array_fill(0, count($mentioned_usernames), '?'));
            $mentionStmt = $db->prepare("SELECT id, username FROM users WHERE username IN ($inClause)");
            $mentionStmt->execute(array_values($mentioned_usernames));
            $mentionedUsers = $mentionStmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($mentionedUsers as $mu) {
                $mUserId = (int)$mu['id'];
                if ($mUserId !== $user_id && $mUserId !== $post_author_id) {
                    NotificationHelper::sendToUser(
                        $db,
                        $mUserId,
                        $user_id,
                        'New Mention in Comment',
                        "{$commenter_name} mentioned you in a comment",
                        'mention',
                        'community',
                        '/community'
                    );
                }
            }
        }
    }

    $commentObject = [
        "id" => $comment_id,
        "post_id" => $post_id,
        "user_id" => $user_id,
        "parent_id" => $parent_id,
        "comment" => $comment_text,
        "created_at" => $now,
        "author" => [
            "id" => $user_id,
            "name" => $commenter['name'],
            "username" => $commenter_username,
            "avatar" => $commenter['profile_picture'],
            "role" => $commenter['role']
        ]
    ];

    // 7. Broadcast to Pusher
    try {
        PusherHelper::trigger('community-channel', 'new-comment', [
            'post_id' => $post_id,
            'comment' => $commentObject,
            'comments_count' => $new_comments_count
        ]);
    } catch (Throwable $pe) {
        error_log("Pusher comment trigger error: " . $pe->getMessage());
    }

    echo json_encode([
        "status" => "success",
        "message" => "Comment added successfully",
        "data" => $commentObject,
        "comments_count" => $new_comments_count
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Failed to add comment: " . $e->getMessage()
    ]);
}
