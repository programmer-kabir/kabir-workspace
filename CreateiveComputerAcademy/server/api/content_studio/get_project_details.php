<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once 'ContentStudioHelper.php';

$database = new Database();
$db = $database->getConnection();
ContentStudioHelper::ensureSchema($db);

$projectId = isset($_GET['project_id']) ? (int)$_GET['project_id'] : 0;

if (!$projectId) {
    echo json_encode(['status' => 'error', 'message' => 'Project ID is required.']);
    exit;
}

try {
    $stmt = $db->prepare("
        SELECT 
            p.*,
            u_creator.name as creator_name,
            u_script.name as scriptwriter_name,
            u_voice.name as voice_artist_name,
            u_footage.name as footage_collector_name,
            u_editor.name as video_editor_name,
            u_thumb.name as thumbnail_designer_name,
            u_pub.name as publisher_name,
            u_rev.name as reviewer_name
        FROM content_studio_projects p
        LEFT JOIN users u_creator ON p.created_by = u_creator.id
        LEFT JOIN users u_script ON p.scriptwriter_id = u_script.id
        LEFT JOIN users u_voice ON p.voice_artist_id = u_voice.id
        LEFT JOIN users u_footage ON p.footage_collector_id = u_footage.id
        LEFT JOIN users u_editor ON p.video_editor_id = u_editor.id
        LEFT JOIN users u_thumb ON p.thumbnail_designer_id = u_thumb.id
        LEFT JOIN users u_pub ON p.publisher_id = u_pub.id
        LEFT JOIN users u_rev ON p.reviewer_id = u_rev.id
        WHERE p.id = :id
        LIMIT 1
    ");
    $stmt->execute([':id' => $projectId]);
    $project = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$project) {
        echo json_encode(['status' => 'error', 'message' => 'Project not found.']);
        exit;
    }

    // Fetch reviews with timestamp
    $revStmt = $db->prepare("
        SELECT r.*, u.name as reviewer_name, u.profile_picture as reviewer_avatar
        FROM content_studio_reviews r
        JOIN users u ON r.reviewer_id = u.id
        WHERE r.project_id = :id
        ORDER BY r.timestamp_seconds ASC, r.created_at ASC
    ");
    $revStmt->execute([':id' => $projectId]);
    $reviews = $revStmt->fetchAll(PDO::FETCH_ASSOC);

    // Fetch stage logs
    $logStmt = $db->prepare("
        SELECT l.*, u.name as user_name
        FROM content_studio_stage_logs l
        JOIN users u ON l.completed_by = u.id
        WHERE l.project_id = :id
        ORDER BY l.created_at ASC
    ");
    $logStmt->execute([':id' => $projectId]);
    $logs = $logStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'data' => [
            'project' => $project,
            'reviews' => $reviews,
            'stage_logs' => $logs
        ]
    ]);

} catch (Throwable $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
