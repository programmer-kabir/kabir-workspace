<?php
require_once '../config/cors.php';
require_once '../config/db.php';
require_once '../middleware/check_role.php';
require_once '../helper/notification_helper.php';
require_once '../helper/email_helper.php';

// Set timezone to BD Time
date_default_timezone_set('Asia/Dhaka');

header("Content-Type: application/json");

// 🔒 শুধু admin update করতে পারবে
requireRole('admin');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);
$id = isset($input['id']) ? (int)$input['id'] : 0;
$status = isset($input['status']) ? $input['status'] : '';
$reason = isset($input['reason']) ? $input['reason'] : ''; // Rejection reason
$reviewerNote = isset($input['reviewer_note']) ? $input['reviewer_note'] : '';

if ($id <= 0 || !in_array($status, ['published', 'rejected', 'exclusive_buyout'])) {
    echo json_encode(["success" => false, "message" => "Invalid ID or status"]);
    exit;
}

$admin_id = isset($GLOBALS['user']['id']) ? (int)$GLOBALS['user']['id'] : 1;
$currentTime = date('Y-m-d H:i:s');
$publishedAt = null;

if ($status === 'published') {
    $publishedAt = $currentTime;
}

$rejectionReason = ($status === 'rejected') ? $reason : null;
$finalReviewerNote = ($status === 'rejected') ? $reviewerNote : null;

$sql = "UPDATE contents 
        SET status = ?, 
            rejection_reason = ?, 
            reviewed_by = ?, 
            reviewed_at = ?, 
            reviewer_note = ?, 
            published_at = ? 
        WHERE id = ?";

$stmt = $mysqli->prepare($sql);

if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Prepare failed: " . $mysqli->error]);
    exit;
}

$stmt->bind_param("ssisssi", $status, $rejectionReason, $admin_id, $currentTime, $finalReviewerNote, $publishedAt, $id);

if ($stmt->execute()) {
    if ($stmt->affected_rows >= 0) {
        echo json_encode(["success" => true, "message" => "Content status updated successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "Content not found or no changes made"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Update failed: " . $stmt->error]);
}

$stmt->close();
$mysqli->close();
?>
