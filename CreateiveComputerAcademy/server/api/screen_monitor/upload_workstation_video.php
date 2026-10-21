<?php
// server/api/screen_monitor/upload_workstation_video.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/GoogleDriveClient.php';
require_once __DIR__ . '/../../config/R2Client.php';

date_default_timezone_set('Asia/Dhaka');
@ini_set('memory_limit', '1024M');
@set_time_limit(600);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed. Use POST.']);
    exit();
}

$userId     = !empty($_POST['user_id']) ? (int)$_POST['user_id'] : 0;
$staffName  = !empty($_POST['staff_name']) ? trim($_POST['staff_name']) : '';
$rawDate    = !empty($_POST['date']) ? trim($_POST['date']) : date('Y-m-d');
$startTime  = !empty($_POST['start_time']) ? trim($_POST['start_time']) : date('H:i:s', time() - 1800);
$endTime    = !empty($_POST['end_time']) ? trim($_POST['end_time']) : date('H:i:s');
$chunkIndex = !empty($_POST['chunk_index']) ? (int)$_POST['chunk_index'] : 1;
$durationSec= !empty($_POST['duration_seconds']) ? (int)$_POST['duration_seconds'] : 1800;

if ($userId <= 0) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing or invalid user_id parameter.']);
    exit();
}

if (empty($_FILES['video_file']) || $_FILES['video_file']['error'] !== UPLOAD_ERR_OK) {
    $errCode = $_FILES['video_file']['error'] ?? 'no_file';
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => "No valid video file uploaded. Code: {$errCode}"]);
    exit();
}

$tmpPath   = $_FILES['video_file']['tmp_name'];
$fileSize  = $_FILES['video_file']['size'];

// Normalize Date format: ensure Y-m-d for DB and d-m-Y for Google Drive folder
$ts = strtotime($rawDate);
if ($ts === false) $ts = time();
$dbDate = date('Y-m-d', $ts);
$folderDate = date('d-m-Y', $ts); // e.g. 17-10-2026

