<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo json_encode(["status" => "error", "message" => "Database connection error."]);
    exit;
}

$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

if ($user_id <= 0) {
    echo json_encode(["status" => "error", "message" => "Valid User ID is required."]);
    exit;
}

try {
    // 1. Overall Stats
    // Best WPMs
    $wpmStmt = $db->prepare("
        SELECT 
            MAX(CASE WHEN language = 'en' THEN wpm ELSE 0 END) AS best_wpm_en,
            MAX(CASE WHEN language IN ('bn_avro', 'bn_bijoy') THEN wpm ELSE 0 END) AS best_wpm_bn,
            AVG(accuracy_percent) AS avg_typing_accuracy,
            COUNT(id) AS total_typing_tests,
            SUM(duration_seconds) AS total_typing_seconds
        FROM student_typing_sessions
        WHERE user_id = ?
    ");
    $wpmStmt->execute([$user_id]);
    $typingStats = $wpmStmt->fetch(PDO::FETCH_ASSOC);

    // Mouse & Drill Stats
    $drillStmt = $db->prepare("
        SELECT 
            COUNT(id) AS total_drills_completed,
            AVG(accuracy_percent) AS avg_drill_accuracy,
            AVG(reaction_time_ms) AS avg_reaction_time,
            SUM(duration_seconds) AS total_drill_seconds
        FROM student_foundations_drills
        WHERE user_id = ?
    ");
    $drillStmt->execute([$user_id]);
    $drillStats = $drillStmt->fetch(PDO::FETCH_ASSOC);

    // 2. Recent Typing Sessions (Last 50 for complete history & lesson breakdown)
    $recTypingStmt = $db->prepare("
        SELECT id, language, difficulty_level, wpm, cpm, accuracy_percent, mistakes_count, duration_seconds, created_at
        FROM student_typing_sessions
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT 50
    ");
    $recTypingStmt->execute([$user_id]);
    $recentTyping = $recTypingStmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Curriculum Progress (Lesson by lesson status & unlocked states)
    $curricStmt = $db->prepare("
        SELECT lesson_id, lesson_number, lesson_title, is_completed, is_unlocked, stars, best_wpm, best_accuracy, total_attempts, last_practiced_at
        FROM student_typing_curriculum_progress
        WHERE user_id = ?
        ORDER BY lesson_id ASC
    ");
    $curricStmt->execute([$user_id]);
    $curriculumProgress = $curricStmt->fetchAll(PDO::FETCH_ASSOC);

    // 4. Recent Mouse & Shortcuts Drills (Last 10)
    $recDrillStmt = $db->prepare("
        SELECT id, drill_type, level_no, score, accuracy_percent, reaction_time_ms, duration_seconds, completed_at
        FROM student_foundations_drills
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT 10
    ");
    $recDrillStmt->execute([$user_id]);
    $recentDrills = $recDrillStmt->fetchAll(PDO::FETCH_ASSOC);

    // 4. Weak Keys Heatmap Aggregate (Last 30 sessions)
    $errStmt = $db->prepare("
        SELECT error_keys_json
        FROM student_typing_sessions
        WHERE user_id = ? AND error_keys_json IS NOT NULL AND error_keys_json != ''
        ORDER BY id DESC
        LIMIT 30
    ");
    $errStmt->execute([$user_id]);
    $errorRows = $errStmt->fetchAll(PDO::FETCH_ASSOC);

    $weakKeysMap = [];
    foreach ($errorRows as $row) {
        $decoded = json_decode($row['error_keys_json'], true);
        if (is_array($decoded)) {
            foreach ($decoded as $key => $count) {
                $cleanKey = strtolower(trim($key));
                if (!isset($weakKeysMap[$cleanKey])) {
                    $weakKeysMap[$cleanKey] = 0;
                }
                $weakKeysMap[$cleanKey] += intval($count);
            }
        }
    }
    arsort($weakKeysMap);

    // 5. Badges
    $badgeStmt = $db->prepare("
        SELECT badge_code, badge_title, badge_category, badge_icon, description, unlocked_at
        FROM student_skill_badges
        WHERE user_id = ?
        ORDER BY id DESC
    ");
    $badgeStmt->execute([$user_id]);
    $unlockedBadges = $badgeStmt->fetchAll(PDO::FETCH_ASSOC);

    // System defined badges master catalog
    $allBadgesCatalog = [
        ["code" => "first_step", "title" => "First Step", "category" => "general", "icon" => "🌱", "desc" => "Completed your very first computer foundation drill."],
        ["code" => "mouse_rookie", "title" => "Mouse Rookie", "category" => "mouse", "icon" => "🖱️", "desc" => "Successfully completed Single & Double Click training."],
        ["code" => "mouse_ninja", "title" => "Mouse Ninja", "category" => "mouse", "icon" => "🎯", "desc" => "Achieved 95%+ accuracy in Balloon Popper & Target Aim."],
        ["code" => "drag_drop_pro", "title" => "Desktop Organizer", "category" => "mouse", "icon" => "📂", "desc" => "Mastered Drag & Drop and File Management drill."],
        ["code" => "home_row_hero", "title" => "Home Row Hero", "category" => "typing", "icon" => "⌨️", "desc" => "Mastered ASDF JKL; touch typing with 90%+ accuracy."],
        ["code" => "typing_speedster_20", "title" => "Typing Speedster (20+ WPM)", "category" => "typing", "icon" => "⚡", "desc" => "Reached 20 Words Per Minute typing speed."],
        ["code" => "typing_ninja_35", "title" => "Typing Ninja (35+ WPM)", "category" => "typing", "icon" => "🚀", "desc" => "Reached 35 Words Per Minute typing speed."],
        ["code" => "typing_master_50", "title" => "Typing Master (50+ WPM)", "category" => "typing", "icon" => "👑", "desc" => "Reached 50 Words Per Minute typing speed."],
        ["code" => "bangla_typist", "title" => "Bangla Typist", "category" => "typing", "icon" => "🇧🇩", "desc" => "Successfully completed Bengali typing test with 15+ WPM."],
        ["code" => "shortcuts_wizard", "title" => "Shortcuts Wizard", "category" => "shortcuts", "icon" => "🪄", "desc" => "Mastered top 10 essential OS & productivity shortcuts."],
        ["code" => "foundations_graduate", "title" => "Foundations Graduate", "category" => "general", "icon" => "🎓", "desc" => "Completed all foundation modules and earned graduation certificate."]
    ];

    $unlockedMap = [];
    foreach ($unlockedBadges as $ub) {
        $unlockedMap[$ub['badge_code']] = $ub;
    }

    $finalBadges = [];
    foreach ($allBadgesCatalog as $catBadge) {
        $isUnlocked = isset($unlockedMap[$catBadge['code']]);
        $finalBadges[] = [
            "code" => $catBadge['code'],
            "title" => $catBadge['title'],
            "category" => $catBadge['category'],
            "icon" => $catBadge['icon'],
            "description" => $catBadge['desc'],
            "is_unlocked" => $isUnlocked,
            "unlocked_at" => $isUnlocked ? $unlockedMap[$catBadge['code']]['unlocked_at'] : null
        ];
    }

    $totalTimeMins = round((($typingStats['total_typing_seconds'] ?? 0) + ($drillStats['total_drill_seconds'] ?? 0)) / 60, 1);

    echo json_encode([
        "status" => "success",
        "data" => [
            "stats" => [
                "best_wpm_en" => intval($typingStats['best_wpm_en'] ?? 0),
                "best_wpm_bn" => intval($typingStats['best_wpm_bn'] ?? 0),
                "avg_typing_accuracy" => round(floatval($typingStats['avg_typing_accuracy'] ?? 100), 1),
                "total_typing_tests" => intval($typingStats['total_typing_tests'] ?? 0),
                "total_drills_completed" => intval($drillStats['total_drills_completed'] ?? 0),
                "avg_drill_accuracy" => round(floatval($drillStats['avg_drill_accuracy'] ?? 100), 1),
                "avg_reaction_time_ms" => round(floatval($drillStats['avg_reaction_time'] ?? 0)),
                "total_practice_time_mins" => $totalTimeMins,
                "unlocked_badges_count" => count($unlockedBadges),
                "total_badges_count" => count($allBadgesCatalog)
            ],
            "recent_typing" => $recentTyping,
            "curriculum_progress" => $curriculumProgress,
            "recent_drills" => $recentDrills,
            "weak_keys" => $weakKeysMap,
            "badges" => $finalBadges
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
