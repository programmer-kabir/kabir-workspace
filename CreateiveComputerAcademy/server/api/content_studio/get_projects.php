<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once 'ContentStudioHelper.php';

$database = new Database();
$db = $database->getConnection();
ContentStudioHelper::ensureSchema($db);

$userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;
$filter = isset($_GET['filter']) ? $_GET['filter'] : 'all'; // 'all', 'my_turn', 'completed', 'active'
$stage = isset($_GET['stage']) ? $_GET['stage'] : null;

try {
    $query = "
        SELECT 
            p.*,
            u_creator.name as creator_name,
            u_script.name as scriptwriter_name,
            u_voice.name as voice_artist_name,
            u_footage.name as footage_collector_name,
            u_editor.name as video_editor_name,
            u_thumb.name as thumbnail_designer_name,
            u_pub.name as publisher_name,
            u_rev.name as reviewer_name,
            (SELECT COUNT(*) FROM content_studio_reviews WHERE project_id = p.id AND status = 'open') as open_revisions_count
        FROM content_studio_projects p
        LEFT JOIN users u_creator ON p.created_by = u_creator.id
        LEFT JOIN users u_script ON p.scriptwriter_id = u_script.id
        LEFT JOIN users u_voice ON p.voice_artist_id = u_voice.id
        LEFT JOIN users u_footage ON p.footage_collector_id = u_footage.id
        LEFT JOIN users u_editor ON p.video_editor_id = u_editor.id
        LEFT JOIN users u_thumb ON p.thumbnail_designer_id = u_thumb.id
        LEFT JOIN users u_pub ON p.publisher_id = u_pub.id
        LEFT JOIN users u_rev ON p.reviewer_id = u_rev.id
        WHERE 1=1
    ";

    $params = [];

    if ($stage) {
        $query .= " AND p.current_stage = :stage";
        $params[':stage'] = $stage;
    }

    if ($filter === 'completed') {
        $query .= " AND (p.status = 'completed' OR p.current_stage = 'published')";
    } elseif ($filter === 'active') {
        $query .= " AND p.status != 'completed' AND p.current_stage != 'published'";
    }

    $query .= " ORDER BY p.updated_at DESC";

    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // If filter is 'my_turn' and userId is provided, filter in PHP
    if ($filter === 'my_turn' && $userId) {
        $filtered = [];
        foreach ($projects as $p) {
            $currentStage = $p['current_stage'];
            $assigneeId = ContentStudioHelper::getAssigneeForStage($p, $currentStage);
            if ($assigneeId === $userId) {
                $p['is_my_turn'] = true;
                $filtered[] = $p;
            }
        }
        $projects = $filtered;
    } else {
        foreach ($projects as &$p) {
            if ($userId) {
                $assigneeId = ContentStudioHelper::getAssigneeForStage($p, $p['current_stage']);
                $p['is_my_turn'] = ($assigneeId === $userId);
            }
        }
    }

    echo json_encode([
        'status' => 'success',
        'data' => $projects
    ]);

} catch (Throwable $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
