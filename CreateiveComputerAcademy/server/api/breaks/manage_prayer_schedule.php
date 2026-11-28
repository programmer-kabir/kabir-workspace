<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/PusherHelper.php';
require_once __DIR__ . '/BreakDbHelper.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();
BreakDbHelper::ensureSchema($db);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    try {
        $schedule = BreakDbHelper::getActivePrayerSchedule($db);
        echo json_encode([
            "status" => "success",
            "data" => $schedule,
            "server_time" => date('Y-m-d H:i:s')
        ]);
    } catch (Throwable $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->start_time)) {
        echo json_encode(["status" => "error", "message" => "start_time is required (e.g. 16:15)."]);
        exit;
    }

    try {
        $title = !empty($data->title) ? trim($data->title) : 'আসরের নামাজ ও বিকাল বিরতি';
        $startTimeRaw = trim($data->start_time);
        
        // Normalize time string (HH:MM or HH:MM:SS)
        $parsedTime = strtotime($startTimeRaw);
        if (!$parsedTime) {
            echo json_encode(["status" => "error", "message" => "Invalid start_time format."]);
            exit;
        }
        $startTime = date('H:i:00', $parsedTime);

        $allocatedMinutes = isset($data->allocated_minutes) ? max(5, min(60, (int)$data->allocated_minutes)) : 20;
        $endTime = date('H:i:00', strtotime($startTime) + ($allocatedMinutes * 60));
        $isActive = isset($data->is_active) ? ((int)$data->is_active ? 1 : 0) : 1;
        $salahRewardMins = isset($data->salah_reward_mins) ? max(0, min(30, (int)$data->salah_reward_mins)) : 3;
        $salahFullDayBonus = isset($data->salah_full_day_bonus) ? max(0, min(60, (int)$data->salah_full_day_bonus)) : 5;
        $isRewardEnabled = isset($data->is_reward_enabled) ? ((int)$data->is_reward_enabled ? 1 : 0) : 1;

        // Check if schedule exists
        $sStmt = $db->query("SELECT id FROM center_prayer_schedules ORDER BY id ASC LIMIT 1");
        $existing = $sStmt->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            $uStmt = $db->prepare("UPDATE center_prayer_schedules 
                                   SET title = :title, 
                                       start_time = :start_time, 
                                       end_time = :end_time, 
                                       allocated_minutes = :allocated_minutes, 
                                       is_active = :is_active, 
                                       salah_reward_mins = :salah_reward_mins,
                                       salah_full_day_bonus = :salah_full_day_bonus,
                                       is_reward_enabled = :is_reward_enabled,
                                       updated_at = NOW() 
                                   WHERE id = :id");
            $uStmt->execute([
                ':title' => $title,
                ':start_time' => $startTime,
                ':end_time' => $endTime,
                ':allocated_minutes' => $allocatedMinutes,
                ':is_active' => $isActive,
                ':salah_reward_mins' => $salahRewardMins,
                ':salah_full_day_bonus' => $salahFullDayBonus,
                ':is_reward_enabled' => $isRewardEnabled,
                ':id' => $existing['id']
            ]);
            $scheduleId = (int)$existing['id'];
        } else {
            $iStmt = $db->prepare("INSERT INTO center_prayer_schedules 
                                   (title, start_time, end_time, allocated_minutes, is_active, salah_reward_mins, salah_full_day_bonus, is_reward_enabled, created_at, updated_at) 
                                   VALUES (:title, :start_time, :end_time, :allocated_minutes, :is_active, :salah_reward_mins, :salah_full_day_bonus, :is_reward_enabled, NOW(), NOW())");
            $iStmt->execute([
                ':title' => $title,
                ':start_time' => $startTime,
                ':end_time' => $endTime,
                ':allocated_minutes' => $allocatedMinutes,
                ':is_active' => $isActive,
                ':salah_reward_mins' => $salahRewardMins,
                ':salah_full_day_bonus' => $salahFullDayBonus,
                ':is_reward_enabled' => $isRewardEnabled
            ]);
            $scheduleId = (int)$db->lastInsertId();
        }

        $updatedSchedule = [
            "id" => $scheduleId,
            "title" => $title,
            "start_time" => $startTime,
            "end_time" => $endTime,
            "allocated_minutes" => $allocatedMinutes,
            "is_active" => $isActive,
            "salah_reward_mins" => $salahRewardMins,
            "salah_full_day_bonus" => $salahFullDayBonus,
            "is_reward_enabled" => $isRewardEnabled
        ];

        // Trigger Real-time event to all staff browsers
        try {
            $pusher = new PusherHelper();
            $pusher->trigger('staff-breaks', 'prayer-schedule-updated', $updatedSchedule);
            $pusher->trigger('admin-breaks', 'prayer-schedule-updated', $updatedSchedule);
        } catch (Throwable $pe) {
            error_log("Pusher prayer schedule error: " . $pe->getMessage());
        }

        echo json_encode([
            "status" => "success",
            "message" => "Namaz & Prayer Schedule updated successfully.",
            "data" => $updatedSchedule
        ]);
    } catch (Throwable $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}
