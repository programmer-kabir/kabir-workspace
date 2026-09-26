<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';
require_once '../../../config/r2.php';
require_once '../../../config/R2Client.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo json_encode(["status" => "error", "message" => "Database connection error."]);
    exit;
}

// Ensure database table and columns exist
try {
    $db->exec("CREATE TABLE IF NOT EXISTS `student_submissions` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `assignment_id` INT NOT NULL,
        `course_id` INT DEFAULT NULL,
        `user_id` INT NOT NULL,
        `submission_link` TEXT DEFAULT NULL,
        `file_url` VARCHAR(500) DEFAULT NULL,
        `file_name` VARCHAR(255) DEFAULT NULL,
        `file_size` INT DEFAULT NULL,
        `files_json` LONGTEXT DEFAULT NULL,
        `notes` TEXT DEFAULT NULL,
        `marks_obtained` INT DEFAULT NULL,
        `feedback` TEXT DEFAULT NULL,
        `status` ENUM('submitted', 'reviewed', 'resubmit_required') DEFAULT 'submitted',
        `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `reviewed_at` DATETIME DEFAULT NULL,
        `reviewer_id` INT DEFAULT NULL,
        INDEX (`assignment_id`),
        INDEX (`user_id`),
        INDEX (`course_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Add missing columns if table existed prior
    $cols = $db->query("SHOW COLUMNS FROM `student_submissions`")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('files_json', $cols)) {
        $db->exec("ALTER TABLE `student_submissions` ADD COLUMN `files_json` LONGTEXT DEFAULT NULL AFTER `file_size`");
    }
    if (!in_array('file_url', $cols)) {
        $db->exec("ALTER TABLE `student_submissions` ADD COLUMN `file_url` VARCHAR(500) DEFAULT NULL AFTER `submission_link`");
    }
    if (!in_array('file_name', $cols)) {
        $db->exec("ALTER TABLE `student_submissions` ADD COLUMN `file_name` VARCHAR(255) DEFAULT NULL AFTER `file_url`");
    }
    if (!in_array('file_size', $cols)) {
        $db->exec("ALTER TABLE `student_submissions` ADD COLUMN `file_size` INT DEFAULT NULL AFTER `file_name`");
    }
    if (!in_array('course_id', $cols)) {
        $db->exec("ALTER TABLE `student_submissions` ADD COLUMN `course_id` INT DEFAULT NULL AFTER `assignment_id`");
    }
} catch (Throwable $e) {}

// Read inputs from either multipart/form-data or JSON payload
$assignment_id = 0;
$user_id = 0;
$course_id = 0;
$submission_link = '';
$notes = '';
$submittedFiles = [];

if (!empty($_POST)) {
    $assignment_id = isset($_POST['assignment_id']) ? intval($_POST['assignment_id']) : 0;
    $user_id = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;
    $course_id = isset($_POST['course_id']) ? intval($_POST['course_id']) : 0;
    $submission_link = isset($_POST['submission_link']) ? trim($_POST['submission_link']) : '';
    $notes = isset($_POST['notes']) ? trim($_POST['notes']) : '';
    if (isset($_POST['files_json'])) {
        $decoded = json_decode($_POST['files_json'], true);
        if (is_array($decoded)) $submittedFiles = $decoded;
    }
} else {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);
    if ($data) {
        $assignment_id = isset($data['assignment_id']) ? intval($data['assignment_id']) : 0;
        $user_id = isset($data['user_id']) ? intval($data['user_id']) : 0;
        $course_id = isset($data['course_id']) ? intval($data['course_id']) : 0;
        $submission_link = isset($data['submission_link']) ? trim($data['submission_link']) : '';
        $notes = isset($data['notes']) ? trim($data['notes']) : '';
        if (isset($data['files']) && is_array($data['files'])) {
            $submittedFiles = $data['files'];
        } elseif (isset($data['files_json'])) {
            $decoded = json_decode($data['files_json'], true);
            if (is_array($decoded)) $submittedFiles = $decoded;
        }
    }
}

