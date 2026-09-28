<?php
// High-Speed Student Daily Practice File Uploader
// Direct Server-Side Cloudflare R2 Upload (Zero Browser CORS Issues)
// Creative Computer Academy - Student Portal

@ini_set('display_errors', '0');
error_reporting(0);

@ini_set('upload_max_filesize', '256M');
@ini_set('post_max_size', '256M');
@ini_set('max_execution_time', '300');
@ini_set('memory_limit', '512M');

require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/r2.php';
require_once __DIR__ . '/../../../config/R2Client.php';
require_once __DIR__ . '/DailyLogDbHelper.php';

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

try {
    $userId = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;
    $customDate = isset($_POST['date']) && !empty($_POST['date']) ? trim($_POST['date']) : date('Y-m-d');

    if ($userId <= 0) {
        echo json_encode(["status" => "error", "message" => "Valid user_id is required."]);
        exit();
    }

    if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        $errorCode = isset($_FILES['file']['error']) ? $_FILES['file']['error'] : 'NO_FILE';
        echo json_encode(["status" => "error", "message" => "File upload failed or no file received (Code: {$errorCode})."]);
        exit();
    }

    $fileData = $_FILES['file'];
    $originalName = basename($fileData['name']);
    $fileSize = intval($fileData['size']);
    $fileTmpPath = $fileData['tmp_name'];
    $fileExt = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

    $allowedExts = [
        'png', 'jpg', 'jpeg', 'webp', 'gif', 'svg',
        'psd', 'ai', 'eps', 'pdf', 'zip', 'rar', '7z',
        'doc', 'docx', 'txt', 'mp4', 'mov'
    ];

    if (!in_array($fileExt, $allowedExts)) {
        echo json_encode(["status" => "error", "message" => "File type .{$fileExt} is not supported."]);
        exit();
    }

    $database = new Database();
    $db = $database->getConnection();
    if (!$db) {
        echo json_encode(["status" => "error", "message" => "Database connection failed."]);
        exit();
    }

    DailyLogDbHelper::ensureSchema($db);

    // Fetch Student Code & Info
    $userStmt = $db->prepare("
        SELECT u.id, u.name, s.student_code
        FROM users u
        LEFT JOIN students s ON s.user_id = u.id
        WHERE u.id = :uid
        LIMIT 1
    ");
    $userStmt->execute([':uid' => $userId]);
    $userRow = $userStmt->fetch(PDO::FETCH_ASSOC);

    $studentCode = !empty($userRow['student_code']) ? $userRow['student_code'] : 'STU-' . $userId;
    $cleanStudentCode = preg_replace('/[^A-Za-z0-9_-]/', '', $studentCode);

    // Folder Structure: daily-logs/YYYY-MM/user_{id}_{code}/YYYY-MM-DD/timestamp_filename.ext
    $monthFolder = date('Y-m', strtotime($customDate));
    $dayFolder   = date('Y-m-d', strtotime($customDate));
    $userFolder  = "user_{$userId}_{$cleanStudentCode}";

    $cleanBaseName = preg_replace('/[^A-Za-z0-9_-]/', '_', pathinfo($originalName, PATHINFO_FILENAME));
    $cleanBaseName = trim($cleanBaseName, '_');
    if (empty($cleanBaseName)) $cleanBaseName = 'practice_file';

    $targetFileName = time() . "_{$cleanBaseName}." . $fileExt;
    $r2Key = "cca-student/daily-logs/{$monthFolder}/{$userFolder}/{$dayFolder}/{$targetFileName}";

    // Upload using R2Client (Connected directly to active public storage)
    $r2Client = new R2Client();
    $mimeType = function_exists('mime_content_type') ? @mime_content_type($fileTmpPath) : 'application/octet-stream';
    if (!$mimeType) $mimeType = 'application/octet-stream';

    $uploadRes = $r2Client->uploadFile($fileTmpPath, $r2Key, $mimeType);

    if ($uploadRes && !empty($uploadRes['success'])) {
        $finalUrl = $uploadRes['url'];
    } else {
        // Fallback to Local Storage if R2 is unavailable
        $localDir = __DIR__ . "/../../../../uploads/daily_logs/{$monthFolder}/{$userFolder}/{$dayFolder}/";
        if (!file_exists($localDir)) {
            @mkdir($localDir, 0777, true);
        }
        $localPath = $localDir . $targetFileName;
        if (move_uploaded_file($fileTmpPath, $localPath)) {
            $finalUrl = "uploads/daily_logs/{$monthFolder}/{$userFolder}/{$dayFolder}/" . $targetFileName;
        } else {
            echo json_encode([
                "status" => "error",
                "message" => "Upload failed: " . ($uploadRes['error'] ?? 'Storage connection error.')
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
            "size"      => ($fileSize / (1024 * 1024) < 1) ? round($fileSize / 1024, 1) . ' KB' : round($fileSize / (1024 * 1024), 2) . ' MB',
            "size_bytes"=> $fileSize,
            "ext"       => $fileExt,
            "type"      => in_array($fileExt, ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg']) ? 'preview' : 'source'
        ]
    ]);

} catch (\Throwable $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
