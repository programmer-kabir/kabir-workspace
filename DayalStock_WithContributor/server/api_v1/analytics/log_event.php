<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents("php://input"), true);
if (!$input) {
    echo json_encode(['success' => false, 'message' => 'Invalid input']);
    exit;
}

$visitor_log_id = isset($input['visitor_log_id']) ? (int)$input['visitor_log_id'] : 0;
$user_id        = isset($input['user_id']) && $input['user_id'] !== '' ? (int)$input['user_id'] : 'NULL';
$content_id     = isset($input['content_id']) && $input['content_id'] !== '' ? (int)$input['content_id'] : 'NULL';
$session_id     = $mysqli->real_escape_string($input['session_id'] ?? '');
$event_name     = $mysqli->real_escape_string($input['event_name'] ?? '');
$event_value    = $mysqli->real_escape_string($input['event_value'] ?? '');

if (!$event_name || !$session_id) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

$sql = "INSERT INTO analytics_events (
    visitor_log_id, user_id, session_id, content_id, event_name, event_value
) VALUES (
    $visitor_log_id, $user_id, '$session_id', $content_id, '$event_name', '$event_value'
)";

if ($mysqli->query($sql)) {
    echo json_encode(['success' => true, 'event_id' => $mysqli->insert_id]);
} else {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $mysqli->error]);
}
?>
