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

// ── GET: Fetch Notes for current student ─────────────────────────────────────
if ($method === 'GET') {
    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    $lesson_id = isset($_GET['lesson_id']) ? intval($_GET['lesson_id']) : 0;
    $course_id = isset($_GET['course_id']) ? intval($_GET['course_id']) : 0;

    if ($user_id <= 0) {
        echo json_encode(["status" => "error", "message" => "Valid User ID is required."]);
        exit;
    }

    try {
        if ($lesson_id > 0) {
            $stmt = $db->prepare("
                SELECT id, user_id, course_id, lesson_id, timestamp_seconds, 
                       timestamp_formatted, note_text, color_tag, created_at, updated_at
                FROM student_lesson_notes
                WHERE user_id = :uid AND lesson_id = :lid
                ORDER BY timestamp_seconds ASC, id DESC
            ");
            $stmt->execute([':uid' => $user_id, ':lid' => $lesson_id]);
        } else if ($course_id > 0) {
            $stmt = $db->prepare("
                SELECT n.id, n.user_id, n.course_id, n.lesson_id, n.timestamp_seconds, 
                       n.timestamp_formatted, n.note_text, n.color_tag, n.created_at, n.updated_at,
                       l.title AS lesson_title, l.lesson_no
                FROM student_lesson_notes n
                LEFT JOIN course_lessons l ON n.lesson_id = l.id
                WHERE n.user_id = :uid AND n.course_id = :cid
                ORDER BY n.created_at DESC
            ");
            $stmt->execute([':uid' => $user_id, ':cid' => $course_id]);
        } else {
            $stmt = $db->prepare("
                SELECT n.id, n.user_id, n.course_id, n.lesson_id, n.timestamp_seconds, 
                       n.timestamp_formatted, n.note_text, n.color_tag, n.created_at, n.updated_at,
                       l.title AS lesson_title, l.lesson_no, c.title AS course_title
                FROM student_lesson_notes n
                LEFT JOIN course_lessons l ON n.lesson_id = l.id
                LEFT JOIN courses c ON n.course_id = c.id
                WHERE n.user_id = :uid
                ORDER BY n.created_at DESC
            ");
            $stmt->execute([':uid' => $user_id]);
        }

        $notes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "status" => "success",
            "count" => count($notes),
            "data" => $notes
        ]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

// ── POST: Add, Update or Delete Note ─────────────────────────────────────────
if ($method === 'POST') {
    $raw = file_get_contents("php://input");
    $data = json_decode($raw);

    if (!$data) {
        echo json_encode(["status" => "error", "message" => "Invalid JSON payload."]);
        exit;
    }

    $action = isset($data->action) ? trim($data->action) : 'create';
    $user_id = isset($data->user_id) ? intval($data->user_id) : 0;

    if ($user_id <= 0) {
        echo json_encode(["status" => "error", "message" => "User ID required."]);
        exit;
    }

    // 1. DELETE NOTE
    if ($action === 'delete') {
        $note_id = isset($data->note_id) ? intval($data->note_id) : 0;
        if ($note_id <= 0) {
            echo json_encode(["status" => "error", "message" => "Note ID required."]);
            exit;
        }

        try {
            $del = $db->prepare("DELETE FROM student_lesson_notes WHERE id = :id AND user_id = :uid");
            $del->execute([':id' => $note_id, ':uid' => $user_id]);

            echo json_encode(["status" => "success", "message" => "Note deleted successfully."]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        exit;
    }

    // 2. UPDATE NOTE
    if ($action === 'update') {
        $note_id = isset($data->note_id) ? intval($data->note_id) : 0;
        $note_text = isset($data->note_text) ? trim($data->note_text) : '';
        $color_tag = isset($data->color_tag) ? trim($data->color_tag) : 'indigo';

        if ($note_id <= 0 || empty($note_text)) {
            echo json_encode(["status" => "error", "message" => "Note ID and content are required."]);
            exit;
        }

        try {
            $up = $db->prepare("
                UPDATE student_lesson_notes 
                SET note_text = :txt, color_tag = :col, updated_at = NOW()
                WHERE id = :id AND user_id = :uid
            ");
            $up->execute([
                ':txt' => $note_text,
                ':col' => $color_tag,
                ':id' => $note_id,
                ':uid' => $user_id
            ]);

            echo json_encode(["status" => "success", "message" => "Note updated successfully."]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        exit;
    }

    // 3. CREATE NOTE
    $course_id = isset($data->course_id) ? intval($data->course_id) : 0;
    $lesson_id = isset($data->lesson_id) ? intval($data->lesson_id) : 0;
    $note_text = isset($data->note_text) ? trim($data->note_text) : '';
    $timestamp_seconds = isset($data->timestamp_seconds) ? intval($data->timestamp_seconds) : 0;
    $timestamp_formatted = isset($data->timestamp_formatted) ? trim($data->timestamp_formatted) : '00:00';
    $color_tag = isset($data->color_tag) ? trim($data->color_tag) : 'indigo';

    if ($course_id <= 0 || $lesson_id <= 0 || empty($note_text)) {
        echo json_encode(["status" => "error", "message" => "Course, lesson ID, and note content are required."]);
        exit;
    }

    try {
        $ins = $db->prepare("
            INSERT INTO student_lesson_notes (user_id, course_id, lesson_id, timestamp_seconds, timestamp_formatted, note_text, color_tag, created_at, updated_at)
            VALUES (:uid, :cid, :lid, :tsec, :tfmt, :ntxt, :col, NOW(), NOW())
        ");
        $ins->execute([
            ':uid' => $user_id,
            ':cid' => $course_id,
            ':lid' => $lesson_id,
            ':tsec' => $timestamp_seconds,
            ':tfmt' => $timestamp_formatted,
            ':ntxt' => $note_text,
            ':col' => $color_tag
        ]);

        $new_id = $db->lastInsertId();

        echo json_encode([
            "status" => "success",
            "message" => "Note saved successfully!",
            "data" => [
                "id" => $new_id,
                "user_id" => $user_id,
                "course_id" => $course_id,
                "lesson_id" => $lesson_id,
                "timestamp_seconds" => $timestamp_seconds,
                "timestamp_formatted" => $timestamp_formatted,
                "note_text" => $note_text,
                "color_tag" => $color_tag,
                "created_at" => date('Y-m-d H:i:s')
            ]
        ]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}
?>
