<?php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo json_encode(["status" => "error", "message" => "Database connection error."]);
    exit;
}

try {
    // Mode 1: Individual Student Deep-Dive if user_id is passed
    $singleUserId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

    if ($singleUserId > 0) {
        // Fetch student user info
        $table_check = $db->query("SHOW TABLES LIKE 'student_enrollments'");
        $has_enrollments = ($table_check && $table_check->rowCount() > 0);

        if ($has_enrollments) {
            $uStmt = $db->prepare("
                SELECT u.id, u.name, u.email, u.phone, u.profile_picture, u.status, u.created_at,
                       COALESCE(s.student_code, CONCAT('STU-', u.id)) AS student_code,
                       COALESCE(
                           (SELECT se.enrollment_date FROM student_enrollments se WHERE se.user_id = u.id ORDER BY se.id DESC LIMIT 1),
                           s.enrollment_date
                       ) AS enrollment_date,
                       s.guardian_phone,
                       (SELECT c.title FROM student_enrollments se JOIN courses c ON se.course_id = c.id WHERE se.user_id = u.id AND (se.status = 'active' OR se.status IS NULL) ORDER BY se.id DESC LIMIT 1) AS course_name,
                       (SELECT c.course_code FROM student_enrollments se JOIN courses c ON se.course_id = c.id WHERE se.user_id = u.id AND (se.status = 'active' OR se.status IS NULL) ORDER BY se.id DESC LIMIT 1) AS course_code
                FROM users u
                LEFT JOIN students s ON u.id = s.user_id
                WHERE u.id = ?
                LIMIT 1
            ");
        } else {
            $uStmt = $db->prepare("
                SELECT u.id, u.name, u.email, u.phone, u.profile_picture, u.status, u.created_at,
                       s.student_code, s.enrollment_date, s.guardian_phone,
                       'General Course' AS course_name, 'GEN' AS course_code
                FROM users u
                LEFT JOIN students s ON u.id = s.user_id
                WHERE u.id = ?
                LIMIT 1
            ");
        }
        $uStmt->execute([$singleUserId]);
        $studentInfo = $uStmt->fetch(PDO::FETCH_ASSOC);

        if (!$studentInfo) {
            echo json_encode(["status" => "error", "message" => "Student not found."]);
            exit;
        }

        // Fetch curriculum progress (all 14 lessons)
        $curricStmt = $db->prepare("
            SELECT lesson_id, lesson_number, lesson_title, is_completed, is_unlocked, stars, best_wpm, best_accuracy, total_attempts, last_practiced_at
            FROM student_typing_curriculum_progress
            WHERE user_id = ?
            ORDER BY lesson_id ASC
        ");
        $curricStmt->execute([$singleUserId]);
        $curricRows = $curricStmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch recent typing sessions (last 50)
        $sessStmt = $db->prepare("
            SELECT id, language, difficulty_level, wpm, cpm, accuracy_percent, mistakes_count, duration_seconds, error_keys_json, created_at
            FROM student_typing_sessions
            WHERE user_id = ?
            ORDER BY id DESC
            LIMIT 50
        ");
        $sessStmt->execute([$singleUserId]);
        $recentSessions = $sessStmt->fetchAll(PDO::FETCH_ASSOC);

        // Aggregate Weak Keys
        $weakKeysMap = [];
        foreach ($recentSessions as $sess) {
            if (!empty($sess['error_keys_json'])) {
                $decoded = json_decode($sess['error_keys_json'], true);
                if (is_array($decoded)) {
                    foreach ($decoded as $item) {
                        if (is_array($item) && isset($item['key'])) {
                            $k = strtoupper(trim($item['key']));
                            $cnt = intval($item['errors'] ?? 1);
                            $weakKeysMap[$k] = ($weakKeysMap[$k] ?? 0) + $cnt;
                        } elseif (is_string($item)) {
                            $k = strtoupper(trim($item));
                            $weakKeysMap[$k] = ($weakKeysMap[$k] ?? 0) + 1;
                        }
                    }
                }
            }
        }
        arsort($weakKeysMap);
        $topWeakKeys = [];
        foreach (array_slice($weakKeysMap, 0, 10, true) as $k => $errCount) {
            $topWeakKeys[] = ['key' => $k, 'errors' => $errCount];
        }

        // Aggregate overall numbers
        $totalCompleted = 0;
        $totalStars = 0;
        $bestWpm = 0;
        $bestAcc = 0;
        foreach ($curricRows as $c) {
            if (intval($c['is_completed']) === 1) $totalCompleted++;
            $totalStars += intval($c['stars']);
            if (intval($c['best_wpm']) > $bestWpm) $bestWpm = intval($c['best_wpm']);
            if (intval($c['best_accuracy']) > $bestAcc) $bestAcc = intval($c['best_accuracy']);
        }
        // Fallback from session log if curriculum row wasn't populated
        foreach ($recentSessions as $s) {
            if (intval($s['wpm']) > $bestWpm) $bestWpm = intval($s['wpm']);
            if (intval($s['accuracy_percent']) > $bestAcc) $bestAcc = intval($s['accuracy_percent']);
        }

        echo json_encode([
            "status" => "success",
            "data" => [
                "student" => $studentInfo,
                "curriculum_progress" => $curricRows,
                "recent_sessions" => $recentSessions,
                "weak_keys" => $topWeakKeys,
                "summary" => [
                    "completed_lessons" => $totalCompleted,
                    "total_stars" => $totalStars,
                    "best_wpm" => $bestWpm,
                    "best_accuracy" => $bestAcc,
                    "total_sessions" => count($recentSessions)
                ]
            ]
        ]);
        exit;
    }

    // Mode 2: Global Overview, Aggregates & Student List

    // 1. All Students Base Query
    $table_check_m2 = $db->query("SHOW TABLES LIKE 'student_enrollments'");
    $has_enrollments_m2 = ($table_check_m2 && $table_check_m2->rowCount() > 0);

    if ($has_enrollments_m2) {
        $studentsQuery = "
            SELECT 
                u.id AS user_id, u.name, u.email, u.phone, u.profile_picture, u.status AS user_status, u.created_at AS user_created_at,
                COALESCE(s.student_code, CONCAT('STU-', u.id)) AS student_code,
                COALESCE(
                    (SELECT se.enrollment_date FROM student_enrollments se WHERE se.user_id = u.id ORDER BY se.id DESC LIMIT 1),
                    s.enrollment_date
                ) AS enrollment_date,
                s.guardian_phone,
                (SELECT se.course_id FROM student_enrollments se WHERE se.user_id = u.id AND (se.status = 'active' OR se.status IS NULL) ORDER BY se.id DESC LIMIT 1) AS course_id,
                (SELECT c.title FROM student_enrollments se JOIN courses c ON se.course_id = c.id WHERE se.user_id = u.id AND (se.status = 'active' OR se.status IS NULL) ORDER BY se.id DESC LIMIT 1) AS course_name,
                (SELECT c.course_code FROM student_enrollments se JOIN courses c ON se.course_id = c.id WHERE se.user_id = u.id AND (se.status = 'active' OR se.status IS NULL) ORDER BY se.id DESC LIMIT 1) AS course_code
            FROM users u
            INNER JOIN user_roles ur ON u.id = ur.user_id
            LEFT JOIN students s ON u.id = s.user_id
            WHERE ur.role = 'student' OR EXISTS (SELECT 1 FROM students st WHERE st.user_id = u.id)
            GROUP BY u.id
            ORDER BY u.name ASC
        ";
    } else {
        $studentsQuery = "
            SELECT 
                u.id AS user_id, u.name, u.email, u.phone, u.profile_picture, u.status AS user_status, u.created_at AS user_created_at,
                s.student_code, s.enrollment_date, s.guardian_phone,
                NULL AS course_id, 'General Course' AS course_name, 'GEN' AS course_code
            FROM users u
            INNER JOIN user_roles ur ON u.id = ur.user_id
            LEFT JOIN students s ON u.id = s.user_id
            WHERE ur.role = 'student' OR EXISTS (SELECT 1 FROM students st WHERE st.user_id = u.id)
            GROUP BY u.id
            ORDER BY u.name ASC
        ";
    }
    $stuStmt = $db->query($studentsQuery);
    $allStudents = $stuStmt ? $stuStmt->fetchAll(PDO::FETCH_ASSOC) : [];

    // 2. Fetch all curriculum progress rows in one fast query
    $allCurricQuery = "
        SELECT user_id, lesson_id, lesson_number, is_completed, is_unlocked, stars, best_wpm, best_accuracy, total_attempts, last_practiced_at
        FROM student_typing_curriculum_progress
        ORDER BY user_id ASC, lesson_id ASC
    ";
    $curricStmt = $db->query($allCurricQuery);
    $allCurric = $curricStmt ? $curricStmt->fetchAll(PDO::FETCH_ASSOC) : [];

    $curricByUser = [];
    foreach ($allCurric as $row) {
        $uid = intval($row['user_id']);
        if (!isset($curricByUser[$uid])) {
            $curricByUser[$uid] = [];
        }
        $curricByUser[$uid][intval($row['lesson_id'])] = $row;
    }

    // 3. Fetch aggregated session metrics per user in one fast GROUP BY query
    $allSessQuery = "
        SELECT 
            user_id,
            COUNT(id) AS total_sessions,
            MAX(wpm) AS peak_wpm,
            AVG(accuracy_percent) AS avg_accuracy,
            SUM(duration_seconds) AS total_duration_seconds,
            MAX(created_at) AS last_session_at
        FROM student_typing_sessions
        GROUP BY user_id
    ";
    $sessStmt = $db->query($allSessQuery);
    $allSessAgg = $sessStmt ? $sessStmt->fetchAll(PDO::FETCH_ASSOC) : [];

    $sessByUser = [];
    foreach ($allSessAgg as $row) {
        $sessByUser[intval($row['user_id'])] = $row;
    }

    // 4. Merge and assemble student typing report objects
    $studentReports = [];
    $totalPracticing = 0;
    $totalGraduates = 0;
    $academyWpmSum = 0;
    $academyAccSum = 0;
    $academyTotalSeconds = 0;
    $peakSpeedRecord = 0;
    $peakSpeedHolder = 'None';

    // Funnel counters for lessons 1 to 14
    $lessonFunnel = [];
    for ($i = 1; $i <= 14; $i++) {
        $lessonFunnel[$i] = [
            'lesson_id' => $i,
            'unlocked_count' => 0,
            'completed_count' => 0,
            'total_wpm_sum' => 0,
            'wpm_count' => 0
        ];
    }

    foreach ($allStudents as $stu) {
        $uid = intval($stu['user_id']);
        $userCurric = $curricByUser[$uid] ?? [];
        $userSess = $sessByUser[$uid] ?? null;

        $completedCount = 0;
        $totalStars = 0;
        $highestUnlocked = 1;
        $bestWpm = 0;
        $bestAcc = 0;
        $lastPracticed = null;

        // Build 14-lesson mini array
        $lessonGrid = [];
        for ($l = 1; $l <= 14; $l++) {
            $cRow = $userCurric[$l] ?? null;
            $isUnlocked = $l === 1 || ($cRow && intval($cRow['is_unlocked']) === 1);
            $isCompleted = $cRow ? (intval($cRow['is_completed']) === 1) : false;
            $stars = $cRow ? intval($cRow['stars']) : 0;
            $lWpm = $cRow ? intval($cRow['best_wpm']) : 0;
            $lAcc = $cRow ? intval($cRow['best_accuracy']) : 0;

            if ($isCompleted) {
                $completedCount++;
                $lessonFunnel[$l]['completed_count']++;
            }
            if ($isUnlocked) {
                $highestUnlocked = max($highestUnlocked, $l);
                $lessonFunnel[$l]['unlocked_count']++;
            }
            if ($lWpm > 0) {
                $lessonFunnel[$l]['total_wpm_sum'] += $lWpm;
                $lessonFunnel[$l]['wpm_count']++;
            }

            $totalStars += $stars;
            if ($lWpm > $bestWpm) $bestWpm = $lWpm;
            if ($lAcc > $bestAcc) $bestAcc = $lAcc;

            if ($cRow && !empty($cRow['last_practiced_at'])) {
                if (!$lastPracticed || strtotime($cRow['last_practiced_at']) > strtotime($lastPracticed)) {
                    $lastPracticed = $cRow['last_practiced_at'];
                }
            }

            $lessonGrid[] = [
                'lesson_id' => $l,
                'unlocked' => $isUnlocked,
                'completed' => $isCompleted,
                'stars' => $stars,
                'best_wpm' => $lWpm
            ];
        }

        // Integrate session logs if curriculum rows were sparse
        $totalSessions = $userSess ? intval($userSess['total_sessions']) : 0;
        $sessionPeakWpm = $userSess ? intval($userSess['peak_wpm']) : 0;
        $sessionAvgAcc = $userSess ? round(floatval($userSess['avg_accuracy']), 1) : 0;
        $durationSec = $userSess ? intval($userSess['total_duration_seconds']) : 0;

        if ($sessionPeakWpm > $bestWpm) $bestWpm = $sessionPeakWpm;
        if ($sessionAvgAcc > $bestAcc) $bestAcc = $sessionAvgAcc;
        if ($userSess && !empty($userSess['last_session_at'])) {
            if (!$lastPracticed || strtotime($userSess['last_session_at']) > strtotime($lastPracticed)) {
                $lastPracticed = $userSess['last_session_at'];
            }
        }

        $isPracticing = ($totalSessions > 0 || $completedCount > 0 || $bestWpm > 0);
        if ($isPracticing) {
            $totalPracticing++;
            $academyWpmSum += $bestWpm;
            $academyAccSum += ($bestAcc > 0 ? $bestAcc : 95);
            $academyTotalSeconds += $durationSec;

            if ($bestWpm > $peakSpeedRecord) {
                $peakSpeedRecord = $bestWpm;
                $peakSpeedHolder = $stu['name'];
            }
        }

        if ($completedCount >= 14) {
            $totalGraduates++;
        }

        // Determine speed tier
        $tier = 'Not Started';
        if ($isPracticing) {
            if ($bestWpm >= 60) $tier = 'Master (60+ WPM)';
            elseif ($bestWpm >= 40) $tier = 'Advanced (40-59 WPM)';
            elseif ($bestWpm >= 20) $tier = 'Intermediate (20-39 WPM)';
            else $tier = 'Beginner (<20 WPM)';
        }

        $studentReports[] = [
            'user_id' => $uid,
            'name' => $stu['name'],
            'email' => $stu['email'],
            'phone' => $stu['phone'],
            'profile_picture' => $stu['profile_picture'],
            'student_code' => $stu['student_code'] ?: ('CCA-' . str_pad($uid, 4, '0', STR_PAD_LEFT)),
            'course_id' => $stu['course_id'],
            'course_name' => $stu['course_name'] ?: 'Foundation Computer',
            'user_status' => $stu['user_status'],
            'enrollment_date' => $stu['enrollment_date'],
            'is_practicing' => $isPracticing,
            'current_lesson' => $highestUnlocked,
            'completed_lessons' => $completedCount,
            'completion_percent' => round(($completedCount / 14) * 100),
            'total_stars' => $totalStars,
            'best_wpm' => $bestWpm,
            'best_accuracy' => $bestAcc > 0 ? $bestAcc : ($isPracticing ? 95 : 0),
            'total_sessions' => $totalSessions,
            'total_minutes' => round($durationSec / 60, 1),
            'last_practiced_at' => $lastPracticed,
            'proficiency_tier' => $tier,
            'lesson_grid' => $lessonGrid
        ];
    }

    // 5. Generate Leaderboard Rankings (Top 10 by Best WPM)
    $leaderboard = array_filter($studentReports, fn($s) => $s['is_practicing'] && $s['best_wpm'] > 0);
    usort($leaderboard, function ($a, $b) {
        if ($b['best_wpm'] !== $a['best_wpm']) {
            return $b['best_wpm'] - $a['best_wpm'];
        }
        return $b['best_accuracy'] - $a['best_accuracy'];
    });
    $topTypists = array_values(array_slice($leaderboard, 0, 10));

    // 6. Global KPI summary metrics
    $totalEnrolled = count($allStudents);
    $avgAcademyWpm = $totalPracticing > 0 ? round($academyWpmSum / $totalPracticing) : 0;
    $avgAcademyAcc = $totalPracticing > 0 ? round($academyAccSum / $totalPracticing) : 0;
    $totalPracticeHours = round($academyTotalSeconds / 3600, 1);

    // Compute average WPM for funnel lessons
    $funnelList = [];
    foreach ($lessonFunnel as $lId => $data) {
        $funnelList[] = [
            'lesson_id' => $lId,
            'unlocked_count' => $data['unlocked_count'],
            'completed_count' => $data['completed_count'],
            'avg_wpm' => $data['wpm_count'] > 0 ? round($data['total_wpm_sum'] / $data['wpm_count']) : 0
        ];
    }

    echo json_encode([
        "status" => "success",
        "data" => [
            "kpi" => [
                "total_enrolled" => $totalEnrolled,
                "total_practicing" => $totalPracticing,
                "total_graduates" => $totalGraduates,
                "graduation_rate_percent" => $totalEnrolled > 0 ? round(($totalGraduates / $totalEnrolled) * 100, 1) : 0,
                "academy_avg_wpm" => $avgAcademyWpm,
                "academy_peak_wpm" => $peakSpeedRecord,
                "peak_wpm_holder" => $peakSpeedHolder,
                "academy_avg_accuracy" => $avgAcademyAcc,
                "total_practice_hours" => $totalPracticeHours
            ],
            "leaderboard" => $topTypists,
            "lesson_funnel" => $funnelList,
            "students" => $studentReports
        ]
    ]);

} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Database exception: " . $e->getMessage()
    ]);
}
