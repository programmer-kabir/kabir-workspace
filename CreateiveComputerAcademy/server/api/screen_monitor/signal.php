<?php
// server/api/screen_monitor/signal.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/PusherHelper.php';

date_default_timezone_set('Asia/Dhaka');

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid JSON payload']);
    exit();
}

$signalType = isset($data['signal_type']) ? trim($data['signal_type']) : '';
$senderId   = isset($data['sender_id']) ? (string)$data['sender_id'] : 'unknown';
$targetId   = isset($data['target_id']) ? (string)$data['target_id'] : '';
$payload    = isset($data['payload']) ? $data['payload'] : [];

if (empty($signalType)) {
    http_response_code(422);
    echo json_encode(['status' => 'error', 'message' => 'Missing signal_type parameter']);
    exit();
}

try {
    $pusher = new PusherHelper();

    // Determine target channel
    if (!empty($targetId)) {
        if ($targetId === 'admin') {
            $channel = 'screen-admin-channel';
        } else {
            $channel = 'screen-staff-' . $targetId;
        }
    } else {
        $channel = 'screen-monitor-channel';
    }

    $eventData = [
        'signal_type' => $signalType,
        'sender_id'   => $senderId,
        'target_id'   => $targetId,
        'payload'     => $payload,
        'timestamp'   => time()
    ];

    // Trigger Pusher event
    $pusher->trigger($channel, 'screen-signal', $eventData);

    echo json_encode([
        'status' => 'success',
        'channel' => $channel,
        'signal_type' => $signalType,
        'dispatched_at' => date('Y-m-d H:i:s')
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Pusher signaling failed: ' . $e->getMessage()
    ]);
}
?>
