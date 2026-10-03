<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../config/PusherHelper.php';
require_once '../notifications/notification_helper.php';
require_once 'ContentStudioHelper.php';

$database = new Database();
$db = $database->getConnection();
ContentStudioHelper::ensureSchema($db);

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || empty($data['project_id']) || empty($data['reviewer_id']) || !isset($data['timestamp_seconds']) || empty($data['feedback_text'])) {
    echo json_encode(['status' => 'error', 'message' => 'Project ID, Reviewer ID, Timestamp and Feedback are required.']);
    exit;
}

try {
    $projectId = (int)$data['project_id'];
    $reviewerId = (int)$data['reviewer_id'];
    $timestampSeconds = (int)$data['timestamp_seconds'];
    $feedbackText = trim($data['feedback_text']);
    
    // Format timestamp mm:ss
    $mins = floor($timestampSeconds / 60);
    $secs = $timestampSeconds % 60;
    $timestampFormatted = sprintf('%02d:%02d', $mins, $secs);

    $stmt = $db->prepare("
        INSERT INTO content_studio_reviews (project_id, reviewer_id, timestamp_seconds, timestamp_formatted, feedback_text, status, created_at)
        VALUES (:p, :r, :ts, :tf, :f, 'open', NOW())
    ");
    $stmt->execute([
        ':p' => $projectId,
        ':r' => $reviewerId,
        ':ts' => $timestampSeconds,
        ':tf' => $timestampFormatted,
        ':f' => $feedbackText
    ]);

    $reviewId = $db->lastInsertId();

    // Trigger Pusher update
    try {
        $pusher = new PusherHelper();
        $pusher->trigger('content-studio', 'review-comment-added', [
            'project_id' => $projectId,
            'review_id' => (int)$reviewId,
            'timestamp_formatted' => $timestampFormatted,
            'feedback_text' => $feedbackText
        ]);
    } catch (Throwable $pe) {}

    echo json_encode([
        'status' => 'success',
        'message' => 'Review comment added successfully!',
        'data' => [
            'id' => (int)$reviewId,
            'timestamp_seconds' => $timestampSeconds,
            'timestamp_formatted' => $timestampFormatted,
            'feedback_text' => $feedbackText,
            'status' => 'open'
        ]
    ]);

} catch (Throwable $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
