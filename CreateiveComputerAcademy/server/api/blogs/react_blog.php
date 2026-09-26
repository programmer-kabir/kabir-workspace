<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../config/PusherHelper.php';
require_once 'BlogDbHelper.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();
BlogDbHelper::ensureSchema($db);

$data = json_decode(file_get_contents("php://input"));

if (!$data || empty($data->blog_id) || empty($data->user_id)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Blog ID and User ID are required."]);
    exit;
}

$blog_id = (int)$data->blog_id;
$user_id = (int)$data->user_id;
$reaction_type = !empty($data->reaction_type) ? strtolower(trim($data->reaction_type)) : 'like';
$now = date('Y-m-d H:i:s');

try {
    // Check if user already reacted
    $chk = $db->prepare("SELECT reaction_type FROM blog_reactions WHERE blog_id = :blog_id AND user_id = :user_id LIMIT 1");
    $chk->execute([':blog_id' => $blog_id, ':user_id' => $user_id]);
    $existing = $chk->fetch(PDO::FETCH_ASSOC);

    $currentReaction = null;

    if ($existing) {
        if ($existing['reaction_type'] === $reaction_type) {
            // Toggle off (remove reaction)
            $del = $db->prepare("DELETE FROM blog_reactions WHERE blog_id = :blog_id AND user_id = :user_id");
            $del->execute([':blog_id' => $blog_id, ':user_id' => $user_id]);
            $currentReaction = null;
        } else {
            // Update to new reaction
            $upd = $db->prepare("UPDATE blog_reactions SET reaction_type = :reaction_type, created_at = :now WHERE blog_id = :blog_id AND user_id = :user_id");
            $upd->execute([':reaction_type' => $reaction_type, ':now' => $now, ':blog_id' => $blog_id, ':user_id' => $user_id]);
            $currentReaction = $reaction_type;
        }
    } else {
        // Insert new reaction
        $ins = $db->prepare("INSERT INTO blog_reactions (blog_id, user_id, reaction_type, created_at) VALUES (:blog_id, :user_id, :reaction_type, :now)");
        $ins->execute([':blog_id' => $blog_id, ':user_id' => $user_id, ':reaction_type' => $reaction_type, ':now' => $now]);
        $currentReaction = $reaction_type;
    }

    // Get updated reaction summary
    $summaryStmt = $db->prepare("SELECT reaction_type, COUNT(*) as count FROM blog_reactions WHERE blog_id = :blog_id GROUP BY reaction_type");
    $summaryStmt->execute([':blog_id' => $blog_id]);
    $summary = $summaryStmt->fetchAll(PDO::FETCH_KEY_PAIR);

    try {
        PusherHelper::trigger("blog-{$blog_id}", 'reaction-updated', [
            'blog_id' => $blog_id,
            'summary' => $summary
        ]);
    } catch (Exception $pe) {}

    echo json_encode([
        "status" => "success",
        "user_reaction" => $currentReaction,
        "reactions_summary" => $summary
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
