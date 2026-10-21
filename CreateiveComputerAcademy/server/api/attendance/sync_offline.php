<?php
// server/api/attendance/sync_offline.php
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
require_once __DIR__ . '/AttendanceSecurityHelper.php';

date_default_timezone_set('Asia/Dhaka');

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!isset($data['user_id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "user_id is required."]);
    exit();
}

$userId = (int)$data['user_id'];
$punches = isset($data['punches']) && is_array($data['punches']) ? $data['punches'] : [];

if (empty($punches) && isset($data['type'])) {
    // Single punch payload fallback
    $punches = [$data];
}

if (empty($punches)) {
    echo json_encode(["status" => "success", "message" => "No offline punches to sync.", "synced_count" => 0]);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();
    if (!$db) {
        throw new Exception("Database unavailable.");
    }

    $synced = [];
    $errors = [];

    foreach ($punches as $p) {
        $type = isset($p['type']) ? trim(strtolower($p['type'])) : 'check_in';
        $punchDate = !empty($p['punch_date']) ? trim($p['punch_date']) : (!empty($p['date']) ? trim($p['date']) : date('Y-m-d'));
        $punchTime = !empty($p['punch_time']) ? trim($p['punch_time']) : (!empty($p['time']) ? trim($p['time']) : date('H:i:s'));
        $deviceInfo = isset($p['device_info']) && is_array($p['device_info']) ? $p['device_info'] : [];
        $location = isset($p['location']) && is_array($p['location']) ? $p['location'] : [];

        // Validate date format YYYY-MM-DD
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $punchDate)) {
            $punchDate = date('Y-m-d');
        }

        // Validate time format HH:MM:SS
        if (preg_match('/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/', $punchTime, $m)) {
            $h = str_pad($m[1], 2, '0', STR_PAD_LEFT);
            $i = $m[2];
            $s = isset($m[3]) ? $m[3] : '00';
            $punchTime = "{$h}:{$i}:{$s}";
        } else {
            $punchTime = date('H:i:s');
        }

        if ($type === 'check_in') {
            // Check if attendance record exists for this user and date
            $checkStmt = $db->prepare("SELECT id, check_in, check_out FROM attendance WHERE user_id = :uid AND date = :pdate LIMIT 1");
            $checkStmt->execute([':uid' => $userId, ':pdate' => $punchDate]);
            $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if (!$existing) {
                // Insert new attendance record with offline recorded time
                $ins = $db->prepare("INSERT INTO attendance (user_id, date, check_in, status) VALUES (:uid, :pdate, :ptime, 'Present')");
                $ins->execute([
                    ':uid'   => $userId,
                    ':pdate' => $punchDate,
                    ':ptime' => $punchTime
                ]);
                $attId = (int)$db->lastInsertId();

                // Log punch security entry
                $eval = [
                    'trust_score' => 95,
                    'distance_meters' => 0,
                    'verification_status' => 'offline_synced',
                    'notes' => 'Punched offline at ' . $punchTime . ', synced on ' . date('Y-m-d H:i:s')
                ];
                AttendanceSecurityHelper::logDevicePunch($db, $attId, $userId, 'check_in', $eval);

                $synced[] = [
                    'id' => $p['id'] ?? null,
                    'type' => 'check_in',
                    'date' => $punchDate,
                    'time' => $punchTime,
                    'status' => 'inserted'
                ];
            } else {
                // If record exists but check_in is null, backfill it
                if (empty($existing['check_in'])) {
                    $upd = $db->prepare("UPDATE attendance SET check_in = :ptime WHERE id = :id");
                    $upd->execute([':ptime' => $punchTime, ':id' => $existing['id']]);
                }
                $synced[] = [
                    'id' => $p['id'] ?? null,
                    'type' => 'check_in',
                    'date' => $punchDate,
                    'time' => $existing['check_in'] ?: $punchTime,
                    'status' => 'already_exists'
                ];
            }
        } elseif ($type === 'check_out') {
            // Find existing record
            $findStmt = $db->prepare("SELECT id, check_in, check_out FROM attendance WHERE user_id = :uid AND date = :pdate LIMIT 1");
            $findStmt->execute([':uid' => $userId, ':pdate' => $punchDate]);
            $att = $findStmt->fetch(PDO::FETCH_ASSOC);

            if ($att) {
                $attId = (int)$att['id'];
                $upd = $db->prepare("UPDATE attendance SET check_out = :ctime WHERE id = :id");
                $upd->execute([':ctime' => $punchTime, ':id' => $attId]);

                // Auto-close any lingering active break safely
                try {
                    $abStmt = $db->prepare("SELECT id, break_type, start_time FROM user_breaks WHERE user_id = :uid AND status = 'Active' ORDER BY id DESC LIMIT 1");
                    $abStmt->execute([':uid' => $userId]);
                    $activeBreak = $abStmt->fetch(PDO::FETCH_ASSOC);
                    if ($activeBreak) {
                        $abId = (int)$activeBreak['id'];
                        $abType = $activeBreak['break_type'];
                        $sTime = strtotime($activeBreak['start_time']);
                        $nowTime = time();
                        $durMins = max(1, round(abs($nowTime - $sTime) / 60));
                        $tDelta = 0;
                        if ($abType === 'Tiffin') {
                            require_once __DIR__ . '/../breaks/BreakDbHelper.php';
                            $tDelta = BreakDbHelper::calculateTiffinDelta($durMins);
                        }
                        $closeStmt = $db->prepare("UPDATE user_breaks SET end_time = NOW(), duration_minutes = :dur, tiffin_delta_minutes = :delta, status = 'Completed', updated_at = NOW() WHERE id = :id");
                        $closeStmt->execute([':dur' => $durMins, ':delta' => $tDelta, ':id' => $abId]);
                    }
                } catch (Throwable $eBrk) {}

                // Log check_out device metadata
                $evalOut = [
                    'trust_score' => 95,
                    'distance_meters' => 0,
                    'verification_status' => 'offline_synced',
                    'notes' => 'Punched checkout offline at ' . $punchTime . ', synced on ' . date('Y-m-d H:i:s')
                ];
                AttendanceSecurityHelper::logDevicePunch($db, $attId, $userId, 'check_out', $evalOut);

                // Sync payroll earnings
                try {
                    require_once __DIR__ . '/../payroll/PayrollHelper.php';
                    PayrollHelper::syncAttendanceEarnings($db, $userId);
                } catch (Exception $ePay) {}

                $synced[] = [
                    'id' => $p['id'] ?? null,
                    'type' => 'check_out',
                    'date' => $punchDate,
                    'time' => $punchTime,
                    'status' => 'updated'
                ];
            } else {
                // Check in wasn't found, insert new record with both or checkout
                $ins = $db->prepare("INSERT INTO attendance (user_id, date, check_out, status) VALUES (:uid, :pdate, :ptime, 'Present')");
                $ins->execute([
                    ':uid'   => $userId,
                    ':pdate' => $punchDate,
                    ':ptime' => $punchTime
                ]);
                $synced[] = [
                    'id' => $p['id'] ?? null,
                    'type' => 'check_out',
                    'date' => $punchDate,
                    'time' => $punchTime,
                    'status' => 'inserted'
                ];
            }
        }
    }

    echo json_encode([
        "status" => "success",
        "message" => "Successfully processed " . count($synced) . " offline punch(es).",
        "synced_count" => count($synced),
        "synced" => $synced,
        "errors" => $errors
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Failed to sync offline punches: " . $e->getMessage()
    ]);
}
