<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../config/PusherHelper.php';
require_once '../notifications/notification_helper.php';
require_once 'ContentStudioHelper.php';

$database = new Database();
$db = $database->getConnection();
ContentStudioHelper::ensureSchema($db);

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || empty($data['project_id']) || empty($data['user_id']) || empty($data['yt_live_url'])) {
    echo json_encode(['status' => 'error', 'message' => 'Project ID, User ID and YouTube Live URL are required.']);
    exit;
}

try {
    $projectId = (int)$data['project_id'];
    $userId = (int)$data['user_id'];
    $ytLiveUrl = trim($data['yt_live_url']);
    $ytTitle = trim($data['yt_title'] ?? '');
    $ytDescription = trim($data['yt_description'] ?? '');
    $ytTags = trim($data['yt_tags'] ?? '');

    $stmt = $db->prepare("SELECT * FROM content_studio_projects WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $projectId]);
    $project = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$project) {
        echo json_encode(['status' => 'error', 'message' => 'Project not found.']);
        exit;
    }

    $title = $project['title'];

    $upd = $db->prepare("
        UPDATE content_studio_projects 
        SET yt_live_url = :url,
            yt_title = :yt_title,
            yt_description = :yt_desc,
            yt_tags = :yt_tags,
            status = 'completed',
            current_stage = 'published',
            published_at = NOW(),
            publisher_id = :pub_id,
            updated_at = NOW()
        WHERE id = :id
    ");
    $upd->execute([
        ':url' => $ytLiveUrl,
        ':yt_title' => $ytTitle ?: $title,
        ':yt_desc' => $ytDescription,
        ':yt_tags' => $ytTags,
        ':pub_id' => $userId,
        ':id' => $projectId
    ]);

    // Award +10 Credits for Publishing
    ContentStudioHelper::awardStageCredit($db, $projectId, 'published', $userId, 10, "YouTube Published: '{$title}'");

    // Notify team
    try {
        $creatorId = $project['created_by'];
        if ($creatorId && $creatorId != $userId) {
            NotificationHelper::sendToUser(
                $db,
                $creatorId,
                $userId,
                "🚀 Video Published to YouTube!",
                "'{$title}' is now LIVE on YouTube: {$ytLiveUrl}",
                "content_live",
                "staff",
                "/content-studio",
                "high",
                ["project_id" => $projectId, "yt_url" => $ytLiveUrl]
            );
        }
    } catch (Throwable $ne) {}

    // Trigger Pusher update
    try {
        $pusher = new PusherHelper();
        $pusher->trigger('content-studio', 'project-published', [
            'project_id' => $projectId,
            'yt_live_url' => $ytLiveUrl
        ]);
    } catch (Throwable $pe) {}

    echo json_encode([
        'status' => 'success',
        'message' => 'Video successfully marked as Published! +10 Credits awarded.',
        'yt_live_url' => $ytLiveUrl
    ]);

} catch (Throwable $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