if (!$assignment_id || !$user_id) {
    echo json_encode(["status" => "error", "message" => "Assignment ID and User ID are required."]);
    exit;
}

// Helper to create clean filesystem & cloud storage slugs
function cleanSlug($str, $fallback = 'unknown') {
    $clean = preg_replace('/[^a-zA-Z0-9_-]/', '_', trim((string)$str));
    $clean = preg_replace('/_+/', '_', $clean);
    $clean = trim($clean, '_');
    return !empty($clean) ? $clean : $fallback;
}

try {
    // Check if submission already exists
    $stmt = $db->prepare("
        SELECT id, file_url, file_name, file_size, files_json, marks_obtained, feedback, status 
        FROM student_submissions 
        WHERE assignment_id = :aid AND user_id = :uid 
        LIMIT 1
    ");
    $stmt->execute([':aid' => $assignment_id, ':uid' => $user_id]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    // If existing files exist and no new files array passed, retain existing
    if (empty($submittedFiles) && $existing && !empty($existing['files_json'])) {
        $prevFiles = json_decode($existing['files_json'], true);
        if (is_array($prevFiles)) $submittedFiles = $prevFiles;
    }

    // Handle single file upload if uploaded directly via standard form
    if (isset($_FILES['project_file']) && $_FILES['project_file']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['project_file'];
        $original_name = basename($file['name']);
        $file_ext = strtolower(pathinfo($original_name, PATHINFO_EXTENSION));

        // 1. Fetch Assignment & Course Context
        $infoStmt = $db->prepare("
            SELECT a.id, a.assignment_no, a.title AS assignment_title,
                   m.id AS module_id, m.module_no, m.title AS module_title,
                   ms.id AS milestone_id, ms.milestone_no, ms.title AS milestone_title,
                   c.id AS course_id, c.course_code, c.title AS course_title
            FROM course_assignments a
            LEFT JOIN course_modules m ON a.module_id = m.id
            LEFT JOIN course_milestones ms ON a.milestone_id = ms.id
            LEFT JOIN courses c ON a.course_id = c.id
            WHERE a.id = :aid
            LIMIT 1
        ");
        $infoStmt->execute([':aid' => $assignment_id]);
        $asgInfo = $infoStmt->fetch(PDO::FETCH_ASSOC);

        // 2. Fetch User Info
        $userStmt = $db->prepare("
            SELECT u.id, u.name, u.username
            FROM users u
            WHERE u.id = :uid
            LIMIT 1
        ");
        $userStmt->execute([':uid' => $user_id]);
        $userInfo = $userStmt->fetch(PDO::FETCH_ASSOC);

        // Assembly
        $courseSegment = !empty($asgInfo['course_code']) ? 'course_' . cleanSlug($asgInfo['course_code']) : ('course_' . $course_id);
        $mNo = !empty($asgInfo['milestone_no']) ? $asgInfo['milestone_no'] : 1;
        $milestoneSegment = 'milestone_' . $mNo;
        $modNo = !empty($asgInfo['module_no']) ? $asgInfo['module_no'] : 1;
        $moduleSegment = 'module_' . $modNo;
        $userSlug = !empty($userInfo['username']) ? cleanSlug($userInfo['username']) : 'student';
        $userSegment = 'user_' . $user_id . '_' . $userSlug;
        $cleanBaseName = cleanSlug(pathinfo($original_name, PATHINFO_FILENAME), 'submission');
        $targetFileName = time() . '_' . $cleanBaseName . '.' . $file_ext;

        $r2Key = "cca-student/assignment/{$courseSegment}/{$milestoneSegment}/{$moduleSegment}/{$userSegment}/{$targetFileName}";

        $r2Client = new R2Client();
        $mimeType = function_exists('mime_content_type') ? @mime_content_type($file['tmp_name']) : 'application/octet-stream';
        $uploadRes = $r2Client->uploadFile($file['tmp_name'], $r2Key, $mimeType ?: 'application/octet-stream');

        if ($uploadRes && !empty($uploadRes['success'])) {
            $uploadedUrl = $uploadRes['url'];
        } else {
            $localDir = __DIR__ . "/../../../../uploads/assignments/{$courseSegment}/{$milestoneSegment}/{$moduleSegment}/{$userSegment}/";
            if (!file_exists($localDir)) mkdir($localDir, 0777, true);
            move_uploaded_file($file['tmp_name'], $localDir . $targetFileName);
            $uploadedUrl = "uploads/assignments/{$courseSegment}/{$milestoneSegment}/{$moduleSegment}/{$userSegment}/" . $targetFileName;
        }

        $submittedFiles[] = [
            'name' => $original_name,
            'url' => $uploadedUrl,
            'key' => $r2Key,
            'size' => intval($file['size']),
            'ext' => $file_ext
        ];
    }

    // Determine primary file info for backward compatibility
    $primaryFileUrl = !empty($submittedFiles[0]['url']) ? $submittedFiles[0]['url'] : ($existing['file_url'] ?? null);
    $primaryFileName = !empty($submittedFiles[0]['name']) ? $submittedFiles[0]['name'] : ($existing['file_name'] ?? null);
    $primaryFileSize = !empty($submittedFiles[0]['size']) ? intval($submittedFiles[0]['size']) : ($existing['file_size'] ?? null);
    $filesJson = !empty($submittedFiles) ? json_encode($submittedFiles) : null;

    // Require at least one file OR a project link
    if (empty($submission_link) && empty($submittedFiles) && empty($primaryFileUrl)) {
        echo json_encode(["status" => "error", "message" => "Please upload one or more project files or provide a project link (Google Drive, Figma, GitHub, etc.)."]);
        exit;
    }

    if ($existing) {
        $updateStmt = $db->prepare("
            UPDATE student_submissions 
            SET course_id = COALESCE(:cid, course_id),
                submission_link = :link,
                file_url = :furl,
                file_name = :fname,
                file_size = :fsize,
                files_json = :fjson,
                notes = :notes,
                status = 'submitted',
                submitted_at = NOW()
            WHERE id = :id
        ");
        $updateStmt->execute([
            ':cid' => $course_id ?: null,
            ':link' => $submission_link ?: null,
            ':furl' => $primaryFileUrl,
            ':fname' => $primaryFileName,
            ':fsize' => $primaryFileSize,
            ':fjson' => $filesJson,
            ':notes' => $notes,
            ':id' => $existing['id']
        ]);
        $subId = intval($existing['id']);
    } else {
        $insStmt = $db->prepare("
            INSERT INTO student_submissions 
            (assignment_id, course_id, user_id, submission_link, file_url, file_name, file_size, files_json, notes, status, submitted_at)
            VALUES 
            (:aid, :cid, :uid, :link, :furl, :fname, :fsize, :fjson, :notes, 'submitted', NOW())
        ");
        $insStmt->execute([
            ':aid' => $assignment_id,
            ':cid' => $course_id ?: null,
            ':uid' => $user_id,
            ':link' => $submission_link ?: null,
            ':furl' => $primaryFileUrl,
            ':fname' => $primaryFileName,
            ':fsize' => $primaryFileSize,
            ':fjson' => $filesJson,
            ':notes' => $notes
        ]);
        $subId = intval($db->lastInsertId());
    }

    echo json_encode([
        "status" => "success",
        "message" => "Assignment submitted successfully!",
        "data" => [
            "id" => $subId,
            "submission_id" => $subId,
            "assignment_id" => $assignment_id,
            "course_id" => $course_id,
            "user_id" => $user_id,
            "submission_link" => $submission_link,
            "file_url" => $primaryFileUrl,
            "file_name" => $primaryFileName,
            "file_size" => $primaryFileSize,
            "files" => $submittedFiles,
            "notes" => $notes,
            "status" => "submitted",
            "submitted_at" => date('Y-m-d H:i:s'),
            "is_completed" => true
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
