<?php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';

// Ensure Bangladesh Standard Time
date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo json_encode(["status" => "error", "message" => "Database connection error."]);
    exit;
}

// Stage Catalog Reference (All 21 Stages in Exact Sequence)
$STAGE_CATALOG = [
    0  => ['name' => 'Line', 'minNodes' => 3],
    1  => ['name' => 'Home', 'minNodes' => 5],
    2  => ['name' => 'Circle', 'minNodes' => 4],
    3  => ['name' => 'Heart', 'minNodes' => 2],
    4  => ['name' => 'Apple with Leaf', 'minNodes' => 8],
    5  => ['name' => 'Fish', 'minNodes' => 6],
    6  => ['name' => 'Butterfly', 'minNodes' => 10],
    7  => ['name' => 'Royal Crown', 'minNodes' => 7],
    8  => ['name' => 'Coffee Cup', 'minNodes' => 8],
    9  => ['name' => 'Nautical Anchor', 'minNodes' => 12],
    10 => ['name' => 'VW Beetle', 'minNodes' => 9],
    11 => ['name' => 'Plane', 'minNodes' => 10],
    12 => ['name' => 'Clip', 'minNodes' => 8],
    13 => ['name' => 'Wrench', 'minNodes' => 8],
    14 => ['name' => 'Cloud', 'minNodes' => 5],
    15 => ['name' => 'Profile', 'minNodes' => 9],
    16 => ['name' => 'Duck', 'minNodes' => 9],
    17 => ['name' => 'Cap', 'minNodes' => 9],
    18 => ['name' => 'Letter', 'minNodes' => 6],
    19 => ['name' => 'Guitar', 'minNodes' => 10],
    20 => ['name' => 'Flag', 'minNodes' => 9]
];

