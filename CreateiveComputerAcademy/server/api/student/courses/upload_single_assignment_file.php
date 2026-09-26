<?php
// High-Speed Single File Uploader for Student Assignments (Parallel Worker Endpoint)
// Creative Computer Academy - Cloudflare R2 Storage

@ini_set('display_errors', '0');
error_reporting(0);

@ini_set('upload_max_filesize', '256M');
@ini_set('post_max_size', '256M');
@ini_set('max_execution_time', '300');
@ini_set('memory_limit', '512M');

require_once '../../../config/cors.php';
require_once '../../../config/database.php';
require_once '../../../config/r2.php';
require_once '../../../config/R2Client.php';

date_default_timezone_set('Asia/Dhaka');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(["status" => "success", "message" => "Preflight OK"]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(200);
    echo json_encode(["status" => "error", "message" => "Method not allowed. Use POST."]);
    exit();
}

$assignment_id = isset($_POST['assignment_id']) ? intval($_POST['assignment_id']) : 0;
$user_id       = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;
$course_id     = isset($_POST['course_id']) ? intval($_POST['course_id']) : 0;
$index         = isset($_POST['index']) ? intval($_POST['index']) : 1;

if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["status" => "error", "message" => "No valid file received or file upload error."]);
    exit();
}

if (!$assignment_id || !$user_id) {
    echo json_encode(["status" => "error", "message" => "Assignment ID and User ID are required."]);
    exit();
}

$fileData     = $_FILES['file'];
$originalName = basename($fileData['name']);
$fileSize     = intval($fileData['size']);
$fileTmpPath  = $fileData['tmp_name'];
$fileExt      = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

$allowed_extensions = [
    'zip', 'rar', '7z', 'tar', 'gz',
    'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt',
    'psd', 'ai', 'xd', 'fig', 'eps', 'svg',
    'png', 'jpg', 'jpeg', 'webp', 'gif',
    'mp4', 'mov', 'avi', 'mkv', 'webm',
    'html', 'css', 'js', 'json', 'py', 'cpp', 'c', 'java'
];

if (!in_array($fileExt, $allowed_extensions)) {
    echo json_encode(["status" => "error", "message" => "File type (.{$fileExt}) is not supported."]);
    exit();
}

function classifyAssignmentFileType($ext) {
    $images = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
    $videos = ['mp4', 'mov', 'webm', 'avi', 'mkv'];
    $source = ['psd', 'eps', 'ai', 'indd', 'cdr', 'zip', 'rar', '7z', 'tar', 'gz', 'pdf', 'fig', 'xd', 'docx', 'xlsx', 'pptx'];

    if (in_array($ext, $images)) return 'image';
    if (in_array($ext, $videos)) return 'video';
    if (in_array($ext, $source)) return 'source';
    return 'other';
}
$fileType = classifyAssignmentFileType($fileExt);

// Helper to create clean filesystem & cloud storage slugs
function cleanSlug($str, $fallback = 'unknown') {
    $clean = preg_replace('/[^a-zA-Z0-9_-]/', '_', trim((string)$str));
    $clean = preg_replace('/_+/', '_', $clean);
    $clean = trim($clean, '_');
    return !empty($clean) ? $clean : $fallback;
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // 1. Fetch Assignment, Module, Milestone & Course Context
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

    // 2. Fetch User Information
    $userStmt = $db->prepare("
        SELECT u.id, u.name, u.username
        FROM users u
        WHERE u.id = :uid
        LIMIT 1
    ");
    $userStmt->execute([':uid' => $user_id]);
    $userInfo = $userStmt->fetch(PDO::FETCH_ASSOC);

    // 3. Assemble Hierarchical Cloudflare R2 Folder Key:
    // cca-student / assignment / {course} / {milestone} / {module} / {user} / {file}
    
    // Course segment
    $courseSegment = !empty($asgInfo['course_code']) ? 'course_' . cleanSlug($asgInfo['course_code']) : ('course_' . $course_id);

    // Milestone segment
    $mNo = !empty($asgInfo['milestone_no']) ? $asgInfo['milestone_no'] : (!empty($asgInfo['milestone_id']) ? $asgInfo['milestone_id'] : 1);
    $milestoneSegment = 'milestone_' . $mNo;

    // Module segment
    $modNo = !empty($asgInfo['module_no']) ? $asgInfo['module_no'] : (!empty($asgInfo['module_id']) ? $asgInfo['module_id'] : 1);
    $moduleSegment = 'module_' . $modNo;

    // User segment
    $userSlug = !empty($userInfo['username']) ? cleanSlug($userInfo['username']) : (!empty($userInfo['name']) ? cleanSlug($userInfo['name']) : 'student');
    $userSegment = 'user_' . $user_id . '_' . $userSlug;

    // File name & full R2 Key
    $cleanBaseName = cleanSlug(pathinfo($originalName, PATHINFO_FILENAME), 'submission');
    $suffix = ($index > 1) ? "_{$index}" : "";
    $targetFileName = time() . "_{$cleanBaseName}{$suffix}." . $fileExt;

    $r2Key = "cca-student/assignment/{$courseSegment}/{$milestoneSegment}/{$moduleSegment}/{$userSegment}/{$targetFileName}";

    // Upload to Cloudflare R2 Bucket
    $r2Client = new R2Client();
    $mimeType = function_exists('mime_content_type') ? @mime_content_type($fileTmpPath) : 'application/octet-stream';
    $uploadRes = $r2Client->uploadFile($fileTmpPath, $r2Key, $mimeType ?: 'application/octet-stream');

    if ($uploadRes && !empty($uploadRes['success'])) {
        $finalUrl = $uploadRes['url'];
    } else {
        // Fallback to local storage
        $localDir = __DIR__ . "/../../../../uploads/assignments/{$courseSegment}/{$milestoneSegment}/{$moduleSegment}/{$userSegment}/";
        if (!file_exists($localDir)) {
            mkdir($localDir, 0777, true);
        }
        $localPath = $localDir . $targetFileName;
        if (move_uploaded_file($fileTmpPath, $localPath)) {
            $finalUrl = "uploads/assignments/{$courseSegment}/{$milestoneSegment}/{$moduleSegment}/{$userSegment}/" . $targetFileName;
        } else {
            echo json_encode([
                "status" => "error", 
                "message" => "Upload failed: " . ($uploadRes['error'] ?? 'R2 connection error')
            ]);
            exit();
        }
    }

    echo json_encode([
        "status" => "success",
        "message" => "File uploaded successfully!",
        "file" => [
            "name"      => $originalName,
            "url"       => $finalUrl,
            "key"       => $r2Key,
            "size"      => $fileSize,
            "ext"       => $fileExt,
            "file_type" => $fileType
        ]
    ]);

} catch (Throwable $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
