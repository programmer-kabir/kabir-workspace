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

// Fetch content details for notification
$contentTitle = "Unknown Content";
$authorId = null;
$authorUserId = null;
$authorEmail = "";
$authorName = "";
$contentSql = "SELECT c.title, c.author_id, a.user_id, u.email, u.name 
               FROM contents c
               LEFT JOIN authors a ON a.id = c.author_id
               LEFT JOIN users u ON u.id = a.user_id
               WHERE c.id = ?";
if ($contentStmt = $mysqli->prepare($contentSql)) {
    $contentStmt->bind_param("i", $id);
    $contentStmt->execute();
    $contentResult = $contentStmt->get_result();
    if ($contentRow = $contentResult->fetch_assoc()) {
        $contentTitle = $contentRow['title'];
        $authorId = (int)$contentRow['author_id'];
        $authorUserId = (int)$contentRow['user_id'];
        $authorEmail = $contentRow['email'] ?? '';
        $authorName = $contentRow['name'] ?? 'Contributor';
    }
    $contentStmt->close();
}

$admin_id = isset($GLOBALS['user']['id']) ? (int)$GLOBALS['user']['id'] : 1; // Get real user id instead of hardcoded
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
    if ($stmt->affected_rows > 0) {
        // Send Notification to the author
        if ($authorUserId > 0) {
            $notifTitle = ($status === 'published') ? "Content Published!" : "Content Rejected";
            $notifMessage = ($status === 'published') 
                ? "Your content '{$contentTitle}' has been published successfully." 
                : "Your content '{$contentTitle}' was rejected.";
            if ($status === 'rejected' && !empty($reason)) {
                $notifMessage .= " Reason: {$reason}";
            }
            sendNotification($mysqli, [
                'user_id'     => $authorUserId,
                'sender_id'   => $admin_id,
                'sender_type' => 'admin',
                'target_role' => 'author',
                'type'        => 'content_review',
                'title'       => $notifTitle,
                'message'     => $notifMessage,
                'priority'    => ($status === 'rejected') ? 'high' : 'normal',
                'link'        => 'https://contributor.dayalstock.com/dashboard/files/published' // optional link for author
            ]);

            // Send Email Notification
            if (!empty($authorEmail)) {
                $emailType = ($status === 'published') ? 'content_approved' : 'content_rejected';
                sendEmail($mysqli, $authorEmail, $authorName, $emailType, [
                    'content_title' => $contentTitle,
                    'reason'        => $reason
                ], $authorUserId, $admin_id, 'Admin');
            }
        }
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
