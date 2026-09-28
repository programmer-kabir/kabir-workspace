<?php
// get_all_student_logs.php - Admin / Instructor query to list student daily logs by date

@ini_set('display_errors', '0');
error_reporting(0);

date_default_timezone_set('Asia/Dhaka');

require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../student/daily_logs/DailyLogDbHelper.php';

$filterDate   = isset($_GET['date']) ? trim($_GET['date']) : date('Y-m-d');
$searchQuery  = isset($_GET['search']) ? trim($_GET['search']) : '';
$filterStatus = isset($_GET['status']) ? trim($_GET['status']) : 'all'; // all, reviewed, pending_review, missing

try {
    $database = new Database();
    $db = $database->getConnection();
    if (!$db) {
        throw new Exception("Database connection failed.");
    }

    DailyLogDbHelper::ensureSchema($db);

    // 1. Fetch all active students
    $stuQuery = "SELECT u.id as user_id, u.name, u.email, u.profile_picture,
                        st.id as student_id, st.student_code, st.student_type, st.shift_hours,
                        att.check_in, att.check_out, att.status as attendance_status
                 FROM users u
                 JOIN students st ON u.id = st.user_id
                 LEFT JOIN attendance att ON u.id = att.user_id AND att.date = :att_date
                 WHERE u.status = 'active'
                 ORDER BY u.name ASC";

    $stuStmt = $db->prepare($stuQuery);
    $stuStmt->execute([':att_date' => $filterDate]);
    $students = $stuStmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. Fetch all logs for this date
    $logQuery = "SELECT l.*, 
                        u_rev.name as reviewer_name, 
                        u_rev.profile_picture as reviewer_avatar
                 FROM student_daily_logs l
                 LEFT JOIN users u_rev ON l.reviewed_by = u_rev.id
                 WHERE l.date = :log_date";

    $logStmt = $db->prepare($logQuery);
    $logStmt->execute([':log_date' => $filterDate]);
    $logsRaw = $logStmt->fetchAll(PDO::FETCH_ASSOC);

    $logsByUser = [];
    foreach ($logsRaw as $l) {
        $filesArr = [];
        if (!empty($l['files'])) {
            $decoded = json_decode($l['files'], true);
            if (is_array($decoded)) {
                $filesArr = $decoded;
            }
        }
        $l['files'] = $filesArr;
        $l['files_count'] = count($filesArr);
        $logsByUser[intval($l['user_id'])] = $l;
    }

    // 3. Merge students with their log status
    $resultList = [];
    $totalStudents = count($students);
    $submittedCount = 0;
    $reviewedCount = 0;
    $pendingReviewCount = 0;
    $missingCount = 0;

    foreach ($students as $s) {
        $uid = intval($s['user_id']);
        $hasLog = isset($logsByUser[$uid]);
        $logData = $hasLog ? $logsByUser[$uid] : null;

        $isReviewed = $logData && !empty($logData['reviewed_at']);
        $statusKey = 'missing';

        if ($hasLog) {
            $submittedCount++;
            if ($isReviewed) {
                $reviewedCount++;
                $statusKey = 'reviewed';
            } else {
                $pendingReviewCount++;
                $statusKey = 'pending_review';
            }
        } else {
            $missingCount++;
        }

        // Apply search filter if provided
        if (!empty($searchQuery)) {
            $q = strtolower($searchQuery);
            $nameMatch = strpos(strtolower($s['name']), $q) !== false;
            $codeMatch = strpos(strtolower($s['student_code'] ?? ''), $q) !== false;
            $topicMatch = $logData && strpos(strtolower($logData['topic_title'] ?? ''), $q) !== false;
            if (!$nameMatch && !$codeMatch && !$topicMatch) {
                continue;
            }
        }

        // Apply status filter if provided
        if ($filterStatus !== 'all' && $statusKey !== $filterStatus) {
            continue;
        }

        $resultList[] = [
            "user_id"           => $uid,
            "student_id"        => intval($s['student_id']),
            "student_code"      => $s['student_code'] ?? "STU-{$uid}",
            "student_name"      => $s['name'],
            "student_email"     => $s['email'],
            "profile_picture"   => $s['profile_picture'],
            "student_type"      => $s['student_type'] ?? 'Full-time',
            "attendance"        => [
                "status"    => $s['attendance_status'] ?? 'Absent',
                "check_in"  => $s['check_in'] ?? null,
                "check_out" => $s['check_out'] ?? null
            ],
            "log"               => $logData,
            "status"            => $statusKey // 'reviewed', 'pending_review', 'missing'
        ];
    }

    echo json_encode([
        "status" => "success",
        "data"   => [
            "date"    => $filterDate,
            "summary" => [
                "total_students"   => $totalStudents,
                "submitted"        => $submittedCount,
                "reviewed"         => $reviewedCount,
                "pending_review"   => $pendingReviewCount,
                "missing"          => $missingCount
            ],
            "students" => $resultList
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
