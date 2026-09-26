<?php
// Universal Bulletproof Final Stock Delivery & Approval Handler
// Works safely across local and production environments

@ini_set('display_errors', '0');
error_reporting(0);

@ini_set('upload_max_filesize', '128M');
@ini_set('post_max_size', '128M');
@ini_set('max_execution_time', '300');
@ini_set('memory_limit', '256M');

// Universal CORS & Content Type
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header("Access-Control-Allow-Origin: " . $origin);
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(["status" => "success", "message" => "Preflight OK"]);
    exit();
}
require_once '../../config/cors.php';
require_once '../../config/database.php';
if (file_exists('../credits/CreditHelper.php')) {
    require_once '../credits/CreditHelper.php';
}
if (file_exists('../../config/R2Client.php')) {
    @require_once '../../config/R2Client.php';
} elseif (file_exists('../config/R2Client.php')) {
    @require_once '../config/R2Client.php';
}

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

if (!$db) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit();
}

// 1. Auto ensure required tables and columns exist
try {
    $db->exec("
        CREATE TABLE IF NOT EXISTS task_final_deliveries (
            id INT AUTO_INCREMENT PRIMARY KEY,
            task_id INT NOT NULL,
            reviewer_id INT NOT NULL,
            final_file_url VARCHAR(500) NULL,
            final_image_url VARCHAR(500) NULL,
            fix_notes TEXT NULL,
            is_stock_ready TINYINT(1) DEFAULT 1,
            source_type VARCHAR(50) DEFAULT 'reviewer_corrected',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_task_final (task_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    // Ensure columns exist in case table was created with an older schema
    $colsCheck = $db->query("SHOW COLUMNS FROM task_final_deliveries")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('final_image_url', $colsCheck)) {
        $db->exec("ALTER TABLE task_final_deliveries ADD COLUMN final_image_url VARCHAR(500) NULL AFTER final_file_url");
    }
    if (!in_array('fix_notes', $colsCheck)) {
        $db->exec("ALTER TABLE task_final_deliveries ADD COLUMN fix_notes TEXT NULL AFTER final_image_url");
    }
    if (!in_array('source_type', $colsCheck)) {
        $db->exec("ALTER TABLE task_final_deliveries ADD COLUMN source_type VARCHAR(50) DEFAULT 'reviewer_corrected' AFTER is_stock_ready");
    }

    $db->exec("
        CREATE TABLE IF NOT EXISTS task_reviews (
            id INT AUTO_INCREMENT PRIMARY KEY,
            task_id INT NOT NULL,
            reviewer_id INT NOT NULL,
            staff_user_id INT NULL,
            rating INT DEFAULT 5,
            feedback_notes TEXT NULL,
            tags TEXT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_task_review (task_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
} catch (Throwable $t) {
    error_log("Table ensure error in submit_final_delivery: " . $t->getMessage());
}

$task_id = isset($_POST['task_id']) ? intval($_POST['task_id']) : null;
$reviewer_id = isset($_POST['reviewer_id']) ? intval($_POST['reviewer_id']) : null;
$fix_notes = isset($_POST['fix_notes']) ? trim($_POST['fix_notes']) : null;
$final_file_link = isset($_POST['final_file_link']) ? trim($_POST['final_file_link']) : null;
$final_image_link = isset($_POST['final_image_link']) ? trim($_POST['final_image_link']) : null;
$source_type = isset($_POST['source_type']) ? $_POST['source_type'] : 'reviewer_corrected';

if (!$task_id || !$reviewer_id) {
    echo json_encode(["status" => "error", "message" => "task_id and reviewer_id are required."]);
    exit();
}

// Check task exists
$stmt = $db->prepare("SELECT id, title, status, assigned_to FROM tasks WHERE id = :id");
$stmt->execute([':id' => $task_id]);
$task = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$task) {
    echo json_encode(["status" => "error", "message" => "Task not found."]);
    exit();
}

$r2 = null;
try {
    if (class_exists('R2Client')) {
        $r2 = new R2Client();
    }
} catch (Throwable $e) {
    error_log("R2Client init error: " . $e->getMessage());
}

$final_file_url = $final_file_link;
$final_image_url = $final_image_link;

// Helper to determine safe mime type
function getDeliveryMimeType($tmpPath, $fileName, $fallback = 'application/octet-stream') {
    if (function_exists('finfo_open')) {
        try {
            $finfo = @finfo_open(FILEINFO_MIME_TYPE);
            if ($finfo) {
                $m = @finfo_file($finfo, $tmpPath);
                @finfo_close($finfo);
                if (!empty($m)) return $m;
            }
        } catch (Throwable $t) {}
    }
    $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    $map = [
        'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png',
        'webp' => 'image/webp', 'gif' => 'image/gif', 'psd' => 'image/vnd.adobe.photoshop',
        'ai' => 'application/postscript', 'eps' => 'application/postscript',
        'zip' => 'application/zip', 'rar' => 'application/x-rar-compressed',
        'pdf' => 'application/pdf'
    ];
    return $map[$ext] ?? $fallback;
}

// 1. Upload Final Source File to Cloud / Local
if (isset($_FILES['final_file']) && $_FILES['final_file']['error'] === UPLOAD_ERR_OK) {
    $fileTmpPath = $_FILES['final_file']['tmp_name'];
    $originalFileName = $_FILES['final_file']['name'];
    $fileExt = strtolower(pathinfo($originalFileName, PATHINFO_EXTENSION)) ?: 'zip';

    $targetFileName = "{$task_id}_update.{$fileExt}";
    $r2Key = "task_submissions/task_{$task_id}/{$targetFileName}";
    $mimeType = getDeliveryMimeType($fileTmpPath, $originalFileName, 'application/octet-stream');

    $uploadedToCloud = false;
    if ($r2) {
        try {
            $uploadRes = $r2->uploadFile($fileTmpPath, $r2Key, $mimeType);
            if ($uploadRes && !empty($uploadRes['success'])) {
                $final_file_url = $uploadRes['url'] ?? $uploadRes['public_url'] ?? $r2->getPublicUrl($r2Key);
                $uploadedToCloud = true;
            }
        } catch (Throwable $e) {
            error_log("R2 final file upload error: " . $e->getMessage());
        }
    }

    // Local fallback if R2 not configured or failed
    if (!$uploadedToCloud) {
        $localDir = __DIR__ . '/../../uploads/reviewer_finals/';
        if (!file_exists($localDir)) {
            @mkdir($localDir, 0777, true);
        }
        $destPath = $localDir . $targetFileName;
        if (@move_uploaded_file($fileTmpPath, $destPath)) {
            $final_file_url = "/uploads/reviewer_finals/" . $targetFileName;
        }
    }
}

// 2. Upload Final Preview Image to Cloud / Local
if (isset($_FILES['final_image']) && $_FILES['final_image']['error'] === UPLOAD_ERR_OK) {
    $imgTmpPath = $_FILES['final_image']['tmp_name'];
    $imgName = $_FILES['final_image']['name'];
    $imgExt = strtolower(pathinfo($imgName, PATHINFO_EXTENSION)) ?: 'jpg';

    $targetImgName = "{$task_id}_update.{$imgExt}";
    $r2ImgKey = "task_submissions/task_{$task_id}/{$targetImgName}";
    $mimeType = getDeliveryMimeType($imgTmpPath, $imgName, 'image/jpeg');

    $uploadedImgToCloud = false;
    if ($r2) {
        try {
            $uploadImgRes = $r2->uploadFile($imgTmpPath, $r2ImgKey, $mimeType);
            if ($uploadImgRes && !empty($uploadImgRes['success'])) {
                $final_image_url = $uploadImgRes['url'] ?? $uploadImgRes['public_url'] ?? $r2->getPublicUrl($r2ImgKey);
                $uploadedImgToCloud = true;
            }
        } catch (Throwable $e) {
            error_log("R2 final image upload error: " . $e->getMessage());
        }
    }

    // Local fallback
    if (!$uploadedImgToCloud) {
        $localDir = __DIR__ . '/../../uploads/reviewer_finals/';
        if (!file_exists($localDir)) {
            @mkdir($localDir, 0777, true);
        }
        $destImgPath = $localDir . $targetImgName;
        if (@move_uploaded_file($imgTmpPath, $destImgPath)) {
            $final_image_url = "/uploads/reviewer_finals/" . $targetImgName;
        }
    }
}

if (empty($final_file_url) && empty($final_image_url)) {
    echo json_encode(["status" => "error", "message" => "Please provide a final file (upload or link) or preview image."]);
    exit();
}

try {
    $db->beginTransaction();

    // 1. Insert or Update task_final_deliveries
    $deliveryQuery = "INSERT INTO task_final_deliveries 
        (task_id, reviewer_id, final_file_url, final_image_url, fix_notes, is_stock_ready, source_type)
        VALUES (:task_id, :reviewer_id, :final_file_url, :final_image_url, :fix_notes, 1, :source_type)
        ON DUPLICATE KEY UPDATE 
            reviewer_id = VALUES(reviewer_id),
            final_file_url = VALUES(final_file_url),
            final_image_url = VALUES(final_image_url),
            fix_notes = VALUES(fix_notes),
            is_stock_ready = 1,
            source_type = VALUES(source_type),
            updated_at = NOW()";

    $delStmt = $db->prepare($deliveryQuery);
    $delStmt->execute([
        ':task_id' => $task_id,
        ':reviewer_id' => $reviewer_id,
        ':final_file_url' => $final_file_url ?? '',
        ':final_image_url' => $final_image_url,
        ':fix_notes' => $fix_notes,
        ':source_type' => $source_type
    ]);

    // 2. Mark task as Completed
    $taskUpdateQuery = "UPDATE tasks 
        SET status = 'Completed',
            reviewed_by = :reviewer_id,
            reviewed_at = NOW(),
            updated_at = NOW(),
            rejected_by = NULL,
            rejected_at = NULL,
            rejection_reason = NULL
        WHERE id = :task_id";

    $taskStmt = $db->prepare($taskUpdateQuery);
    $taskStmt->execute([
        ':reviewer_id' => $reviewer_id,
        ':task_id' => $task_id
    ]);

    // 3. Save Rating / Review to task_reviews if provided
    $rating = isset($_POST['rating']) ? intval($_POST['rating']) : null;
    $feedback_notes = isset($_POST['feedback_notes']) ? trim($_POST['feedback_notes']) : $fix_notes;
    $tags_val = null;
    if (isset($_POST['tags'])) {
        $tags_val = is_array($_POST['tags']) ? json_encode($_POST['tags']) : (is_string($_POST['tags']) ? $_POST['tags'] : null);
    }

    if ($rating !== null && $rating > 0) {
        try {
            // Find staff user_id
            $staff_uid = intval($task['assigned_to']);
            try {
                $stf_stmt = $db->prepare("SELECT user_id FROM employees WHERE id = :id LIMIT 1");
                $stf_stmt->execute([':id' => $task['assigned_to']]);
                $emp_uid = $stf_stmt->fetchColumn();
                if ($emp_uid) $staff_uid = intval($emp_uid);
            } catch (Throwable $e) {}

            $rev_stmt = $db->prepare("INSERT INTO task_reviews (task_id, reviewer_id, staff_user_id, rating, feedback_notes, tags, created_at) 
                VALUES (:task_id, :reviewer_id, :staff_user_id, :rating, :feedback_notes, :tags, NOW())
                ON DUPLICATE KEY UPDATE rating = VALUES(rating), feedback_notes = VALUES(feedback_notes), tags = VALUES(tags), updated_at = NOW()");
            $rev_stmt->execute([
                ':task_id' => $task_id,
                ':reviewer_id' => $reviewer_id,
                ':staff_user_id' => $staff_uid,
                ':rating' => $rating,
                ':feedback_notes' => $feedback_notes,
                ':tags' => $tags_val
            ]);
        } catch (Throwable $ex) {
            error_log("Failed to insert task review in submit_final_delivery: " . $ex->getMessage());
        }
    }

    // Credit Reward for Staff (+Category.credit) and Reviewer (Delivery Bonus or Approval Credit)
    if (class_exists('CreditHelper')) {
        try {
            $reward_credit = isset($_POST['reward_credit']) && intval($_POST['reward_credit']) > 0 ? intval($_POST['reward_credit']) : null;
            CreditHelper::rewardTaskCompletion($db, $task_id, $reviewer_id, $reward_credit);

            if ($source_type === 'reviewer_corrected') {
                CreditHelper::rewardReviewerDeliveryBonus($db, $task_id, $reviewer_id);
            } else {
                CreditHelper::rewardReviewerApproval($db, $task_id, $reviewer_id);
            }
        } catch (Throwable $ex) {
            error_log("Credit reward error in submit_final_delivery: " . $ex->getMessage());
        }
    }

    // 4. Log to task_logs table
    try {
        $log_stmt = $db->prepare("INSERT INTO task_logs (task_id, status_from, status_to, changed_by) VALUES (:task_id, :status_from, 'Completed', :changed_by)");
        $log_stmt->execute([
            ':task_id' => $task_id,
            ':status_from' => $task['status'] ?: 'In Review',
            ':changed_by' => $reviewer_id
        ]);
    } catch (Throwable $e) {
        error_log("Task log error: " . $e->getMessage());
    }

    if ($db->inTransaction()) {
        $db->commit();
    }

    echo json_encode([
        "status" => "success",
        "message" => "Final stock delivery saved and task approved successfully!",
        "delivery" => [
            "task_id" => $task_id,
            "final_file_url" => $final_file_url,
            "final_image_url" => $final_image_url,
            "fix_notes" => $fix_notes,
            "rating" => $rating,
            "source_type" => $source_type
        ]
    ]);
} catch (Throwable $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    error_log("Error saving final delivery: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Failed to save final delivery: " . $e->getMessage()]);
}
