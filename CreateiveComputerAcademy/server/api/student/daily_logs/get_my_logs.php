<?php
// get_my_logs.php - Fetch student's own daily work logs and feedback history

@ini_set('display_errors', '0');
error_reporting(0);

date_default_timezone_set('Asia/Dhaka');

require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/DailyLogDbHelper.php';

$userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

if ($userId <= 0) {
    echo json_encode(["status" => "error", "message" => "Valid user_id is required."]);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();
    if (!$db) {
        throw new Exception("Database connection failed.");
    }

    DailyLogDbHelper::ensureSchema($db);

    $query = "SELECT l.*, 
                     u_rev.name as reviewer_name,
                     u_rev.profile_picture as reviewer_avatar
              FROM student_daily_logs l
              LEFT JOIN users u_rev ON l.reviewed_by = u_rev.id
              WHERE l.user_id = :uid
              ORDER BY l.date DESC, l.id DESC";

    $stmt = $db->prepare($query);
    $stmt->execute([':uid' => $userId]);
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $totalLogs = count($logs);
    $totalCredits = 0;
    $totalHours = 0.0;
    $totalRatings = 0;
    $ratedCount = 0;
    $formattedLogs = [];

    foreach ($logs as $row) {
        $filesArr = [];
        if (!empty($row['files'])) {
            $decoded = json_decode($row['files'], true);
            if (is_array($decoded)) {
                $filesArr = $decoded;
            }
        }

        $credits = intval($row['credits_earned'] ?? 0);
        $hours   = floatval($row['practice_hours'] ?? 0.0);
        $rating  = !empty($row['instructor_rating']) ? intval($row['instructor_rating']) : null;

        $totalCredits += $credits;
        $totalHours += $hours;
        if ($rating !== null && $rating > 0) {
            $totalRatings += $rating;
            $ratedCount++;
        }

        $formattedLogs[] = [
            "id"                  => intval($row['id']),
            "user_id"             => intval($row['user_id']),
            "date"                => $row['date'],
            "topic_title"         => $row['topic_title'],
            "summary"             => $row['summary'],
            "challenges_faced"    => $row['challenges_faced'] ?? '',
            "practice_hours"      => $hours,
            "files"               => $filesArr,
            "files_count"         => count($filesArr),
            "instructor_feedback" => $row['instructor_feedback'] ?? null,
            "instructor_rating"   => $rating,
            "reviewer_name"       => $row['reviewer_name'] ?? null,
            "reviewer_avatar"     => $row['reviewer_avatar'] ?? null,
            "reviewed_at"         => $row['reviewed_at'] ?? null,
            "credits_earned"      => $credits,
            "created_at"          => $row['created_at'],
            "updated_at"          => $row['updated_at']
        ];
    }

    $avgRating = $ratedCount > 0 ? round($totalRatings / $ratedCount, 1) : 0.0;

    echo json_encode([
        "status" => "success",
        "data"   => [
            "stats" => [
                "total_logs"     => $totalLogs,
                "total_credits"  => $totalCredits,
                "total_hours"    => round($totalHours, 1),
                "average_rating" => $avgRating,
                "rated_logs"     => $ratedCount
            ],
            "logs" => $formattedLogs
        ]
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => $e->getMessage()
    ]);
}
?>
