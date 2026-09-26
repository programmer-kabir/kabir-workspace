<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo json_encode(["status" => "error", "message" => "Database connection error."]);
    exit;
}

$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

if ($user_id <= 0) {
    echo json_encode(["status" => "error", "message" => "Valid User ID is required."]);
    exit;
}

try {
    // Fetch all stages progress
    $stmt = $db->prepare("
        SELECT stage_id, stage_name, is_completed, is_unlocked, min_nodes, best_nodes_used, 
               last_nodes_used, node_variance, efficiency_percent, stars, total_attempts, 
               best_time_seconds, total_time_seconds, last_practiced_at
        FROM student_pentool_stage_progress
        WHERE user_id = ?
        ORDER BY stage_id ASC
    ");
    $stmt->execute([$user_id]);
    $stages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Summary calculations
    $total_completed = 0;
    $total_stars = 0;
    $total_attempts = 0;
    $total_time = 0;
    $total_efficiency = 0;
    $highest_stage = 0;

    foreach ($stages as $s) {
        if (intval($s['is_completed']) === 1) {
            $total_completed++;
            $total_stars += intval($s['stars']);
            $total_efficiency += floatval($s['efficiency_percent']);
            if (intval($s['stage_id']) > $highest_stage) {
                $highest_stage = intval($s['stage_id']);
            }
        }
        $total_attempts += intval($s['total_attempts']);
        $total_time += intval($s['total_time_seconds']);
    }

    $avg_efficiency = $total_completed > 0 ? round($total_efficiency / $total_completed, 1) : 0;

    echo json_encode([
        "status" => "success",
        "data" => [
            "summary" => [
                "total_completed" => $total_completed,
                "total_stages" => 21,
                "highest_stage" => $highest_stage,
                "total_stars" => $total_stars,
                "total_attempts" => $total_attempts,
                "total_time_seconds" => $total_time,
                "avg_efficiency_percent" => $avg_efficiency,
                "is_graduated" => ($total_completed >= 21)
            ],
            "stages" => $stages
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
