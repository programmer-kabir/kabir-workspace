<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';

// Set Bangladesh Standard Time (BST, UTC+6)
date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo json_encode(["status" => "error", "message" => "Database connection error."]);
    exit;
}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    echo json_encode(["status" => "error", "message" => "Invalid JSON payload."]);
    exit;
}

$user_id = isset($data['user_id']) ? intval($data['user_id']) : 0;
$stage_id = isset($data['stage_id']) ? intval($data['stage_id']) : 0;
$stage_name = !empty($data['stage_name']) ? trim($data['stage_name']) : "Stage " . ($stage_id + 1);
$min_nodes = isset($data['min_nodes']) ? max(0, intval($data['min_nodes'])) : 0;
$nodes_used = isset($data['nodes_used']) ? max(0, intval($data['nodes_used'])) : 0;
$duration_seconds = isset($data['duration_seconds']) ? max(1, intval($data['duration_seconds'])) : 1;
$undo_count = isset($data['undo_count']) ? max(0, intval($data['undo_count'])) : 0;
$status = (!empty($data['status']) && in_array($data['status'], ['completed', 'failed', 'retried'])) ? $data['status'] : 'completed';

if ($user_id <= 0) {
    echo json_encode(["status" => "error", "message" => "Valid User ID is required."]);
    exit;
}

// Compute microscopic metrics
$node_variance = max(0, $nodes_used - $min_nodes);
$efficiency_percent = ($nodes_used > 0 && $min_nodes > 0) ? min(100.0, round(($min_nodes / $nodes_used) * 100, 2)) : 100.0;

// Star calculation: 3 stars = perfect or below min_nodes; 2 stars = min + 2; 1 star = more
if ($nodes_used <= $min_nodes) {
    $stars = 3;
} elseif ($nodes_used <= $min_nodes + 2) {
    $stars = 2;
} else {
    $stars = 1;
}

$current_bd_time = date('Y-m-d H:i:s');

try {
    // Upsert Aggregated Stage Progress
    $upsertStmt = $db->prepare("
        INSERT INTO student_pentool_stage_progress
        (user_id, stage_id, stage_name, is_completed, is_unlocked, min_nodes, best_nodes_used, last_nodes_used, node_variance, efficiency_percent, stars, total_attempts, best_time_seconds, total_time_seconds, last_practiced_at, created_at, updated_at)
        VALUES (?, ?, ?, 1, 1, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            is_completed = 1,
            is_unlocked = 1,
            stage_name = VALUES(stage_name),
            min_nodes = VALUES(min_nodes),
            best_nodes_used = CASE WHEN best_nodes_used = 0 THEN VALUES(best_nodes_used) ELSE LEAST(best_nodes_used, VALUES(best_nodes_used)) END,
            last_nodes_used = VALUES(last_nodes_used),
            node_variance = VALUES(node_variance),
            efficiency_percent = GREATEST(efficiency_percent, VALUES(efficiency_percent)),
            stars = GREATEST(stars, VALUES(stars)),
            total_attempts = total_attempts + 1,
            best_time_seconds = CASE WHEN best_time_seconds = 0 THEN VALUES(best_time_seconds) ELSE LEAST(best_time_seconds, VALUES(best_time_seconds)) END,
            total_time_seconds = total_time_seconds + VALUES(total_time_seconds),
            last_practiced_at = VALUES(last_practiced_at),
            updated_at = VALUES(updated_at)
    ");
    $upsertStmt->execute([
        $user_id, $stage_id, $stage_name, $min_nodes, $nodes_used, $nodes_used, $node_variance, $efficiency_percent, $stars, $duration_seconds, $duration_seconds, $current_bd_time, $current_bd_time, $current_bd_time
    ]);

    // Auto-unlock next stage (0 to 20 stages)
    $next_stage_id = $stage_id + 1;
    if ($next_stage_id <= 20) {
        $nextStmt = $db->prepare("
            INSERT INTO student_pentool_stage_progress
            (user_id, stage_id, stage_name, is_completed, is_unlocked, min_nodes, best_nodes_used, last_nodes_used, node_variance, efficiency_percent, stars, total_attempts, best_time_seconds, total_time_seconds, last_practiced_at, created_at, updated_at)
            VALUES (?, ?, ?, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                is_unlocked = 1,
                updated_at = VALUES(updated_at)
        ");
        $nextStmt->execute([
            $user_id, $next_stage_id, "Stage " . ($next_stage_id + 1), $current_bd_time, $current_bd_time, $current_bd_time
        ]);
    }

    echo json_encode([
        "status" => "success",
        "message" => "Stage progress saved successfully.",
        "data" => [
            "user_id" => $user_id,
            "stage_id" => $stage_id,
            "stage_name" => $stage_name,
            "stars" => $stars,
            "efficiency_percent" => $efficiency_percent,
            "bd_time" => $current_bd_time
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
