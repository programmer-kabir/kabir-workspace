<?php
// server/api/breaks/sync_offline_breaks.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/PusherHelper.php';
require_once __DIR__ . '/BreakDbHelper.php';

date_default_timezone_set('Asia/Dhaka');

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!isset($data['user_id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "user_id is required."]);
    exit();
}

$userId = (int)$data['user_id'];
$breaks = isset($data['breaks']) && is_array($data['breaks']) ? $data['breaks'] : [];

if (empty($breaks)) {
    echo json_encode(["status" => "success", "message" => "No offline breaks to sync.", "synced_count" => 0]);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();
    if (!$db) {
        throw new Exception("Database connection unavailable.");
    }

    BreakDbHelper::ensureSchema($db);

    $synced = [];
    $errors = [];

    foreach ($breaks as $b) {
        $clientBreakId = !empty($b['id']) ? trim($b['id']) : null;
        $breakType     = !empty($b['break_type']) ? trim($b['break_type']) : 'Tiffin';
        $purpose       = !empty($b['purpose']) ? trim($b['purpose']) : $breakType;
        $reason        = !empty($b['reason']) ? trim($b['reason']) : 'Offline break';
        $status        = !empty($b['status']) ? trim($b['status']) : 'Completed';
        
        $startTime = !empty($b['start_time']) ? trim($b['start_time']) : date('Y-m-d H:i:s');
        $endTime   = !empty($b['end_time']) ? trim($b['end_time']) : null;
        
        // Extract calendar date (YYYY-MM-DD)
        $date = !empty($b['date']) ? trim($b['date']) : date('Y-m-d', strtotime($startTime));
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            $date = date('Y-m-d');
        }

        // Deduplication check: check if an identical break for this user & start_time exists
        $dupStmt = $db->prepare("SELECT id, status FROM user_breaks WHERE user_id = :uid AND date = :pdate AND start_time = :stime LIMIT 1");
        $dupStmt->execute([
            ':uid'   => $userId,
            ':pdate' => $date,
            ':stime' => $startTime
        ]);
        $existing = $dupStmt->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            $existingId = (int)$existing['id'];
            if ($status === 'Completed' && $existing['status'] === 'Active' && !empty($endTime)) {
                $startTs = strtotime($startTime);
                $endTs   = strtotime($endTime);
                $durMins = max(1, round(abs($endTs - $startTs) / 60));
                $tiffinDelta = ($breakType === 'Tiffin') ? BreakDbHelper::calculateTiffinDelta($durMins) : 0;

                $upd = $db->prepare("UPDATE user_breaks 
                    SET end_time = :etime, duration_minutes = :dur, tiffin_delta_minutes = :delta, status = 'Completed', updated_at = NOW() 
                    WHERE id = :id");
                $upd->execute([
                    ':etime' => $endTime,
                    ':dur'   => $durMins,
                    ':delta' => $tiffinDelta,
                    ':id'    => $existingId
                ]);
            }

            $synced[] = [
                'client_id' => $clientBreakId,
                'server_id' => $existingId,
                'break_type' => $breakType,
                'status'    => 'already_synced'
            ];
            continue;
        }

        // Calculate duration and tiffin delta if completed
        $durationMinutes = 0;
        $tiffinDelta = 0;

        if ($status === 'Completed') {
            if (empty($endTime)) {
                $endTime = date('Y-m-d H:i:s');
            }
            $startTs = strtotime($startTime);
            $endTs   = strtotime($endTime);
            $durationMinutes = max(1, round(abs($endTs - $startTs) / 60));
            if ($breakType === 'Tiffin') {
                $tiffinDelta = BreakDbHelper::calculateTiffinDelta($durationMinutes);
            }
        }

        $ins = $db->prepare("INSERT INTO user_breaks 
            (user_id, date, break_type, purpose, reason, start_time, end_time, duration_minutes, tiffin_delta_minutes, status, created_at, updated_at) 
            VALUES 
            (:uid, :date, :btype, :purpose, :reason, :stime, :etime, :dur, :delta, :status, :stime, NOW())");
        
        $ins->execute([
            ':uid'     => $userId,
            ':date'    => $date,
            ':btype'   => $breakType,
            ':purpose' => $purpose,
            ':reason'  => $reason,
            ':stime'   => $startTime,
            ':etime'   => $endTime,
            ':dur'     => $durationMinutes,
            ':delta'   => $tiffinDelta,
            ':status'  => $status
        ]);

        $newServerId = (int)$db->lastInsertId();

        // Broadcast to Pusher so Admin Break Monitor updates in real-time
        try {
            $pusher = new PusherHelper();
            $pusher->trigger('staff-breaks', 'break-ended', [
                'break_id'         => $newServerId,
                'user_id'          => $userId,
                'break_type'       => $breakType,
                'purpose'          => $purpose,
                'status'           => $status,
                'duration_minutes' => $durationMinutes,
                'tiffin_delta'     => $tiffinDelta,
                'is_offline_sync'  => true
            ]);
        } catch (Throwable $pe) {}

        $synced[] = [
            'client_id'  => $clientBreakId,
            'server_id'  => $newServerId,
            'break_type' => $breakType,
            'duration'   => $durationMinutes,
            'status'     => 'inserted'
        ];
    }

    echo json_encode([
        "status"       => "success",
        "message"      => "Successfully synchronized " . count($synced) . " offline break(s).",
        "synced_count" => count($synced),
        "synced"       => $synced,
        "errors"       => $errors
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Failed to sync offline breaks: " . $e->getMessage()
    ]);
}