try {
    $database = new Database();
    $db = $database->getConnection();

    // 1. Ensure staff_workstation_videos table exists
    $db->exec("
        CREATE TABLE IF NOT EXISTS staff_workstation_videos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            staff_name VARCHAR(150) NOT NULL,
            date DATE NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            chunk_index INT DEFAULT 1,
            duration_seconds INT DEFAULT 1800,
            file_size_bytes BIGINT NOT NULL,
            drive_file_id VARCHAR(100) NOT NULL,
            drive_view_link TEXT DEFAULT NULL,
            storage_provider VARCHAR(20) DEFAULT 'gdrive',
            status ENUM('uploaded', 'processing', 'failed') DEFAULT 'uploaded',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_user_date (user_id, date),
            INDEX idx_date (date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // Resolve staff name if generic or empty
    if (empty($staffName) || $staffName === "Staff #{$userId}") {
        $uStmt = $db->prepare("SELECT name FROM users WHERE id = :uid LIMIT 1");
        $uStmt->execute([':uid' => $userId]);
        $uRow = $uStmt->fetch(PDO::FETCH_ASSOC);
        if ($uRow && !empty($uRow['name'])) {
            $staffName = $uRow['name'];
        } else {
            $staffName = "Staff_{$userId}";
        }
    }

    $sanitizedStaffName = preg_replace('/[^a-zA-Z0-9_-]/', '_', trim($staffName));
    $staffFolderKey = "{$sanitizedStaffName}_{$userId}";

    // Format clean start/end time for file naming (e.g. 09-00_AM)
    $cleanStart = preg_replace('/[^a-zA-Z0-9]/', '-', date('h-i_A', strtotime($startTime)));
    $cleanEnd   = preg_replace('/[^a-zA-Z0-9]/', '-', date('h-i_A', strtotime($endTime)));
    $chunkPad   = str_pad($chunkIndex, 2, '0', STR_PAD_LEFT);
    $targetFileName = "clip_{$chunkPad}_{$cleanStart}_to_{$cleanEnd}.webm";

    $storageProvider = 'gdrive';
    $driveFileId = '';
    $driveViewLink = '';

    // ── ATTEMPT GOOGLE DRIVE UPLOAD ─────────────────────────────────────────────
    $driveSuccess = false;
    try {
        $gdrive = new GoogleDriveClient();
        if ($gdrive->isConfigured()) {
            // Read root folder ID from settings if configured, fallback to CCA_Vault
            $rootParentId = null;
            try {
                $stStmt = $db->query("SELECT setting_value FROM system_storage_settings WHERE setting_key = 'gdrive_root_folder_id' LIMIT 1");
                $val = $stStmt ? $stStmt->fetchColumn() : null;
                if (!empty($val)) $rootParentId = trim($val);
            } catch (Throwable $e) {}

            // Fallback: Always place Workstation_Videos inside CCA_Vault
            if (empty($rootParentId)) {
                $rootParentId = $gdrive->findOrCreateFolder('CCA_Vault');
            }

            // 1. Root: CCA_Vault / Workstation_Videos
            $mainVaultId = $gdrive->findOrCreateFolder('Workstation_Videos', $rootParentId);
            if (empty($mainVaultId)) $mainVaultId = $rootParentId;

            // 2. Date Folder: DD-MM-YYYY (e.g. 17-10-2026)
            $dateFolderId = $gdrive->findOrCreateFolder($folderDate, $mainVaultId);

            // 3. Staff Folder: StaffName_UserID (e.g. Kabir_Hossen_2)
            $staffFolderId = $gdrive->findOrCreateFolder($staffFolderKey, $dateFolderId);

            // 4. Upload 30-min WebM clip
            $uploadRes = $gdrive->uploadFile($tmpPath, $targetFileName, 'video/webm', $staffFolderId);

            $driveFileId   = $uploadRes['file_id'];
            $driveViewLink = $uploadRes['view_url'];
            $gdrive->makeFilePublic($driveFileId);

            $driveSuccess = true;
            $storageProvider = 'gdrive';
        }
    } catch (Exception $driveErr) {
        error_log("[WorkstationVideo] GDrive Upload failed: " . $driveErr->getMessage());
    }

    // ── FALLBACK TO CLOUDFLARE R2 IF DRIVE FAILS ──────────────────────────────
    if (!$driveSuccess) {
        try {
            $r2 = new R2Client();
            $r2Key = "workstation_videos/{$folderDate}/{$staffFolderKey}/{$targetFileName}";
            $r2Res = $r2->uploadFile($tmpPath, $r2Key, 'video/webm');

            if ($r2Res['success']) {
                $storageProvider = 'r2';
                $driveFileId = $r2Key;
                $driveViewLink = $r2Res['url'];
            } else {
                throw new Exception("R2 failover failed: " . ($r2Res['error'] ?? 'Unknown error'));
            }
        } catch (Exception $r2Err) {
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => 'Upload failed on both Google Drive and R2: ' . $r2Err->getMessage()
            ]);
            exit();
        }
    }

    // ── RECORD METADATA IN DATABASE ──────────────────────────────────────────
    $ins = $db->prepare("
        INSERT INTO staff_workstation_videos 
        (user_id, staff_name, date, start_time, end_time, chunk_index, duration_seconds, file_size_bytes, drive_file_id, drive_view_link, storage_provider, status)
        VALUES 
        (:uid, :name, :dt, :start, :end, :chunk, :dur, :size, :fid, :link, :prov, 'uploaded')
    ");
    $ins->execute([
        ':uid'   => $userId,
        ':name'  => $staffName,
        ':dt'    => $dbDate,
        ':start' => date('H:i:s', strtotime($startTime)),
        ':end'   => date('H:i:s', strtotime($endTime)),
        ':chunk' => $chunkIndex,
        ':dur'   => $durationSec,
        ':size'  => $fileSize,
        ':fid'   => $driveFileId,
        ':link'  => $driveViewLink,
        ':prov'  => $storageProvider
    ]);

    $insertedId = (int)$db->lastInsertId();

    echo json_encode([
        'status'           => 'success',
        'message'          => 'Workstation video clip uploaded successfully.',
        'video_id'         => $insertedId,
        'user_id'          => $userId,
        'staff_name'       => $staffName,
        'date'             => $folderDate,
        'file_name'        => $targetFileName,
        'file_size_mb'     => round($fileSize / (1024 * 1024), 2),
        'storage_provider' => $storageProvider,
        'drive_file_id'    => $driveFileId,
        'view_link'        => $driveViewLink
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Server error while processing video upload: ' . $e->getMessage()
    ]);
}
?>
