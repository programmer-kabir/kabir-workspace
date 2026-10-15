<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/PusherHelper.php';

header('Content-Type: application/json; charset=UTF-8');
date_default_timezone_set('Asia/Dhaka');

$data = json_decode(file_get_contents("php://input"), true);
$sender = isset($data['sender']) ? trim($data['sender']) : 'Developer Console';

try {
    $payload = [
        'event' => 'developer-ping',
        'sender' => $sender,
        'timestamp' => date('Y-m-d H:i:s'),
        'message' => 'Pusher Realtime WebSocket link verified successfully!'
    ];

    PusherHelper::trigger('community-channel', 'dev-ping', $payload);

    echo json_encode([
        'status' => 'success',
        'message' => 'Pusher broadcast ping transmitted successfully.',
        'data' => $payload
    ]);
} catch (Throwable $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
