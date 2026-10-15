<?php
// BreakDbHelper.php - Schema auto-ensurance for Break & Approval System

class BreakDbHelper {
    public static function ensureSchema($db) {
        if (!$db) return;
        try {
            // 1. Create table if not exists
            $db->exec("CREATE TABLE IF NOT EXISTS user_breaks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                date DATE NOT NULL,
                break_type VARCHAR(50) NOT NULL,
                start_time DATETIME NULL,
                end_time DATETIME DEFAULT NULL,
                duration_minutes INT DEFAULT 0,
                status VARCHAR(30) NOT NULL DEFAULT 'Active',
                reason VARCHAR(255) NULL,
                estimated_minutes INT NULL,
                approved_by INT NULL,
                approved_at DATETIME NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX (user_id),
                INDEX (date),
                INDEX (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

            // 2. Add missing columns if existing table
            $cols = $db->query("SHOW COLUMNS FROM user_breaks")->fetchAll(PDO::FETCH_COLUMN);

            if (!in_array('purpose', $cols)) {
                $db->exec("ALTER TABLE user_breaks ADD COLUMN purpose VARCHAR(50) NULL AFTER break_type");
                $db->exec("UPDATE user_breaks SET purpose = 'Tiffin' WHERE break_type = 'Tiffin' AND (purpose IS NULL OR purpose = '')");
            }
            if (!in_array('reason', $cols)) {
                $db->exec("ALTER TABLE user_breaks ADD COLUMN reason VARCHAR(255) NULL AFTER status");
            }
            if (!in_array('estimated_minutes', $cols)) {
                $db->exec("ALTER TABLE user_breaks ADD COLUMN estimated_minutes INT NULL AFTER reason");
            }
            if (!in_array('approved_by', $cols)) {
                $db->exec("ALTER TABLE user_breaks ADD COLUMN approved_by INT NULL AFTER estimated_minutes");
            }
            if (!in_array('approved_at', $cols)) {
                $db->exec("ALTER TABLE user_breaks ADD COLUMN approved_at DATETIME NULL AFTER approved_by");
            }
            if (!in_array('tiffin_delta_minutes', $cols)) {
                $db->exec("ALTER TABLE user_breaks ADD COLUMN tiffin_delta_minutes INT DEFAULT 0 AFTER duration_minutes");
            }

            // Backfill completed tiffins with exact delta (40 - duration_minutes)
            try {
                $db->exec("UPDATE user_breaks 
                    SET tiffin_delta_minutes = (40 - duration_minutes) 
                    WHERE break_type = 'Tiffin' 
                      AND status = 'Completed' 
                      AND duration_minutes > 0");
            } catch (Throwable $bf) {}

            // Ensure status is VARCHAR(30) so 'Pending', 'Active', 'Completed', 'Rejected' are supported
            $db->exec("ALTER TABLE user_breaks MODIFY COLUMN status VARCHAR(30) NOT NULL DEFAULT 'Active'");

            // Allow start_time to be NULL for initial pending state
            $db->exec("ALTER TABLE user_breaks MODIFY COLUMN start_time DATETIME NULL");

            // 3. Ensure staff_withdrawals has overtime_hours_cashed column
            try {
                $swCols = $db->query("SHOW COLUMNS FROM staff_withdrawals")->fetchAll(PDO::FETCH_COLUMN);
                if (!in_array('overtime_hours_cashed', $swCols)) {
                    $db->exec("ALTER TABLE staff_withdrawals ADD COLUMN overtime_hours_cashed DECIMAL(6,2) NOT NULL DEFAULT 0.00 AFTER amount");
                }
            } catch (Throwable $t2) {}

            // 4. Ensure staff_overtime_trades table exists
            try {
                $db->exec("CREATE TABLE IF NOT EXISTS staff_overtime_trades (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    trade_code VARCHAR(50) NOT NULL UNIQUE,
                    seller_id INT NOT NULL,
                    buyer_id INT NOT NULL,
                    hours_traded DECIMAL(6,2) NOT NULL,
                    minutes_traded INT NOT NULL,
                    hourly_rate DECIMAL(10,2) NOT NULL,
                    total_price DECIMAL(10,2) NOT NULL,
                    status VARCHAR(30) NOT NULL DEFAULT 'pending_seller',
                    seller_action_at DATETIME NULL,
                    approved_by INT NULL,
                    approved_at DATETIME NULL,
                    rejection_reason VARCHAR(255) NULL,
                    buyer_note VARCHAR(255) NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX (seller_id),
                    INDEX (buyer_id),
                    INDEX (status)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
            } catch (Throwable $t3) {}

        } catch (Throwable $t) {
            error_log("BreakDbHelper error: " . $t->getMessage());
        }
    }

    /**
     * Calculates the user's current net available Mango Overtime balance in minutes
     * Formula: Total Worked Overtime Minutes + Bought Overtime - (Claimed Breaks + Cashed Out Overtime + Sold Overtime)
     */
    public static function getAvailableMangoMinutes($db, $user_id) {
        if (!$db || !$user_id) return 0;
        try {
            // 1. Fetch user shift hours
            $userStmt = $db->prepare("SELECT COALESCE(e.shift_hours, 8) as shift_hours FROM users u LEFT JOIN employees e ON u.id = e.user_id WHERE u.id = :user_id LIMIT 1");
            $userStmt->execute([':user_id' => $user_id]);
            $uRow = $userStmt->fetch(PDO::FETCH_ASSOC);
            $shift_hours = $uRow ? (float)$uRow['shift_hours'] : 8.0;
            if ($shift_hours <= 0) $shift_hours = 8.0;

            // 2. Fetch holidays
            $holidays = [];
            $holStmt = $db->query("SELECT date, expected_hours FROM holidays");
            if ($holStmt) {
                while ($h = $holStmt->fetch(PDO::FETCH_ASSOC)) {
                    $holidays[$h['date']] = (float)$h['expected_hours'];
                }
            }

            // 3. Fetch attendance records
            $attStmt = $db->prepare("SELECT date, check_in, check_out FROM attendance WHERE user_id = :user_id AND check_in IS NOT NULL AND check_out IS NOT NULL");
            $attStmt->execute([':user_id' => $user_id]);
            $attRows = $attStmt->fetchAll(PDO::FETCH_ASSOC);

            // Group worked seconds per calendar date
            $dailyWorked = [];
            foreach ($attRows as $r) {
                $in_ts = strtotime($r['check_in']);
                $out_ts = strtotime($r['check_out']);
                if ($out_ts <= $in_ts) continue;
                $d = $r['date'];
                if (!isset($dailyWorked[$d])) $dailyWorked[$d] = 0;
                $dailyWorked[$d] += ($out_ts - $in_ts);
            }

            $totalOvertimeSeconds = 0;
            foreach ($dailyWorked as $d => $workedSec) {
                $isFriday = (date('N', strtotime($d)) == 5);
                $expectedSec = $isFriday ? 0 : ($shift_hours * 3600);
                if (isset($holidays[$d])) {
                    $expectedSec = $holidays[$d] * 3600;
                }
                $diffSec = $workedSec - $expectedSec;
                if ($diffSec > 0) {
                    $totalOvertimeSeconds += $diffSec;
                }
            }
            $totalOvertimeMinutes = round($totalOvertimeSeconds / 60);

            // 4. Deduct claimed mango breaks (Full Day 480 mins + In-Shift minutes)
            $claimStmt = $db->prepare("SELECT SUM(duration_minutes) as used_mins FROM user_breaks WHERE user_id = :user_id AND break_type IN ('Mango Full Day', 'Mango Break', 'Mango Overtime') AND status != 'Rejected'");
            $claimStmt->execute([':user_id' => $user_id]);
            $claimRow = $claimStmt->fetch(PDO::FETCH_ASSOC);
            $usedBreakMins = (int)($claimRow['used_mins'] ?? 0);

            // 5. Deduct cashed out overtime from staff_withdrawals
            $cashStmt = $db->prepare("SELECT SUM(overtime_hours_cashed) as cashed_hrs FROM staff_withdrawals WHERE user_id = :user_id AND overtime_hours_cashed > 0 AND status != 'rejected'");
            $cashStmt->execute([':user_id' => $user_id]);
            $cashRow = $cashStmt->fetch(PDO::FETCH_ASSOC);
            $cashedMins = round(((float)($cashRow['cashed_hrs'] ?? 0)) * 60);

            // 6. Deduct sold overtime (hours sold to colleagues: pending or approved)
            $soldMins = 0;
            try {
                $soldStmt = $db->prepare("SELECT SUM(minutes_traded) as sold_mins FROM staff_overtime_trades WHERE seller_id = :user_id AND status IN ('approved', 'pending_admin', 'pending_seller')");
                $soldStmt->execute([':user_id' => $user_id]);
                $soldRow = $soldStmt->fetch(PDO::FETCH_ASSOC);
                $soldMins = (int)($soldRow['sold_mins'] ?? 0);
            } catch (Throwable $e1) {}

            // 7. Add bought overtime (hours purchased from colleagues: approved)
            $boughtMins = 0;
            try {
                $boughtStmt = $db->prepare("SELECT SUM(minutes_traded) as bought_mins FROM staff_overtime_trades WHERE buyer_id = :user_id AND status = 'approved'");
                $boughtStmt->execute([':user_id' => $user_id]);
                $boughtRow = $boughtStmt->fetch(PDO::FETCH_ASSOC);
                $boughtMins = (int)($boughtRow['bought_mins'] ?? 0);
            } catch (Throwable $e2) {}

            // 8. Add Tiffin net savings / penalties
            $tiffinSavings = 0;
            try {
                $tStmt = $db->prepare("SELECT COALESCE(SUM(tiffin_delta_minutes), 0) as t_savings FROM user_breaks WHERE user_id = :user_id AND break_type = 'Tiffin' AND status = 'Completed'");
                $tStmt->execute([':user_id' => $user_id]);
                $tRow = $tStmt->fetch(PDO::FETCH_ASSOC);
                $tiffinSavings = (int)($tRow['t_savings'] ?? 0);
            } catch (Throwable $e3) {}

            // 9. Deduct unexcused absent days (Option 2: 8h / shift_hours per absent day)
            $absentMins = 0;
            try {
                $absStmt = $db->prepare("SELECT COUNT(*) as absent_count FROM attendance WHERE user_id = :user_id AND status = 'Absent'");
                $absStmt->execute([':user_id' => $user_id]);
                $absRow = $absStmt->fetch(PDO::FETCH_ASSOC);
                $absentCount = (int)($absRow['absent_count'] ?? 0);
                $absentMins = (int)round($absentCount * $shift_hours * 60);
            } catch (Throwable $e4) {}

            $availableMins = max(0, ($totalOvertimeMinutes + $boughtMins + $tiffinSavings) - ($usedBreakMins + $cashedMins + $soldMins + $absentMins));
            return (int)$availableMins;
        } catch (Throwable $e) {
            error_log("getAvailableMangoMinutes error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Calculates the Tiffin Efficiency Delta (Full Real Time — No Capping)
     * Standard: 40 minutes
     * Formula: 40 - duration_minutes
     * Early finish credits full saved minutes (e.g. 5m lunch => +35 mins)
     * Excess break penalizes full overdue minutes (e.g. 85m lunch => -45 mins)
     */
    public static function calculateTiffinDelta($duration_minutes) {
        $duration = max(1, (int)$duration_minutes);
        return (40 - $duration);
    }

    /**
     * Get detailed Tiffin efficiency summary for user
     */
    public static function getTiffinSummary($db, $user_id) {
        $data = [
            'total_tiffin_count' => 0,
            'total_target_minutes' => 0,
            'total_target_hours' => 0,
            'total_taken_minutes' => 0,
            'total_taken_hours' => 0,
            'bonus_minutes' => 0,
            'penalty_minutes' => 0,
            'net_tiffin_delta' => 0
        ];
        if (!$db || !$user_id) return $data;

        try {
            $stmt = $db->prepare("SELECT 
                COUNT(*) as t_count,
                COALESCE(SUM(duration_minutes), 0) as total_duration_taken,
                COALESCE(SUM(CASE WHEN tiffin_delta_minutes > 0 THEN tiffin_delta_minutes ELSE 0 END), 0) as total_bonus,
                COALESCE(SUM(CASE WHEN tiffin_delta_minutes < 0 THEN ABS(tiffin_delta_minutes) ELSE 0 END), 0) as total_penalty,
                COALESCE(SUM(tiffin_delta_minutes), 0) as net_delta
            FROM user_breaks 
            WHERE user_id = :user_id AND break_type = 'Tiffin' AND status = 'Completed'");
            $stmt->execute([':user_id' => $user_id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                $tCount = (int)$row['t_count'];
                $takenMins = (int)$row['total_duration_taken'];
                $targetMins = $tCount * 40;

                $data['total_tiffin_count'] = $tCount;
                $data['total_target_minutes'] = $targetMins;
                $data['total_target_hours'] = round($targetMins / 60, 2);
                $data['total_taken_minutes'] = $takenMins;
                $data['total_taken_hours'] = round($takenMins / 60, 2);
                $data['bonus_minutes'] = (int)$row['total_bonus'];
                $data['penalty_minutes'] = (int)$row['total_penalty'];
                $data['net_tiffin_delta'] = (int)$row['net_delta'];
            }
        } catch (Throwable $t) {}

        return $data;
    }

    /**
     * Get detailed trade breakdown for user
     */
    public static function getTradeBreakdown($db, $user_id) {
        $data = [
            'sold_minutes' => 0,
            'sold_hours' => 0.0,
            'sold_earnings' => 0.0,
            'bought_minutes' => 0,
            'bought_hours' => 0.0,
            'bought_spent' => 0.0
        ];
        if (!$db || !$user_id) return $data;

        try {
            // Sold summary
            $sStmt = $db->prepare("SELECT SUM(minutes_traded) as total_mins, SUM(total_price) as total_earned FROM staff_overtime_trades WHERE seller_id = :user_id AND status = 'approved'");
            $sStmt->execute([':user_id' => $user_id]);
            $sRow = $sStmt->fetch(PDO::FETCH_ASSOC);
            $data['sold_minutes'] = (int)($sRow['total_mins'] ?? 0);
            $data['sold_hours'] = round($data['sold_minutes'] / 60, 2);
            $data['sold_earnings'] = (float)($sRow['total_earned'] ?? 0);

            // Bought summary
            $bStmt = $db->prepare("SELECT SUM(minutes_traded) as total_mins, SUM(total_price) as total_cost FROM staff_overtime_trades WHERE buyer_id = :user_id AND status = 'approved'");
            $bStmt->execute([':user_id' => $user_id]);
            $bRow = $bStmt->fetch(PDO::FETCH_ASSOC);
            $data['bought_minutes'] = (int)($bRow['total_mins'] ?? 0);
            $data['bought_hours'] = round($data['bought_minutes'] / 60, 2);
            $data['bought_spent'] = (float)($bRow['total_cost'] ?? 0);
        } catch (Throwable $t) {}

        return $data;
    }
}
?>
