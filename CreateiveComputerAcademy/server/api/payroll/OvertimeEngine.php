<?php
/**
 * OvertimeEngine.php — Single Source of Truth for Overtime Calculation
 *
 * This engine is THE one and only place that computes:
 *   - Gross Overtime (attendance beyond shift + tiffin efficiency savings)
 *   - Short shifts, Excess breaks, Absences/Leaves
 *   - Mango break claims, Cashed-out OT, P2P trades, Vault
 *   - Net Available Overtime (what staff can redeem as breaks or cash)
 *
 * Both the Mango Break Tree (get_mango_break_bank.php) and the Payroll
 * Payout Modal (PayrollHelper.php) must call this engine so they always
 * show identical numbers — zero divergence, forever.
 *
 * Usage:
 *   require_once 'OvertimeEngine.php';
 *   $result = OvertimeEngine::calculate($pdo, $userId, $shiftHours, $upToDate);
 *
 * Returns an array with keys:
 *   gross_ot_seconds          - raw attendance overtime seconds
 *   tiffin_bonus_seconds      - tiffin efficiency savings seconds
 *   total_gross_ot_seconds    - gross_ot + tiffin_bonus
 *   short_seconds             - short-shift seconds
 *   excess_break_seconds      - excess break (>40m) seconds
 *   absent_seconds            - absent/leave penalty seconds
 *   claimed_break_seconds     - Mango Full Day breaks claimed seconds
 *   in_shift_break_seconds    - Mango in-shift break seconds
 *   cashed_out_seconds        - cashed-out overtime seconds
 *   sold_seconds              - P2P sold overtime seconds
 *   bought_seconds            - P2P bought overtime seconds
 *   vault_held_seconds        - admin vault hold seconds
 *   vault_out_seconds         - vault transferred-out seconds
 *   vault_in_seconds          - vault transferred-in seconds
 *   total_deducted_seconds    - everything subtracted from gross OT
 *   net_seconds               - gross - deducted (may be negative = debt)
 *   available_seconds         - max(0, net_seconds) — clampable to 0
 *   monthly_ot_seconds        - [month_key => seconds] per-month gross OT
 *   monthly_tiffin_seconds    - [month_key => seconds] per-month tiffin bonus
 *   monthly_short_seconds     - [month_key => seconds] per-month short
 *   monthly_excess_break_sec  - [month_key => seconds] per-month excess break
 *   monthly_break_sec         - [month_key => seconds] per-month Mango in-shift
 *   absent_dates              - [date => hours_deducted] absent/leave date map
 *   claimed_dates             - [date => true] dates covered by Mango Full Day claims
 */
class OvertimeEngine {

