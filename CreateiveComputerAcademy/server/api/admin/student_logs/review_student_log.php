<?php
// review_student_log.php - Instructor grading, feedback & credit bonus reward

@ini_set('display_errors', '0');
error_reporting(0);

date_default_timezone_set('Asia/Dhaka');

require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/PusherHelper.php';
require_once __DIR__ . '/../../student/daily_logs/DailyLogDbHelper.php';
require_once __DIR__ . '/../../credits/CreditHelper.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(["status" => "success", "message" => "Preflight OK"]);
    exit();
}

$input = json_decode(file_get_contents("php://input"), true);
if (!$input) {
    $input = $_POST;
}

$logId         = isset($input['log_id']) ? intval($input['log_id']) : 0;
$reviewerId    = isset($input['reviewer_id']) ? intval($input['reviewer_id']) : (isset($input['admin_id']) ? intval($input['admin_id']) : null);
$rating        = isset($input['rating']) ? max(1, min(5, intval($input['rating']))) : null;
$feedback      = isset($input['feedback']) ? trim($input['feedback']) : '';
$creditsReward = isset($input['bonus_credits']) ? max(0, intval($input['bonus_credits'])) : (isset($input['credits_reward']) ? max(0, intval($input['credits_reward'])) : 0);

if ($logId <= 0) {
    echo json_encode(["status" => "error", "message" => "Valid log_id is required."]);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();
    if (!$db) {
        throw new Exception("Database connection failed.");
    }

    DailyLogDbHelper::ensureSchema($db);

    // Fetch existing log
    $logStmt = $db->prepare("SELECT l.*, u.name as student_name 
                             FROM student_daily_logs l 
                             JOIN users u ON l.user_id = u.id 
                             WHERE l.id = :id LIMIT 1");
    $logStmt->execute([':id' => $logId]);
    $log = $logStmt->fetch(PDO::FETCH_ASSOC);

    if (!$log) {
        echo json_encode(["status" => "error", "message" => "Daily log record not found."]);
        exit();
    }

    $studentUserId = intval($log['user_id']);
    $studentName   = $log['student_name'];
    $previousCredits = intval($log['credits_earned'] ?? 0);
    $now = date('Y-m-d H:i:s');

    // Update log with review details
    $updStmt = $db->prepare("UPDATE student_daily_logs 
                             SET instructor_rating = :rating, 
                                 instructor_feedback = :feedback, 
                                 reviewed_by = :reviewer, 
                                 reviewed_at = :now, 
                                 credits_earned = :credits, 
                                 updated_at = :now 
                             WHERE id = :id");
    $updStmt->execute([
        ':rating'   => $rating,
        ':feedback' => $feedback,
        ':reviewer' => $reviewerId,
        ':now'      => $now,
        ':credits'  => ($previousCredits + $creditsReward),
        ':id'       => $logId
    ]);

    // If new credits awarded, credit the student's wallet
    if ($creditsReward > 0) {
        CreditHelper::ensureCreditSchema($db);
        CreditHelper::ensureWallet($db, $studentUserId);

        $eventKey = "daily_work_log_reward_{$logId}_ts_" . time();
        $desc = "Reward for Daily Practice Log on {$log['date']} (" . str_repeat('⭐', $rating ?: 5) . ")";
        
        $db->beginTransaction();
        try {
            // Update balance
            $updWallet = $db->prepare("UPDATE user_credits 
                                       SET balance = balance + :amount, 
                                           total_earned = total_earned + :amount, 
                                           updated_at = :now 
                                       WHERE user_id = :uid");
            $updWallet->execute([':amount' => $creditsReward, ':now' => $now, ':uid' => $studentUserId]);

            // Ledger record
            $meta = json_encode([
                "log_id"      => $logId,
                "date"        => $log['date'],
                "rating"      => $rating,
                "topic_title" => $log['topic_title']
            ]);

            $insTx = $db->prepare("INSERT INTO credit_transactions 
                (user_id, sender_id, amount, type, reference_id, event_key, description, meta_data, created_at) 
                VALUES (:uid, :sender, :amount, 'daily_log_reward', :ref_id, :event_key, :desc, :meta, :now)");
            $insTx->execute([
                ':uid'       => $studentUserId,
                ':sender'    => $reviewerId,
                ':amount'    => $creditsReward,
                ':ref_id'    => $logId,
                ':event_key' => $eventKey,
                ':desc'      => $desc,
                ':meta'      => $meta,
                ':now'       => $now
            ]);

            $db->commit();
        } catch (Throwable $txErr) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            error_log("Credit reward error: " . $txErr->getMessage());
        }
    }

    // Trigger Pusher notification to Student
    try {
        $pusherPayload = [
            "log_id"          => $logId,
            "date"            => $log['date'],
            "topic_title"     => $log['topic_title'],
            "rating"          => $rating,
            "feedback"        => $feedback,
            "credits_awarded" => $creditsReward,
            "reviewed_at"     => $now
        ];
        PusherHelper::trigger("user-channel-{$studentUserId}", 'daily-log-reviewed', $pusherPayload);
        PusherHelper::trigger("user-{$studentUserId}", 'daily-log-reviewed', $pusherPayload);
    } catch (\Throwable $pe) {
        error_log("Pusher student review error: " . $pe->getMessage());
    }

    // In-App Notification
    try {
        if (file_exists(__DIR__ . '/../../notifications/notification_helper.php')) {
            require_once __DIR__ . '/../../notifications/notification_helper.php';
            $starText = $rating ? str_repeat('⭐', $rating) : '';
            NotificationHelper::sendToUser(
                $db,
                $studentUserId,
                $reviewerId,
                "✨ Practice Log Reviewed! {$starText}",
                "Your daily work log for {$log['date']} was reviewed by instructor. " . ($creditsReward > 0 ? "+{$creditsReward} credits awarded!" : ""),
                "daily_log_reviewed",
                "student",
                "/daily-log",
                "normal",
                ["log_id" => $logId, "rating" => $rating, "credits" => $creditsReward]
            );
        }
    } catch (\Throwable $ne) {}

    echo json_encode([
        "status"          => "success",
        "message"         => "Daily work log reviewed and graded successfully.",
        "log_id"          => $logId,
        "rating"          => $rating,
        "credits_awarded" => $creditsReward,
        "reviewed_at"     => $now
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => $e->getMessage()
    ]);
}
?>
