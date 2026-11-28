<?php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/PusherHelper.php';
require_once __DIR__ . '/../BreakDbHelper.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();
BreakDbHelper::ensureSchema($db);

$data = json_decode(file_get_contents("php://input"));

if (empty($data->user_id) || empty($data->waqt)) {
    echo json_encode(["status" => "error", "message" => "user_id and waqt are required."]);
    exit;
}

$userId = (int)$data->user_id;
$waqt = ucfirst(strtolower(trim($data->waqt)));
$validWaqts = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

if (!in_array($waqt, $validWaqts)) {
    echo json_encode(["status" => "error", "message" => "Invalid waqt. Allowed: Fajr, Dhuhr, Asr, Maghrib, Isha."]);
    exit;
}

$action = !empty($data->action) ? strtolower(trim($data->action)) : 'toggle';
$date = !empty($data->date) ? trim($data->date) : date('Y-m-d');
$now = date('Y-m-d H:i:s');

$waqtNamesBn = [
    'Fajr' => 'ফজর',
    'Dhuhr' => 'জোহর',
    'Asr' => 'আসর',
    'Maghrib' => 'মাগরিব',
    'Isha' => 'এশা'
];
$waqtBn = $waqtNamesBn[$waqt] ?? $waqt;

try {
    // Check if already logged for this user, date and waqt
    $chkStmt = $db->prepare("SELECT id, logged_at, reward_minutes, bonus_minutes, ledger_id FROM staff_salah_logs WHERE user_id = :uid AND date = :date AND waqt = :waqt LIMIT 1");
    $chkStmt->execute([':uid' => $userId, ':date' => $date, ':waqt' => $waqt]);
    $existing = $chkStmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        if ($action === 'toggle' || $action === 'unlog') {
            // 1. Delete associated ledger record for this waqt
            if (!empty($existing['ledger_id'])) {
                try {
                    $delLedger = $db->prepare("DELETE FROM mango_vault_ledger WHERE id = :lid AND user_id = :uid");
                    $delLedger->execute([':lid' => $existing['ledger_id'], ':uid' => $userId]);
                } catch (Throwable $tle) {}
            }
            // 2. Also check if today had a 5-waqt full day bonus awarded, and rollback bonus since waqt is no longer 5
            try {
                $delBonus = $db->prepare("DELETE FROM mango_vault_ledger WHERE user_id = :uid AND action_type = 'salah_full_day_bonus' AND note LIKE :datePattern");
                $delBonus->execute([':uid' => $userId, ':datePattern' => "%{$date}%"]);
            } catch (Throwable $tbe) {}

            // 3. Unlog / delete prayer record
            $delStmt = $db->prepare("DELETE FROM staff_salah_logs WHERE id = :id");
            $delStmt->execute([':id' => $existing['id']]);

            // Pusher notify mango balance change & salah update
            try {
                PusherHelper::trigger("user-{$userId}", 'mango-vault-updated', ['message' => 'Salah reward undone.']);
                PusherHelper::trigger('staff-breaks', 'salah-tracker-updated', ['user_id' => $userId, 'date' => $date]);
            } catch (Throwable $pe) {}

            echo json_encode([
                "status" => "success",
                "is_prayed" => false,
                "waqt" => $waqt,
                "message" => "{$waqtBn} নামাজের রেকর্ড আনডু করা হয়েছে।"
            ]);
            exit;
        } else {
            echo json_encode([
                "status" => "success",
                "is_prayed" => true,
                "waqt" => $waqt,
                "logged_at" => $existing['logged_at'],
                "message" => "{$waqtBn} নামাজ ইতিমধ্যে রেকর্ড করা আছে।"
            ]);
            exit;
        }
    } else {
        if ($action === 'unlog') {
            echo json_encode([
                "status" => "success",
                "is_prayed" => false,
                "waqt" => $waqt,
                "message" => "কোনো রেকর্ড পাওয়া যায়নি।"
            ]);
            exit;
        }

        // Fetch active prayer reward settings
        $schedule = BreakDbHelper::getActivePrayerSchedule($db);
        $isRewardEnabled = !empty($schedule['is_reward_enabled']);
        $rewardMins = $isRewardEnabled ? (int)($schedule['salah_reward_mins'] ?? 3) : 0;
        $fullDayBonusRate = $isRewardEnabled ? (int)($schedule['salah_full_day_bonus'] ?? 5) : 0;

        $ledgerId = null;
        if ($rewardMins > 0) {
            try {
                $lIns = $db->prepare("INSERT INTO mango_vault_ledger 
                    (user_id, action_type, mango_count, minutes_amount, from_source, note, performed_by, created_at) 
                    VALUES (:uid, 'salah_reward', 0, :mins, 'salah_tracker', :note, :perf, NOW())");
                $lIns->execute([
                    ':uid' => $userId,
                    ':mins' => $rewardMins,
                    ':note' => "সলাত রিওয়ার্ড: {$waqtBn} ওয়াক্ত ({$date})",
                    ':perf' => $userId
                ]);
                $ledgerId = (int)$db->lastInsertId();
            } catch (Throwable $tle) {
                error_log("salah ledger insert error: " . $tle->getMessage());
            }
        }

        // Insert new prayer log
        $insStmt = $db->prepare("INSERT INTO staff_salah_logs 
                                 (user_id, date, waqt, status, reward_minutes, bonus_minutes, ledger_id, logged_at, created_at) 
                                 VALUES (:uid, :date, :waqt, 'prayed', :rw, 0, :lid, :logged_at, NOW())");
        $insStmt->execute([
            ':uid' => $userId,
            ':date' => $date,
            ':waqt' => $waqt,
            ':rw' => $rewardMins,
            ':lid' => $ledgerId,
            ':logged_at' => $now
        ]);
        $salahLogId = (int)$db->lastInsertId();

        // Check if all 5 prayers are completed today for full day bonus
        $cntStmt = $db->prepare("SELECT COUNT(*) FROM staff_salah_logs WHERE user_id = :uid AND date = :date");
        $cntStmt->execute([':uid' => $userId, ':date' => $date]);
        $prayedCountToday = (int)$cntStmt->fetchColumn();

        $bonusAwarded = 0;
        if ($prayedCountToday >= 5 && $fullDayBonusRate > 0) {
            // Check if bonus already given today
            $chkBonus = $db->prepare("SELECT id FROM mango_vault_ledger WHERE user_id = :uid AND action_type = 'salah_full_day_bonus' AND note LIKE :notePattern LIMIT 1");
            $chkBonus->execute([':uid' => $userId, ':notePattern' => "%{$date}%"]);
            if (!$chkBonus->fetch()) {
                try {
                    $bIns = $db->prepare("INSERT INTO mango_vault_ledger 
                        (user_id, action_type, mango_count, minutes_amount, from_source, note, performed_by, created_at) 
                        VALUES (:uid, 'salah_full_day_bonus', 0, :mins, 'salah_tracker', :note, :perf, NOW())");
                    $bIns->execute([
                        ':uid' => $userId,
                        ':mins' => $fullDayBonusRate,
                        ':note' => "সলাত মেগা বোনাস: ৫ ওয়াক্ত সম্পন্ন ({$date})",
                        ':perf' => $userId
                    ]);
                    $bonusAwarded = $fullDayBonusRate;

                    // Update log with bonus_minutes
                    $updLog = $db->prepare("UPDATE staff_salah_logs SET bonus_minutes = :bm WHERE id = :id");
                    $updLog->execute([':bm' => $bonusAwarded, ':id' => $salahLogId]);
                } catch (Throwable $tbe) {
                    error_log("salah bonus insert error: " . $tbe->getMessage());
                }
            }
        }

        // Pusher Realtime update to user and center
        try {
            PusherHelper::trigger("user-{$userId}", 'mango-vault-updated', [
                'reward_minutes' => $rewardMins,
                'bonus_minutes' => $bonusAwarded
            ]);
            PusherHelper::trigger('staff-breaks', 'salah-tracker-updated', [
                'user_id' => $userId,
                'date' => $date
            ]);
        } catch (Throwable $pe) {}

        $msg = "মাশাআল্লাহ! {$waqtBn} ওয়াক্তের নামাজ সফলভাবে রেকর্ড হয়েছে।";
        if ($rewardMins > 0) {
            $msg .= " (+{$rewardMins} মিনিট ম্যাঙ্গো ওভারটাইম অর্জিত!)";
        }
        if ($bonusAwarded > 0) {
            $msg .= " 🎉 ৫ ওয়াক্ত পূর্ণ করায় অতিরিক্ত +{$bonusAwarded} মিনিট মেগা বোনাস!";
        }

        echo json_encode([
            "status" => "success",
            "is_prayed" => true,
            "waqt" => $waqt,
            "reward_minutes" => $rewardMins,
            "bonus_minutes" => $bonusAwarded,
            "logged_at" => $now,
            "message" => $msg
        ]);
        exit;
    }
} catch (Throwable $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
