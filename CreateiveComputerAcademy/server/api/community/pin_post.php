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
$admin_id = isset($data['admin_id']) ? (int)$data['admin_id'] : (isset($data['user_id']) ? (int)$data['user_id'] : 0);
$is_pinned = isset($data['is_pinned']) ? ((int)$data['is_pinned'] ? 1 : 0) : 1;

if (!$post_id || !$admin_id) {
    echo json_encode(["status" => "error", "message" => "post_id and admin_id are required."]);
    exit;
}

try {
    // 1. Role verification
    $rStmt = $db->prepare("SELECT id FROM user_roles WHERE user_id = :admin_id AND role = 'admin' LIMIT 1");
    $rStmt->execute([':admin_id' => $admin_id]);
    if (!$rStmt->fetch()) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Unauthorized. Only administrators can pin/unpin posts."]);
        exit;
    }

    // 2. Update pin status
    $stmt = $db->prepare("UPDATE community_posts SET is_pinned = :is_pinned WHERE id = :post_id");
    $stmt->execute([':is_pinned' => $is_pinned, ':post_id' => $post_id]);

    // 3. Broadcast to Pusher
    try {
        PusherHelper::trigger('community-channel', 'post-pinned', [
            'post_id' => $post_id,
            'is_pinned' => $is_pinned
        ]);
    } catch (Throwable $pe) {
        error_log("Pusher pin trigger error: " . $pe->getMessage());
    }

    echo json_encode([
        "status" => "success",
        "message" => $is_pinned ? "Post pinned successfully" : "Post unpinned successfully",
        "post_id" => $post_id,
        "is_pinned" => $is_pinned
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Failed to update pin status: " . $e->getMessage()
    ]);
}
