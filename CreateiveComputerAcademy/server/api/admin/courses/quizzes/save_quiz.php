<?php
require_once '../../../../config/cors.php';
require_once '../../../../config/database.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo json_encode(["status" => "error", "message" => "Database connection error."]);
    exit;
}

// Auto ensure database schema supports short_answer & true_false
try {
    $db->exec("ALTER TABLE `course_quiz_questions` MODIFY COLUMN `question_type` VARCHAR(50) NOT NULL DEFAULT 'single_choice'");
    $db->exec("ALTER TABLE `course_quiz_questions` MODIFY COLUMN `option_a` TEXT NULL");
    $db->exec("ALTER TABLE `course_quiz_questions` MODIFY COLUMN `option_b` TEXT NULL");
    $db->exec("ALTER TABLE `course_quiz_questions` MODIFY COLUMN `option_c` TEXT NULL");
    $db->exec("ALTER TABLE `course_quiz_questions` MODIFY COLUMN `option_d` TEXT NULL");
    
    $colCheck = $db->query("SHOW COLUMNS FROM `course_quiz_questions` LIKE 'correct_answer_text'")->fetch();
    if (!$colCheck) {
        $db->exec("ALTER TABLE `course_quiz_questions` ADD COLUMN `correct_answer_text` TEXT NULL AFTER `correct_option`");
    }
} catch (Throwable $t) {}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    echo json_encode(["status" => "error", "message" => "Invalid JSON payload."]);
    exit;
}

$id = isset($data['id']) ? intval($data['id']) : 0;
$course_id = isset($data['course_id']) ? intval($data['course_id']) : 0;
$module_id = isset($data['module_id']) ? intval($data['module_id']) : 0;
$milestone_id = isset($data['milestone_id']) && $data['milestone_id'] ? intval($data['milestone_id']) : null;
$lesson_id = isset($data['lesson_id']) && $data['lesson_id'] ? intval($data['lesson_id']) : null;
$title = isset($data['title']) ? trim($data['title']) : '';
$description = isset($data['description']) ? trim($data['description']) : '';
$time_limit_minutes = isset($data['time_limit_minutes']) ? intval($data['time_limit_minutes']) : 10;
$passing_score_percent = isset($data['passing_score_percent']) ? intval($data['passing_score_percent']) : 70;
$order_index = isset($data['order_index']) ? intval($data['order_index']) : 99;
$status = isset($data['status']) && $data['status'] === 'inactive' ? 'inactive' : 'active';
$questions = isset($data['questions']) && is_array($data['questions']) ? $data['questions'] : [];

if (!$course_id || !$module_id || empty($title)) {
    echo json_encode(["status" => "error", "message" => "Course ID, Module ID, and Quiz Title are required."]);
    exit;
}

try {
    $db->beginTransaction();

    if ($id > 0) {
        // Update existing quiz
        $stmt = $db->prepare("
            UPDATE course_quizzes 
            SET course_id = ?, milestone_id = ?, module_id = ?, lesson_id = ?, 
                title = ?, description = ?, time_limit_minutes = ?, passing_score_percent = ?, 
                total_marks = ?, order_index = ?, status = ?
            WHERE id = ?
        ");
        $stmt->execute([
            $course_id, $milestone_id, $module_id, $lesson_id,
            $title, $description, $time_limit_minutes, $passing_score_percent,
            count($questions), $order_index, $status, $id
        ]);
        $quizId = $id;
    } else {
        // Insert new quiz
        $stmt = $db->prepare("
            INSERT INTO course_quizzes 
            (course_id, milestone_id, module_id, lesson_id, title, description, time_limit_minutes, passing_score_percent, total_marks, order_index, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $course_id, $milestone_id, $module_id, $lesson_id,
            $title, $description, $time_limit_minutes, $passing_score_percent,
            count($questions), $order_index, $status
        ]);
        $quizId = $db->lastInsertId();
    }

    // Save Questions if provided
    if (!empty($questions)) {
        // Remove existing questions for clean replacement
        $delQ = $db->prepare("DELETE FROM course_quiz_questions WHERE quiz_id = ?");
        $delQ->execute([$quizId]);

        $insQ = $db->prepare("
            INSERT INTO course_quiz_questions 
            (quiz_id, question_text, question_type, option_a, option_b, option_c, option_d, correct_option, correct_answer_text, explanation, marks, order_index)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        foreach ($questions as $idx => $q) {
            $qText = isset($q['question_text']) ? trim($q['question_text']) : '';
            $qType = isset($q['question_type']) ? trim($q['question_type']) : 'single_choice';
            $optA = isset($q['option_a']) ? trim($q['option_a']) : null;
            $optB = isset($q['option_b']) ? trim($q['option_b']) : null;
            $optC = isset($q['option_c']) ? trim($q['option_c']) : null;
            $optD = isset($q['option_d']) ? trim($q['option_d']) : null;
            $correctOpt = isset($q['correct_option']) ? strtolower(trim($q['correct_option'])) : 'a';
            $correctText = isset($q['correct_answer_text']) ? trim($q['correct_answer_text']) : (isset($q['correct_answer']) ? trim($q['correct_answer']) : null);
            $exp = isset($q['explanation']) ? trim($q['explanation']) : '';
            $marks = isset($q['marks']) ? max(1, intval($q['marks'])) : 1;

            if (!empty($qText)) {
                $insQ->execute([
                    $quizId,
                    $qText,
                    $qType,
                    $optA,
                    $optB,
                    $optC,
                    $optD,
                    $correctOpt,
                    $correctText,
                    $exp,
                    $marks,
                    $idx + 1
                ]);
            }
        }
    }

    $db->commit();
    echo json_encode([
        "status" => "success",
        "message" => "Quiz saved successfully!",
        "quiz_id" => $quizId
    ]);
} catch (PDOException $e) {
    $db->rollBack();
    echo json_encode(["status" => "error", "message" => "Failed to save quiz: " . $e->getMessage()]);
}
?>
