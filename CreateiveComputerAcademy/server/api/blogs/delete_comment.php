<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
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

if (!$data || empty($data->comment_id) || empty($data->user_id)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Comment ID and User ID are required."]);
    exit;
}

$comment_id = (int)$data->comment_id;
$user_id = (int)$data->user_id;

try {
    // Check if comment belongs to user OR if user is admin
    $uStmt = $db->prepare("SELECT role FROM user_roles WHERE user_id = :id");
    $uStmt->execute([':id' => $user_id]);
    $roles = $uStmt->fetchAll(PDO::FETCH_COLUMN) ?: [];
    $isAdmin = in_array('admin', $roles);

    $cStmt = $db->prepare("SELECT user_id, blog_id FROM blog_comments WHERE id = :id LIMIT 1");
    $cStmt->execute([':id' => $comment_id]);
    $comment = $cStmt->fetch(PDO::FETCH_ASSOC);

    if (!$comment) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Comment not found."]);
        exit;
    }

    if ($comment['user_id'] != $user_id && !$isAdmin) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "You are not authorized to delete this comment."]);
        exit;
    }

    $delStmt = $db->prepare("DELETE FROM blog_comments WHERE id = :id OR parent_comment_id = :id");
    $delStmt->execute([':id' => $comment_id]);

    echo json_encode([
        "status" => "success",
        "message" => "Comment deleted."
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Server error: " . $e->getMessage()]);
}
?>
