<?php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';

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

$student_id = isset($data['student_id']) ? intval($data['student_id']) : 0;
$action = !empty($data['action']) ? trim($data['action']) : '';
$stage_id = isset($data['stage_id']) ? intval($data['stage_id']) : null;

if ($student_id <= 0) {
    echo json_encode(["status" => "error", "message" => "Valid Student User ID is required."]);
    exit;
}

// Stage Catalog Reference
$STAGE_CATALOG = [
    0  => ['name' => 'Line', 'minNodes' => 3],
    1  => ['name' => 'Home', 'minNodes' => 5],
    2  => ['name' => 'Circle', 'minNodes' => 4],
    3  => ['name' => 'Heart', 'minNodes' => 2],
    4  => ['name' => 'Apple with Leaf', 'minNodes' => 8],
    5  => ['name' => 'Fish', 'minNodes' => 6],
    6  => ['name' => 'Butterfly', 'minNodes' => 10],
    7  => ['name' => 'Royal Crown', 'minNodes' => 7],
    8  => ['name' => 'Coffee Cup', 'minNodes' => 8],
    9  => ['name' => 'Nautical Anchor', 'minNodes' => 12],
    10 => ['name' => 'VW Beetle', 'minNodes' => 9],
    11 => ['name' => 'Plane', 'minNodes' => 10],
    12 => ['name' => 'Clip', 'minNodes' => 8],
    13 => ['name' => 'Wrench', 'minNodes' => 8],
    14 => ['name' => 'Cloud', 'minNodes' => 5],
    15 => ['name' => 'Profile', 'minNodes' => 9],
    16 => ['name' => 'Duck', 'minNodes' => 9],
    17 => ['name' => 'Cap', 'minNodes' => 9],
    18 => ['name' => 'Letter', 'minNodes' => 6],
    19 => ['name' => 'Guitar', 'minNodes' => 10],
    20 => ['name' => 'Flag', 'minNodes' => 9]
];

$current_bd_time = date('Y-m-d H:i:s');

try {
    switch ($action) {
        case 'reset_progress':
            // Reset all stages for this student
            $del = $db->prepare("DELETE FROM student_pentool_stage_progress WHERE user_id = ?");
            $del->execute([$student_id]);

            // Re-seed Stage 0 as unlocked
            $seed = $db->prepare("
                INSERT INTO student_pentool_stage_progress
                (user_id, stage_id, stage_name, is_completed, is_unlocked, min_nodes, best_nodes_used, last_nodes_used, node_variance, efficiency_percent, stars, total_attempts, best_time_seconds, total_time_seconds, last_practiced_at, created_at, updated_at)
                VALUES (?, 0, 'Line', 0, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0, ?, ?, ?)
            ");
            $seed->execute([$student_id, $current_bd_time, $current_bd_time, $current_bd_time]);

            echo json_encode(["status" => "success", "message" => "Student Pen Tool progress reset back to Stage 1."]);
            break;

        case 'complete_all':
            // Mark all 21 stages as completed with 3 stars
            for ($i = 0; $i <= 20; $i++) {
                $cat = $STAGE_CATALOG[$i];
                $minN = $cat['minNodes'];
                $stmt = $db->prepare("
                    INSERT INTO student_pentool_stage_progress
                    (user_id, stage_id, stage_name, is_completed, is_unlocked, min_nodes, best_nodes_used, last_nodes_used, node_variance, efficiency_percent, stars, total_attempts, best_time_seconds, total_time_seconds, last_practiced_at, created_at, updated_at)
                    VALUES (?, ?, ?, 1, 1, ?, ?, ?, 0, 100.0, 3, 1, 15, 15, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        is_completed = 1,
                        is_unlocked = 1,
                        stars = 3,
                        efficiency_percent = 100.0,
                        best_nodes_used = VALUES(best_nodes_used),
                        last_nodes_used = VALUES(last_nodes_used),
                        node_variance = 0,
                        last_practiced_at = VALUES(last_practiced_at),
                        updated_at = VALUES(updated_at)
                ");
                $stmt->execute([
                    $student_id, $i, $cat['name'], $minN, $minN, $minN, $current_bd_time, $current_bd_time, $current_bd_time
                ]);
            }
            echo json_encode(["status" => "success", "message" => "All 21 stages marked as 100% Completed (Full Vector Graduate)."]);
            break;

        case 'unlock_stage':
            if ($stage_id === null || $stage_id < 0 || $stage_id > 20) {
                echo json_encode(["status" => "error", "message" => "Valid Stage ID (0-20) required."]);
                exit;
            }
            $cat = $STAGE_CATALOG[$stage_id];
            $stmt = $db->prepare("
                INSERT INTO student_pentool_stage_progress
                (user_id, stage_id, stage_name, is_completed, is_unlocked, min_nodes, best_nodes_used, last_nodes_used, node_variance, efficiency_percent, stars, total_attempts, best_time_seconds, total_time_seconds, last_practiced_at, created_at, updated_at)
                VALUES (?, ?, ?, 0, 1, ?, 0, 0, 0, 0, 0, 0, 0, 0, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    is_unlocked = 1,
                    updated_at = VALUES(updated_at)
            ");
            $stmt->execute([
                $student_id, $stage_id, $cat['name'], $cat['minNodes'], $current_bd_time, $current_bd_time, $current_bd_time
            ]);
            echo json_encode(["status" => "success", "message" => "Stage " . ($stage_id + 1) . " (" . $cat['name'] . ") unlocked."]);
            break;

        default:
            echo json_encode(["status" => "error", "message" => "Invalid action specified."]);
            break;
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
