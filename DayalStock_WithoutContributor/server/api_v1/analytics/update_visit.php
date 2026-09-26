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
$visit_duration = isset($input['visit_duration']) ? (int)$input['visit_duration'] : 0;

if ($visitor_log_id <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid visitor_log_id']);
    exit;
}

$sql = "UPDATE visitor_logs SET visit_duration = $visit_duration WHERE id = $visitor_log_id";

if ($mysqli->query($sql)) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $mysqli->error]);
}
?>
