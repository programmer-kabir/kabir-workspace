<?php
// server/api/screen_monitor/get_workstation_videos.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/cors.php';

date_default_timezone_set('Asia/Dhaka');

$rawDate = !empty($_GET['date']) ? trim($_GET['date']) : date('Y-m-d');
$userId  = !empty($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

$ts = strtotime($rawDate);
if ($ts === false) $ts = time();
$filterDate = date('Y-m-d', $ts);

try {
    $database = new Database();
    $db = $database->getConnection();

    // Ensure table exists
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

    $sql = "
        SELECT 
            id,
            user_id,
            staff_name,
            date,
            DATE_FORMAT(start_time, '%h:%i %p') as start_time_formatted,
            DATE_FORMAT(end_time, '%h:%i %p') as end_time_formatted,
            start_time,
            end_time,
            chunk_index,
            duration_seconds,
            file_size_bytes,
            ROUND(file_size_bytes / (1024 * 1024), 2) as file_size_mb,
            drive_file_id,
            drive_view_link,
            storage_provider,
            status,
            created_at
        FROM staff_workstation_videos
        WHERE date = :filter_date
    ";

    $params = [':filter_date' => $filterDate];
    if ($userId > 0) {
        $sql .= " AND user_id = :uid";
        $params[':uid'] = $userId;
    }

    $sql .= " ORDER BY user_id ASC, chunk_index ASC, start_time ASC";

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Group by staff member
    $staffGrouped = [];
    $totalAllMinutes = 0;

    foreach ($records as $row) {
        $uid = (int)$row['user_id'];
        if (!isset($staffGrouped[$uid])) {
            $staffGrouped[$uid] = [
                'user_id' => $uid,
                'staff_name' => $row['staff_name'],
                'date' => $row['date'],
                'total_clips' => 0,
                'total_duration_minutes' => 0,
                'total_size_mb' => 0,
                'clips' => []
            ];
        }

        $durMins = round($row['duration_seconds'] / 60);
        $staffGrouped[$uid]['total_clips']++;
        $staffGrouped[$uid]['total_duration_minutes'] += $durMins;
        $staffGrouped[$uid]['total_size_mb'] += (float)$row['file_size_mb'];

        // Build streaming preview / embed link
        $embedLink = $row['drive_view_link'];
        if ($row['storage_provider'] === 'gdrive' && !empty($row['drive_file_id'])) {
            $embedLink = "https://drive.google.com/file/d/{$row['drive_file_id']}/preview";
        }

        $row['embed_url'] = $embedLink;
        $staffGrouped[$uid]['clips'][] = $row;
        $totalAllMinutes += $durMins;
    }

    echo json_encode([
        'status' => 'success',
        'query_date' => $filterDate,
        'total_staff_recorded' => count($staffGrouped),
        'total_clips_count' => count($records),
        'total_recorded_hours' => round($totalAllMinutes / 60, 2),
        'data' => array_values($staffGrouped)
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to fetch workstation videos: ' . $e->getMessage()
    ]);
}
?>
