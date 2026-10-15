<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/PusherHelper.php';

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

if (!$post_id || !$user_id) {
    echo json_encode(["status" => "error", "message" => "post_id and user_id are required."]);
    exit;
}

try {
    // 1. Fetch post author
    $pStmt = $db->prepare("SELECT id, user_id FROM community_posts WHERE id = :post_id LIMIT 1");
    $pStmt->execute([':post_id' => $post_id]);
    $post = $pStmt->fetch(PDO::FETCH_ASSOC);

    if (!$post) {
        echo json_encode(["status" => "error", "message" => "Post not found."]);
        exit;
    }

    $is_author = ((int)$post['user_id'] === $user_id);

    // 2. Check if user is admin
    $rStmt = $db->prepare("SELECT id FROM user_roles WHERE user_id = :user_id AND role = 'admin' LIMIT 1");
    $rStmt->execute([':user_id' => $user_id]);
    $is_admin = (bool)$rStmt->fetch();

    if (!$is_author && !$is_admin) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Unauthorized. You can only delete your own posts."]);
        exit;
    }

    // 3. Soft delete post
    $stmt = $db->prepare("UPDATE community_posts SET status = 'deleted', updated_at = NOW() WHERE id = :post_id");
    $stmt->execute([':post_id' => $post_id]);

    // 4. Broadcast to Pusher
    try {
        PusherHelper::trigger('community-channel', 'post-deleted', [
            'post_id' => $post_id
        ]);
    } catch (Throwable $pe) {
        error_log("Pusher delete trigger error: " . $pe->getMessage());
    }

    echo json_encode([
        "status" => "success",
        "message" => "Post deleted successfully",
        "post_id" => $post_id
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Failed to delete post: " . $e->getMessage()
    ]);
}
