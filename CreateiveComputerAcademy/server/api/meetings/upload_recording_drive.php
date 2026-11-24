<?php
// server/api/meetings/upload_recording_drive.php
// Receives in-browser recorded meeting video (WebM/MP4)
// Saves to local server storage and uploads directly to CCA Google Drive Cloud Vault
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../config/GoogleDriveClient.php';
require_once 'MeetingDbHelper.php';

date_default_timezone_set('Asia/Dhaka');

// Increase script execution time and memory for video handling
@set_time_limit(600);
@ini_set('memory_limit', '512M');

$database = new Database();
$db = $database->getConnection();
MeetingDbHelper::ensureSchema($db);

$roomId   = isset($_POST['room_id']) ? trim($_POST['room_id']) : '';
$userId   = isset($_POST['user_id']) ? (int)$_POST['user_id'] : 0;
$duration = isset($_POST['duration']) ? (int)$_POST['duration'] : 0;

if (empty($roomId)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Room ID is required."]);
    exit;
}

if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "No recording file uploaded or file transfer error."]);
    exit;
}

$fileData     = $_FILES['file'];
$fileTmpPath  = $fileData['tmp_name'];
$fileSize     = (int)$fileData['size'];
$originalName = basename($fileData['name']);
$fileExt      = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
if (!$fileExt) $fileExt = 'webm';

// Ensure uploads/meeting_recordings directory exists
$uploadDir = realpath(__DIR__ . '/../../uploads');
if (!$uploadDir) {
    $uploadDir = __DIR__ . '/../../uploads';
    @mkdir($uploadDir, 0755, true);
}
$recordingsDir = $uploadDir . DIRECTORY_SEPARATOR . 'meeting_recordings';
if (!is_dir($recordingsDir)) {
    @mkdir($recordingsDir, 0755, true);
}

// Generate unique safe filename: CCA_Meeting_<roomId>_<dateStr>.<ext>
$cleanRoomId = preg_replace('/[^a-zA-Z0-9_-]/', '_', $roomId);
$dateStr = date('Ymd_His');
$savedFileName = "CCA_Meeting_{$cleanRoomId}_{$dateStr}.{$fileExt}";
$localFilePath = $recordingsDir . DIRECTORY_SEPARATOR . $savedFileName;

// Move uploaded file to local recording vault
if (!move_uploaded_file($fileTmpPath, $localFilePath)) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Failed to save recording to local server vault."]);
    exit;
}

$localRelativeUrl = "uploads/meeting_recordings/{$savedFileName}";
$storageType = 'local_vault';
$finalViewUrl = $localRelativeUrl;
$driveFileId = null;
$driveMessage = null;

// Try uploading to Google Drive
try {
    $gdrive = new GoogleDriveClient();
    if ($gdrive->isConfigured()) {
        $driveMime = ($fileExt === 'mp4') ? 'video/mp4' : 'video/webm';

        // 1. Target verified folder ID: Meeting_Recordings inside CCA_Vault
        $vaultParentId = '18HFbN429toI-WJ1NUMTXcK3bVY69Kcno';
        $meetingFolderId = '1ylVVos5JaUoi4PBnewR2Danbd3AR5P4D';

        // Fallback search if needed
        try {
            if (empty($meetingFolderId)) {
                $meetingFolderId = $gdrive->findOrCreateFolder('Meeting_Recordings', $vaultParentId);
            }
        } catch (Throwable $fErr) {
            error_log("Meeting folder findOrCreate warning: " . $fErr->getMessage());
            $meetingFolderId = $vaultParentId;
        }

        $driveRes = $gdrive->uploadFile($localFilePath, $savedFileName, $driveMime, $meetingFolderId);
        if (!empty($driveRes['view_url'])) {
            $finalViewUrl = $driveRes['view_url'];
            $driveFileId = $driveRes['file_id'] ?? null;
            $storageType = 'google_drive';
            $driveMessage = "Saved inside CCA_Vault > Meeting_Recordings on Google Drive!";
        }
    } else {
        $driveMessage = "Saved locally. Google Drive credentials not yet configured on server.";
    }
} catch (Throwable $gErr) {
    error_log("Google Drive Upload Warning: " . $gErr->getMessage());
    $driveMessage = "Saved locally. Google Drive sync notice: " . $gErr->getMessage();
}

// Update database academy_meetings record
try {
    $updateStmt = $db->prepare("UPDATE `academy_meetings` SET
        `recording_url` = :rec_url,
        `recording_drive_id` = :drive_id,
        `recording_duration` = :duration,
        `recording_size` = :rec_size,
        `recorded_at` = NOW()
        WHERE `room_id` = :room_id
    ");
    $updateStmt->execute([
        ':rec_url'   => $finalViewUrl,
        ':drive_id'  => $driveFileId,
        ':duration'  => $duration,
        ':rec_size'  => $fileSize,
        ':room_id'   => $roomId
    ]);
} catch (Throwable $dbErr) {
    error_log("Database recording update error: " . $dbErr->getMessage());
}

echo json_encode([
    "status"          => "success",
    "storage"         => $storageType,
    "recording_url"   => $finalViewUrl,
    "drive_id"        => $driveFileId,
    "local_path"      => $localRelativeUrl,
    "duration"        => $duration,
    "size"            => $fileSize,
    "message"         => $driveMessage ?: "Meeting recording saved successfully!"
]);
