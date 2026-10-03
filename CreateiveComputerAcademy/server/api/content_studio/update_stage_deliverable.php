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

if (!$data || empty($data['project_id']) || empty($data['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Project ID and User ID are required.']);
    exit;
}

try {
    $projectId = (int)$data['project_id'];
    $userId = (int)$data['user_id'];
    $nextStage = $data['next_stage'] ?? null;
    
    // Fetch project
    $stmt = $db->prepare("SELECT * FROM content_studio_projects WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $projectId]);
    $project = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$project) {
        echo json_encode(['status' => 'error', 'message' => 'Project not found.']);
        exit;
    }

    $currentStage = $project['current_stage'];
    $title = $project['title'];

    // Fields to update if provided
    $updates = [];
    $params = [':id' => $projectId];

    if (isset($data['script_text'])) {
        $updates[] = "script_text = :script_text";
        $params[':script_text'] = $data['script_text'];
    }
    if (isset($data['voiceover_audio_url'])) {
        $updates[] = "voiceover_audio_url = :voiceover_audio_url";
        $params[':voiceover_audio_url'] = $data['voiceover_audio_url'];
    }
    if (isset($data['assets_drive_url'])) {
        $updates[] = "assets_drive_url = :assets_drive_url";
        $params[':assets_drive_url'] = $data['assets_drive_url'];
    }
    if (isset($data['draft_video_url'])) {
        $updates[] = "draft_video_url = :draft_video_url";
        $params[':draft_video_url'] = $data['draft_video_url'];
    }
    if (isset($data['project_source_url'])) {
        $updates[] = "project_source_url = :project_source_url";
        $params[':project_source_url'] = $data['project_source_url'];
    }
    if (isset($data['thumbnail_url'])) {
        $updates[] = "thumbnail_url = :thumbnail_url";
        $params[':thumbnail_url'] = $data['thumbnail_url'];
    }

    // Award stage credits if transitioning to next stage
    $creditAwarded = 0;
    if ($nextStage && $nextStage !== $currentStage) {
        $updates[] = "current_stage = :next_stage";
        $params[':next_stage'] = $nextStage;

        if ($nextStage === 'review') {
            $updates[] = "status = 'active'";
        }

        // Credit rules per completed stage
        if ($currentStage === 'scripting') {
            ContentStudioHelper::awardStageCredit($db, $projectId, 'scripting', $userId, 10, "Script Completed for '{$title}'");
            $creditAwarded = 10;
        } elseif ($currentStage === 'voiceover') {
            ContentStudioHelper::awardStageCredit($db, $projectId, 'voiceover', $userId, 10, "Voiceover Completed for '{$title}'");
            $creditAwarded = 10;
        } elseif ($currentStage === 'footage') {
            ContentStudioHelper::awardStageCredit($db, $projectId, 'footage', $userId, 5, "Footage Collected for '{$title}'");
            $creditAwarded = 5;
        }

        // Send notification to next assignee
        $nextAssigneeId = ContentStudioHelper::getAssigneeForStage($project, $nextStage);
        if ($nextAssigneeId && $nextAssigneeId != $userId) {
            $stageNames = [
                'voiceover' => 'Voiceover Recording',
                'footage' => 'Footage & Asset Collection',
                'editing' => 'Video Editing',
                'review' => 'Video Review & QA',
                'published' => 'YouTube Publishing'
            ];
            $stageLabel = $stageNames[$nextStage] ?? $nextStage;

            NotificationHelper::sendToUser(
                $db,
                $nextAssigneeId,
                $userId,
                "🎬 Action Needed: {$stageLabel}",
                "'{$title}' has moved to {$stageLabel}. It's your turn!",
                "content_stage_ready",
                "staff",
                "/content-studio",
                "high",
                ["project_id" => $projectId, "stage" => $nextStage]
            );
        }
    }

    if (!empty($updates)) {
        $sql = "UPDATE content_studio_projects SET " . implode(", ", $updates) . ", updated_at = NOW() WHERE id = :id";
        $updStmt = $db->prepare($sql);
        $updStmt->execute($params);
    }

    // Trigger Pusher update
    try {
        $pusher = new PusherHelper();
        $pusher->trigger('content-studio', 'project-updated', [
            'project_id' => $projectId,
            'current_stage' => $nextStage ?: $currentStage,
            'updated_by' => $userId
        ]);
    } catch (Throwable $pe) {}

    echo json_encode([
        'status' => 'success',
        'message' => 'Deliverable saved and stage updated successfully!',
        'credit_awarded' => $creditAwarded
    ]);

} catch (Throwable $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
