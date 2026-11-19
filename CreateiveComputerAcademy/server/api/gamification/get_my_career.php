<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/GamificationHelper.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    if (!$userId) {
        $raw = file_get_contents("php://input");
        $data = json_decode($raw, true);
        if (!empty($data['user_id'])) {
            $userId = intval($data['user_id']);
        }
    }

    if ($userId <= 0) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Valid user_id required."]);
        exit();
    }

    $profile = GamificationHelper::getUserProfile($db, $userId);

    echo json_encode([
        "status" => "success",
        "data"   => $profile
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => $e->getMessage()
    ]);
}
