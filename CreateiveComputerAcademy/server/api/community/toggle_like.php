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
$reaction_type = isset($data['reaction_type']) ? trim($data['reaction_type']) : 'like';

if (!$post_id || !$user_id) {
    echo json_encode(["status" => "error", "message" => "post_id and user_id are required."]);
    exit;
}

try {
    // 1. Fetch post and author
    $pStmt = $db->prepare("SELECT id, user_id, content FROM community_posts WHERE id = :post_id AND status = 'active' LIMIT 1");
    $pStmt->execute([':post_id' => $post_id]);
    $post = $pStmt->fetch(PDO::FETCH_ASSOC);

    if (!$post) {
        echo json_encode(["status" => "error", "message" => "Post not found or deleted."]);
        exit;
    }

    $author_id = (int)$post['user_id'];

    // 2. Check if already liked
    $chkStmt = $db->prepare("SELECT id FROM community_likes WHERE post_id = :post_id AND user_id = :user_id LIMIT 1");
    $chkStmt->execute([':post_id' => $post_id, ':user_id' => $user_id]);
    $existingLike = $chkStmt->fetch(PDO::FETCH_ASSOC);

    $liked = false;
    if ($existingLike) {
        // Unlike
        $delStmt = $db->prepare("DELETE FROM community_likes WHERE id = :like_id");
        $delStmt->execute([':like_id' => $existingLike['id']]);
        $liked = false;
    } else {
        // Like
        $insStmt = $db->prepare("INSERT INTO community_likes (post_id, user_id, reaction_type, created_at) VALUES (:post_id, :user_id, :reaction_type, NOW())");
        $insStmt->execute([
            ':post_id' => $post_id,
            ':user_id' => $user_id,
            ':reaction_type' => $reaction_type
        ]);
        $liked = true;
    }

    // 3. Update likes count in community_posts
    $countStmt = $db->prepare("SELECT COUNT(*) FROM community_likes WHERE post_id = :post_id");
    $countStmt->execute([':post_id' => $post_id]);
    $new_count = (int)$countStmt->fetchColumn();

    $upStmt = $db->prepare("UPDATE community_posts SET likes_count = :cnt WHERE id = :post_id");
    $upStmt->execute([':cnt' => $new_count, ':post_id' => $post_id]);

    // 4. Send notification if new like and not self
    if ($liked && $author_id !== $user_id) {
        $uStmt = $db->prepare("SELECT name FROM users WHERE id = :user_id LIMIT 1");
        $uStmt->execute([':user_id' => $user_id]);
        $liker_name = $uStmt->fetchColumn() ?: "A colleague";

        NotificationHelper::sendToUser(
            $db,
            $author_id,
            $user_id,
            'New Like on Community Wall',
            "{$liker_name} liked your post",
            'like',
            'community',
            '/community'
        );
    }

    // 5. Broadcast to Pusher
    try {
        PusherHelper::trigger('community-channel', 'post-liked', [
            'post_id' => $post_id,
            'user_id' => $user_id,
            'liked' => $liked,
            'likes_count' => $new_count
        ]);
    } catch (Throwable $pe) {
        error_log("Pusher trigger error: " . $pe->getMessage());
    }

    echo json_encode([
        "status" => "success",
        "liked" => $liked,
        "likes_count" => $new_count
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Toggle like failed: " . $e->getMessage()
    ]);
}
