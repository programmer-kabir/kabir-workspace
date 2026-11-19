<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/ProductivityHelper.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid JSON payload"]);
        exit;
    }

    $userId = isset($input['user_id']) ? intval($input['user_id']) : 0;
    $planDate = isset($input['plan_date']) ? trim($input['plan_date']) : date('Y-m-d');
    $majorGoal = isset($input['major_goal']) ? trim($input['major_goal']) : '';
    $majorCompleted = !empty($input['major_completed']) ? 1 : 0;
    $mediumGoals = isset($input['medium_goals']) ? $input['medium_goals'] : [];
    $smallGoals = isset($input['small_goals']) ? $input['small_goals'] : [];

    if ($userId <= 0) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "user_id is required"]);
        exit;
    }

    $result = ProductivityHelper::saveDailyPlan(
        $db,
        $userId,
        $planDate,
        $majorGoal,
        $majorCompleted,
        $mediumGoals,
        $smallGoals
    );

    echo json_encode([
        "status" => "success",
        "data"   => $result
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => $e->getMessage()
    ]);
}
