<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/ProductivityHelper.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

    if ($userId <= 0) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "user_id is required"]);
        exit;
    }

    $content = ProductivityHelper::getScratchpad($db, $userId);

    echo json_encode([
        "status" => "success",
        "data"   => [
            "content" => $content
        ]
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => $e->getMessage()
    ]);
}
