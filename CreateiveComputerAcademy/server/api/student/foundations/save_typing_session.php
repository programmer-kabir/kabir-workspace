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

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    echo json_encode(["status" => "error", "message" => "Invalid JSON payload."]);
    exit;
}

$user_id = isset($data['user_id']) ? intval($data['user_id']) : 0;
$language = isset($data['language']) && in_array($data['language'], ['en', 'bn_avro', 'bn_bijoy']) ? $data['language'] : 'en';
$difficulty_level = !empty($data['difficulty_level']) ? trim($data['difficulty_level']) : 'lesson_1';
$wpm = isset($data['wpm']) ? max(0, intval($data['wpm'])) : 0;
$cpm = isset($data['cpm']) ? max(0, intval($data['cpm'])) : 0;
$accuracy_percent = isset($data['accuracy_percent']) ? max(0, min(100, intval($data['accuracy_percent']))) : 100;
$raw_wpm = isset($data['raw_wpm']) ? max(0, intval($data['raw_wpm'])) : $wpm;
$mistakes_count = isset($data['mistakes_count']) ? max(0, intval($data['mistakes_count'])) : 0;
$error_keys = isset($data['error_keys']) && is_array($data['error_keys']) ? json_encode($data['error_keys']) : null;
$duration_seconds = isset($data['duration_seconds']) ? max(5, intval($data['duration_seconds'])) : 60;

if ($user_id <= 0) {
    echo json_encode(["status" => "error", "message" => "Valid User ID is required."]);
    exit;
}

try {
    // 1. Insert Typing Session Record
    $stmt = $db->prepare("
        INSERT INTO student_typing_sessions 
        (user_id, language, difficulty_level, wpm, cpm, accuracy_percent, raw_wpm, mistakes_count, error_keys_json, duration_seconds)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $user_id, $language, $difficulty_level, $wpm, $cpm, $accuracy_percent, $raw_wpm, $mistakes_count, $error_keys, $duration_seconds
    ]);

    // 3. Update Curriculum Progress in MySQL ONLY for actual curriculum lessons
    if (preg_match('/lesson_(\d+)/i', $difficulty_level, $matches)) {
        $lesson_id = intval($matches[1]);
        $stars = ($accuracy_percent >= 98 && $wpm >= 15) ? 3 : (($accuracy_percent >= 95) ? 2 : 1);
        $lesson_title = isset($data['lesson_title']) ? trim($data['lesson_title']) : "Lesson {$lesson_id}";

        $curricStmt = $db->prepare("
            INSERT INTO student_typing_curriculum_progress
            (user_id, lesson_id, lesson_number, lesson_title, is_completed, is_unlocked, stars, best_wpm, best_accuracy, total_attempts)
            VALUES (?, ?, ?, ?, 1, 1, ?, ?, ?, 1)
            ON DUPLICATE KEY UPDATE
                is_completed = 1,
                is_unlocked = 1,
                stars = GREATEST(stars, VALUES(stars)),
                best_wpm = GREATEST(best_wpm, VALUES(best_wpm)),
                best_accuracy = GREATEST(best_accuracy, VALUES(best_accuracy)),
                total_attempts = total_attempts + 1,
                last_practiced_at = CURRENT_TIMESTAMP
        ");
        $curricStmt->execute([
            $user_id, $lesson_id, (string)$lesson_id, $lesson_title, $stars, $wpm, $accuracy_percent
        ]);

        // Auto-unlock next lesson
        $next_lesson_id = $lesson_id + 1;
        if ($next_lesson_id <= 14) {
            $nextStmt = $db->prepare("
                INSERT INTO student_typing_curriculum_progress
                (user_id, lesson_id, lesson_number, lesson_title, is_completed, is_unlocked, stars, best_wpm, best_accuracy, total_attempts)
                VALUES (?, ?, ?, ?, 0, 1, 0, 0, 0, 0)
                ON DUPLICATE KEY UPDATE
                    is_unlocked = 1
            ");
            $nextStmt->execute([
                $user_id, $next_lesson_id, (string)$next_lesson_id, "Lesson {$next_lesson_id}"
            ]);
        }
    }

    // Badge Evaluation Helper
    $unlockedBadges = [];

    $badgeHelper = function($code, $title, $category, $icon, $desc) use ($db, $user_id, &$unlockedBadges) {
        $check = $db->prepare("SELECT id FROM student_skill_badges WHERE user_id = ? AND badge_code = ? LIMIT 1");
        $check->execute([$user_id, $code]);
        if (!$check->fetch()) {
            $ins = $db->prepare("
                INSERT INTO student_skill_badges (user_id, badge_code, badge_title, badge_category, badge_icon, description)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $ins->execute([$user_id, $code, $title, $category, $icon, $desc]);
            $unlockedBadges[] = [
                "code" => $code,
                "title" => $title,
                "icon" => $icon,
                "description" => $desc
            ];
        }
    };

    // 1. First Step Badge
    $badgeHelper("first_step", "First Step", "general", "🌱", "Completed your very first computer foundation drill.");

    // 2. Home Row Hero
    if ($difficulty_level === 'home_row' && $accuracy_percent >= 85) {
        $badgeHelper("home_row_hero", "Home Row Hero", "typing", "⌨️", "Mastered ASDF JKL; touch typing with 85%+ accuracy.");
    }

    // 3. Typing Milestones
    if ($wpm >= 20 && $accuracy_percent >= 80) {
        $badgeHelper("typing_speedster_20", "Typing Speedster (20+ WPM)", "typing", "⚡", "Reached 20 Words Per Minute typing speed.");
    }
    if ($wpm >= 35 && $accuracy_percent >= 85) {
        $badgeHelper("typing_ninja_35", "Typing Ninja (35+ WPM)", "typing", "🚀", "Reached 35 Words Per Minute typing speed.");
    }
    if ($wpm >= 50 && $accuracy_percent >= 90) {
        $badgeHelper("typing_master_50", "Typing Master (50+ WPM)", "typing", "👑", "Reached 50 Words Per Minute typing speed.");
    }

    // 4. Bangla Typist
    if (in_array($language, ['bn_avro', 'bn_bijoy']) && $wpm >= 12 && $accuracy_percent >= 80) {
        $badgeHelper("bangla_typist", "Bangla Typist", "typing", "🇧🇩", "Successfully completed Bengali typing test with 12+ WPM.");
    }

    // 5. Foundations Graduate (if student has completed mouse drills & reached 25+ WPM)
    $drillCount = $db->prepare("SELECT COUNT(id) FROM student_foundations_drills WHERE user_id = ?");
    $drillCount->execute([$user_id]);
    $totalDrills = $drillCount->fetchColumn();

    if ($totalDrills >= 3 && $wpm >= 25 && $accuracy_percent >= 85) {
        $badgeHelper("foundations_graduate", "Foundations Graduate", "general", "🎓", "Completed all foundation modules and earned graduation certificate.");
    }

    echo json_encode([
        "status" => "success",
        "message" => "Typing test saved successfully!",
        "data" => [
            "session_id" => $db->lastInsertId(),
            "wpm" => $wpm,
            "accuracy" => $accuracy_percent,
            "new_badges" => $unlockedBadges
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
