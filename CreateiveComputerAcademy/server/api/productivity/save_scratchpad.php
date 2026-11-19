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
    $content = isset($input['content']) ? (string)$input['content'] : '';

    if ($userId <= 0) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "user_id is required"]);
        exit;
    }

    ProductivityHelper::saveScratchpad($db, $userId, $content);

    echo json_encode([
        "status" => "success",
        "message" => "Scratchpad saved successfully"
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => $e->getMessage()
    ]);
}
