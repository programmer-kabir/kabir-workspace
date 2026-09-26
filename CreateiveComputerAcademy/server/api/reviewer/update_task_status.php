<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
if (file_exists('../credits/CreditHelper.php')) {
    require_once '../credits/CreditHelper.php';
}

$database = new Database();
$db = $database->getConnection();

if (isset($_SERVER["CONTENT_TYPE"]) && strpos($_SERVER["CONTENT_TYPE"], "application/json") !== false) {
    $data = json_decode(file_get_contents("php://input"));
} else {
    $data = (object) $_POST;
}

if(!isset($data->task_id) || !isset($data->status) || !isset($data->changed_by)) {
    echo json_encode(["status" => "error", "message" => "Task ID, Status, and Reviewer ID are required."]);
    exit;
}

try {
    $db->beginTransaction();

    // Get old status
    $old_stmt = $db->prepare("SELECT status FROM tasks WHERE id = :id");
    $old_stmt->execute([':id' => $data->task_id]);
    $old_status = $old_stmt->fetchColumn();

    if (!$old_status) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        echo json_encode(["status" => "error", "message" => "Task not found."]);
        exit;
    }

    // Update status and tracking info in tasks table
    $status = $data->status;
    $reviewer_id = $data->changed_by;

    if ($status === 'Completed') {
        $query = "UPDATE tasks 
                  SET status = :status, 
                       reviewed_by = :reviewer_id, 
                       reviewed_at = NOW(), 
                       updated_at = NOW(),
                       rejected_by = NULL, 
                       rejected_at = NULL, 
                       rejection_reason = NULL 
                  WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':reviewer_id', $reviewer_id);
        $stmt->bindParam(':id', $data->task_id);
        $stmt->execute();

        // Extract rating data
        $rating = isset($data->rating) ? intval($data->rating) : 5;
        $feedback_notes = isset($data->feedback_notes) ? trim($data->feedback_notes) : null;
        $tags_val = null;
        if (isset($data->tags)) {
            $tags_val = is_array($data->tags) ? json_encode($data->tags) : (is_string($data->tags) ? $data->tags : null);
        }

        // Insert or update task review in task_reviews table
        try {
            // Find staff user_id
            $stf_stmt = $db->prepare("SELECT e.user_id FROM tasks t JOIN employees e ON t.assigned_to = e.id WHERE t.id = :id");
            $stf_stmt->execute([':id' => $data->task_id]);
            $staff_uid = $stf_stmt->fetchColumn() ?: null;

            $rev_stmt = $db->prepare("INSERT INTO task_reviews (task_id, reviewer_id, staff_user_id, rating, feedback_notes, tags, created_at) 
                VALUES (:task_id, :reviewer_id, :staff_user_id, :rating, :feedback_notes, :tags, NOW())
                ON DUPLICATE KEY UPDATE rating = VALUES(rating), feedback_notes = VALUES(feedback_notes), tags = VALUES(tags), updated_at = NOW()");
            $rev_stmt->execute([
                ':task_id' => $data->task_id,
                ':reviewer_id' => $reviewer_id,
                ':staff_user_id' => $staff_uid,
                ':rating' => $rating,
                ':feedback_notes' => $feedback_notes,
                ':tags' => $tags_val
            ]);
        } catch (Exception $ex) {}

        // Credit Rewards: Staff (+Category.credit) and Reviewer (+Reviewer.credit)
        if (class_exists('CreditHelper')) {
            try {
                $reward_credit = isset($data->reward_credit) && intval($data->reward_credit) > 0 ? intval($data->reward_credit) : null;
                CreditHelper::rewardTaskCompletion($db, $data->task_id, $reviewer_id, $reward_credit);
                CreditHelper::rewardReviewerApproval($db, $data->task_id, $reviewer_id);
            } catch (Exception $ex) {
                error_log("Credit reward error on task completion: " . $ex->getMessage());
            }
        }
    } else if ($status === 'Rejected') {
        $rejection_reason = isset($data->rejection_reason) ? $data->rejection_reason : null;

        // Credit Penalty for Staff (-1 Credit) & Reward for Reviewer (+1 QA Credit)
        if (class_exists('CreditHelper')) {
            try {
                CreditHelper::penalizeTaskRejection($db, $data->task_id, $reviewer_id, $rejection_reason);
                CreditHelper::rewardReviewerRejection($db, $data->task_id, $reviewer_id, $rejection_reason);
            } catch (Exception $ex) {
                error_log("Credit penalty/reward error on task rejection: " . $ex->getMessage());
            }
        }
        
        $rejection_image = null;
        if (isset($_FILES['rejection_image']) && $_FILES['rejection_image']['error'] === UPLOAD_ERR_OK) {
            $upload_dir = '../../uploads/rejection_screenshots/';
            if (!is_dir($upload_dir)) {
                mkdir($upload_dir, 0777, true);
            }
            
            $sourcePath = $_FILES['rejection_image']['tmp_name'];
            $file_extension = pathinfo($_FILES['rejection_image']['name'], PATHINFO_EXTENSION);
            
            $info = getimagesize($sourcePath);
            $image_saved = false;
            
            if ($info !== false && function_exists('imagewebp')) {
                if ($info['mime'] == 'image/jpeg') {
                    $image = @imagecreatefromjpeg($sourcePath);
                } elseif ($info['mime'] == 'image/png') {
                    $image = @imagecreatefrompng($sourcePath);
                    if ($image !== false) {
                        imagepalettetotruecolor($image);
                        imagealphablending($image, true);
                        imagesavealpha($image, true);
                    }
                } elseif ($info['mime'] == 'image/webp') {
                    $image = @imagecreatefromwebp($sourcePath);
                }
                
                if (isset($image) && $image !== false) {
                    $new_filename = 'reject_' . time() . '_' . uniqid() . '.webp';
                    imagewebp($image, $upload_dir . $new_filename, 80);
                    imagedestroy($image);
                    $image_saved = true;
                    $rejection_image = '/uploads/rejection_screenshots/' . $new_filename;
                }
            }
            
            // Fallback if GD is not available or conversion fails
            if (!$image_saved) {
                $new_filename = 'reject_' . time() . '_' . uniqid() . '.' . $file_extension;
                if (move_uploaded_file($sourcePath, $upload_dir . $new_filename)) {
                    $rejection_image = '/uploads/rejection_screenshots/' . $new_filename;
                }
            }
        }

        $query = "UPDATE tasks 
                  SET status = :status, 
                      rejection_reason = :rejection_reason, 
                      rejection_image = :rejection_image,
                      rejected_by = :reviewer_id, 
                      rejected_at = NOW(), 
                      updated_at = NOW(),
                      reviewed_by = NULL, 
                      reviewed_at = NULL 
                  WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':rejection_reason', $rejection_reason);
        $stmt->bindParam(':rejection_image', $rejection_image);
        $stmt->bindParam(':reviewer_id', $reviewer_id);
        $stmt->bindParam(':id', $data->task_id);
        $stmt->execute();
    } else {
        $query = "UPDATE tasks SET status = :status WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':id', $data->task_id);
        $stmt->execute();
    }

    // Log the change to task_logs table
    $log_query = "INSERT INTO task_logs (task_id, status_from, status_to, changed_by) VALUES (:task_id, :status_from, :status_to, :changed_by)";
    $log_stmt = $db->prepare($log_query);
    $log_stmt->execute([
        ':task_id'     => $data->task_id,
        ':status_from' => $old_status,
        ':status_to'   => $status,
        ':changed_by'  => $data->changed_by,
    ]);



    // Fetch task info to notify assigned staff
    $info_stmt = $db->prepare("SELECT t.title, e.user_id, u.email, u.name FROM tasks t JOIN employees e ON t.assigned_to = e.id JOIN users u ON e.user_id = u.id WHERE t.id = :id");
    $info_stmt->execute([':id' => $data->task_id]);
    $task_info = $info_stmt->fetch(PDO::FETCH_ASSOC);

    $debug_log = [];
    $debug_log['task_info'] = $task_info;

    if ($task_info && !empty($task_info['user_id'])) {
        require_once '../notifications/notification_helper.php';
        require_once '../emails/EmailHelper.php';
        
        if ($status === 'Completed') {
            try {
                NotificationHelper::sendToUser(
                    $db,
                    $task_info['user_id'],
                    $reviewer_id,
                    "Task Approved: " . $task_info['title'],
                    "Great job! Your task '{$task_info['title']}' has been reviewed and approved.",
                    "task_approved",
                    "staff",
                    "/tasks",
                    "normal",
                    ["task_id" => $data->task_id]
                );
            } catch (Exception $e) {
                $debug_log['notif_error'] = $e->getMessage();
            }

            // Send approval email
            if (!empty($task_info['email'])) {
                try {
                    $stmt_tpl = $db->prepare("SELECT subject, body FROM email_templates WHERE event_name = 'task_approved'");
                    $stmt_tpl->execute();
                    if ($tpl = $stmt_tpl->fetch(PDO::FETCH_ASSOC)) {
                        $subject = str_replace('{{task_title}}', $task_info['title'] ?? 'Task', $tpl['subject']);
                        $body = $tpl['body'];
                        $body = str_replace('{{staff_name}}', $task_info['name'], $body);
                        $body = str_replace('{{task_title}}', $task_info['title'] ?? 'Task', $body);
                        
                        $actionUrl = 'https://staff.creativecomputeracademy.com/tasks?taskId=' . $data->task_id;
                        $htmlBody = EmailHelper::getHtmlTemplate($subject, $body, $actionUrl, 'View Task');
                        
                        $debug_log['mail_result'] = EmailHelper::sendEmail($task_info['email'], $task_info['name'], $subject, $htmlBody, false);
                    } else {
                        $debug_log['mail_error'] = 'Template task_approved not found';
                    }
                } catch (Exception $e) {
                    $debug_log['mail_error'] = $e->getMessage();
                }
            } else {
                $debug_log['mail_error'] = 'User email is empty';
            }

        } else if ($status === 'Rejected') {
            $reason = isset($data->rejection_reason) ? $data->rejection_reason : 'Revision requested';
            try {
                NotificationHelper::sendToUser(
                    $db,
                    $task_info['user_id'],
                    $reviewer_id,
                    "Revision Required: " . $task_info['title'],
                    "Reason: {$reason}. Please revise and resubmit.",
                    "task_rejected",
                    "staff",
                    "/tasks",
                    "high",
                    ["task_id" => $data->task_id, "reason" => $reason]
                );
            } catch (Exception $e) {
                $debug_log['notif_error'] = $e->getMessage();
            }

            // Send rejection email
            if (!empty($task_info['email'])) {
                try {
                    $stmt_tpl = $db->prepare("SELECT subject, body FROM email_templates WHERE event_name = 'task_rejected'");
                    $stmt_tpl->execute();
                    if ($tpl = $stmt_tpl->fetch(PDO::FETCH_ASSOC)) {
                        $subject = str_replace('{{task_title}}', $task_info['title'] ?? 'Task', $tpl['subject']);
                        $body = $tpl['body'];
                        $body = str_replace('{{staff_name}}', $task_info['name'], $body);
                        $body = str_replace('{{task_title}}', $task_info['title'] ?? 'Task', $body);
                        $body = str_replace('{{rejection_reason}}', nl2br(htmlspecialchars($reason)), $body);
                        
                        $imgHtml = '';
                        if (!empty($rejection_image)) {
                            $fullImageUrl = 'https://api.creativecomputeracademy.com' . $rejection_image;
                            $imgHtml = '<div style="margin: 20px 0;"><p><strong>Screenshot:</strong></p><a href="'.$fullImageUrl.'" target="_blank"><img src="'.$fullImageUrl.'" alt="Rejection Screenshot" style="max-width: 100%; border: 1px solid #e2e8f0; border-radius: 8px;" /></a></div>';
                        }
                        $body = str_replace('{{rejection_image_html}}', $imgHtml, $body);
                        
                        $actionUrl = 'https://staff.creativecomputeracademy.com/tasks?taskId=' . $data->task_id;
                        $htmlBody = EmailHelper::getHtmlTemplate($subject, $body, $actionUrl, 'View Task');
                        
                        $debug_log['mail_result'] = EmailHelper::sendEmail($task_info['email'], $task_info['name'], $subject, $htmlBody, false);
                    } else {
                        $debug_log['mail_error'] = 'Template task_rejected not found';
                    }
                } catch (Exception $e) {
                    $debug_log['mail_error'] = $e->getMessage();
                }
            } else {
                $debug_log['mail_error'] = 'User email is empty';
            }
        }
    }

    if ($db->inTransaction()) {
        $db->commit();
    }
    echo json_encode(["status" => "success", "message" => "Task marked as " . $status, "debug" => $debug_log]);

} catch(Throwable $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
