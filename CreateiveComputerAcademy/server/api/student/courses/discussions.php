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
$method = $_SERVER['REQUEST_METHOD'];

// ── GET: Fetch Discussions & Replies for a Lesson ───────────────────────────
if ($method === 'GET') {
    $lesson_id = isset($_GET['lesson_id']) ? intval($_GET['lesson_id']) : 0;
    $course_id = isset($_GET['course_id']) ? intval($_GET['course_id']) : 0;

    if ($lesson_id <= 0 && $course_id <= 0) {
        echo json_encode(["status" => "error", "message" => "Lesson ID or Course ID required."]);
        exit;
    }

    try {
        $where = $lesson_id > 0 ? "d.lesson_id = :lid" : "d.course_id = :cid";
        $params = $lesson_id > 0 ? [':lid' => $lesson_id] : [':cid' => $course_id];

        $stmt = $db->prepare("
            SELECT d.id, d.user_id, d.course_id, d.lesson_id, d.timestamp_seconds, 
                   d.timestamp_formatted, d.question_title, d.question_details, d.status, 
                   d.upvotes, d.created_at,
                   u.name AS author_name, u.profile_picture AS author_avatar,
                   (SELECT COUNT(*) FROM student_lesson_discussion_replies r WHERE r.discussion_id = d.id) AS reply_count
            FROM student_lesson_discussions d
            LEFT JOIN users u ON d.user_id = u.id
            WHERE {$where}
            ORDER BY 
                CASE WHEN d.status = 'pinned' THEN 0 ELSE 1 END,
                d.id DESC
        ");
        $stmt->execute($params);
        $discussions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch replies for each question
        foreach ($discussions as &$disc) {
            $rStmt = $db->prepare("
                SELECT r.id, r.discussion_id, r.user_id, r.reply_text, r.is_instructor, 
                       r.is_solution, r.created_at,
                       u.name AS author_name, u.profile_picture AS author_avatar
                FROM student_lesson_discussion_replies r
                LEFT JOIN users u ON r.user_id = u.id
                WHERE r.discussion_id = :did
                ORDER BY r.is_solution DESC, r.id ASC
            ");
            $rStmt->execute([':did' => $disc['id']]);
            $disc['replies'] = $rStmt->fetchAll(PDO::FETCH_ASSOC);
        }

        echo json_encode([
            "status" => "success",
            "count" => count($discussions),
            "data" => $discussions
        ]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

// ── POST: Add Question, Reply or Vote ───────────────────────────────────────
if ($method === 'POST') {
    $raw = file_get_contents("php://input");
    $data = json_decode($raw);

    if (!$data) {
        echo json_encode(["status" => "error", "message" => "Invalid JSON payload."]);
        exit;
    }

    $action = isset($data->action) ? trim($data->action) : 'create_question';
    $user_id = isset($data->user_id) ? intval($data->user_id) : 0;

    if ($user_id <= 0) {
        echo json_encode(["status" => "error", "message" => "User ID required."]);
        exit;
    }

    // 1. REPLY TO QUESTION
    if ($action === 'reply') {
        $discussion_id = isset($data->discussion_id) ? intval($data->discussion_id) : 0;
        $reply_text = isset($data->reply_text) ? trim($data->reply_text) : '';

        if ($discussion_id <= 0 || empty($reply_text)) {
            echo json_encode(["status" => "error", "message" => "Discussion ID and reply content are required."]);
            exit;
        }

        try {
            // Check if user is instructor / admin / reviewer
            $role_stmt = $db->prepare("SELECT role FROM user_roles WHERE user_id = :uid");
            $role_stmt->execute([':uid' => $user_id]);
            $roles = $role_stmt->fetchAll(PDO::FETCH_COLUMN);
            $is_instructor = (in_array('admin', $roles) || in_array('reviewer', $roles)) ? 1 : 0;

            $ins = $db->prepare("
                INSERT INTO student_lesson_discussion_replies (discussion_id, user_id, reply_text, is_instructor, created_at, updated_at)
                VALUES (:did, :uid, :rtxt, :is_inst, NOW(), NOW())
            ");
            $ins->execute([
                ':did' => $discussion_id,
                ':uid' => $user_id,
                ':rtxt' => $reply_text,
                ':is_inst' => $is_instructor
            ]);

            $reply_id = $db->lastInsertId();

            $uStmt = $db->prepare("SELECT name, profile_picture FROM users WHERE id = :uid LIMIT 1");
            $uStmt->execute([':uid' => $user_id]);
            $uInfo = $uStmt->fetch(PDO::FETCH_ASSOC);

            echo json_encode([
                "status" => "success",
                "message" => "Reply posted!",
                "data" => [
                    "id" => $reply_id,
                    "discussion_id" => $discussion_id,
                    "user_id" => $user_id,
                    "reply_text" => $reply_text,
                    "is_instructor" => $is_instructor,
                    "is_solution" => 0,
                    "created_at" => date('Y-m-d H:i:s'),
                    "author_name" => $uInfo['name'] ?? 'Student',
                    "author_avatar" => $uInfo['profile_picture'] ?? null
                ]
            ]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        exit;
    }

    // 2. UPVOTE QUESTION
    if ($action === 'upvote') {
        $discussion_id = isset($data->discussion_id) ? intval($data->discussion_id) : 0;
        if ($discussion_id <= 0) {
            echo json_encode(["status" => "error", "message" => "Discussion ID required."]);
            exit;
        }

        try {
            $up = $db->prepare("UPDATE student_lesson_discussions SET upvotes = upvotes + 1 WHERE id = :id");
            $up->execute([':id' => $discussion_id]);
            echo json_encode(["status" => "success", "message" => "Upvoted!"]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        exit;
    }

    // 3. CREATE QUESTION
    $course_id = isset($data->course_id) ? intval($data->course_id) : 0;
    $lesson_id = isset($data->lesson_id) ? intval($data->lesson_id) : 0;
    $question_title = isset($data->question_title) ? trim($data->question_title) : '';
    $question_details = isset($data->question_details) ? trim($data->question_details) : '';
    $timestamp_seconds = isset($data->timestamp_seconds) ? intval($data->timestamp_seconds) : 0;
    $timestamp_formatted = isset($data->timestamp_formatted) ? trim($data->timestamp_formatted) : null;

    if ($course_id <= 0 || $lesson_id <= 0 || empty($question_title)) {
        echo json_encode(["status" => "error", "message" => "Course ID, Lesson ID and Question Title are required."]);
        exit;
    }

    try {
        $ins = $db->prepare("
            INSERT INTO student_lesson_discussions (user_id, course_id, lesson_id, timestamp_seconds, timestamp_formatted, question_title, question_details, status, upvotes, created_at, updated_at)
            VALUES (:uid, :cid, :lid, :tsec, :tfmt, :qtitle, :qdesc, 'open', 0, NOW(), NOW())
        ");
        $ins->execute([
            ':uid' => $user_id,
            ':cid' => $course_id,
            ':lid' => $lesson_id,
            ':tsec' => $timestamp_seconds,
            ':tfmt' => $timestamp_formatted,
            ':qtitle' => $question_title,
            ':qdesc' => $question_details
        ]);

        $new_id = $db->lastInsertId();

        $uStmt = $db->prepare("SELECT name, profile_picture FROM users WHERE id = :uid LIMIT 1");
        $uStmt->execute([':uid' => $user_id]);
        $uInfo = $uStmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            "status" => "success",
            "message" => "Your question was posted successfully! Instructors and peers will respond soon.",
            "data" => [
                "id" => $new_id,
                "user_id" => $user_id,
                "course_id" => $course_id,
                "lesson_id" => $lesson_id,
                "timestamp_seconds" => $timestamp_seconds,
                "timestamp_formatted" => $timestamp_formatted,
                "question_title" => $question_title,
                "question_details" => $question_details,
                "status" => "open",
                "upvotes" => 0,
                "created_at" => date('Y-m-d H:i:s'),
                "author_name" => $uInfo['name'] ?? 'Student',
                "author_avatar" => $uInfo['profile_picture'] ?? null,
                "reply_count" => 0,
                "replies" => []
            ]
        ]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}
?>