    /**
     * Calculate all overtime-related balances for a user up to a given date.
     *
     * @param PDO    $pdo          Active DB connection
     * @param int    $userId       Staff user ID
     * @param float  $shiftHours   Standard daily shift (e.g. 8.0)
     * @param string $upToDate     Cutoff date 'YYYY-MM-DD' (defaults to today)
     * @return array               See class docblock for returned keys
     */
    public static function calculate($pdo, $userId, $shiftHours = 8.0, $upToDate = null) {
        if (!$pdo || !$userId) return self::empty();

        if ($shiftHours <= 0) $shiftHours = 8.0;
        $shiftMins = self::toStandardMinutes($shiftHours);   // e.g. 480 for 8h, 360 for 6h
        $shiftSecs = $shiftMins * 60;
        $upToDate  = $upToDate ?: date('Y-m-d');

        try {
            // ── 1. Holidays ───────────────────────────────────────────────────────
            $holidays = [];
            try {
                $hStmt = $pdo->query("SELECT date, expected_hours FROM holidays");
                while ($h = $hStmt->fetch(PDO::FETCH_ASSOC)) {
                    $holidays[$h['date']] = (float)$h['expected_hours'];
                }
            } catch (Throwable $e) {}

            // ── 2. Attendance presence per date ───────────────────────────────────
            $attStmt = $pdo->prepare("
                SELECT date, check_in, check_out
                FROM attendance
                WHERE user_id = :uid
                  AND check_in IS NOT NULL AND check_out IS NOT NULL
                  AND date <= :upto
                ORDER BY date ASC
            ");
            $attStmt->execute([':uid' => $userId, ':upto' => $upToDate]);
            $attRows = $attStmt->fetchAll(PDO::FETCH_ASSOC);

            // ── 3. Completed breaks per date (for excess-break calc) ───────────────
            $brkStmt = $pdo->prepare("
                SELECT date, COALESCE(SUM(duration_minutes), 0) AS b_mins
                FROM user_breaks
                WHERE user_id = :uid AND status = 'Completed' AND date <= :upto
                GROUP BY date
            ");
            $brkStmt->execute([':uid' => $userId, ':upto' => $upToDate]);
            $breaksByDate = $brkStmt->fetchAll(PDO::FETCH_KEY_PAIR);

            // ── 4. Daily presence & excess-break aggregation ──────────────────────
            $allocatedBreakSec = 40 * 60; // 40 m free paid break per day
            $dailyPresence    = [];
            $dailyExcessBreak = [];
            foreach ($attRows as $r) {
                $inTs  = strtotime((strpos($r['check_in'],  ' ') !== false) ? $r['check_in']  : ($r['date'] . ' ' . $r['check_in']));
                $outTs = strtotime((strpos($r['check_out'], ' ') !== false) ? $r['check_out'] : ($r['date'] . ' ' . $r['check_out']));
                if ($outTs <= $inTs) continue;
                $d        = $r['date'];
                $grossSec = ($outTs - $inTs);
                $bSec     = intval($breaksByDate[$d] ?? 0) * 60;
                $excessBreakSec = max(0, $bSec - $allocatedBreakSec);
                if (!isset($dailyPresence[$d])) {
                    $dailyPresence[$d]    = 0;
                    $dailyExcessBreak[$d] = 0;
                }
                $dailyPresence[$d]    += $grossSec;
                $dailyExcessBreak[$d]  = max($dailyExcessBreak[$d], $excessBreakSec);
            }

            // ── 5. OT / Short / Excess-break per day ─────────────────────────────
            $grossOtSec       = 0;
            $shortSec         = 0;
            $excessBreakSec   = 0;
            $monthlyOtSec     = [];
            $monthlyShortSec  = [];
            $monthlyExcessBreakSec = [];

            foreach ($dailyPresence as $d => $pSec) {
                $isFri  = (date('N', strtotime($d)) == 5);
                $expSec = $isFri ? 0 : $shiftSecs;
                if (isset($holidays[$d])) $expSec = (int)round($holidays[$d] * 3600);
                $diff  = $pSec - $expSec;
                $mKey  = substr($d, 0, 7);
                if ($diff > 0) {
                    $grossOtSec += $diff;
                    $monthlyOtSec[$mKey] = ($monthlyOtSec[$mKey] ?? 0) + $diff;
                } elseif ($diff < -900 && !$isFri) {
                    $abs = abs($diff);
                    $shortSec += $abs;
                    $monthlyShortSec[$mKey] = ($monthlyShortSec[$mKey] ?? 0) + $abs;
                }
                $exB = $dailyExcessBreak[$d] ?? 0;
                if ($exB > 0) {
                    $excessBreakSec += $exB;
                    $monthlyExcessBreakSec[$mKey] = ($monthlyExcessBreakSec[$mKey] ?? 0) + $exB;
                }
            }

            // ── 6. Tiffin efficiency savings bonus ────────────────────────────────
            $tiffinBonusSec     = 0;
            $monthlyTiffinSec   = [];
            try {
                $tfStmt = $pdo->prepare("
                    SELECT date, COALESCE(tiffin_delta_minutes, 0) AS t_delta
                    FROM user_breaks
                    WHERE user_id = :uid
                      AND break_type = 'Tiffin'
                      AND status = 'Completed'
                      AND date <= :upto
                ");
                $tfStmt->execute([':uid' => $userId, ':upto' => $upToDate]);
                while ($tf = $tfStmt->fetch(PDO::FETCH_ASSOC)) {
                    $delta = intval($tf['t_delta']);
                    if ($delta > 0) {
                        $sec = $delta * 60;
                        $tiffinBonusSec += $sec;
                        $mKey = substr($tf['date'], 0, 7);
                        $monthlyTiffinSec[$mKey] = ($monthlyTiffinSec[$mKey] ?? 0) + $sec;
                    }
                }
            } catch (Throwable $e) {}

            // ── 7. Mango break claims (Full Day + In-shift) ───────────────────────
            $claimedBreakSec   = 0;
            $inShiftBreakSec   = 0;
            $claimedDates      = [];
            $monthlyBreakSec   = [];
            try {
                $mbStmt = $pdo->prepare("
                    SELECT date, break_type, duration_minutes
                    FROM user_breaks
                    WHERE user_id = :uid
                      AND status != 'Rejected'
                      AND break_type IN ('Mango Full Day', 'Mango Break', 'Mango Overtime')
                      AND date <= :upto
                ");
                $mbStmt->execute([':uid' => $userId, ':upto' => $upToDate]);
                while ($mb = $mbStmt->fetch(PDO::FETCH_ASSOC)) {
                    $sec  = intval($mb['duration_minutes']) * 60;
                    $mKey = substr($mb['date'], 0, 7);
                    if ($mb['break_type'] === 'Mango Full Day') {
                        $claimedBreakSec += $sec;
                        $claimedDates[$mb['date']] = true;
                    } else {
                        $inShiftBreakSec += $sec;
                        $monthlyBreakSec[$mKey] = ($monthlyBreakSec[$mKey] ?? 0) + $sec;
                    }
                }
            } catch (Throwable $e) {}

            // ── 8. Absences and Leaves (penalty = 1 full shift per absent day) ────
            $absentSec         = 0;
            $absentDates       = [];
            $monthlyAbsentSec  = [];
            try {
                // a) Approved leave_requests
                $lrStmt = $pdo->prepare("
                    SELECT start_date, end_date, type
                    FROM leave_requests
                    WHERE user_id = :uid AND status = 'Approved'
                ");
                $lrStmt->execute([':uid' => $userId]);
                while ($al = $lrStmt->fetch(PDO::FETCH_ASSOC)) {
                    $cur = strtotime($al['start_date']);
                    $end = strtotime($al['end_date']);
                    while ($cur <= $end) {
                        $dt = date('Y-m-d', $cur);
                        $isStudentExempt = (($al['type'] ?? '') === 'Student Academic Leave');
                        if (date('N', $cur) != 5 && !isset($claimedDates[$dt]) && $dt <= $upToDate && !isset($absentDates[$dt])) {
                            $hrs = $isStudentExempt ? 0.0 : $shiftHours;
                            $absentDates[$dt] = $hrs;
                            $penSec = (int)round($hrs * 3600);
                            $absentSec += $penSec;
                            $mKey2 = substr($dt, 0, 7);
                            $monthlyAbsentSec[$mKey2] = ($monthlyAbsentSec[$mKey2] ?? 0) + $penSec;
                        }
                        $cur = strtotime('+1 day', $cur);
                    }
                }
            } catch (Throwable $e) {}

            try {
                // b) attendance rows marked Absent or Leave
                $alStmt = $pdo->prepare("
                    SELECT date, status
                    FROM attendance
                    WHERE user_id = :uid
                      AND status IN ('Leave', 'Absent')
                      AND date <= :upto
                ");
                $alStmt->execute([':uid' => $userId, ':upto' => $upToDate]);
                while ($al = $alStmt->fetch(PDO::FETCH_ASSOC)) {
                    $dt = $al['date'];
                    if (date('N', strtotime($dt)) != 5 && !isset($claimedDates[$dt]) && !isset($absentDates[$dt])) {
                        $absentDates[$dt] = $shiftHours;
                        $penSec = (int)round($shiftHours * 3600);
                        $absentSec += $penSec;
                        $mKey2 = substr($dt, 0, 7);
                        $monthlyAbsentSec[$mKey2] = ($monthlyAbsentSec[$mKey2] ?? 0) + $penSec;
                    }
                }
            } catch (Throwable $e) {}

            // ── 9. Cashed-out overtime from staff_withdrawals ─────────────────────
            $cashedSec = 0;
            try {
                $cwStmt = $pdo->prepare("
                    SELECT COALESCE(SUM(overtime_hours_cashed), 0) AS cashed
                    FROM staff_withdrawals
                    WHERE user_id = :uid AND overtime_hours_cashed > 0 AND status != 'rejected'
                ");
                $cwStmt->execute([':uid' => $userId]);
                $cashedSec = (int)round(floatval($cwStmt->fetchColumn()) * 3600);
            } catch (Throwable $e) {}

            // ── 10. P2P Overtime trades ───────────────────────────────────────────
            $soldSec   = 0;
            $boughtSec = 0;
            try {
                $soldStmt = $pdo->prepare("
                    SELECT COALESCE(SUM(minutes_traded), 0) AS mins
                    FROM staff_overtime_trades
                    WHERE seller_id = :uid AND status IN ('approved', 'pending_admin', 'pending_seller')
                ");
                $soldStmt->execute([':uid' => $userId]);
                $soldSec = (int)($soldStmt->fetchColumn()) * 60;

                $boughtStmt = $pdo->prepare("
                    SELECT COALESCE(SUM(minutes_traded), 0) AS mins
                    FROM staff_overtime_trades
                    WHERE buyer_id = :uid AND status = 'approved'
                ");
                $boughtStmt->execute([':uid' => $userId]);
                $boughtSec = (int)($boughtStmt->fetchColumn()) * 60;
            } catch (Throwable $e) {}

            // ── 11. Vault (admin holds & transfers) ───────────────────────────────
            $vaultHeldSec = 0;
            $vaultOutSec  = 0;
            $vaultInSec   = 0;
            try {
                $vStmt = $pdo->prepare("
                    SELECT
                        COALESCE(SUM(CASE
                            WHEN action_type = 'hold'    THEN minutes_amount
                            WHEN action_type = 'release' THEN -minutes_amount
                            ELSE 0
                        END), 0) AS held_mins,
                        COALESCE(SUM(CASE WHEN action_type = 'transfer_out' THEN minutes_amount ELSE 0 END), 0) AS out_mins,
                        COALESCE(SUM(CASE WHEN action_type = 'transfer_in'  THEN minutes_amount ELSE 0 END), 0) AS in_mins
                    FROM mango_vault_ledger
                    WHERE user_id = :uid
                ");
                $vStmt->execute([':uid' => $userId]);
                $vRow = $vStmt->fetch(PDO::FETCH_ASSOC);
                if ($vRow) {
                    $vaultHeldSec = max(0, (int)$vRow['held_mins']) * 60;
                    $vaultOutSec  = (int)$vRow['out_mins'] * 60;
                    $vaultInSec   = (int)$vRow['in_mins']  * 60;
                }
            } catch (Throwable $e) {}

            // ── 12. Totals ────────────────────────────────────────────────────────
            // Gross = raw OT from attendance + tiffin savings + P2P bought + vault in
            $totalGrossOtSec = $grossOtSec + $tiffinBonusSec + $boughtSec + $vaultInSec;

            // Deductions = short + excess break + mango claims + in-shift mango + cashed out + sold + absent/leave + vault out
            $totalDeductedSec = $shortSec + $excessBreakSec + $claimedBreakSec
                              + $inShiftBreakSec + $cashedSec + $soldSec
                              + $absentSec + $vaultOutSec;

            $netSec       = $totalGrossOtSec - $totalDeductedSec;
            // Vault hold reduces what STAFF can see (admin can still see full net)
            $availableSec = max(0, $netSec - $vaultHeldSec);

            return [
                // Raw breakdown
                'gross_ot_seconds'         => $grossOtSec,
                'tiffin_bonus_seconds'     => $tiffinBonusSec,
                'total_gross_ot_seconds'   => $totalGrossOtSec,
                'short_seconds'            => $shortSec,
                'excess_break_seconds'     => $excessBreakSec,
                'absent_seconds'           => $absentSec,
                'claimed_break_seconds'    => $claimedBreakSec,
                'in_shift_break_seconds'   => $inShiftBreakSec,
                'cashed_out_seconds'       => $cashedSec,
                'sold_seconds'             => $soldSec,
                'bought_seconds'           => $boughtSec,
                'vault_held_seconds'       => $vaultHeldSec,
                'vault_out_seconds'        => $vaultOutSec,
                'vault_in_seconds'         => $vaultInSec,
                'total_deducted_seconds'   => $totalDeductedSec,
                'net_seconds'              => $netSec,
                'available_seconds'        => $availableSec,
                // Convenience hours
                'gross_ot_hours'           => round($grossOtSec / 3600, 2),
                'tiffin_bonus_hours'       => round($tiffinBonusSec / 3600, 2),
                'total_gross_ot_hours'     => round($totalGrossOtSec / 3600, 2),
                'short_hours'              => round($shortSec / 3600, 2),
                'excess_break_hours'       => round($excessBreakSec / 3600, 2),
                'absent_hours'             => round($absentSec / 3600, 2),
                'cashed_out_hours'         => round($cashedSec / 3600, 2),
                'net_hours'                => round($netSec / 3600, 2),
                'available_hours'          => round($availableSec / 3600, 2),
                // Per-month breakdowns (for Payroll ledger restoration loop)
                'monthly_ot_seconds'       => $monthlyOtSec,
                'monthly_tiffin_seconds'   => $monthlyTiffinSec,
                'monthly_short_seconds'    => $monthlyShortSec,
                'monthly_excess_break_sec' => $monthlyExcessBreakSec,
                'monthly_break_sec'        => $monthlyBreakSec,
                'monthly_absent_sec'       => $monthlyAbsentSec,
                // Maps for reference
                'absent_dates'             => $absentDates,
                'claimed_dates'            => $claimedDates,
            ];

        } catch (Throwable $e) {
            error_log("OvertimeEngine::calculate error for user $userId: " . $e->getMessage());
            return self::empty();
        }
    }

    /**
     * Convert shift hours to exact standard minutes
     * (matches BreakDbHelper and PayrollHelper rounding rules)
     */
    public static function toStandardMinutes(float $hours): int {
        return intval(round($hours * 60));
    }

    /** Return zero-value result array (safe fallback) */
    public static function empty(): array {
        return [
            'gross_ot_seconds' => 0, 'tiffin_bonus_seconds' => 0,
            'total_gross_ot_seconds' => 0, 'short_seconds' => 0,
            'excess_break_seconds' => 0, 'absent_seconds' => 0,
            'claimed_break_seconds' => 0, 'in_shift_break_seconds' => 0,
            'cashed_out_seconds' => 0, 'sold_seconds' => 0,
            'bought_seconds' => 0, 'vault_held_seconds' => 0,
            'vault_out_seconds' => 0, 'vault_in_seconds' => 0,
            'total_deducted_seconds' => 0, 'net_seconds' => 0,
            'available_seconds' => 0,
            'gross_ot_hours' => 0.0, 'tiffin_bonus_hours' => 0.0,
            'total_gross_ot_hours' => 0.0, 'short_hours' => 0.0,
            'excess_break_hours' => 0.0, 'absent_hours' => 0.0,
            'cashed_out_hours' => 0.0, 'net_hours' => 0.0,
            'available_hours' => 0.0,
            'monthly_ot_seconds' => [], 'monthly_tiffin_seconds' => [],
            'monthly_short_seconds' => [], 'monthly_excess_break_sec' => [],
            'monthly_break_sec' => [], 'monthly_absent_sec' => [],
            'absent_dates' => [], 'claimed_dates' => [],
        ];
    }
}
