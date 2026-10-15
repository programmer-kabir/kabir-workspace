<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../config/PusherHelper.php';
require_once __DIR__ . '/developer_guard.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"), true) ?? [];
$token = $data['token'] ?? ($_SERVER['HTTP_AUTHORIZATION'] ?? '');
if (strpos($token, 'Bearer ') === 0) {
    $token = substr($token, 7);
}

$devUser = verifyDeveloperAccess($db, $token);
if (!$devUser) {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Forbidden: Developer or Admin access required."]);
    exit;
}

$channel = trim($data['channel'] ?? 'community-channel');
$event = trim($data['event'] ?? 'dev-test-event');
$payload = $data['payload'] ?? [];

if (empty($channel) || empty($event)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Channel and Event name are required."]);
    exit;
}

// Enhance payload with meta
if (is_array($payload)) {
    $payload['_dispatched_by'] = $devUser['name'] . " (ID: {$devUser['id']})";
    $payload['_dispatched_at'] = date('Y-m-d H:i:s');
}

try {
    $result = PusherHelper::trigger($channel, $event, $payload);

    if ($result) {
        echo json_encode([
            "status" => "success",
            "message" => "Realtime event transmitted to Pusher gateway.",
            "channel" => $channel,
            "event" => $event,
            "payload" => $payload,
            "dispatched_at" => date('Y-m-d H:i:s')
        ]);
    } else {
        http_response_code(502);
        echo json_encode([
            "status" => "error",
            "message" => "Pusher gateway rejected the event transmission. Check Pusher credentials."
        ]);
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Dispatch failed: " . $e->getMessage()
    ]);
}
?>
