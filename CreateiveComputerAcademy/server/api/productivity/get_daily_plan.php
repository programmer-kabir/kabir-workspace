<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/ProductivityHelper.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    $date = isset($_GET['date']) ? trim($_GET['date']) : date('Y-m-d');

    if ($userId <= 0) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "user_id is required"]);
        exit;
    }

    $plan = ProductivityHelper::getDailyPlan($db, $userId, $date);

    echo json_encode([
        "status" => "success",
        "data"   => $plan
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => $e->getMessage()
    ]);
}
