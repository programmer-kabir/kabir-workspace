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

// Auto-migration check
try {
    $colCheck = $db->query("SHOW COLUMNS FROM `course_quiz_questions` LIKE 'correct_answer_text'")->fetch();
    if (!$colCheck) {
        $db->exec("ALTER TABLE `course_quiz_questions` ADD COLUMN `correct_answer_text` TEXT NULL AFTER `correct_option`");
        $db->exec("ALTER TABLE `course_quiz_questions` MODIFY COLUMN `question_type` VARCHAR(50) NOT NULL DEFAULT 'single_choice'");
        $db->exec("ALTER TABLE `course_quiz_questions` MODIFY COLUMN `option_a` TEXT NULL");
        $db->exec("ALTER TABLE `course_quiz_questions` MODIFY COLUMN `option_b` TEXT NULL");
        $db->exec("ALTER TABLE `course_quiz_questions` MODIFY COLUMN `option_c` TEXT NULL");
        $db->exec("ALTER TABLE `course_quiz_questions` MODIFY COLUMN `option_d` TEXT NULL");
    }
} catch (Throwable $t) {}

$method = $_SERVER['REQUEST_METHOD'];

// Helper to normalize strings for forgiving short answer comparisons
function normalizeAnswerString($str) {
    $str = mb_strtolower(trim((string)$str), 'UTF-8');
    // Replace multiple spaces/newlines with single space
    $str = preg_replace('/\s+/', ' ', $str);
    return $str;
}

// Check if short answer matches correct text or acceptable synonyms
function evaluateShortAnswer($studentAns, $correctText) {
    $normStudent = normalizeAnswerString($studentAns);
    if ($normStudent === '') return false;

    $normCorrect = normalizeAnswerString($correctText);
    if ($normStudent === $normCorrect) return true;

    // Check comma, semicolon, slash, or pipe separated alternatives
    $alternatives = preg_split('/[,;\/|]+/', $correctText);
    foreach ($alternatives as $alt) {
        $altNorm = normalizeAnswerString($alt);
        if ($altNorm !== '' && ($normStudent === $altNorm)) {
            return true;
        }

        // Also check stripped punctuation (e.g., "Ctrl + S" vs "ctrl s" or "Ctrl+S")
        $strippedStudent = preg_replace('/[^a-zA-Z0-9\x{0980}-\x{09FF}]/u', '', $normStudent);
        $strippedAlt = preg_replace('/[^a-zA-Z0-9\x{0980}-\x{09FF}]/u', '', $altNorm);
        if ($strippedStudent !== '' && $strippedStudent === $strippedAlt) {
            return true;
        }
    }

    return false;
}

