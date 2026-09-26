<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['student_id']) || !isset($data['action'])) {
    echo json_encode(["status" => "error", "message" => "Missing student_id or action parameter."]);
    exit;
}

$student_id = intval($data['student_id']);
$action = trim($data['action']);
$lesson_id = isset($data['lesson_id']) ? intval($data['lesson_id']) : 1;

$LESSON_NAMES = [
    1 => 'Home Row (ASDF JKL;)',
    2 => 'Top Row: Keys E & I',
    3 => 'Top Row: Keys R & U',
    4 => 'Top Row: Keys T & Y',
    5 => 'Home Row: Keys G & H',
    6 => 'Bottom Row: C & Comma',
    7 => 'Bottom Row: V & M',
    8 => 'Bottom Row: B & N',
    9 => 'Top Row: Keys W & O',
    10 => 'Top Row: Keys Q & P',
    11 => 'Bottom Row: Z, X, . & /',
    12 => 'Shift & Capital Letters',
    13 => 'Numbers 1 to 0',
    14 => 'Symbols & Punctuation'
];

try {
    // Verify user exists
    $userCheck = $db->prepare("SELECT id, name FROM users WHERE id = ? LIMIT 1");
    $userCheck->execute([$student_id]);
    $user = $userCheck->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(["status" => "error", "message" => "Student not found in database."]);
        exit;
    }

    if ($action === 'unlock_lesson') {
        if ($lesson_id < 1 || $lesson_id > 14) {
            echo json_encode(["status" => "error", "message" => "Invalid lesson ID (must be 1-14)."]);
            exit;
        }

        // Unlock all lessons from 1 up to $lesson_id
        for ($i = 1; $i <= $lesson_id; $i++) {
            $lTitle = $LESSON_NAMES[$i] ?? "Lesson {$i}";
            $stmt = $db->prepare("
                INSERT INTO student_typing_curriculum_progress
                (user_id, lesson_id, lesson_number, lesson_title, is_completed, is_unlocked, stars, best_wpm, best_accuracy, total_attempts)
                VALUES (?, ?, ?, ?, 0, 1, 0, 0, 0, 0)
                ON DUPLICATE KEY UPDATE
                    is_unlocked = 1
            ");
            $stmt->execute([$student_id, $i, (string)$i, $lTitle]);
        }

        echo json_encode([
            "status" => "success",
            "message" => "Lesson {$lesson_id} unlocked successfully for {$user['name']}."
        ]);
        exit;
    }

    if ($action === 'complete_lesson') {
        if ($lesson_id < 1 || $lesson_id > 14) {
            echo json_encode(["status" => "error", "message" => "Invalid lesson ID (must be 1-14)."]);
            exit;
        }

        $wpm = isset($data['wpm']) && intval($data['wpm']) > 0 ? intval($data['wpm']) : 48;
        $accuracy = isset($data['accuracy']) && intval($data['accuracy']) > 0 ? intval($data['accuracy']) : 99;
        $stars = isset($data['stars']) && intval($data['stars']) > 0 ? min(3, intval($data['stars'])) : 3;
        $lTitle = $LESSON_NAMES[$lesson_id] ?? "Lesson {$lesson_id}";

        // Mark current lesson as completed
        $stmt = $db->prepare("
            INSERT INTO student_typing_curriculum_progress
            (user_id, lesson_id, lesson_number, lesson_title, is_completed, is_unlocked, stars, best_wpm, best_accuracy, total_attempts, last_practiced_at)
            VALUES (?, ?, ?, ?, 1, 1, ?, ?, ?, 1, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE
                is_completed = 1,
                is_unlocked = 1,
                stars = GREATEST(stars, VALUES(stars)),
                best_wpm = GREATEST(best_wpm, VALUES(best_wpm)),
                best_accuracy = GREATEST(best_accuracy, VALUES(best_accuracy)),
                total_attempts = total_attempts + 1,
                last_practiced_at = CURRENT_TIMESTAMP
        ");
        $stmt->execute([$student_id, $lesson_id, (string)$lesson_id, $lTitle, $stars, $wpm, $accuracy]);

        // Auto unlock next lesson if applicable
        $next_lesson_id = $lesson_id + 1;
        if ($next_lesson_id <= 14) {
            $nextTitle = $LESSON_NAMES[$next_lesson_id] ?? "Lesson {$next_lesson_id}";
            $nextStmt = $db->prepare("
                INSERT INTO student_typing_curriculum_progress
                (user_id, lesson_id, lesson_number, lesson_title, is_completed, is_unlocked, stars, best_wpm, best_accuracy, total_attempts)
                VALUES (?, ?, ?, ?, 0, 1, 0, 0, 0, 0)
                ON DUPLICATE KEY UPDATE
                    is_unlocked = 1
            ");
            $nextStmt->execute([$student_id, $next_lesson_id, (string)$next_lesson_id, $nextTitle]);
        }

        echo json_encode([
            "status" => "success",
            "message" => "Lesson {$lesson_id} marked as completed (Passed with {$stars} Stars) for {$user['name']}."
        ]);
        exit;
    }

    if ($action === 'unlock_all') {
        // Unlock all 14 lessons
        for ($i = 1; $i <= 14; $i++) {
            $lTitle = $LESSON_NAMES[$i] ?? "Lesson {$i}";
            $stmt = $db->prepare("
                INSERT INTO student_typing_curriculum_progress
                (user_id, lesson_id, lesson_number, lesson_title, is_completed, is_unlocked, stars, best_wpm, best_accuracy, total_attempts)
                VALUES (?, ?, ?, ?, 0, 1, 0, 0, 0, 0)
                ON DUPLICATE KEY UPDATE
                    is_unlocked = 1
            ");
            $stmt->execute([$student_id, $i, (string)$i, $lTitle]);
        }

        echo json_encode([
            "status" => "success",
            "message" => "All 14 curriculum lessons unlocked for {$user['name']}."
        ]);
        exit;
    }

    if ($action === 'complete_all') {
        $defaultWpm = isset($data['wpm']) && intval($data['wpm']) > 0 ? intval($data['wpm']) : 55;
        $defaultAcc = isset($data['accuracy']) && intval($data['accuracy']) > 0 ? intval($data['accuracy']) : 99;

        // Force complete all 14 lessons with 3 stars
        for ($i = 1; $i <= 14; $i++) {
            $lTitle = $LESSON_NAMES[$i] ?? "Lesson {$i}";
            $stmt = $db->prepare("
                INSERT INTO student_typing_curriculum_progress
                (user_id, lesson_id, lesson_number, lesson_title, is_completed, is_unlocked, stars, best_wpm, best_accuracy, total_attempts, last_practiced_at)
                VALUES (?, ?, ?, ?, 1, 1, 3, ?, ?, 1, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE
                    is_completed = 1,
                    is_unlocked = 1,
                    stars = 3,
                    best_wpm = GREATEST(best_wpm, VALUES(best_wpm)),
                    best_accuracy = GREATEST(best_accuracy, VALUES(best_accuracy)),
                    total_attempts = GREATEST(total_attempts, 1),
                    last_practiced_at = CURRENT_TIMESTAMP
            ");
            $stmt->execute([$student_id, $i, (string)$i, $lTitle, $defaultWpm, $defaultAcc]);
        }

        // Grant Graduation Badge if badges table exists
        try {
            $badgeCheck = $db->prepare("SELECT id FROM student_skill_badges WHERE user_id = ? AND badge_code = 'typing_master_graduate' LIMIT 1");
            $badgeCheck->execute([$student_id]);
            if (!$badgeCheck->fetch()) {
                $insBadge = $db->prepare("
                    INSERT INTO student_skill_badges (user_id, badge_code, badge_title, badge_category, badge_icon, description)
                    VALUES (?, 'typing_master_graduate', 'Touch Typing Master Graduate', 'typing', '👑', 'Completed all 14 touch typing curriculum levels with mastery.')
                ");
                $insBadge->execute([$student_id]);
            }
        } catch (Exception $e) {
            // Ignore badge errors if table not present
        }

        echo json_encode([
            "status" => "success",
            "message" => "All 14 lessons marked as 100% Complete (Graduated) for {$user['name']}!"
        ]);
        exit;
    }

    if ($action === 'reset_progress') {
        // Reset all lessons: delete curriculum progress or reset to lesson 1
        $del = $db->prepare("DELETE FROM student_typing_curriculum_progress WHERE user_id = ?");
        $del->execute([$student_id]);

        // Re-initialize Lesson 1 as unlocked
        $l1Title = $LESSON_NAMES[1] ?? 'Home Row (ASDF JKL;)';
        $insL1 = $db->prepare("
            INSERT INTO student_typing_curriculum_progress
            (user_id, lesson_id, lesson_number, lesson_title, is_completed, is_unlocked, stars, best_wpm, best_accuracy, total_attempts)
            VALUES (?, 1, '1', ?, 0, 1, 0, 0, 0, 0)
        ");
        $insL1->execute([$student_id, $l1Title]);

        echo json_encode([
            "status" => "success",
            "message" => "Typing curriculum progress has been reset to Lesson 1 for {$user['name']}."
        ]);
        exit;
    }

    echo json_encode(["status" => "error", "message" => "Unknown action '{$action}'."]);

} catch (PDOException $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Database exception: " . $e->getMessage()
    ]);
}
?>
