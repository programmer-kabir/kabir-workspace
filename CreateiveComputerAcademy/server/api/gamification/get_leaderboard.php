<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/GamificationHelper.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
    $leaderboard = GamificationHelper::getLeaderboard($db, $limit);

    echo json_encode([
        "status" => "success",
        "data"   => $leaderboard
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => $e->getMessage()
    ]);
}