// ── GET: Fetch Quiz with Questions (Hiding correct answers for active exam) ─────
if ($method === 'GET') {
    $quiz_id = isset($_GET['quiz_id']) ? intval($_GET['quiz_id']) : 0;
    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

    if ($quiz_id <= 0) {
        echo json_encode(["status" => "error", "message" => "Valid Quiz ID is required."]);
        exit;
    }

    try {
        // Fetch Quiz metadata
        $qStmt = $db->prepare("
            SELECT q.*, m.title AS module_title, c.title AS course_title
            FROM course_quizzes q
            LEFT JOIN course_modules m ON q.module_id = m.id
            LEFT JOIN courses c ON q.course_id = c.id
            WHERE q.id = :qid AND q.status = 'active'
            LIMIT 1
        ");
        $qStmt->execute([':qid' => $quiz_id]);
        $quiz = $qStmt->fetch(PDO::FETCH_ASSOC);

        if (!$quiz) {
            echo json_encode(["status" => "error", "message" => "Quiz not found or inactive."]);
            exit;
        }

        // Fetch Questions
        $questStmt = $db->prepare("
            SELECT id, quiz_id, question_text, question_type, option_a, option_b, option_c, option_d, correct_option, correct_answer_text, explanation, marks, order_index
            FROM course_quiz_questions
            WHERE quiz_id = :qid
            ORDER BY order_index ASC, id ASC
        ");
        $questStmt->execute([':qid' => $quiz_id]);
        $questions = $questStmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch previous attempts of this student
        $attempts = [];
        $bestAttempt = null;
        $completedResult = null;

        if ($user_id > 0) {
            $attStmt = $db->prepare("
                SELECT id, total_questions, correct_answers, score_percent, is_passed, answers_json, time_taken_seconds, attempt_number, created_at
                FROM student_quiz_attempts
                WHERE user_id = :uid AND quiz_id = :qid
                ORDER BY id DESC
            ");
            $attStmt->execute([':uid' => $user_id, ':qid' => $quiz_id]);
            $attempts = $attStmt->fetchAll(PDO::FETCH_ASSOC);

            if (!empty($attempts)) {
                $latestAttempt = $attempts[0];
                $bestScore = -1;
                foreach ($attempts as $at) {
                    if (intval($at['score_percent']) > $bestScore) {
                        $bestScore = intval($at['score_percent']);
                        $bestAttempt = $at;
                    }
                }

                // Generate full answer breakdown for already completed quiz review
                $savedAnswers = json_decode($latestAttempt['answers_json'] ?? '{}', true) ?: [];

                $breakdown = [];
                foreach ($questions as $quest) {
                    $qId = intval($quest['id']);
                    $qType = isset($quest['question_type']) && !empty($quest['question_type']) ? $quest['question_type'] : 'single_choice';
                    $correctOpt = strtolower(trim($quest['correct_option'] ?? 'a'));
                    $correctText = trim($quest['correct_answer_text'] ?? '');
                    
                    $studentRaw = isset($savedAnswers[$qId]) ? $savedAnswers[$qId] : (isset($savedAnswers[strval($qId)]) ? $savedAnswers[strval($qId)] : null);
                    $isCorrect = false;

                    if ($qType === 'short_answer') {
                        $studentChoice = $studentRaw !== null ? trim((string)$studentRaw) : '';
                        $isCorrect = evaluateShortAnswer($studentChoice, !empty($correctText) ? $correctText : $correctOpt);
                    } else if ($qType === 'true_false') {
                        $studentChoice = $studentRaw !== null ? strtolower(trim((string)$studentRaw)) : null;
                        $expected = ($correctOpt === 'true' || $correctOpt === 'a') ? 'true' : 'false';
                        $isCorrect = ($studentChoice !== null && $studentChoice === $expected);
                    } else {
                        $studentChoice = $studentRaw !== null ? strtolower(trim((string)$studentRaw)) : null;
                        $isCorrect = ($studentChoice !== null && $studentChoice === $correctOpt);
                    }

                    $breakdown[] = [
                        'question_id' => $qId,
                        'question_text' => $quest['question_text'],
                        'question_type' => $qType,
                        'option_a' => $quest['option_a'],
                        'option_b' => $quest['option_b'],
                        'option_c' => $quest['option_c'],
                        'option_d' => $quest['option_d'],
                        'student_choice' => $studentChoice,
                        'correct_option' => $correctOpt,
                        'correct_answer_text' => !empty($correctText) ? $correctText : ($qType === 'true_false' ? $correctOpt : null),
                        'is_correct' => $isCorrect,
                        'explanation' => $quest['explanation']
                    ];
                }

                $completedResult = [
                    "quiz_id" => $quiz_id,
                    "title" => $quiz['title'],
                    "total_questions" => count($questions),
                    "correct_answers" => intval($latestAttempt['correct_answers']),
                    "score_percent" => intval($latestAttempt['score_percent']),
                    "passing_score_percent" => intval($quiz['passing_score_percent']) ?: 70,
                    "is_passed" => intval($latestAttempt['is_passed']) === 1,
                    "time_taken_seconds" => intval($latestAttempt['time_taken_seconds']),
                    "attempt_number" => intval($latestAttempt['attempt_number']),
                    "breakdown" => $breakdown,
                    "submitted_at" => $latestAttempt['created_at']
                ];

                // Also attach breakdown directly into attempts
                $attempts[0]['breakdown'] = $breakdown;
                $attempts[0]['passing_score_percent'] = intval($quiz['passing_score_percent']) ?: 70;
                if ($bestAttempt) {
                    $bestAttempt['breakdown'] = $breakdown;
                    $bestAttempt['passing_score_percent'] = intval($quiz['passing_score_percent']) ?: 70;
                }
            }
        }

        echo json_encode([
            "status" => "success",
            "data" => [
                "quiz" => [
                    "id" => intval($quiz['id']),
                    "course_id" => intval($quiz['course_id']),
                    "module_id" => intval($quiz['module_id']),
                    "milestone_id" => $quiz['milestone_id'] ? intval($quiz['milestone_id']) : null,
                    "title" => $quiz['title'],
                    "description" => $quiz['description'],
                    "time_limit_minutes" => intval($quiz['time_limit_minutes']),
                    "passing_score_percent" => intval($quiz['passing_score_percent']),
                    "total_marks" => intval($quiz['total_marks']),
                    "total_questions" => count($questions),
                    "module_title" => $quiz['module_title'],
                    "course_title" => $quiz['course_title']
                ],
                "questions" => $questions,
                "attempts" => $attempts,
                "best_attempt" => $bestAttempt,
                "is_passed" => $bestAttempt ? (intval($bestAttempt['is_passed']) === 1) : false,
                "already_completed" => !empty($completedResult),
                "completed_result" => $completedResult
            ]
        ]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Failed to load quiz: " . $e->getMessage()]);
    }
    exit;
}

// ── POST: Submit Quiz Evaluation & Record Attempt ──────────────────────────────
if ($method === 'POST') {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);

    $action = isset($data['action']) ? trim($data['action']) : 'submit';

    if ($action === 'submit') {
        $user_id = isset($data['user_id']) ? intval($data['user_id']) : 0;
        $quiz_id = isset($data['quiz_id']) ? intval($data['quiz_id']) : 0;
        $course_id = isset($data['course_id']) ? intval($data['course_id']) : 0;
        $answers = isset($data['answers']) && is_array($data['answers']) ? $data['answers'] : [];
        $time_taken = isset($data['time_taken_seconds']) ? intval($data['time_taken_seconds']) : 0;

        if ($user_id <= 0 || $quiz_id <= 0 || $course_id <= 0) {
            echo json_encode(["status" => "error", "message" => "User ID, Quiz ID, and Course ID are required."]);
            exit;
        }

        try {
            // Fetch Quiz details
            $qStmt = $db->prepare("SELECT * FROM course_quizzes WHERE id = :qid LIMIT 1");
            $qStmt->execute([':qid' => $quiz_id]);
            $quiz = $qStmt->fetch(PDO::FETCH_ASSOC);

            if (!$quiz) {
                echo json_encode(["status" => "error", "message" => "Quiz not found."]);
                exit;
            }

            // Fetch actual questions with correct options/answers and explanations
            $questStmt = $db->prepare("SELECT * FROM course_quiz_questions WHERE quiz_id = :qid ORDER BY order_index ASC, id ASC");
            $questStmt->execute([':qid' => $quiz_id]);
            $questions = $questStmt->fetchAll(PDO::FETCH_ASSOC);

            $totalQuestions = count($questions);
            if ($totalQuestions === 0) {
                echo json_encode(["status" => "error", "message" => "Quiz has no questions configured."]);
                exit;
            }

            $correctCount = 0;
            $breakdown = [];

            foreach ($questions as $quest) {
                $qId = intval($quest['id']);
                $qType = isset($quest['question_type']) && !empty($quest['question_type']) ? $quest['question_type'] : 'single_choice';
                $correctOpt = strtolower(trim($quest['correct_option'] ?? 'a'));
                $correctText = trim($quest['correct_answer_text'] ?? '');
                
                $studentRaw = isset($answers[$qId]) ? $answers[$qId] : (isset($answers[strval($qId)]) ? $answers[strval($qId)] : null);
                $isCorrect = false;

                if ($qType === 'short_answer') {
                    $studentChoice = $studentRaw !== null ? trim((string)$studentRaw) : '';
                    $isCorrect = evaluateShortAnswer($studentChoice, !empty($correctText) ? $correctText : $correctOpt);
                } else if ($qType === 'true_false') {
                    $studentChoice = $studentRaw !== null ? strtolower(trim((string)$studentRaw)) : null;
                    $expected = ($correctOpt === 'true' || $correctOpt === 'a') ? 'true' : 'false';
                    $isCorrect = ($studentChoice !== null && $studentChoice === $expected);
                } else {
                    // Standard Single Choice MCQ
                    $studentChoice = $studentRaw !== null ? strtolower(trim((string)$studentRaw)) : null;
                    $isCorrect = ($studentChoice !== null && $studentChoice === $correctOpt);
                }

                if ($isCorrect) {
                    $correctCount++;
                }

                $breakdown[] = [
                    'question_id' => $qId,
                    'question_text' => $quest['question_text'],
                    'question_type' => $qType,
                    'option_a' => $quest['option_a'],
                    'option_b' => $quest['option_b'],
                    'option_c' => $quest['option_c'],
                    'option_d' => $quest['option_d'],
                    'student_choice' => $studentChoice,
                    'correct_option' => $correctOpt,
                    'correct_answer_text' => !empty($correctText) ? $correctText : ($qType === 'true_false' ? $correctOpt : null),
                    'is_correct' => $isCorrect,
                    'explanation' => $quest['explanation']
                ];
            }

            $scorePercent = round(($correctCount / $totalQuestions) * 100);
            $passingScore = intval($quiz['passing_score_percent']) ?: 70;
            $isPassed = ($scorePercent >= $passingScore) ? 1 : 0;

            // Count previous attempts
            $attCountStmt = $db->prepare("SELECT COUNT(*) FROM student_quiz_attempts WHERE user_id = :uid AND quiz_id = :qid");
            $attCountStmt->execute([':uid' => $user_id, ':qid' => $quiz_id]);
            $previousAttempts = intval($attCountStmt->fetchColumn());
            $attemptNo = $previousAttempts + 1;

            // Insert into student_quiz_attempts
            $insertStmt = $db->prepare("
                INSERT INTO student_quiz_attempts 
                (user_id, quiz_id, course_id, total_questions, correct_answers, score_percent, is_passed, answers_json, time_taken_seconds, attempt_number) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $insertStmt->execute([
                $user_id,
                $quiz_id,
                $course_id,
                $totalQuestions,
                $correctCount,
                $scorePercent,
                $isPassed,
                json_encode($answers),
                $time_taken,
                $attemptNo
            ]);

            // If quiz is attached to a lesson_id, update progress
            if ($isPassed) {
                try {
                    if (!empty($quiz['lesson_id'])) {
                        $upProg = $db->prepare("
                            INSERT INTO student_lesson_progress (user_id, course_id, lesson_id, is_completed, completed_at)
                            VALUES (?, ?, ?, 1, NOW())
                            ON DUPLICATE KEY UPDATE is_completed = 1, completed_at = NOW()
                        ");
                        $upProg->execute([$user_id, $course_id, $quiz['lesson_id']]);
                    }
                } catch (Throwable $e) {}
            }

            echo json_encode([
                "status" => "success",
                "data" => [
                    "quiz_id" => $quiz_id,
                    "title" => $quiz['title'],
                    "total_questions" => $totalQuestions,
                    "correct_answers" => $correctCount,
                    "score_percent" => $scorePercent,
                    "passing_score_percent" => $passingScore,
                    "is_passed" => $isPassed === 1,
                    "time_taken_seconds" => $time_taken,
                    "attempt_number" => $attemptNo,
                    "breakdown" => $breakdown
                ]
            ]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => "Failed to evaluate quiz: " . $e->getMessage()]);
        }
        exit;
    }
}
?>
