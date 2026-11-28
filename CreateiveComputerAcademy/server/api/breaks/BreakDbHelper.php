<?php
// BreakDbHelper.php - Break & Approval System Helper
require_once __DIR__ . '/BreakSchema.php';

class BreakDbHelper {
    public static function ensureSchema($db) {
        BreakSchema::ensure($db);
    }

    /**
     * Calculates the user's current net available Mango Overtime balance in minutes
     * Formula: Total Worked Overtime Minutes + Bought Overtime - (Claimed Breaks + Cashed Out Overtime + Sold Overtime)
     */
    public static function getAvailableMangoMinutes($db, $user_id) {
        if (!$db || !$user_id) return 0;
        try {
            // 1. Fetch user shift hours (prefer active pay scheme standard_daily_hours)
            $shift_hours = 7.33;
            try {
                $psStmt = $db->prepare("SELECT standard_daily_hours FROM staff_pay_schemes WHERE user_id = :user_id AND status = 'active' ORDER BY id DESC LIMIT 1");
                $psStmt->execute([':user_id' => $user_id]);
                $psHours = $psStmt->fetchColumn();
                if ($psHours && floatval($psHours) > 0) {
                    $shift_hours = floatval($psHours);
                } else {
                    $userStmt = $db->prepare("SELECT COALESCE(e.shift_hours, 8) as shift_hours FROM users u LEFT JOIN employees e ON u.id = e.user_id WHERE u.id = :user_id LIMIT 1");
                    $userStmt->execute([':user_id' => $user_id]);
                    $uRow = $userStmt->fetch(PDO::FETCH_ASSOC);
                    $shift_hours = $uRow ? (float)$uRow['shift_hours'] : 8.0;
                }
            } catch (Throwable $pe) {
                $shift_hours = 8.0;
            }
            if ($shift_hours <= 0) $shift_hours = 8.0;
            $shiftMins = intval(round($shift_hours * 60)); // Exact shift: 360m for 6h staff, 480m for 8h staff

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

            // Fetch completed regular breaks grouped by date (excluding Mango breaks to prevent double deduction)
            $bStmt = $db->prepare("SELECT date, COALESCE(SUM(duration_minutes), 0) as b_mins FROM user_breaks WHERE user_id = :user_id AND status = 'Completed' AND break_type NOT IN ('Mango Full Day', 'Mango Break', 'Mango Overtime') GROUP BY date");
            $bStmt->execute([':user_id' => $user_id]);
            $breaksByDate = $bStmt->fetchAll(PDO::FETCH_KEY_PAIR);

            // Group presence and excess breaks (beyond 60m allocated free paid break: 40m noon + 20m afternoon) per calendar date
            $allocatedBreakSec = 60 * 60; // 60m allocated paid break (40m tiffin + 20m namaz)
            $dailyPresence = [];
            $dailyExcessBreak = [];
            foreach ($attRows as $r) {
                $in_ts = strtotime($r['check_in']);
                $out_ts = strtotime($r['check_out']);
                if ($out_ts <= $in_ts) continue;
                $d = $r['date'];
                $grossSec = ($out_ts - $in_ts);
                $bSec = intval($breaksByDate[$d] ?? 0) * 60;
                $excessBreakSec = max(0, $bSec - $allocatedBreakSec);

                if (!isset($dailyPresence[$d])) {
                    $dailyPresence[$d] = 0;
                    $dailyExcessBreak[$d] = 0;
                }
                $dailyPresence[$d] += $grossSec;
                $dailyExcessBreak[$d] = max($dailyExcessBreak[$d], $excessBreakSec);
            }

            // Approved Student Leaves for getAvailableMangoMinutes
            $studentLeaveDates = [];
            try {
                $slStmt = $db->prepare("SELECT start_date, end_date FROM leave_requests WHERE user_id = :uid AND status = 'Approved' AND type = 'Student Academic Leave'");
                $slStmt->execute([':uid' => $user_id]);
                while ($sl = $slStmt->fetch(PDO::FETCH_ASSOC)) {
                    $cTs = strtotime($sl['start_date']);
                    $eTs = strtotime($sl['end_date']);
                    while ($cTs <= $eTs) {
                        $studentLeaveDates[date('Y-m-d', $cTs)] = true;
                        $cTs = strtotime('+1 day', $cTs);
                    }
                }
            } catch (Throwable $e) {}
            try {
                $attSlStmt = $db->prepare("SELECT date FROM attendance WHERE user_id = :uid AND status = 'Student Leave'");
                $attSlStmt->execute([':uid' => $user_id]);
                while ($asl = $attSlStmt->fetch(PDO::FETCH_ASSOC)) {
                    $studentLeaveDates[$asl['date']] = true;
                }
            } catch (Throwable $e) {}

            $totalOvertimeSeconds = 0;
            $totalShortSeconds = 0;
            $totalExcessBreakSeconds = 0;
            foreach ($dailyPresence as $d => $pSec) {
                $isFriday = (date('N', strtotime($d)) == 5);
                $isStudentLeave = isset($studentLeaveDates[$d]);
                $expectedSec = ($isFriday || $isStudentLeave) ? 0 : ($shiftMins * 60);
                if (isset($holidays[$d])) {
                    $expectedSec = $holidays[$d] * 3600;
                }
                $diffSec = $pSec - $expectedSec;
                if ($diffSec > 0) {
                    $totalOvertimeSeconds += $diffSec;
                } elseif ($diffSec < -900 && !$isFriday && !$isStudentLeave) {
                    $totalShortSeconds += abs($diffSec);
                }
                $exB = $dailyExcessBreak[$d] ?? 0;
                if ($exB > 0) {
                    $totalExcessBreakSeconds += $exB;
                }
            }
            $totalOvertimeMinutes = round($totalOvertimeSeconds / 60);
            $totalShortMinutes = round($totalShortSeconds / 60);
            $totalExcessBreakMinutes = round($totalExcessBreakSeconds / 60);

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

            // 8. Tiffin & Namaz efficiency savings bonus (when taking less than allocated paid break)
            $tiffinSavings = 0;
            try {
                $tStmt = $db->prepare("SELECT COALESCE(SUM(CASE WHEN tiffin_delta_minutes > 0 THEN tiffin_delta_minutes ELSE 0 END), 0) as t_bonus FROM user_breaks WHERE user_id = :user_id AND break_type IN ('Tiffin', 'Namaz') AND status = 'Completed'");
                $tStmt->execute([':user_id' => $user_id]);
                $tRow = $tStmt->fetch(PDO::FETCH_ASSOC);
                $tiffinSavings = (int)($tRow['t_bonus'] ?? 0);
            } catch (Throwable $e3) {}

            // 9. Deduct unexcused absent days — count DISTINCT dates to avoid duplicate-row double-counting;
            //    exclude Fridays (DAYOFWEEK=6) which have no shift obligation.
            $absentMins = 0;
            try {
                $absStmt = $db->prepare("SELECT COUNT(DISTINCT date) as absent_count FROM attendance WHERE user_id = :user_id AND status = 'Absent' AND DAYOFWEEK(date) != 6");
                $absStmt->execute([':user_id' => $user_id]);
                $absRow = $absStmt->fetch(PDO::FETCH_ASSOC);
                $absentCount = (int)($absRow['absent_count'] ?? 0);
                $absentMins = (int)round($absentCount * $shift_hours * 60);
            } catch (Throwable $e4) {}

            // 10. Vault deductions and transfers
            $vaultSummary = self::getVaultSummary($db, $user_id, $shift_hours);
            $vaultHeldMins = $vaultSummary['held_minutes'];
            $vaultTransOutMins = $vaultSummary['transferred_out_minutes'];
            $vaultTransInMins = $vaultSummary['transferred_in_minutes'];

            // Total net earned across all attendance and transactions
            $totalGrossMins = $totalOvertimeMinutes + $boughtMins + $tiffinSavings + $vaultTransInMins;
            $totalDeductedMins = $totalShortMinutes + $totalExcessBreakMinutes + $usedBreakMins + $cashedMins + $soldMins + $absentMins + $vaultTransOutMins;
            $totalNetAvailableMins = max(0, $totalGrossMins - $totalDeductedMins);

            // Staff only sees and can claim what is NOT held in the admin vault
            $staffVisibleMins = max(0, $totalNetAvailableMins - $vaultHeldMins);
            return (int)$staffVisibleMins;
        } catch (Throwable $e) {
            error_log("getAvailableMangoMinutes error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Calculates the user's real total net earned Mango Overtime balance in minutes (WITHOUT vault hold deduction)
     * Used by Admins & Developers to see full earned balance
     */
    public static function getTotalEarnedMangoMinutes($db, $user_id) {
        if (!$db || !$user_id) return 0;
        try {
            $shift_hours = 7.33;
            try {
                $psStmt = $db->prepare("SELECT standard_daily_hours FROM staff_pay_schemes WHERE user_id = :user_id AND status = 'active' ORDER BY id DESC LIMIT 1");
                $psStmt->execute([':user_id' => $user_id]);
                $psHours = $psStmt->fetchColumn();
                if ($psHours && floatval($psHours) > 0) {
                    $shift_hours = floatval($psHours);
                } else {
                    $userStmt = $db->prepare("SELECT COALESCE(e.shift_hours, 8) as shift_hours FROM users u LEFT JOIN employees e ON u.id = e.user_id WHERE u.id = :user_id LIMIT 1");
                    $userStmt->execute([':user_id' => $user_id]);
                    $uRow = $userStmt->fetch(PDO::FETCH_ASSOC);
                    $shift_hours = $uRow ? (float)$uRow['shift_hours'] : 8.0;
                }
            } catch (Throwable $pe) {
                $shift_hours = 8.0;
            }
            if ($shift_hours <= 0) $shift_hours = 8.0;
            $shiftMins = intval(round($shift_hours * 60)); // Exact shift: 360m for 6h staff, 480m for 8h staff

            $holidays = [];
            $holStmt = $db->query("SELECT date, expected_hours FROM holidays");
            if ($holStmt) {
                while ($h = $holStmt->fetch(PDO::FETCH_ASSOC)) {
                    $holidays[$h['date']] = (float)$h['expected_hours'];
                }
            }

            $attStmt = $db->prepare("SELECT date, check_in, check_out FROM attendance WHERE user_id = :user_id AND check_in IS NOT NULL AND check_out IS NOT NULL");
            $attStmt->execute([':user_id' => $user_id]);
            $attRows = $attStmt->fetchAll(PDO::FETCH_ASSOC);

            // Fetch completed regular breaks grouped by date (excluding Mango breaks to prevent double deduction)
            $bStmt = $db->prepare("SELECT date, COALESCE(SUM(duration_minutes), 0) as b_mins FROM user_breaks WHERE user_id = :user_id AND status = 'Completed' AND break_type NOT IN ('Mango Full Day', 'Mango Break', 'Mango Overtime') GROUP BY date");
            $bStmt->execute([':user_id' => $user_id]);
            $breaksByDate = $bStmt->fetchAll(PDO::FETCH_KEY_PAIR);

            $allocatedBreakSec = 60 * 60; // 60m allocated paid break (40m tiffin + 20m namaz)
            $dailyPresence = [];
            $dailyExcessBreak = [];
            foreach ($attRows as $r) {
                $in_ts = strtotime($r['check_in']);
                $out_ts = strtotime($r['check_out']);
                if ($out_ts <= $in_ts) continue;
                $d = $r['date'];
                $grossSec = ($out_ts - $in_ts);
                $bSec = intval($breaksByDate[$d] ?? 0) * 60;
                $excessBreakSec = max(0, $bSec - $allocatedBreakSec);

                if (!isset($dailyPresence[$d])) {
                    $dailyPresence[$d] = 0;
                    $dailyExcessBreak[$d] = 0;
                }
                $dailyPresence[$d] += $grossSec;
                $dailyExcessBreak[$d] = max($dailyExcessBreak[$d], $excessBreakSec);
            }

            // Approved Student Leaves for getAvailableMangoMinutes
            $studentLeaveDates = [];
            try {
                $slStmt = $db->prepare("SELECT start_date, end_date FROM leave_requests WHERE user_id = :uid AND status = 'Approved' AND type = 'Student Academic Leave'");
                $slStmt->execute([':uid' => $user_id]);
                while ($sl = $slStmt->fetch(PDO::FETCH_ASSOC)) {
                    $cTs = strtotime($sl['start_date']);
                    $eTs = strtotime($sl['end_date']);
                    while ($cTs <= $eTs) {
                        $studentLeaveDates[date('Y-m-d', $cTs)] = true;
                        $cTs = strtotime('+1 day', $cTs);
                    }
                }
            } catch (Throwable $e) {}
            try {
                $attSlStmt = $db->prepare("SELECT date FROM attendance WHERE user_id = :uid AND status = 'Student Leave'");
                $attSlStmt->execute([':uid' => $user_id]);
                while ($asl = $attSlStmt->fetch(PDO::FETCH_ASSOC)) {
                    $studentLeaveDates[$asl['date']] = true;
                }
            } catch (Throwable $e) {}

            $totalOvertimeSeconds = 0;
            $totalShortSeconds = 0;
            $totalExcessBreakSeconds = 0;
            foreach ($dailyPresence as $d => $pSec) {
                $isFriday = (date('N', strtotime($d)) == 5);
                $isStudentLeave = isset($studentLeaveDates[$d]);
                $expectedSec = ($isFriday || $isStudentLeave) ? 0 : ($shiftMins * 60);
                if (isset($holidays[$d])) {
                    $expectedSec = $holidays[$d] * 3600;
                }
                $diffSec = $pSec - $expectedSec;
                if ($diffSec > 0) {
                    $totalOvertimeSeconds += $diffSec;
                } elseif ($diffSec < -900 && !$isFriday && !$isStudentLeave) {
                    $totalShortSeconds += abs($diffSec);
                }
                $exB = $dailyExcessBreak[$d] ?? 0;
                if ($exB > 0) {
                    $totalExcessBreakSeconds += $exB;
                }
            }
            $totalOvertimeMinutes = round($totalOvertimeSeconds / 60);
            $totalShortMinutes = round($totalShortSeconds / 60);
            $totalExcessBreakMinutes = round($totalExcessBreakSeconds / 60);

            $claimStmt = $db->prepare("SELECT SUM(duration_minutes) as used_mins FROM user_breaks WHERE user_id = :user_id AND break_type IN ('Mango Full Day', 'Mango Break', 'Mango Overtime') AND status != 'Rejected'");
            $claimStmt->execute([':user_id' => $user_id]);
            $claimRow = $claimStmt->fetch(PDO::FETCH_ASSOC);
            $usedBreakMins = (int)($claimRow['used_mins'] ?? 0);

            $cashStmt = $db->prepare("SELECT SUM(overtime_hours_cashed) as cashed_hrs FROM staff_withdrawals WHERE user_id = :user_id AND overtime_hours_cashed > 0 AND status != 'rejected'");
            $cashStmt->execute([':user_id' => $user_id]);
            $cashRow = $cashStmt->fetch(PDO::FETCH_ASSOC);
            $cashedMins = round(((float)($cashRow['cashed_hrs'] ?? 0)) * 60);

            $soldMins = 0;
            try {
                $soldStmt = $db->prepare("SELECT SUM(minutes_traded) as sold_mins FROM staff_overtime_trades WHERE seller_id = :user_id AND status IN ('approved', 'pending_admin', 'pending_seller')");
                $soldStmt->execute([':user_id' => $user_id]);
                $soldRow = $soldStmt->fetch(PDO::FETCH_ASSOC);
                $soldMins = (int)($soldRow['sold_mins'] ?? 0);
            } catch (Throwable $e1) {}

            $boughtMins = 0;
            try {
                $boughtStmt = $db->prepare("SELECT SUM(minutes_traded) as bought_mins FROM staff_overtime_trades WHERE buyer_id = :user_id AND status = 'approved'");
                $boughtStmt->execute([':user_id' => $user_id]);
                $boughtRow = $boughtStmt->fetch(PDO::FETCH_ASSOC);
                $boughtMins = (int)($boughtRow['bought_mins'] ?? 0);
            } catch (Throwable $e2) {}

            $tiffinSavings = 0;
            try {
                $tStmt = $db->prepare("SELECT COALESCE(SUM(CASE WHEN tiffin_delta_minutes > 0 THEN tiffin_delta_minutes ELSE 0 END), 0) as t_savings FROM user_breaks WHERE user_id = :user_id AND break_type IN ('Tiffin', 'Namaz') AND status = 'Completed'");
                $tStmt->execute([':user_id' => $user_id]);
                $tRow = $tStmt->fetch(PDO::FETCH_ASSOC);
                $tiffinSavings = (int)($tRow['t_savings'] ?? 0);
            } catch (Throwable $e3) {}

            // Deduct unexcused absent days — DISTINCT date to avoid duplicate-row double-counting;
            // exclude Fridays (DAYOFWEEK=6, no shift obligation).
            $absentMins = 0;
            try {
                $absStmt = $db->prepare("SELECT COUNT(DISTINCT date) as absent_count FROM attendance WHERE user_id = :user_id AND status = 'Absent' AND DAYOFWEEK(date) != 6");
                $absStmt->execute([':user_id' => $user_id]);
                $absRow = $absStmt->fetch(PDO::FETCH_ASSOC);
                $absentCount = (int)($absRow['absent_count'] ?? 0);
                $absentMins = (int)round($absentCount * $shift_hours * 60);
            } catch (Throwable $e4) {}

            $vaultSummary = self::getVaultSummary($db, $user_id, $shift_hours);
            $vaultTransOutMins = $vaultSummary['transferred_out_minutes'];
            $vaultTransInMins = $vaultSummary['transferred_in_minutes'];

            $totalGrossMins = $totalOvertimeMinutes + $boughtMins + $tiffinSavings + $vaultTransInMins;
            $totalDeductedMins = $totalShortMinutes + $totalExcessBreakMinutes + $usedBreakMins + $cashedMins + $soldMins + $absentMins + $vaultTransOutMins;
            // Return raw signed balance (negative if staff has overtime debt/deficit from absences)
            return (int)($totalGrossMins - $totalDeductedMins);
        } catch (Throwable $e) {
            error_log("getTotalEarnedMangoMinutes error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Get vault hold, release, and transfer summary for a user
     */
    public static function getVaultSummary($db, $user_id, $shift_hours = 8.0) {
        $result = [
            'held_minutes' => 0,
            'held_mangoes' => 0,
            'transferred_out_minutes' => 0,
            'transferred_out_mangoes' => 0,
            'transferred_in_minutes' => 0,
            'transferred_in_mangoes' => 0
        ];
        if (!$db || !$user_id) return $result;

        try {
            $shift_mins = max(60, (int)round($shift_hours * 60));

            $stmt = $db->prepare("SELECT 
                COALESCE(SUM(CASE 
                    WHEN action_type = 'hold' THEN minutes_amount 
                    WHEN action_type = 'release' THEN -minutes_amount 
                    WHEN action_type = 'transfer_out' AND from_source = 'vault' THEN -minutes_amount 
                    ELSE 0 
                END), 0) as net_held_mins,
                COALESCE(SUM(CASE WHEN action_type = 'transfer_out' THEN minutes_amount ELSE 0 END), 0) as total_trans_out,
                COALESCE(SUM(CASE WHEN action_type IN ('transfer_in', 'salah_reward', 'salah_full_day_bonus') THEN minutes_amount ELSE 0 END), 0) as total_trans_in
            FROM mango_vault_ledger 
            WHERE user_id = :user_id");
            $stmt->execute([':user_id' => $user_id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($row) {
                $held_mins = max(0, (int)$row['net_held_mins']);
                $trans_out = max(0, (int)$row['total_trans_out']);
                $trans_in = max(0, (int)$row['total_trans_in']);

                $result['held_minutes'] = $held_mins;
                $result['held_mangoes'] = (int)floor($held_mins / $shift_mins);
                $result['transferred_out_minutes'] = $trans_out;
                $result['transferred_out_mangoes'] = (int)floor($trans_out / $shift_mins);
                $result['transferred_in_minutes'] = $trans_in;
                $result['transferred_in_mangoes'] = (int)floor($trans_in / $shift_mins);
            }
        } catch (Throwable $e) {
            error_log("getVaultSummary error: " . $e->getMessage());
        }
        return $result;
    }

    /**
     * Get active center prayer break schedule
     * Stored in dedicated center_prayer_schedules table to keep employees table unbloated
     */
    public static function getActivePrayerSchedule($db) {
        $default = [
            'id' => 1,
            'title' => 'আসরের নামাজ ও বিকাল বিরতি',
            'start_time' => '16:15:00',
            'end_time' => '16:35:00',
            'allocated_minutes' => 20,
            'is_active' => 1,
            'salah_reward_mins' => 3,
            'salah_full_day_bonus' => 5,
            'is_reward_enabled' => 1
        ];
        if (!$db) return $default;
        try {
            $stmt = $db->query("SELECT id, title, start_time, end_time, allocated_minutes, is_active, salah_reward_mins, salah_full_day_bonus, is_reward_enabled FROM center_prayer_schedules WHERE is_active = 1 ORDER BY id DESC LIMIT 1");
            $row = $stmt ? $stmt->fetch(PDO::FETCH_ASSOC) : null;
            if ($row) {
                return [
                    'id' => (int)$row['id'],
                    'title' => $row['title'] ?: 'আসরের নামাজ ও বিকাল বিরতি',
                    'start_time' => $row['start_time'] ?: '16:15:00',
                    'end_time' => $row['end_time'] ?: '16:35:00',
                    'allocated_minutes' => isset($row['allocated_minutes']) ? (int)$row['allocated_minutes'] : 20,
                    'is_active' => (int)$row['is_active'],
                    'salah_reward_mins' => isset($row['salah_reward_mins']) ? (int)$row['salah_reward_mins'] : 3,
                    'salah_full_day_bonus' => isset($row['salah_full_day_bonus']) ? (int)$row['salah_full_day_bonus'] : 5,
                    'is_reward_enabled' => isset($row['is_reward_enabled']) ? (int)$row['is_reward_enabled'] : 1
                ];
            }
        } catch (Throwable $e) {}
        return $default;
    }

    /**
     * Calculates the Break Efficiency Delta for Scheduled Center Breaks
     * Standard: 40 minutes for Tiffin, 20 minutes for Namaz
     * Formula: allocated - duration_minutes
     * Early finish credits full saved minutes into Mango Tree Overtime
     * Excess break penalizes full overdue minutes
     */
    public static function calculateBreakDelta($breakType, $durationMinutes) {
        $duration = max(1, (int)$durationMinutes);
        if ($breakType === 'Namaz') {
            return (20 - $duration);
        }
        return (40 - $duration);
    }

    /**
     * Backward compatible wrapper for Tiffin Efficiency Delta
     */
    public static function calculateTiffinDelta($duration_minutes, $breakType = 'Tiffin') {
        return self::calculateBreakDelta($breakType, $duration_minutes);
    }

    /**
     * Get detailed Tiffin & Namaz efficiency summary for user (optionally scoped to a date range)
     */
    public static function getTiffinSummary($db, $user_id, $startDate = null, $endDate = null) {
        $data = [
            'total_tiffin_count' => 0,
            'total_namaz_count' => 0,
            'total_break_count' => 0,
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
            $sql = "SELECT 
                SUM(CASE WHEN break_type = 'Tiffin' THEN 1 ELSE 0 END) as t_count,
                SUM(CASE WHEN break_type = 'Namaz' THEN 1 ELSE 0 END) as n_count,
                COUNT(*) as total_count,
                COALESCE(SUM(duration_minutes), 0) as total_duration_taken,
                COALESCE(SUM(CASE WHEN tiffin_delta_minutes > 0 THEN tiffin_delta_minutes ELSE 0 END), 0) as total_bonus,
                COALESCE(SUM(CASE WHEN tiffin_delta_minutes < 0 THEN ABS(tiffin_delta_minutes) ELSE 0 END), 0) as total_penalty,
                COALESCE(SUM(tiffin_delta_minutes), 0) as net_delta
            FROM user_breaks 
            WHERE user_id = :user_id AND break_type IN ('Tiffin', 'Namaz') AND status = 'Completed'";
            
            $params = [':user_id' => $user_id];
            if ($startDate && $endDate) {
                $sql .= " AND date BETWEEN :start_d AND :end_d";
                $params[':start_d'] = $startDate;
                $params[':end_d'] = $endDate;
            }

            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                $tCount = (int)($row['t_count'] ?? 0);
                $nCount = (int)($row['n_count'] ?? 0);
                $totalCount = (int)($row['total_count'] ?? 0);
                $takenMins = (int)($row['total_duration_taken'] ?? 0);
                $targetMins = ($tCount * 40) + ($nCount * 20);

                $data['total_tiffin_count'] = $tCount;
                $data['total_namaz_count'] = $nCount;
                $data['total_break_count'] = $totalCount;
                $data['total_target_minutes'] = $targetMins;
                $data['total_target_hours'] = round($targetMins / 60, 2);
                $data['total_taken_minutes'] = $takenMins;
                $data['total_taken_hours'] = round($takenMins / 60, 2);
                $data['bonus_minutes'] = (int)($row['total_bonus'] ?? 0);
                $data['penalty_minutes'] = (int)($row['total_penalty'] ?? 0);
                $data['net_tiffin_delta'] = (int)($row['net_delta'] ?? 0);
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