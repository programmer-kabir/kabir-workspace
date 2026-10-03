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

if (!$data || empty($data['project_id']) || empty($data['reviewer_id']) || empty($data['decision'])) {
    echo json_encode(['status' => 'error', 'message' => 'Project ID, Reviewer ID and Decision are required.']);
    exit;
}

try {
    $projectId = (int)$data['project_id'];
    $reviewerId = (int)$data['reviewer_id'];
    $decision = $data['decision']; // 'approve' or 'revise'
    $notes = trim($data['notes'] ?? '');

    $stmt = $db->prepare("SELECT * FROM content_studio_projects WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $projectId]);
    $project = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$project) {
        echo json_encode(['status' => 'error', 'message' => 'Project not found.']);
        exit;
    }

    $title = $project['title'];
    $editorId = $project['video_editor_id'] ?: $project['created_by'];
    $thumbnailId = $project['thumbnail_designer_id'] ?: $editorId;
    $publisherId = $project['publisher_id'] ?: $project['created_by'];

    if ($decision === 'approve') {
        // Award video editing credit (+25)
        if ($editorId) {
            ContentStudioHelper::awardStageCredit($db, $projectId, 'editing_approved', $editorId, 25, "Video Editing Approved for '{$title}'", $reviewerId);
        }
        // Award thumbnail credit (+5) if distinct
        if ($thumbnailId && $thumbnailId != $editorId) {
            ContentStudioHelper::awardStageCredit($db, $projectId, 'thumbnail_approved', $thumbnailId, 5, "Thumbnail Design Approved for '{$title}'", $reviewerId);
        }

        // Advance to published stage
        $upd = $db->prepare("UPDATE content_studio_projects SET current_stage = 'published', status = 'active', reviewer_id = :r, updated_at = NOW() WHERE id = :id");
        $upd->execute([':r' => $reviewerId, ':id' => $projectId]);

        // Notify publisher
        if ($publisherId) {
            NotificationHelper::sendToUser(
                $db,
                $publisherId,
                $reviewerId,
                "🎉 Video Approved & Ready to Publish!",
                "'{$title}' has been approved by QA! You can now publish it to YouTube.",
                "content_approved",
                "staff",
                "/content-studio",
                "high",
                ["project_id" => $projectId]
            );
        }

        // Notify editor
        if ($editorId && $editorId != $publisherId) {
            NotificationHelper::sendToUser(
                $db,
                $editorId,
                $reviewerId,
                "✅ Video Edit Approved (+25 Credits)!",
                "Your edit for '{$title}' has been approved by QA.",
                "credit_reward",
                "staff",
                "/content-studio",
                "normal",
                ["project_id" => $projectId]
            );
        }

        $message = "Video approved! Credits awarded and moved to Publishing queue.";

    } else {
        // Request revision
        $upd = $db->prepare("UPDATE content_studio_projects SET current_stage = 'editing', status = 'revision', reviewer_id = :r, updated_at = NOW() WHERE id = :id");
        $upd->execute([':r' => $reviewerId, ':id' => $projectId]);

        // Notify editor
        if ($editorId) {
            NotificationHelper::sendToUser(
                $db,
                $editorId,
                $reviewerId,
                "⚠️ Revisions Requested for Video",
                "QA requested revisions on '{$title}': " . ($notes ?: 'Check timestamped feedback in player.'),
                "content_revision",
                "staff",
                "/content-studio",
                "high",
                ["project_id" => $projectId]
            );
        }

        $message = "Revision requested. Video editor has been notified.";
    }

    // Trigger Pusher update
    try {
        $pusher = new PusherHelper();
        $pusher->trigger('content-studio', 'project-reviewed', [
            'project_id' => $projectId,
            'decision' => $decision
        ]);
    } catch (Throwable $pe) {}

    echo json_encode([
        'status' => 'success',
        'message' => $message,
        'decision' => $decision
    ]);

} catch (Throwable $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
