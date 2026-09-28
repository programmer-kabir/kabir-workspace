<?php
// save_daily_log.php - Save or update student daily work log submission

@ini_set('display_errors', '0');
error_reporting(0);

date_default_timezone_set('Asia/Dhaka');

require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/PusherHelper.php';
require_once __DIR__ . '/DailyLogDbHelper.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(["status" => "success", "message" => "Preflight OK"]);
    exit();
}

$input = json_decode(file_get_contents("php://input"), true);
if (!$input) {
    $input = $_POST;
}

$userId          = isset($input['user_id']) ? intval($input['user_id']) : 0;
$date            = !empty($input['date']) ? trim($input['date']) : date('Y-m-d');
$topicTitle      = isset($input['topic_title']) ? trim($input['topic_title']) : '';
$summary         = isset($input['summary']) ? trim($input['summary']) : '';
$challengesFaced = isset($input['challenges_faced']) ? trim($input['challenges_faced']) : '';
$practiceHours   = isset($input['practice_hours']) ? floatval($input['practice_hours']) : 0.0;
$files           = isset($input['files']) && is_array($input['files']) ? $input['files'] : [];

if ($userId <= 0) {
    echo json_encode(["status" => "error", "message" => "Valid user_id is required."]);
    exit();
}

if (empty($topicTitle)) {
    echo json_encode(["status" => "error", "message" => "Topic title is required."]);
    exit();
}

if (empty($summary)) {
    echo json_encode(["status" => "error", "message" => "Work summary is required."]);
    exit();
}

$filesJson = json_encode($files, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

try {
    $database = new Database();
    $db = $database->getConnection();
    if (!$db) {
        throw new Exception("Database connection failed.");
    }

    DailyLogDbHelper::ensureSchema($db);

    // Fetch user name and student code for logging/pusher
    $uStmt = $db->prepare("SELECT u.name, u.profile_picture, st.student_code 
                           FROM users u 
                           LEFT JOIN students st ON u.id = st.user_id 
                           WHERE u.id = :uid LIMIT 1");
    $uStmt->execute([':uid' => $userId]);
    $userRow = $uStmt->fetch(PDO::FETCH_ASSOC);
    $userName = $userRow['name'] ?? "Student #{$userId}";
    $studentCode = $userRow['student_code'] ?? "STU-{$userId}";

    // Check if an entry already exists for this date
    $chkStmt = $db->prepare("SELECT id, files, credits_earned FROM student_daily_logs WHERE user_id = :uid AND date = :date LIMIT 1");
    $chkStmt->execute([':uid' => $userId, ':date' => $date]);
    $existing = $chkStmt->fetch(PDO::FETCH_ASSOC);

    $logId = 0;
    if ($existing) {
        $logId = intval($existing['id']);
        $updStmt = $db->prepare("UPDATE student_daily_logs 
                                 SET topic_title = :topic, 
                                     summary = :summary, 
                                     challenges_faced = :challenges, 
                                     files = :files, 
                                     practice_hours = :hours, 
                                     updated_at = NOW() 
                                 WHERE id = :id");
        $updStmt->execute([
            ':topic'      => $topicTitle,
            ':summary'    => $summary,
            ':challenges' => $challengesFaced,
            ':files'      => $filesJson,
            ':hours'      => $practiceHours,
            ':id'         => $logId
        ]);
        $actionMessage = "Daily work log updated successfully.";
    } else {
        $insStmt = $db->prepare("INSERT INTO student_daily_logs 
                                 (user_id, date, topic_title, summary, challenges_faced, files, practice_hours, created_at, updated_at) 
                                 VALUES (:uid, :date, :topic, :summary, :challenges, :files, :hours, NOW(), NOW())");
        $insStmt->execute([
            ':uid'        => $userId,
            ':date'       => $date,
            ':topic'      => $topicTitle,
            ':summary'    => $summary,
            ':challenges' => $challengesFaced,
            ':files'      => $filesJson,
            ':hours'      => $practiceHours
        ]);
        $logId = intval($db->lastInsertId());
        $actionMessage = "Daily work log submitted successfully.";
    }

    // 1. Create In-App Notifications for Admins and Reviewers
    try {
        if (file_exists(__DIR__ . '/../../notifications/notification_helper.php')) {
            require_once __DIR__ . '/../../notifications/notification_helper.php';

            // Find all Admin & Reviewer user IDs
            $admStmt = $db->query("
                SELECT DISTINCT u.id 
                FROM users u
                LEFT JOIN user_roles ur ON ur.user_id = u.id
                WHERE ur.role IN ('admin', 'reviewer') OR u.role IN ('admin', 'reviewer')
            ");
            $adminIds = $admStmt ? $admStmt->fetchAll(PDO::FETCH_COLUMN) : [];

            $notifTitle = "📝 New Daily Log: {$userName} ({$studentCode})";
            $filesCount = count($files);
            $notifMsg   = "Submitted practice on \"{$topicTitle}\" ({$practiceHours} hrs" . ($filesCount > 0 ? ", {$filesCount} deliverables" : "") . "). Click to evaluate & grade.";
            $actionUrl  = "/student-daily-logs?date={$date}";
            $metadata   = [
                'log_id'         => $logId,
                'user_id'        => $userId,
                'student_code'   => $studentCode,
                'student_name'   => $userName,
                'date'           => $date,
                'topic'          => $topicTitle,
                'practice_hours' => $practiceHours,
                'files_count'    => $filesCount
            ];

            foreach ($adminIds as $admId) {
                NotificationHelper::sendToUser(
                    $db,
                    (int)$admId,
                    $userId,
                    $notifTitle,
                    $notifMsg,
                    'daily_log_submission',
                    'admin',
                    $actionUrl,
                    'normal',
                    $metadata
                );
            }
        }
    } catch (\Throwable $ne) {
        error_log("Daily log admin notification error: " . $ne->getMessage());
    }

    // 2. Trigger Real-time Pusher alert to Admins & Instructors
    try {
        $pusherPayload = [
            "log_id"          => $logId,
            "user_id"         => $userId,
            "student_name"    => $userName,
            "student_code"    => $studentCode,
            "profile_picture" => $userRow['profile_picture'] ?? null,
            "date"            => $date,
            "topic"           => $topicTitle,
            "topic_title"     => $topicTitle,
            "practice_hours"  => $practiceHours,
            "files_count"     => count($files),
            "submitted_at"    => date('Y-m-d H:i:s')
        ];
        PusherHelper::trigger('admin-channel', 'student-daily-log-submitted', $pusherPayload);
    } catch (\Throwable $pt) {
        error_log("Pusher daily-log error: " . $pt->getMessage());
    }

    echo json_encode([
        "status"       => "success",
        "message"      => $actionMessage,
        "log_id"       => $logId,
        "date"         => $date,
        "topic_title"  => $topicTitle,
        "files_count"  => count($files)
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => $e->getMessage()
    ]);
}
?>
