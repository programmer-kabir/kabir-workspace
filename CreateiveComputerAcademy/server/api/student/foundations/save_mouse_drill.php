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
$drill_type = isset($data['drill_type']) ? trim($data['drill_type']) : 'mouse_click';
$level_no = isset($data['level_no']) ? intval($data['level_no']) : 1;
$score = isset($data['score']) ? intval($data['score']) : 0;
$accuracy_percent = isset($data['accuracy_percent']) ? intval($data['accuracy_percent']) : 100;
$reaction_time_ms = isset($data['reaction_time_ms']) ? intval($data['reaction_time_ms']) : 0;
$mistakes_count = isset($data['mistakes_count']) ? intval($data['mistakes_count']) : 0;
$duration_seconds = isset($data['duration_seconds']) ? intval($data['duration_seconds']) : 30;

if ($user_id <= 0) {
    echo json_encode(["status" => "error", "message" => "Valid User ID is required."]);
    exit;
}

$validDrillTypes = ['mouse_click', 'mouse_double_click', 'mouse_drag_drop', 'mouse_right_click', 'mouse_scroll', 'shortcuts_trainer'];
if (!in_array($drill_type, $validDrillTypes)) {
    $drill_type = 'mouse_click';
}

try {
    // Insert Drill Record
    $stmt = $db->prepare("
        INSERT INTO student_foundations_drills 
        (user_id, drill_type, level_no, score, accuracy_percent, reaction_time_ms, mistakes_count, duration_seconds)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $user_id, $drill_type, $level_no, $score, $accuracy_percent, $reaction_time_ms, $mistakes_count, $duration_seconds
    ]);

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

    // 2. Mouse Rookie
    if (in_array($drill_type, ['mouse_click', 'mouse_double_click']) && $accuracy_percent >= 70) {
        $badgeHelper("mouse_rookie", "Mouse Rookie", "mouse", "🖱️", "Successfully completed Single & Double Click training.");
    }

    // 3. Mouse Ninja
    if ($drill_type === 'mouse_click' && $accuracy_percent >= 90 && $score >= 80) {
        $badgeHelper("mouse_ninja", "Mouse Ninja", "mouse", "🎯", "Achieved 90%+ accuracy in Target Aim & Balloon Popper.");
    }

    // 4. Desktop Organizer / Drag Drop Pro
    if ($drill_type === 'mouse_drag_drop' && $accuracy_percent >= 80) {
        $badgeHelper("drag_drop_pro", "Desktop Organizer", "mouse", "📂", "Mastered Drag & Drop and File Management drill.");
    }

    // 5. Shortcuts Wizard
    if ($drill_type === 'shortcuts_trainer' && $score >= 5) {
        $badgeHelper("shortcuts_wizard", "Shortcuts Wizard", "shortcuts", "🪄", "Mastered top essential OS & productivity shortcuts.");
    }

    echo json_encode([
        "status" => "success",
        "message" => "Drill session saved successfully!",
        "data" => [
            "drill_id" => $db->lastInsertId(),
            "new_badges" => $unlockedBadges
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