try {
    $singleUserId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

    // ─────────────────────────────────────────────────────────────────
    // MODE 1: SINGLE STUDENT MICROSCOPIC DEEP DIVE
    // ─────────────────────────────────────────────────────────────────
    if ($singleUserId > 0) {
        // 1. Fetch Student User & Academic Info
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

        // 2. Fetch Progress for All Stages
        $pStmt = $db->prepare("
            SELECT stage_id, stage_name, is_completed, is_unlocked, min_nodes, best_nodes_used,
                   last_nodes_used, node_variance, efficiency_percent, stars, total_attempts,
                   best_time_seconds, total_time_seconds, last_practiced_at
            FROM student_pentool_stage_progress
            WHERE user_id = ?
            ORDER BY stage_id ASC
        ");
        $pStmt->execute([$singleUserId]);
        $progressRows = $pStmt->fetchAll(PDO::FETCH_ASSOC);

        $progressMap = [];
        foreach ($progressRows as $p) {
            $progressMap[intval($p['stage_id'])] = $p;
        }

        // Build Complete 21-Stage Matrix (Ensuring every stage from 0 to 20 is present)
        $stagesMatrix = [];
        $totalCompleted = 0;
        $totalStars = 0;
        $totalAttempts = 0;
        $totalPracticeSeconds = 0;
        $efficiencySum = 0;
        $highestStageIndex = 0;

        for ($idx = 0; $idx <= 20; $idx++) {
            $cat = $STAGE_CATALOG[$idx];
            $saved = $progressMap[$idx] ?? null;

            $isCompleted = $saved ? intval($saved['is_completed']) : 0;
            $isUnlocked = $saved ? intval($saved['is_unlocked']) : ($idx === 0 ? 1 : 0);
            $minNodes = $saved ? intval($saved['min_nodes']) : $cat['minNodes'];
            if ($minNodes <= 0) $minNodes = $cat['minNodes'];

            $bestNodes = $saved ? intval($saved['best_nodes_used']) : 0;
            $lastNodes = $saved ? intval($saved['last_nodes_used']) : 0;
            $variance = $saved ? intval($saved['node_variance']) : 0;
            $eff = $saved ? floatval($saved['efficiency_percent']) : 0.0;
            $stars = $saved ? intval($saved['stars']) : 0;
            $attempts = $saved ? intval($saved['total_attempts']) : 0;
            $bestTime = $saved ? intval($saved['best_time_seconds']) : 0;
            $totalTime = $saved ? intval($saved['total_time_seconds']) : 0;
            $lastPracticed = $saved ? $saved['last_practiced_at'] : null;

            if ($isCompleted === 1) {
                $totalCompleted++;
                $totalStars += $stars;
                $efficiencySum += $eff;
                if ($idx > $highestStageIndex) $highestStageIndex = $idx;
            }

            $totalAttempts += $attempts;
            $totalPracticeSeconds += $totalTime;

            $stagesMatrix[] = [
                'stage_id' => $idx,
                'stage_number' => $idx + 1,
                'stage_name' => $cat['name'],
                'is_completed' => $isCompleted,
                'is_unlocked' => $isUnlocked,
                'min_nodes' => $minNodes,
                'best_nodes_used' => $bestNodes,
                'last_nodes_used' => $lastNodes,
                'node_variance' => $variance,
                'efficiency_percent' => $eff,
                'stars' => $stars,
                'total_attempts' => $attempts,
                'best_time_seconds' => $bestTime,
                'total_time_seconds' => $totalTime,
                'last_practiced_at' => $lastPracticed
            ];
        }

        $avgEfficiency = $totalCompleted > 0 ? round($efficiencySum / $totalCompleted, 1) : 0;
        $recentSessions = [];

        echo json_encode([
            "status" => "success",
            "data" => [
                "student" => $studentInfo,
                "summary" => [
                    "total_completed" => $totalCompleted,
                    "total_stages" => 21,
                    "completion_percent" => round(($totalCompleted / 21) * 100, 1),
                    "highest_stage_index" => $highestStageIndex,
                    "highest_stage_name" => $STAGE_CATALOG[$highestStageIndex]['name'],
                    "avg_efficiency_percent" => $avgEfficiency,
                    "total_stars" => $totalStars,
                    "total_attempts" => $totalAttempts,
                    "total_practice_seconds" => $totalPracticeSeconds,
                    "is_graduated" => ($totalCompleted >= 21)
                ],
                "stages" => $stagesMatrix,
                "recent_sessions" => $recentSessions
            ]
        ]);
        exit;
    }

    // ─────────────────────────────────────────────────────────────────
    // MODE 2: DIRECTORY & ACADEMY MACRO KPI MODE
    // ─────────────────────────────────────────────────────────────────

    // 1. Fetch All Enrolled Students & Their Pen Tool Aggregates
    $table_check_m2 = $db->query("SHOW TABLES LIKE 'student_enrollments'");
    $has_enrollments_m2 = ($table_check_m2 && $table_check_m2->rowCount() > 0);

    if ($has_enrollments_m2) {
        $rosterQuery = "
            SELECT u.id AS user_id, u.name, u.email, u.phone, u.profile_picture, u.status,
                   COALESCE(s.student_code, CONCAT('STU-', u.id)) AS student_code,
                   COALESCE(
                       (SELECT se.enrollment_date FROM student_enrollments se WHERE se.user_id = u.id ORDER BY se.id DESC LIMIT 1),
                       s.enrollment_date
                   ) AS enrollment_date,
                   (SELECT c.title FROM student_enrollments se JOIN courses c ON se.course_id = c.id WHERE se.user_id = u.id AND (se.status = 'active' OR se.status IS NULL) ORDER BY se.id DESC LIMIT 1) AS course_name,
                   (SELECT c.course_code FROM student_enrollments se JOIN courses c ON se.course_id = c.id WHERE se.user_id = u.id AND (se.status = 'active' OR se.status IS NULL) ORDER BY se.id DESC LIMIT 1) AS course_code,
                   COALESCE(pt.completed_count, 0) AS completed_stages,
                   COALESCE(pt.total_stars, 0) AS total_stars,
                   COALESCE(pt.avg_efficiency, 0) AS avg_efficiency,
                   COALESCE(pt.total_attempts, 0) AS total_attempts,
                   COALESCE(pt.total_time_seconds, 0) AS total_time_seconds,
                   COALESCE(pt.highest_stage_id, 0) AS current_stage_id,
                   pt.last_practiced_at
            FROM users u
            INNER JOIN students s ON u.id = s.user_id
            LEFT JOIN (
                SELECT user_id,
                       COUNT(CASE WHEN is_completed = 1 THEN 1 END) AS completed_count,
                       SUM(stars) AS total_stars,
                       ROUND(AVG(CASE WHEN is_completed = 1 THEN efficiency_percent END), 1) AS avg_efficiency,
                       SUM(total_attempts) AS total_attempts,
                       SUM(total_time_seconds) AS total_time_seconds,
                       MAX(CASE WHEN is_completed = 1 THEN stage_id ELSE 0 END) AS highest_stage_id,
                       MAX(last_practiced_at) AS last_practiced_at
                FROM student_pentool_stage_progress
                GROUP BY user_id
            ) pt ON u.id = pt.user_id
            ORDER BY completed_stages DESC, avg_efficiency DESC, last_practiced_at DESC
        ";
    } else {
        $rosterQuery = "
            SELECT u.id AS user_id, u.name, u.email, u.phone, u.profile_picture, u.status,
                   s.student_code, s.enrollment_date,
                   'General Course' AS course_name, 'GEN' AS course_code,
                   COALESCE(pt.completed_count, 0) AS completed_stages,
                   COALESCE(pt.total_stars, 0) AS total_stars,
                   COALESCE(pt.avg_efficiency, 0) AS avg_efficiency,
                   COALESCE(pt.total_attempts, 0) AS total_attempts,
                   COALESCE(pt.total_time_seconds, 0) AS total_time_seconds,
                   COALESCE(pt.highest_stage_id, 0) AS current_stage_id,
                   pt.last_practiced_at
            FROM users u
            INNER JOIN students s ON u.id = s.user_id
            LEFT JOIN (
                SELECT user_id,
                       COUNT(CASE WHEN is_completed = 1 THEN 1 END) AS completed_count,
                       SUM(stars) AS total_stars,
                       ROUND(AVG(CASE WHEN is_completed = 1 THEN efficiency_percent END), 1) AS avg_efficiency,
                       SUM(total_attempts) AS total_attempts,
                       SUM(total_time_seconds) AS total_time_seconds,
                       MAX(CASE WHEN is_completed = 1 THEN stage_id ELSE 0 END) AS highest_stage_id,
                       MAX(last_practiced_at) AS last_practiced_at
                FROM student_pentool_stage_progress
                GROUP BY user_id
            ) pt ON u.id = pt.user_id
            ORDER BY completed_stages DESC, avg_efficiency DESC, last_practiced_at DESC
        ";
    }
    $rosterStmt = $db->query($rosterQuery);
    $rawStudents = $rosterStmt->fetchAll(PDO::FETCH_ASSOC);

    $students = [];
    $totalEnrolled = count($rawStudents);
    $totalPracticing = 0;
    $totalGraduates = 0;
    $totalAcademySeconds = 0;
    $totalEfficiencySum = 0;
    $efficiencyCount = 0;

    foreach ($rawStudents as $stu) {
        $cCount = intval($stu['completed_stages']);
        $attempts = intval($stu['total_attempts']);
        $isPracticing = ($cCount > 0 || $attempts > 0);
        if ($isPracticing) $totalPracticing++;
        if ($cCount >= 21) $totalGraduates++;

        $totalAcademySeconds += intval($stu['total_time_seconds']);
        if ($cCount > 0 && floatval($stu['avg_efficiency']) > 0) {
            $totalEfficiencySum += floatval($stu['avg_efficiency']);
            $efficiencyCount++;
        }

        $cStageId = intval($stu['current_stage_id']);
        $cStageName = $STAGE_CATALOG[$cStageId]['name'] ?? ("Stage " . ($cStageId + 1));

        $students[] = [
            'user_id' => intval($stu['user_id']),
            'name' => $stu['name'],
            'email' => $stu['email'],
            'phone' => $stu['phone'],
            'profile_picture' => $stu['profile_picture'],
            'student_code' => $stu['student_code'],
            'course_name' => $stu['course_name'] ?? 'General Vector',
            'course_code' => $stu['course_code'] ?? 'CCA-VEC',
            'enrollment_date' => $stu['enrollment_date'],
            'completed_stages' => $cCount,
            'total_stages' => 21,
            'completion_percent' => round(($cCount / 21) * 100, 1),
            'current_stage_id' => $cStageId,
            'current_stage_name' => $cStageName,
            'avg_efficiency' => floatval($stu['avg_efficiency']),
            'total_stars' => intval($stu['total_stars']),
            'total_attempts' => $attempts,
            'total_time_seconds' => intval($stu['total_time_seconds']),
            'last_practiced_at' => $stu['last_practiced_at'],
            'is_practicing' => $isPracticing,
            'is_graduated' => ($cCount >= 21)
        ];
    }

    $academyAvgEfficiency = $efficiencyCount > 0 ? round($totalEfficiencySum / $efficiencyCount, 1) : 0;
    $gradRate = $totalEnrolled > 0 ? round(($totalGraduates / $totalEnrolled) * 100, 1) : 0;

    // 2. Stage Funnel Analysis: Count how many students completed each stage
    $funnelStmt = $db->query("
        SELECT stage_id, COUNT(id) AS completions_count, AVG(total_attempts) AS avg_attempts, AVG(efficiency_percent) AS avg_eff
        FROM student_pentool_stage_progress
        WHERE is_completed = 1
        GROUP BY stage_id
        ORDER BY stage_id ASC
    ");
    $funnelRows = $funnelStmt->fetchAll(PDO::FETCH_ASSOC);

    $funnelMap = [];
    foreach ($funnelRows as $f) {
        $funnelMap[intval($f['stage_id'])] = $f;
    }

    $stageFunnel = [];
    $toughestStage = 'None';
    $highestAttempts = 0;

    for ($i = 0; $i <= 20; $i++) {
        $fData = $funnelMap[$i] ?? null;
        $comps = $fData ? intval($fData['completions_count']) : 0;
        $avgAtt = $fData ? round(floatval($fData['avg_attempts']), 1) : 1.0;
        $avgEf = $fData ? round(floatval($fData['avg_eff']), 1) : 100.0;

        if ($avgAtt > $highestAttempts && $comps > 0) {
            $highestAttempts = $avgAtt;
            $toughestStage = "Stage " . ($i + 1) . " (" . $STAGE_CATALOG[$i]['name'] . ")";
        }

        $stageFunnel[] = [
            'stage_id' => $i,
            'stage_name' => $STAGE_CATALOG[$i]['name'],
            'min_nodes' => $STAGE_CATALOG[$i]['minNodes'],
            'completed_students' => $comps,
            'avg_attempts' => $avgAtt,
            'avg_efficiency' => $avgEf
        ];
    }

    echo json_encode([
        "status" => "success",
        "data" => [
            "kpi" => [
                "total_enrolled" => $totalEnrolled,
                "total_practicing" => $totalPracticing,
                "total_graduates" => $totalGraduates,
                "graduation_rate_percent" => $gradRate,
                "academy_avg_efficiency" => $academyAvgEfficiency,
                "total_practice_hours" => round($totalAcademySeconds / 3600, 1),
                "total_practice_seconds" => $totalAcademySeconds,
                "toughest_stage" => $toughestStage
            ],
            "students" => $students,
            "stage_funnel" => $stageFunnel
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
