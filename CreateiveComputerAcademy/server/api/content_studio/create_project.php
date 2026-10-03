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

if (!$data || empty($data['title']) || empty($data['created_by'])) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Project title and creator are required.'
    ]);
    exit;
}

try {
    $title = trim($data['title']);
    $contentType = $data['content_type'] ?? 'youtube_long';
    $createdBy = (int)$data['created_by'];
    
    $scriptwriterId = !empty($data['scriptwriter_id']) ? (int)$data['scriptwriter_id'] : $createdBy;
    $voiceArtistId = !empty($data['voice_artist_id']) ? (int)$data['voice_artist_id'] : null;
    $footageCollectorId = !empty($data['footage_collector_id']) ? (int)$data['footage_collector_id'] : null;
    $videoEditorId = !empty($data['video_editor_id']) ? (int)$data['video_editor_id'] : null;
    $thumbnailDesignerId = !empty($data['thumbnail_designer_id']) ? (int)$data['thumbnail_designer_id'] : null;
    $publisherId = !empty($data['publisher_id']) ? (int)$data['publisher_id'] : $createdBy;
    $reviewerId = !empty($data['reviewer_id']) ? (int)$data['reviewer_id'] : null;
    
    $scriptText = $data['script_text'] ?? null;
    $assetsDriveUrl = $data['assets_drive_url'] ?? null;
    $scheduledAt = !empty($data['scheduled_at']) ? $data['scheduled_at'] : null;

    $stmt = $db->prepare("
        INSERT INTO content_studio_projects (
            title, content_type, current_stage, created_by,
            scriptwriter_id, voice_artist_id, footage_collector_id, video_editor_id, thumbnail_designer_id, publisher_id, reviewer_id,
            script_text, assets_drive_url, scheduled_at, status, created_at
        ) VALUES (
            :title, :content_type, 'scripting', :created_by,
            :scriptwriter_id, :voice_artist_id, :footage_collector_id, :video_editor_id, :thumbnail_designer_id, :publisher_id, :reviewer_id,
            :script_text, :assets_drive_url, :scheduled_at, 'active', NOW()
        )
    ");

    $stmt->execute([
        ':title' => $title,
        ':content_type' => $contentType,
        ':created_by' => $createdBy,
        ':scriptwriter_id' => $scriptwriterId,
        ':voice_artist_id' => $voiceArtistId,
        ':footage_collector_id' => $footageCollectorId,
        ':video_editor_id' => $videoEditorId,
        ':thumbnail_designer_id' => $thumbnailDesignerId,
        ':publisher_id' => $publisherId,
        ':reviewer_id' => $reviewerId,
        ':script_text' => $scriptText,
        ':assets_drive_url' => $assetsDriveUrl,
        ':scheduled_at' => $scheduledAt
    ]);

    $projectId = $db->lastInsertId();

    // Send notification to scriptwriter if different from creator
    if ($scriptwriterId && $scriptwriterId != $createdBy) {
        NotificationHelper::sendToUser(
            $db,
            $scriptwriterId,
            $createdBy,
            "🎬 New Video Script Assigned!",
            "You have been assigned to write the script for '{$title}'.",
            "content_assigned",
            "staff",
            "/content-studio",
            "high",
            ["project_id" => $projectId]
        );
    }

    // Trigger Pusher update
    try {
        $pusher = new PusherHelper();
        $pusher->trigger('content-studio', 'project-created', [
            'project_id' => $projectId,
            'title' => $title,
            'created_by' => $createdBy
        ]);
    } catch (Throwable $pe) {}

    echo json_encode([
        'status' => 'success',
        'message' => 'Content project created successfully!',
        'project_id' => (int)$projectId
    ]);

} catch (Throwable $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
