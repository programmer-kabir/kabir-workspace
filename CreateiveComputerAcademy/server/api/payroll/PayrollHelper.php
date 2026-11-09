<?php
// server/api/payroll/PayrollHelper.php

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../notifications/notification_helper.php';

class PayrollHelper {

    /**
     * Self-healing JIT schema migration for payroll cycle controls and withdrawal tracking
     */
    public static function ensureSchema($pdo) {
        if (!$pdo instanceof PDO) return;
        try {
            // 1. payroll_cycle_controls table
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS `payroll_cycle_controls` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `month_key` VARCHAR(7) NOT NULL UNIQUE,
                    `is_unlocked` TINYINT(1) NOT NULL DEFAULT 0,
                    `unlocked_at` DATETIME NULL,
                    `unlocked_by` INT NULL,
                    `notes` TEXT NULL,
                    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");

            // 2. staff_withdrawals covered_months and invoice_ids
            $wCols = $pdo->query("SHOW COLUMNS FROM `staff_withdrawals`")->fetchAll(PDO::FETCH_COLUMN);
            if (!in_array('covered_months', $wCols)) {
                $pdo->exec("ALTER TABLE `staff_withdrawals` ADD COLUMN `covered_months` VARCHAR(255) NULL AFTER `overtime_hours_cashed`");
            }
            if (!in_array('invoice_ids', $wCols)) {
                $pdo->exec("ALTER TABLE `staff_withdrawals` ADD COLUMN `invoice_ids` TEXT NULL AFTER `covered_months`");
            }

            // 3. staff_contract_tiers table for Staggered / Graduated Salary Schemes
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS `staff_contract_tiers` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `scheme_id` INT NOT NULL,
                    `user_id` INT NOT NULL,
                    `tier_number` TINYINT NOT NULL DEFAULT 1,
                    `tier_name` VARCHAR(100) NOT NULL,
                    `start_month_index` INT NOT NULL DEFAULT 1,
                    `end_month_index` INT NOT NULL DEFAULT 3,
                    `monthly_salary` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                    `hourly_rate` DECIMAL(10,6) NOT NULL DEFAULT 0.000000,
                    `working_days_per_month` INT NOT NULL DEFAULT 26,
                    `standard_daily_hours` DECIMAL(4,2) NOT NULL DEFAULT 8.00,
                    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
                    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX `idx_scheme_id` (`scheme_id`),
                    INDEX `idx_user_tier` (`user_id`, `tier_number`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");

            // 4. Update staff_pay_schemes scheme_type to support STAGGERED_CONTRACT
            $pdo->exec("ALTER TABLE `staff_pay_schemes` MODIFY COLUMN `scheme_type` VARCHAR(30) NOT NULL DEFAULT 'MONTHLY'");

            // 5. Staff Security Deposit (জামানত) schema
            require_once __DIR__ . '/../security_deposit/SecurityDepositHelper.php';
            SecurityDepositHelper::ensureSchema($pdo);
        } catch (Throwable $e) {
            error_log('PayrollHelper::ensureSchema error: ' . $e->getMessage());
        }
    }

    /**
     * Map daily hours to exact net work minutes (e.g. 7.33h = 440m / 7h 20m, 6.33h = 380m / 6h 20m, 5.33h = 320m / 5h 20m)
     */
    public static function getStandardDailyMinutes($dailyHours) {
        $dh = floatval($dailyHours);
        if (abs($dh - 7.33) < 0.05 || abs($dh - 7.3333) < 0.05) {
            return 440; // 7h 20m (8h shift minus 40m unpaid tiffin)
        } elseif (abs($dh - 6.33) < 0.05 || abs($dh - 6.3333) < 0.05) {
            return 380; // 6h 20m (7h shift minus 40m unpaid tiffin)
        } elseif (abs($dh - 5.33) < 0.05 || abs($dh - 5.3333) < 0.05) {
            return 320; // 5h 20m (6h shift minus 40m unpaid tiffin)
        } elseif (abs($dh - 4.33) < 0.05 || abs($dh - 4.3333) < 0.05) {
            return 260; // 4h 20m (5h shift minus 40m unpaid tiffin)
        }
        return max(60, intval(round($dh * 60)));
    }

    /**
     * Calculate hourly rate based on scheme parameters
     */
    public static function calculateHourlyRate($schemeType, $salaryAmount, $contractAmount, $workingDays = 26, $dailyHours = 7.33, $durationMonths = 12) {
        $workingDays = max(1, intval($workingDays));
        $dailyHours = max(0.1, floatval($dailyHours));
        $durationMonths = max(1, intval($durationMonths));

        $dailyMins = self::getStandardDailyMinutes($dailyHours);
        $effectiveDailyHours = $dailyMins / 60.0;

        if ($schemeType === 'YEARLY_CONTRACT') {
            $amount = floatval($contractAmount);
            $totalHours = $workingDays * $durationMonths * $effectiveDailyHours;
            if ($totalHours <= 0) return 0.0;
            return round($amount / $totalHours, 6);
        } elseif ($schemeType === 'STAGGERED_CONTRACT') {
            $amount = floatval($salaryAmount > 0 ? $salaryAmount : 3500.0);
            $monthlyHours = $workingDays * $effectiveDailyHours;
            if ($monthlyHours <= 0) return 0.0;
            return round($amount / $monthlyHours, 6);
        } else {
            // MONTHLY
            $amount = floatval($salaryAmount);
            $monthlyHours = $workingDays * $effectiveDailyHours;
            if ($monthlyHours <= 0) return 0.0;
            return round($amount / $monthlyHours, 6);
        }
    }

    /**
     * Get active pay scheme for a user
     */
    public static function getActiveScheme($pdo, $userId) {
        $stmt = $pdo->prepare("
            SELECT * FROM staff_pay_schemes 
            WHERE user_id = :user_id AND status = 'active'
            ORDER BY id DESC LIMIT 1
        ");
        $stmt->execute([':user_id' => $userId]);
        $scheme = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$scheme) {
            // Check if there is any scheme (e.g. recently expired/completed)
            $stmtLast = $pdo->prepare("
                SELECT * FROM staff_pay_schemes 
                WHERE user_id = :user_id 
                ORDER BY id DESC LIMIT 1
            ");
            $stmtLast->execute([':user_id' => $userId]);
            $scheme = $stmtLast->fetch(PDO::FETCH_ASSOC);
        }

        return $scheme ?: null;
    }

    /**
     * Fetch contract tiers for a scheme
     */
    public static function getContractTiers($pdo, $schemeId) {
        if (!$schemeId) return [];
        try {
            $stmt = $pdo->prepare("SELECT * FROM staff_contract_tiers WHERE scheme_id = :scheme_id ORDER BY tier_number ASC");
            $stmt->execute([':scheme_id' => $schemeId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Throwable $e) {
            return [];
        }
    }

    /**
     * Save/Replace contract tiers for a scheme
     */
    public static function saveContractTiers($pdo, $schemeId, $userId, $tiers, $workingDays = 26, $dailyHours = 8.0) {
        if (!$schemeId || empty($tiers) || !is_array($tiers)) return;

        try {
            $pdo->prepare("DELETE FROM staff_contract_tiers WHERE scheme_id = :scheme_id")->execute([':scheme_id' => $schemeId]);

            $insStmt = $pdo->prepare("
                INSERT INTO staff_contract_tiers (
                    scheme_id, user_id, tier_number, tier_name,
                    start_month_index, end_month_index, monthly_salary,
                    hourly_rate, working_days_per_month, standard_daily_hours, status, created_at
                ) VALUES (
                    :scheme_id, :user_id, :tier_number, :tier_name,
                    :start_month_index, :end_month_index, :monthly_salary,
                    :hourly_rate, :working_days_per_month, :standard_daily_hours, 'pending', NOW()
                )
            ");

            $dailyHours = max(0.1, floatval($dailyHours));
            $workingDays = max(1, intval($workingDays));
            $dailyMins = self::getStandardDailyMinutes($dailyHours);
            $effectiveDailyHours = $dailyMins / 60.0;
            $monthlyHours = $workingDays * $effectiveDailyHours;

            foreach ($tiers as $idx => $t) {
                $tNum = isset($t['tier_number']) ? intval($t['tier_number']) : ($idx + 1);
                $tName = !empty($t['tier_name']) ? trim($t['tier_name']) : "Tier {$tNum}";
                $sIdx = isset($t['start_month_index']) ? intval($t['start_month_index']) : (($idx * 3) + 1);
                $eIdx = isset($t['end_month_index']) ? intval($t['end_month_index']) : (($idx + 1) * 3);
                $salary = floatval($t['monthly_salary'] ?? 0.0);
                $rate = ($monthlyHours > 0) ? round($salary / $monthlyHours, 6) : 0.0;

                $insStmt->execute([
                    ':scheme_id' => $schemeId,
                    ':user_id' => $userId,
                    ':tier_number' => $tNum,
                    ':tier_name' => $tName,
                    ':start_month_index' => $sIdx,
                    ':end_month_index' => $eIdx,
                    ':monthly_salary' => $salary,
                    ':hourly_rate' => $rate,
                    ':working_days_per_month' => $workingDays,
                    ':standard_daily_hours' => $dailyHours
                ]);
            }
        } catch (Throwable $e) {
            error_log("Error in saveContractTiers: " . $e->getMessage());
        }
    }

    /**
     * Resolve the active tier and rate for a specific date or YYYY-MM
     */
    public static function getTierInfoForMonth($scheme, $dateOrMonth, $tiers = null) {
        $defaultRate = floatval($scheme['hourly_rate'] ?? 0.0);
        $defaultSalary = floatval($scheme['salary_amount'] ?? 0.0);

        if (empty($scheme['contract_start_date'])) {
            return [
                'tier_number' => null,
                'tier_name' => null,
                'monthly_salary' => $defaultSalary,
                'hourly_rate' => $defaultRate,
                'month_index' => 1
            ];
        }

        $startTs = strtotime($scheme['contract_start_date']);
        $startYear = (int)date('Y', $startTs);
        $startMonth = (int)date('n', $startTs);

        $targetTs = strtotime((strlen($dateOrMonth) === 7 ? $dateOrMonth . '-01' : $dateOrMonth));
        $targetYear = (int)date('Y', $targetTs);
        $targetMonth = (int)date('n', $targetTs);

        $monthIndex = ($targetYear - $startYear) * 12 + ($targetMonth - $startMonth) + 1;
        if ($monthIndex < 1) $monthIndex = 1;

        if (($scheme['scheme_type'] ?? '') !== 'STAGGERED_CONTRACT' || empty($tiers)) {
            return [
                'tier_number' => null,
                'tier_name' => null,
                'monthly_salary' => $defaultSalary,
                'hourly_rate' => $defaultRate,
                'month_index' => $monthIndex
            ];
        }

        // Match against existing tiers
        foreach ($tiers as $t) {
            $sIdx = intval($t['start_month_index']);
            $eIdx = intval($t['end_month_index']);
            if ($monthIndex >= $sIdx && $monthIndex <= $eIdx) {
                return [
                    'tier_number' => intval($t['tier_number']),
                    'tier_name' => $t['tier_name'],
                    'monthly_salary' => floatval($t['monthly_salary']),
                    'hourly_rate' => floatval($t['hourly_rate']),
                    'month_index' => $monthIndex
                ];
            }
        }

        // If month index exceeds, return final tier
        $lastTier = end($tiers);
        return [
            'tier_number' => intval($lastTier['tier_number']),
            'tier_name' => $lastTier['tier_name'],
            'monthly_salary' => floatval($lastTier['monthly_salary']),
            'hourly_rate' => floatval($lastTier['hourly_rate']),
            'month_index' => $monthIndex
        ];
    }

    /**
     * Build visual roadmap object for Staggered Contracts
     */
    public static function buildContractRoadmap($scheme, $tiers, $totalEarned, $pdo = null, $userId = null) {
        if (($scheme['scheme_type'] ?? '') !== 'STAGGERED_CONTRACT' || empty($tiers)) {
            return null;
        }

        $contractStart = !empty($scheme['contract_start_date']) ? $scheme['contract_start_date'] : date('Y-m-d');
        $contractTarget = floatval($scheme['contract_amount'] ?: 60000.0);
        $startTs = strtotime($contractStart);
        $startYear = (int)date('Y', $startTs);
        $startMonth = (int)date('n', $startTs);

        $nowYear = (int)date('Y');
        $nowMonth = (int)date('n');
        $currentMonthIndex = max(1, ($nowYear - $startYear) * 12 + ($nowMonth - $startMonth) + 1);
        $today = date('Y-m-d');
        $todayTs = strtotime($today);

        $tierList = [];
        $activeTier = null;
        $totalContractMonths = intval($scheme['contract_duration_months'] ?: 12);

        foreach ($tiers as $idx => $t) {
            $tNum = intval($t['tier_number']);
            $sIdx = intval($t['start_month_index']);
            $eIdx = intval($t['end_month_index']);
            $sal = floatval($t['monthly_salary']);
            $rate = floatval($t['hourly_rate']);

            // Precise date boundaries for this tier
            $tierStartDate = date('Y-m-d', strtotime("+" . ($sIdx - 1) . " months", $startTs));
            $nextMonthStart = date('Y-m-d', strtotime("+" . $eIdx . " months", $startTs));
            $tierEndDate = date('Y-m-d', strtotime("-1 day", strtotime($nextMonthStart)));
            $totalDays = max(1, (int)round((strtotime($tierEndDate) - strtotime($tierStartDate)) / 86400) + 1);

            $status = 'upcoming';
            $daysElapsed = 0;
            $daysRemaining = $totalDays;

            if ($today > $tierEndDate) {
                $status = 'completed';
                $daysElapsed = $totalDays;
                $daysRemaining = 0;
            } elseif ($today >= $tierStartDate && $today <= $tierEndDate) {
                $status = 'active';
                $daysElapsed = max(1, (int)round(($todayTs - strtotime($tierStartDate)) / 86400) + 1);
                $daysRemaining = max(0, (int)round((strtotime($tierEndDate) - $todayTs) / 86400));
            } else {
                $status = 'upcoming';
                $daysElapsed = 0;
                $daysRemaining = $totalDays;
            }

            // Attendance days worked in this tier
            $attendanceDays = 0;
            if ($pdo && $userId) {
                try {
                    $stmtAttCount = $pdo->prepare("
                        SELECT COUNT(DISTINCT work_date) 
                        FROM staff_work_earnings 
                        WHERE user_id = :user_id 
                          AND work_date BETWEEN :t_start AND :t_end
                    ");
                    $stmtAttCount->execute([
                        ':user_id' => $userId,
                        ':t_start' => $tierStartDate,
                        ':t_end' => $tierEndDate
                    ]);
                    $attendanceDays = intval($stmtAttCount->fetchColumn() ?: 0);
                } catch (Throwable $e) {}
            }

            $daysProgress = min(100.0, round(($daysElapsed / $totalDays) * 100, 1));
            $nextTier = isset($tiers[$idx + 1]) ? $tiers[$idx + 1] : null;

            $tObj = [
                'tier_number' => $tNum,
                'tier_name' => $t['tier_name'],
                'start_month_index' => $sIdx,
                'end_month_index' => $eIdx,
                'month_span_label' => "Month {$sIdx}–{$eIdx}",
                'start_date' => $tierStartDate,
                'end_date' => $tierEndDate,
                'total_days' => $totalDays,
                'days_elapsed' => $daysElapsed,
                'days_remaining' => $daysRemaining,
                'days_progress' => $daysProgress,
                'attendance_days' => $attendanceDays,
                'next_promotion_date' => $nextTier ? $nextMonthStart : null,
                'next_tier_salary' => $nextTier ? floatval($nextTier['monthly_salary']) : null,
                'next_tier_name' => $nextTier ? $nextTier['tier_name'] : null,
                'monthly_salary' => $sal,
                'hourly_rate' => $rate,
                'status' => $status
            ];

            if ($status === 'active') {
                $tObj['months_remaining_in_tier'] = max(0, $eIdx - $currentMonthIndex + 1);
                $activeTier = $tObj;
            }

            $tierList[] = $tObj;
        }

        if (!$activeTier && !empty($tierList)) {
            $lastT = end($tierList);
            $activeTier = ($today > $lastT['end_date']) 
                ? $lastT 
                : $tierList[0];
        }

        return [
            'scheme_type' => 'STAGGERED_CONTRACT',
            'contract_amount' => $contractTarget,
            'total_earned' => round($totalEarned, 2),
            'remaining_contract' => max(0.0, round($contractTarget - $totalEarned, 2)),
            'progress_percent' => $contractTarget > 0 ? min(100.0, round(($totalEarned / $contractTarget) * 100, 1)) : 100.0,
            'current_month_index' => $currentMonthIndex,
            'total_months' => $totalContractMonths,
            'active_tier' => $activeTier,
            'tiers' => $tierList
        ];
    }

    /**
     * Sync attendance records into staff_work_earnings for a user or scheme
     */
    public static function syncAttendanceEarnings($pdo, $userId = null, $schemeId = null) {
        $schemes = [];
        if ($schemeId) {
            $stmt = $pdo->prepare("SELECT * FROM staff_pay_schemes WHERE id = :id AND status = 'active'");
            $stmt->execute([':id' => $schemeId]);
            $schemes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } elseif ($userId) {
            $stmt = $pdo->prepare("SELECT * FROM staff_pay_schemes WHERE user_id = :user_id AND status = 'active' ORDER BY id DESC");
            $stmt->execute([':user_id' => $userId]);
            $schemes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } else {
            $stmt = $pdo->query("SELECT * FROM staff_pay_schemes WHERE status = 'active' ORDER BY id DESC");
            $schemes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        $totalSyncedSessions = 0;
        $totalSyncedAmount = 0.0;

        foreach ($schemes as $scheme) {
            $sId = $scheme['id'];
            $uId = $scheme['user_id'];
            $startDate = $scheme['contract_start_date'];
            $endDate = !empty($scheme['contract_end_date']) ? $scheme['contract_end_date'] : null;
            $hourlyRate = floatval($scheme['hourly_rate']);
            $tiers = self::getContractTiers($pdo, $sId);

            // Find all attendance records within contract period
            $sql = "
                SELECT id, user_id, date, check_in, check_out, status
                FROM attendance
                WHERE user_id = :user_id
                  AND date >= :start_date
                  " . ($endDate ? "AND date <= :end_date" : "") . "
                  AND check_in IS NOT NULL AND check_in != ''
                  AND check_out IS NOT NULL AND check_out != ''
                  AND status IN ('Present', 'Late', 'Half Day')
                ORDER BY date ASC, check_in ASC
            ";

            $params = [
                ':user_id' => $uId,
                ':start_date' => $startDate,
            ];
            if ($endDate) {
                $params[':end_date'] = $endDate;
            }

            $stmtAtt = $pdo->prepare($sql);
            $stmtAtt->execute($params);
            $attendances = $stmtAtt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($attendances as $att) {
                $attId = $att['id'];
                $attDate = $att['date'];
                $checkInRaw = trim($att['check_in']);
                $checkOutRaw = trim($att['check_out']);

                // Normalize check-in / check-out timestamps
                $inTimeStr = (strpos($checkInRaw, ' ') !== false) ? $checkInRaw : ($attDate . ' ' . $checkInRaw);
                $outTimeStr = (strpos($checkOutRaw, ' ') !== false) ? $checkOutRaw : ($attDate . ' ' . $checkOutRaw);

                $inTs = strtotime($inTimeStr);
                $outTs = strtotime($outTimeStr);

                if ($outTs <= $inTs) {
                    continue; // Skip invalid or zero durations
                }

                $rawMinutes = max(1, intval(round(($outTs - $inTs) / 60)));
                $standardDailyHours = floatval($scheme['standard_daily_hours'] ?: 7.33);
                $standardDailyMinutes = self::getStandardDailyMinutes($standardDailyHours);
                $approvedMinutes = min($rawMinutes, $standardDailyMinutes);

                // Tier-aware active hourly rate for this date
                $dayTierInfo = self::getTierInfoForMonth($scheme, $attDate, $tiers);
                $activeDayRate = $dayTierInfo['hourly_rate'] ?: $hourlyRate;

                $earnedAmount = round(($approvedMinutes / 60.0) * $activeDayRate, 2);
                $sessionStart = date('Y-m-d H:i:s', $inTs);
                $sessionEnd = date('Y-m-d H:i:s', $outTs);
                $dispCapHours = round($standardDailyMinutes / 60.0, 2);
                $notes = "Attendance Work Session ({$att['status']}): {$checkInRaw} to {$checkOutRaw}" . ($rawMinutes > $standardDailyMinutes ? " [Capped at {$dispCapHours}h ({$standardDailyMinutes}m); overtime reserved for Mango Bank]" : "");

                // Check if already in staff_work_earnings
                $stmtCheck = $pdo->prepare("
                    SELECT id FROM staff_work_earnings 
                    WHERE scheme_id = :scheme_id 
                      AND source_type = 'attendance' 
                      AND reference_id = :reference_id
                    LIMIT 1
                ");
                $stmtCheck->execute([
                    ':scheme_id' => $sId,
                    ':reference_id' => $attId
                ]);
                $existingEarning = $stmtCheck->fetch(PDO::FETCH_ASSOC);

                if ($existingEarning) {
                    $stmtUpdate = $pdo->prepare("
                        UPDATE staff_work_earnings SET
                            work_date = :work_date,
                            session_start = :session_start,
                            session_end = :session_end,
                            approved_minutes = :approved_minutes,
                            applied_rate = :applied_rate,
                            earned_amount = :earned_amount,
                            notes = :notes
                        WHERE id = :id
                    ");
                    $stmtUpdate->execute([
                        ':work_date' => $attDate,
                        ':session_start' => $sessionStart,
                        ':session_end' => $sessionEnd,
                        ':approved_minutes' => $approvedMinutes,
                        ':applied_rate' => $activeDayRate,
                        ':earned_amount' => $earnedAmount,
                        ':notes' => $notes,
                        ':id' => $existingEarning['id']
                    ]);
                } else {
                    $stmtInsert = $pdo->prepare("
                        INSERT INTO staff_work_earnings (
                            user_id, scheme_id, work_date, session_start, session_end,
                            approved_minutes, applied_rate, earned_amount, is_surplus,
                            source_type, reference_id, notes, created_at
                        ) VALUES (
                            :user_id, :scheme_id, :work_date, :session_start, :session_end,
                            :approved_minutes, :applied_rate, :earned_amount, 0,
                            'attendance', :reference_id, :notes, NOW()
                        )
                    ");
                    $stmtInsert->execute([
                        ':user_id' => $uId,
                        ':scheme_id' => $sId,
                        ':work_date' => $attDate,
                        ':session_start' => $sessionStart,
                        ':session_end' => $sessionEnd,
                        ':approved_minutes' => $approvedMinutes,
                        ':applied_rate' => $activeDayRate,
                        ':earned_amount' => $earnedAmount,
                        ':reference_id' => $attId,
                        ':notes' => $notes
                    ]);
                }

                $totalSyncedSessions++;
                $totalSyncedAmount += $earnedAmount;
            }

            // Also sync approved mango full day breaks from user_breaks into staff_work_earnings so leave day is fully paid
            try {
                $sqlMango = "
                    SELECT id, user_id, date, duration_minutes, reason 
                    FROM user_breaks 
                    WHERE user_id = :user_id 
                      AND break_type = 'Mango Full Day'
                      AND status = 'Approved'
                      AND date >= :start_date
                      " . ($endDate ? "AND date <= :end_date" : "") . "
                ";
                $stmtMangoClaims = $pdo->prepare($sqlMango);
                $stmtMangoClaims->execute($params);
                $mangoClaims = $stmtMangoClaims->fetchAll(PDO::FETCH_ASSOC);

                foreach ($mangoClaims as $mc) {
                    $mcId = $mc['id'];
                    $mcDate = $mc['date'];
                    $mcMinutes = intval($mc['duration_minutes'] ?: 480);
                    $mcHours = round($mcMinutes / 60.0, 2);
                    $mcTierInfo = self::getTierInfoForMonth($scheme, $mcDate, $tiers);
                    $mcRate = $mcTierInfo['hourly_rate'] ?: $hourlyRate;
                    $mcEarned = round($mcHours * $mcRate, 2);
                    $mcNotes = "Paid Mango Day Off (Redeemed {$mcHours}h Break from Overtime Bank)";

                    $stmtCheckMc = $pdo->prepare("
                        SELECT id FROM staff_work_earnings 
                        WHERE scheme_id = :scheme_id 
                          AND source_type = 'mango_leave' 
                          AND reference_id = :reference_id
                        LIMIT 1
                    ");
                    $stmtCheckMc->execute([
                        ':scheme_id' => $sId,
                        ':reference_id' => $mcId
                    ]);
                    $existingMcEarning = $stmtCheckMc->fetch(PDO::FETCH_ASSOC);

                    if (!$existingMcEarning) {
                        $stmtInsMc = $pdo->prepare("
                            INSERT INTO staff_work_earnings (
                                user_id, scheme_id, work_date, session_start, session_end,
                                approved_minutes, applied_rate, earned_amount, is_surplus,
                                source_type, reference_id, notes, created_at
                            ) VALUES (
                                :user_id, :scheme_id, :work_date, :session_start, :session_end,
                                :approved_minutes, :applied_rate, :earned_amount, 0,
                                'mango_leave', :reference_id, :notes, NOW()
                            )
                        ");
                        $stmtInsMc->execute([
                            ':user_id' => $uId,
                            ':scheme_id' => $sId,
                            ':work_date' => $mcDate,
                            ':session_start' => $mcDate . ' 09:00:00',
                            ':session_end' => $mcDate . ' 17:00:00',
                            ':approved_minutes' => $mcMinutes,
                            ':applied_rate' => $mcRate,
                            ':earned_amount' => $mcEarned,
                            ':reference_id' => $mcId,
                            ':notes' => $mcNotes
                        ]);
                        $totalSyncedSessions++;
                        $totalSyncedAmount += $mcEarned;
                    }
                }
            } catch (Throwable $tMango) {
                error_log("Error syncing mango claims to earnings: " . $tMango->getMessage());
            }

            // Recalculate surplus flags chronologically for yearly contract schemes
            if ($scheme['scheme_type'] === 'YEARLY_CONTRACT') {
                $contractTarget = floatval($scheme['contract_amount']);
                $stmtAll = $pdo->prepare("
                    SELECT id, earned_amount 
                    FROM staff_work_earnings 
                    WHERE scheme_id = :scheme_id 
                    ORDER BY work_date ASC, session_start ASC, id ASC
                ");
                $stmtAll->execute([':scheme_id' => $sId]);
                $allEarnings = $stmtAll->fetchAll(PDO::FETCH_ASSOC);

                $runningEarned = 0.0;
                $stmtUpdateSurplus = $pdo->prepare("UPDATE staff_work_earnings SET is_surplus = :is_surplus WHERE id = :id");

                foreach ($allEarnings as $row) {
                    $rowEarned = floatval($row['earned_amount']);
                    $isSurplus = ($runningEarned >= $contractTarget) ? 1 : 0;
                    $stmtUpdateSurplus->execute([
                        ':is_surplus' => $isSurplus,
                        ':id' => $row['id']
                    ]);
                    $runningEarned += $rowEarned;
                }
            }
        }

        return [
            'status' => 'success',
            'synced_sessions' => $totalSyncedSessions,
            'synced_amount' => round($totalSyncedAmount, 2),
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }

    /**
     * Get complete staff wallet & progress summary
     */
    public static function getStaffWalletSummary($pdo, $userId, $autoSync = true) {
        self::ensureSchema($pdo);
        if ($autoSync) {
            try {
                self::syncAttendanceEarnings($pdo, $userId);
            } catch (Exception $e) {
                // Non-blocking sync error log
            }
        }

        $scheme = self::getActiveScheme($pdo, $userId);

        if (!$scheme) {
            return [
                'has_scheme' => false,
                'message' => 'No active pay scheme found for this staff member.',
                'total_earned' => 0.0,
                'total_approved_minutes' => 0,
                'total_approved_hours' => 0.0,
                'available_withdrawable' => 0.0,
            ];
        }

        $schemeId = $scheme['id'];
        $schemeType = $scheme['scheme_type'];
        $hourlyRate = floatval($scheme['hourly_rate']);
        $tiers = self::getContractTiers($pdo, $schemeId);

        // 1. Total work earnings within this scheme
        $stmtEarn = $pdo->prepare("
            SELECT 
                COALESCE(SUM(earned_amount), 0) AS total_earned,
                COALESCE(SUM(approved_minutes), 0) AS total_minutes,
                COALESCE(COUNT(id), 0) AS total_sessions
            FROM staff_work_earnings
            WHERE scheme_id = :scheme_id
        ");
        $stmtEarn->execute([':scheme_id' => $schemeId]);
        $earnData = $stmtEarn->fetch(PDO::FETCH_ASSOC);

        $totalEarned = floatval($earnData['total_earned']);
        $totalMinutes = intval($earnData['total_minutes']);
        $totalHours = round($totalMinutes / 60, 2);

        // 2. Withdrawals summary
        $stmtWd = $pdo->prepare("
            SELECT 
                COALESCE(SUM(CASE WHEN status IN ('approved', 'paid') THEN amount ELSE 0 END), 0) AS total_withdrawn,
                COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) AS pending_withdrawn
            FROM staff_withdrawals
            WHERE scheme_id = :scheme_id
        ");
        $stmtWd->execute([':scheme_id' => $schemeId]);
        $wdData = $stmtWd->fetch(PDO::FETCH_ASSOC);

        $totalWithdrawn = floatval($wdData['total_withdrawn']);
        $pendingWithdrawn = floatval($wdData['pending_withdrawn']);

        // 3. Check for Live Ongoing Active Shift (Today's check-in without check-out)
        $today = date('Y-m-d');
        $stmtLive = $pdo->prepare("
            SELECT id, date, check_in 
            FROM attendance 
            WHERE user_id = :user_id 
              AND date = :today 
              AND check_in IS NOT NULL AND check_in != ''
              AND (check_out IS NULL OR check_out = '')
            LIMIT 1
        ");
        $stmtLive->execute([':user_id' => $userId, ':today' => $today]);
        $liveAttendance = $stmtLive->fetch(PDO::FETCH_ASSOC);

        $activeSession = null;
        if ($liveAttendance) {
            $liveInStr = (strpos($liveAttendance['check_in'], ' ') !== false) 
                ? $liveAttendance['check_in'] 
                : ($today . ' ' . $liveAttendance['check_in']);
            $liveInTs = strtotime($liveInStr);
            $nowTs = time();
            $liveElapsedMinutes = max(0, intval(round(($nowTs - $liveInTs) / 60)));
            $liveTierInfo = self::getTierInfoForMonth($scheme, $today, $tiers);
            $liveRate = $liveTierInfo['hourly_rate'] ?: $hourlyRate;
            $liveEarned = round(($liveElapsedMinutes / 60.0) * $liveRate, 2);

            $activeSession = [
                'attendance_id' => $liveAttendance['id'],
                'check_in_time' => $liveAttendance['check_in'],
                'session_start' => date('Y-m-d H:i:s', $liveInTs),
                'elapsed_minutes' => $liveElapsedMinutes,
                'elapsed_hours' => round($liveElapsedMinutes / 60, 2),
                'live_earned' => $liveEarned,
                'hourly_rate' => $liveRate,
            ];
        }

        // 4. Monthly Cycle, Flexible Payout Controls & Settlement Calculation
        $todayDate = date('Y-m-d');
        $currentMonth = date('Y-m'); // e.g. 2026-11
        $currentDay = intval(date('j'));

        // Next upcoming payout unlock date (15th of next month if current month ongoing)
        $nextPayoutDate = date('Y-m-15', strtotime('+1 month'));
        $daysUntilNextPayout = max(0, intval(round((strtotime($nextPayoutDate) - strtotime($todayDate)) / 86400)));

        // Fetch custom admin cycle overrides
        $cycleControls = [];
        try {
            $ctrlStmt = $pdo->query("SELECT month_key, is_unlocked, unlocked_at, unlocked_by, notes FROM payroll_cycle_controls");
            while ($cRow = $ctrlStmt->fetch(PDO::FETCH_ASSOC)) {
                $cycleControls[$cRow['month_key']] = $cRow;
            }
        } catch (Throwable $e) {}

        // Fetch all withdrawals for this scheme to chronologically allocate payments to monthly invoices
        $totalPaidPool = 0.0;
        $latestPaidTx = null;
        try {
            $wStmt = $pdo->prepare("
                SELECT id, amount, status, payment_method, account_details, transaction_reference, covered_months, invoice_ids, requested_at, processed_at
                FROM staff_withdrawals
                WHERE scheme_id = :scheme_id AND status IN ('approved', 'paid')
                ORDER BY requested_at ASC, id ASC
            ");
            $wStmt->execute([':scheme_id' => $schemeId]);
            $paidWdList = $wStmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($paidWdList as $pw) {
                $totalPaidPool += floatval($pw['amount']);
                $latestPaidTx = $pw;
            }
        } catch (Throwable $e) {}

        // Fetch earnings grouped by month for this scheme
        $stmtMonthEarn = $pdo->prepare("
            SELECT 
                DATE_FORMAT(work_date, '%Y-%m') AS month_key,
                DATE_FORMAT(work_date, '%M %Y') AS month_label,
                COALESCE(SUM(earned_amount), 0) AS total_earned,
                COALESCE(SUM(CASE WHEN is_surplus = 1 THEN earned_amount ELSE 0 END), 0) AS surplus_earned,
                COALESCE(SUM(approved_minutes), 0) AS approved_minutes,
                COUNT(id) AS sessions_count,
                COUNT(DISTINCT work_date) AS days_count
            FROM staff_work_earnings
            WHERE scheme_id = :scheme_id
            GROUP BY DATE_FORMAT(work_date, '%Y-%m'), DATE_FORMAT(work_date, '%M %Y')
            ORDER BY month_key ASC
        ");
        $stmtMonthEarn->execute([':scheme_id' => $schemeId]);
        $monthlyEarningsRows = $stmtMonthEarn->fetchAll(PDO::FETCH_ASSOC);

        $maturedEarned = 0.0;
        $maturedSurplus = 0.0;
        $accruingEarned = 0.0;
        $accruingSurplus = 0.0;
        $monthlyCycleLedger = [];

        foreach ($monthlyEarningsRows as $mRow) {
            $mKey = $mRow['month_key'];
            $mEarned = floatval($mRow['total_earned']);
            $mSurplus = floatval($mRow['surplus_earned']);

            // Determine if cycle is unlocked:
            // 1. Admin explicit toggle takes top precedence
            // 2. Default: past month ($mKey < $currentMonth) is auto-unlocked
            $hasAdminOverride = isset($cycleControls[$mKey]);
            if ($hasAdminOverride) {
                $isUnlocked = !empty($cycleControls[$mKey]['is_unlocked']);
                $unlockType = 'manual_admin';
                $payoutUnlockDate = $isUnlocked
                    ? (!empty($cycleControls[$mKey]['unlocked_at']) ? 'Unlocked on ' . date('d M Y', strtotime($cycleControls[$mKey]['unlocked_at'])) : 'Unlocked by Admin')
                    : 'Locked by Admin';
            } else {
                $isPastMonth = ($mKey < $currentMonth);
                $isUnlocked = $isPastMonth;
                $unlockType = 'auto_cycle';
                $payoutUnlockDate = date('15 M Y', strtotime($mKey . '-01 +1 month'));
            }

            if ($isUnlocked) {
                $maturedEarned += $mEarned;
                $maturedSurplus += $mSurplus;
            } else {
                $accruingEarned += $mEarned;
                $accruingSurplus += $mSurplus;
            }

            // Chronological payment settlement status for this cycle
            $cyclePaidStatus = 'unpaid';
            $cyclePaidAmount = 0.0;
            $cycleTxRef = null;
            $cyclePayMethod = null;
            $cyclePaidDate = null;

            if ($totalPaidPool >= $mEarned && $mEarned > 0) {
                $cyclePaidStatus = 'paid';
                $cyclePaidAmount = $mEarned;
                $totalPaidPool -= $mEarned;
                if ($latestPaidTx) {
                    $cycleTxRef = $latestPaidTx['transaction_reference'];
                    $cyclePayMethod = $latestPaidTx['payment_method'];
                    $cyclePaidDate = $latestPaidTx['processed_at'] ?: $latestPaidTx['requested_at'];
                }
            } elseif ($totalPaidPool > 0 && $mEarned > 0) {
                $cyclePaidStatus = 'partially_paid';
                $cyclePaidAmount = $totalPaidPool;
                $totalPaidPool = 0.0;
                if ($latestPaidTx) {
                    $cycleTxRef = $latestPaidTx['transaction_reference'];
                    $cyclePayMethod = $latestPaidTx['payment_method'];
                    $cyclePaidDate = $latestPaidTx['processed_at'] ?: $latestPaidTx['requested_at'];
                }
            }

            // Human-readable invoice status & badges
            if ($cyclePaidStatus === 'paid') {
                $status = 'paid';
                $statusLabel = 'Paid & Settled';
            } elseif ($cyclePaidStatus === 'partially_paid') {
                $status = 'partially_paid';
                $statusLabel = 'Partially Paid (৳' . number_format($cyclePaidAmount, 2) . ')';
            } elseif (!$isUnlocked) {
                $status = 'accruing';
                $statusLabel = 'Ongoing Cycle (Accruing)';
            } else {
                if ($pendingWithdrawn > 0) {
                    $status = 'pending_payout';
                    $statusLabel = 'Payout Pending Admin Approval';
                } else {
                    $status = 'unlocked';
                    $statusLabel = 'Matured & Ready for Payout';
                }
            }

            $mTierInfo = self::getTierInfoForMonth($scheme, $mKey, $tiers);

            $monthlyCycleLedger[] = [
                'invoice_id' => 'CCA-PS-' . str_replace('-', '', $mKey) . '-' . $userId,
                'month_key' => $mKey,
                'month_label' => $mRow['month_label'],
                'total_earned' => $mEarned,
                'surplus_earned' => $mSurplus,
                'invoice_integer_amount' => floor($mEarned),
                'fractional_rollover' => round($mEarned - floor($mEarned), 2),
                'approved_minutes' => intval($mRow['approved_minutes']),
                'approved_hours' => round(intval($mRow['approved_minutes']) / 60, 2),
                'days_count' => intval($mRow['days_count']),
                'sessions_count' => intval($mRow['sessions_count']),
                'payout_unlock_date' => $payoutUnlockDate,
                'unlock_type' => $unlockType,
                'is_unlocked' => $isUnlocked,
                'has_admin_override' => $hasAdminOverride,
                'status' => $status,
                'status_label' => $statusLabel,
                'cycle_paid_status' => $cyclePaidStatus,
                'cycle_paid_amount' => $cyclePaidAmount,
                'transaction_reference' => $cycleTxRef,
                'payment_method' => $cyclePayMethod,
                'paid_at' => $cyclePaidDate,
                'tier_number' => $mTierInfo['tier_number'],
                'tier_name' => $mTierInfo['tier_name'],
                'tier_salary' => $mTierInfo['monthly_salary'],
                'tier_hourly_rate' => $mTierInfo['hourly_rate'],
                'month_index' => $mTierInfo['month_index']
            ];
        }

        // Scheme-specific calculations
        $summary = [
            'has_scheme' => true,
            'scheme' => $scheme,
            'total_earned' => $totalEarned,
            'total_approved_minutes' => $totalMinutes,
            'total_approved_hours' => $totalHours,
            'total_sessions' => intval($earnData['total_sessions']),
            'total_withdrawn' => $totalWithdrawn,
            'pending_withdrawn' => $pendingWithdrawn,
            'active_session' => $activeSession,
            'next_payout_date' => $nextPayoutDate,
            'days_until_next_payout' => $daysUntilNextPayout,
            'monthly_cycle_ledger' => array_reverse($monthlyCycleLedger),
        ];

        if ($schemeType === 'YEARLY_CONTRACT') {
            $contractTarget = floatval($scheme['contract_amount']);
            $companyReserved = min($totalEarned, $contractTarget);
            $targetCompleted = ($totalEarned >= $contractTarget);
            $progressPercent = $contractTarget > 0 ? min(100.0, round(($totalEarned / $contractTarget) * 100, 2)) : 100.0;
            $staffSurplusEarned = max(0.0, $totalEarned - $contractTarget);

            // Matured vs Accruing surplus calculation
            $maturedSurplusCalc = max(0.0, $maturedEarned - $contractTarget);
            $accruingSurplusCalc = max(0.0, $staffSurplusEarned - $maturedSurplusCalc);

            // Available withdrawable is matured surplus minus what has been requested/paid
            $availableWithdrawableTotal = max(0.0, $maturedSurplusCalc - $totalWithdrawn - $pendingWithdrawn);

            // Minimum 5K requirement for Yearly Contract
            $minWithdrawalLimit = 5000.0;

            $summary['contract_target'] = $contractTarget;
            $summary['company_reserved'] = $companyReserved;
            $summary['target_completed'] = $targetCompleted;
            $summary['progress_percent'] = $progressPercent;
            $summary['staff_surplus_earned'] = $staffSurplusEarned;
            $summary['matured_surplus_earned'] = $maturedSurplusCalc;
            $summary['accruing_balance'] = round($accruingSurplusCalc, 2);
        } elseif ($schemeType === 'STAGGERED_CONTRACT') {
            $contractTarget = floatval($scheme['contract_amount'] ?: 60000.0);
            $availableWithdrawableTotal = max(0.0, $maturedEarned - $totalWithdrawn - $pendingWithdrawn);

            // Active tier for current cycle
            $currentMonthKey = date('Y-m');
            $activeTierInfo = self::getTierInfoForMonth($scheme, $currentMonthKey, $tiers);
            $minWithdrawalLimit = ($activeTierInfo['monthly_salary'] > 0) ? $activeTierInfo['monthly_salary'] : 3500.0;

            $roadmap = self::buildContractRoadmap($scheme, $tiers, $totalEarned, $pdo, $userId);

            if ($roadmap && !empty($roadmap['active_tier'])) {
                $activeTierInfo = array_merge($activeTierInfo, $roadmap['active_tier']);
            }

            $summary['contract_target'] = $contractTarget;
            $summary['monthly_salary'] = $activeTierInfo['monthly_salary'];
            $summary['active_tier'] = $activeTierInfo;
            $summary['contract_roadmap'] = $roadmap;
            $summary['matured_earned'] = $maturedEarned;
            $summary['accruing_balance'] = round($accruingEarned, 2);
        } else {
            // MONTHLY
            $salaryAmount = floatval($scheme['salary_amount']);
            $availableWithdrawableTotal = max(0.0, $maturedEarned - $totalWithdrawn - $pendingWithdrawn);

            // Minimum withdrawal threshold is the monthly salary requirement (e.g. ৳ 15,000)
            $minWithdrawalLimit = ($salaryAmount > 0) ? $salaryAmount : 5000.0;

            $summary['monthly_salary'] = $salaryAmount;
            $summary['matured_earned'] = $maturedEarned;
            $summary['accruing_balance'] = round($accruingEarned, 2);
        }

        // Integer cashout & Paisa/Fraction Rollover calculation
        $availableWithdrawableInteger = floor($availableWithdrawableTotal);
        $fractionalRollover = round($availableWithdrawableTotal - $availableWithdrawableInteger, 2);
        $canWithdraw = ($minWithdrawalLimit > 0 && $availableWithdrawableInteger >= $minWithdrawalLimit);
        $withdrawalBlockReason = !$canWithdraw 
            ? (($availableWithdrawableInteger <= 0) 
                ? 'No matured withdrawable balance available yet.' 
                : 'Minimum withdrawal requirement for your scheme is ৳ ' . number_format($minWithdrawalLimit) . '.')
            : null;

        $summary['available_withdrawable_total'] = round($availableWithdrawableTotal, 2);
        $summary['available_withdrawable'] = $availableWithdrawableInteger;
        $summary['fractional_rollover'] = $fractionalRollover;
        $summary['min_withdrawal_limit'] = $minWithdrawalLimit;
        $summary['can_withdraw'] = $canWithdraw;
        $summary['withdrawal_block_reason'] = $withdrawalBlockReason;

        // Auto Notify Staff when maturity cycle unlocks with withdrawable amount ONLY IF user strictly meets/exceeds their required minimum salary threshold
        if ($canWithdraw && $availableWithdrawableInteger >= $minWithdrawalLimit && $minWithdrawalLimit > 0) {
            self::checkAndSendMaturityNotification($pdo, $userId, $availableWithdrawableInteger, $fractionalRollover);
        }

        // Period statistics (Today, This Week, This Month, All Time)
        $dayOfWeek = intval(date('w')); // 0 (Sun) to 6 (Sat)
        $diffDays = ($dayOfWeek + 1) % 7; // In BD Saturday starts week: Sat=0, Sun=1, ..., Fri=6
        $weekStart = date('Y-m-d', strtotime("-{$diffDays} days"));
        $monthStart = date('Y-m-01');

        $stmtPeriod = $pdo->prepare("
            SELECT 
                COALESCE(SUM(CASE WHEN work_date = :today THEN earned_amount ELSE 0 END), 0) AS today_earned,
                COALESCE(SUM(CASE WHEN work_date = :today THEN approved_minutes ELSE 0 END), 0) AS today_minutes,
                COALESCE(COUNT(CASE WHEN work_date = :today THEN id ELSE NULL END), 0) AS today_sessions,

                COALESCE(SUM(CASE WHEN work_date >= :week_start THEN earned_amount ELSE 0 END), 0) AS week_earned,
                COALESCE(SUM(CASE WHEN work_date >= :week_start THEN approved_minutes ELSE 0 END), 0) AS week_minutes,
                COALESCE(COUNT(CASE WHEN work_date >= :week_start THEN id ELSE NULL END), 0) AS week_sessions,

                COALESCE(SUM(CASE WHEN work_date >= :month_start THEN earned_amount ELSE 0 END), 0) AS month_earned,
                COALESCE(SUM(CASE WHEN work_date >= :month_start THEN approved_minutes ELSE 0 END), 0) AS month_minutes,
                COALESCE(COUNT(CASE WHEN work_date >= :month_start THEN id ELSE NULL END), 0) AS month_sessions
            FROM staff_work_earnings
            WHERE scheme_id = :scheme_id
        ");
        $stmtPeriod->execute([
            ':scheme_id' => $schemeId,
            ':today' => $today,
            ':week_start' => $weekStart,
            ':month_start' => $monthStart
        ]);
        $periodData = $stmtPeriod->fetch(PDO::FETCH_ASSOC);

        $summary['period_stats'] = [
            'today' => [
                'earned' => round(floatval($periodData['today_earned']), 2),
                'minutes' => intval($periodData['today_minutes']),
                'hours' => round(intval($periodData['today_minutes']) / 60, 2),
                'sessions' => intval($periodData['today_sessions']),
                'date' => $today,
            ],
            'this_week' => [
                'earned' => round(floatval($periodData['week_earned']), 2),
                'minutes' => intval($periodData['week_minutes']),
                'hours' => round(intval($periodData['week_minutes']) / 60, 2),
                'sessions' => intval($periodData['week_sessions']),
                'start_date' => $weekStart,
            ],
            'this_month' => [
                'earned' => round(floatval($periodData['month_earned']), 2),
                'minutes' => intval($periodData['month_minutes']),
                'hours' => round(intval($periodData['month_minutes']) / 60, 2),
                'sessions' => intval($periodData['month_sessions']),
                'start_date' => $monthStart,
            ],
            'all_time' => [
                'earned' => round($totalEarned, 2),
                'minutes' => $totalMinutes,
                'hours' => $totalHours,
                'sessions' => intval($earnData['total_sessions']),
            ]
        ];

        // 5. Overtime Bank (Money vs Mango Choice Calculation)
        try {
            $shiftHours = floatval($scheme['standard_daily_hours'] ?: 7.33);
            if ($shiftHours <= 0) $shiftHours = 7.33;
            $shiftMins = self::getStandardDailyMinutes($shiftHours);
            $effectiveShiftHours = $shiftMins / 60.0;

            // Determine cutoff date and covered month labels for unlocked withdrawal cycles
            $unlockedMonths = [];
            $maxUnlockedMonth = null;
            if (!empty($monthlyCycleLedger)) {
                foreach ($monthlyCycleLedger as $cycle) {
                    if (!empty($cycle['is_unlocked'])) {
                        $unlockedMonths[$cycle['month_key']] = $cycle['month_label'] ?: date('F Y', strtotime($cycle['month_key'] . '-01'));
                        if ($maxUnlockedMonth === null || $cycle['month_key'] > $maxUnlockedMonth) {
                            $maxUnlockedMonth = $cycle['month_key'];
                        }
                    }
                }
            }
            ksort($unlockedMonths);
            $cycleEndDate = $maxUnlockedMonth ? date('Y-m-t', strtotime($maxUnlockedMonth . '-01')) : date('Y-m-d');
            
            // Dynamic cycle label representing ALL unlocked months (e.g. "September 2026 + October 2026")
            $unlockedLabels = array_values($unlockedMonths);
            if (count($unlockedLabels) > 1) {
                $cycleLabel = implode(' + ', $unlockedLabels);
            } elseif (count($unlockedLabels) === 1) {
                $cycleLabel = $unlockedLabels[0];
            } else {
                $cycleLabel = date('F Y');
            }

            // Fetch attendance for unlocked cycle overtime calculation
            $stmtAttAll = $pdo->prepare("
                SELECT date, check_in, check_out 
                FROM attendance 
                WHERE user_id = :user_id 
                  AND check_in IS NOT NULL AND check_out IS NOT NULL
                  AND date <= :cycle_end_date
                ORDER BY date ASC
            ");
            $stmtAttAll->execute([
                ':user_id' => $userId,
                ':cycle_end_date' => $cycleEndDate
            ]);
            $attRowsAll = $stmtAttAll->fetchAll(PDO::FETCH_ASSOC);

            // Holidays
            $holidays = [];
            $holStmt = $pdo->query("SELECT date, expected_hours FROM holidays");
            if ($holStmt) {
                while ($h = $holStmt->fetch(PDO::FETCH_ASSOC)) {
                    $holidays[$h['date']] = (float)$h['expected_hours'];
                }
            }

            // Aggregate by date
            $dailyWorkedSec = [];
            foreach ($attRowsAll as $ar) {
                $inTs = strtotime(strpos($ar['check_in'], ' ') !== false ? $ar['check_in'] : ($ar['date'] . ' ' . $ar['check_in']));
                $outTs = strtotime(strpos($ar['check_out'], ' ') !== false ? $ar['check_out'] : ($ar['date'] . ' ' . $ar['check_out']));
                if ($outTs <= $inTs) continue;
                $d = $ar['date'];
                if (!isset($dailyWorkedSec[$d])) $dailyWorkedSec[$d] = 0;
                $dailyWorkedSec[$d] += ($outTs - $inTs);
            }

            $totalOtSeconds = 0;
            $totalShortSeconds = 0;
            $monthlyOtSec = [];
            $monthlyShortSec = [];
            foreach ($dailyWorkedSec as $dStr => $wSec) {
                $isFri = (date('N', strtotime($dStr)) == 5);
                $expSec = $isFri ? 0 : ($shiftMins * 60);
                if (isset($holidays[$dStr])) {
                    $expSec = $holidays[$dStr] * 3600;
                }
                $diffSec = $wSec - $expSec;
                $mKey = substr($dStr, 0, 7);
                if ($diffSec > 0) {
                    $totalOtSeconds += $diffSec;
                    $monthlyOtSec[$mKey] = ($monthlyOtSec[$mKey] ?? 0) + $diffSec;
                } elseif ($diffSec < -900 && !$isFri) {
                    $shortSec = abs($diffSec);
                    $totalShortSeconds += $shortSec;
                    $monthlyShortSec[$mKey] = ($monthlyShortSec[$mKey] ?? 0) + $shortSec;
                }
            }
            $totalOtHours = round($totalOtSeconds / 3600, 2);
            $totalShortHours = round($totalShortSeconds / 3600, 2);

            // Fetch Tiffin efficiency bonus seconds within cycle cutoff
            $totalTiffinBonusSeconds = 0;
            $monthlyTiffinBonusSec = [];
            try {
                $stmtTf = $pdo->prepare("
                    SELECT date, COALESCE(tiffin_delta_minutes, 0) as t_delta 
                    FROM user_breaks 
                    WHERE user_id = :user_id 
                      AND break_type = 'Tiffin' 
                      AND status = 'Completed' 
                      AND date <= :cycle_end_date
                ");
                $stmtTf->execute([
                    ':user_id' => $userId,
                    ':cycle_end_date' => $cycleEndDate
                ]);
                while ($tf = $stmtTf->fetch(PDO::FETCH_ASSOC)) {
                    $tDelta = intval($tf['t_delta']);
                    if ($tDelta > 0) {
                        $sec = $tDelta * 60;
                        $totalTiffinBonusSeconds += $sec;
                        $mKey = substr($tf['date'], 0, 7);
                        $monthlyTiffinBonusSec[$mKey] = ($monthlyTiffinBonusSec[$mKey] ?? 0) + $sec;
                    }
                }
            } catch (Throwable $eTf) {}
            $totalTiffinBonusHours = round($totalTiffinBonusSeconds / 3600, 2);

            // Claims directly from central user_breaks table (within cycle cutoff)
            $stmtMb = $pdo->prepare("
                SELECT date, break_type, duration_minutes 
                FROM user_breaks 
                WHERE user_id = :user_id 
                  AND status != 'Rejected' 
                  AND break_type IN ('Mango Full Day', 'Mango Break', 'Mango Overtime')
                  AND date <= :cycle_end_date
            ");
            $stmtMb->execute([
                ':user_id' => $userId,
                ':cycle_end_date' => $cycleEndDate
            ]);
            $mbRows = $stmtMb->fetchAll(PDO::FETCH_ASSOC);

            $claimedOtHours = 0.0;
            $inShiftOtHours = 0.0;
            $totalClaimedBreakSeconds = 0;
            $totalInShiftBreakSeconds = 0;
            $claimedDatesMap = [];
            $monthlyBreakSec = [];

            foreach ($mbRows as $mb) {
                $hrs = round(intval($mb['duration_minutes']) / 60, 2);
                $bSec = intval($mb['duration_minutes']) * 60;
                $mKey = substr($mb['date'], 0, 7);
                if ($mb['break_type'] === 'Mango Full Day') {
                    $claimedOtHours += $hrs;
                    $totalClaimedBreakSeconds += $bSec;
                    if (!empty($mb['date'])) {
                        $claimedDatesMap[$mb['date']] = true;
                    }
                } else {
                    $inShiftOtHours += $hrs;
                    $totalInShiftBreakSeconds += $bSec;
                    $monthlyBreakSec[$mKey] = ($monthlyBreakSec[$mKey] ?? 0) + $bSec;
                }
            }

            // Leaves & Absences outside of claimed mango breaks
            $leaveDatesMap = [];
            try {
                $lrStmt = $pdo->prepare("SELECT start_date, end_date FROM leave_requests WHERE user_id = :user_id AND status = 'Approved'");
                $lrStmt->execute([':user_id' => $userId]);
                while ($al = $lrStmt->fetch(PDO::FETCH_ASSOC)) {
                    $cur = strtotime($al['start_date']);
                    $end = strtotime($al['end_date']);
                    while ($cur <= $end) {
                        $dt = date('Y-m-d', $cur);
                        if (date('N', $cur) != 5 && !isset($claimedDatesMap[$dt])) {
                            $leaveDatesMap[$dt] = true;
                        }
                        $cur = strtotime('+1 day', $cur);
                    }
                }
            } catch (Throwable $e) {}

            try {
                $attLeaveStmt = $pdo->prepare("SELECT date FROM attendance WHERE user_id = :user_id AND status IN ('Leave', 'Absent')");
                $attLeaveStmt->execute([':user_id' => $userId]);
                while ($attL = $attLeaveStmt->fetch(PDO::FETCH_ASSOC)) {
                    $dt = $attL['date'];
                    if (date('N', strtotime($dt)) != 5 && !isset($claimedDatesMap[$dt])) {
                        $leaveDatesMap[$dt] = true;
                    }
                }
            } catch (Throwable $e) {}

            $totalLeaveHours = round(count($leaveDatesMap) * $effectiveShiftHours, 2);
            $totalGapHours = round($totalShortHours + $totalLeaveHours, 2);

            // Cashed out overtime from staff_withdrawals
            $stmtCashed = $pdo->prepare("SELECT COALESCE(SUM(overtime_hours_cashed), 0) FROM staff_withdrawals WHERE user_id = :user_id AND status != 'rejected'");
            $stmtCashed->execute([':user_id' => $userId]);
            $cashedOtHours = floatval($stmtCashed->fetchColumn());

            // Unified Single Bucket Rule (Matching Mango Tree calculated from exact seconds):
            // Gross Overtime = Attendance Overtime + Tiffin Efficiency Savings
            $totalGrossOtSeconds = $totalOtSeconds + $totalTiffinBonusSeconds;
            $grossOtHours = round($totalGrossOtSeconds / 3600, 2);

            // Deductions = Short Shifts + Claimed Full Day Leaves + In-Shift Extra Breaks + Cashed Out Overtime
            $totalDeductionSeconds = $totalShortSeconds + $totalClaimedBreakSeconds + $totalInShiftBreakSeconds + intval($cashedOtHours * 3600);
            $totalDeductions = round($totalDeductionSeconds / 3600, 2);

            $netAvailableOtSeconds = max(0, $totalGrossOtSeconds - $totalDeductionSeconds);
            $availableOtHours = round($netAvailableOtSeconds / 3600, 2);
            $availableRipeMangoes = floor($availableOtHours / $shiftHours);
            $effectiveOtCashRate = ($schemeType === 'STAGGERED_CONTRACT' && !empty($activeTierInfo['hourly_rate']))
                ? floatval($activeTierInfo['hourly_rate'])
                : $hourlyRate;
            $availableOtCashValue = round($availableOtHours * $effectiveOtCashRate, 2);

            // Month-by-month overtime breakdown for unlocked cycles
            $monthlyOtBreakdown = [];
            $totalCoveredShortCash = 0.0;
            foreach ($unlockedMonths as $uMonthKey => $uMonthLabel) {
                $gSec = ($monthlyOtSec[$uMonthKey] ?? 0) + ($monthlyTiffinBonusSec[$uMonthKey] ?? 0);
                $dSec = ($monthlyShortSec[$uMonthKey] ?? 0) + ($monthlyBreakSec[$uMonthKey] ?? 0);
                $netSec = max(0, $gSec - $dSec);
                $hrs = round($netSec / 3600, 2);

                $uMonthRate = ($schemeType === 'STAGGERED_CONTRACT' && !empty($tiers))
                    ? (self::getTierInfoForMonth($scheme, $uMonthKey, $tiers)['hourly_rate'] ?: $hourlyRate)
                    : $hourlyRate;

                $cash = round($hrs * $uMonthRate, 2);

                // Short time covered by Overtime Bank
                $covShortSec = min($monthlyShortSec[$uMonthKey] ?? 0, max(0, $gSec - ($monthlyBreakSec[$uMonthKey] ?? 0)));
                $covShortCash = round(($covShortSec / 3600) * $uMonthRate, 2);
                $totalCoveredShortCash += $covShortCash;

                $monthlyOtBreakdown[] = [
                    'month_key' => $uMonthKey,
                    'month_label' => $uMonthLabel,
                    'gross_ot_hours' => round(($monthlyOtSec[$uMonthKey] ?? 0) / 3600, 2),
                    'tiffin_bonus_hours' => round(($monthlyTiffinBonusSec[$uMonthKey] ?? 0) / 3600, 2),
                    'short_hours' => round(($monthlyShortSec[$uMonthKey] ?? 0) / 3600, 2),
                    'in_shift_break_hours' => round(($monthlyBreakSec[$uMonthKey] ?? 0) / 3600, 2),
                    'covered_short_cash' => $covShortCash,
                    'ot_seconds' => $netSec,
                    'ot_hours' => $hrs,
                    'cash_value' => $cash
                ];
            }

            $summary['overtime_bank'] = [
                'cycle_label' => $cycleLabel,
                'cycle_end_date' => $cycleEndDate,
                'shift_hours' => $shiftHours,
                'hourly_rate' => $effectiveOtCashRate,
                'gross_overtime_hours' => $grossOtHours,
                'total_overtime_hours' => $totalOtHours,
                'total_tiffin_bonus_hours' => $totalTiffinBonusHours,
                'total_short_hours' => $totalShortHours,
                'total_in_shift_break_hours' => $inShiftOtHours,
                'cashed_out_hours' => $cashedOtHours,
                'claimed_break_hours' => $claimedOtHours,
                'total_deductions_hours' => $totalDeductions,
                'available_hours' => $availableOtHours,
                'ripe_mangoes' => intval($availableRipeMangoes),
                'cash_value' => $availableOtCashValue,
                'can_cashout' => ($availableOtHours >= 1.0),
                'monthly_breakdown' => $monthlyOtBreakdown
            ];

            // Enrich each monthly cycle in ledger with its corresponding overtime numbers & restored short time
            if (!empty($summary['monthly_cycle_ledger'])) {
                foreach ($summary['monthly_cycle_ledger'] as &$cycleItem) {
                    $mK = $cycleItem['month_key'];
                    $cycleRate = !empty($cycleItem['tier_hourly_rate']) ? floatval($cycleItem['tier_hourly_rate']) : $hourlyRate;
                    $gSec = ($monthlyOtSec[$mK] ?? 0) + ($monthlyTiffinBonusSec[$mK] ?? 0);
                    $dSec = ($monthlyShortSec[$mK] ?? 0) + ($monthlyBreakSec[$mK] ?? 0);
                    $netSec = max(0, $gSec - $dSec);
                    $otHrs = round($netSec / 3600, 2);
                    $otCash = round($otHrs * $cycleRate, 2);

                    // Short time covered by overtime is restored to base salary to prevent double-deduction
                    $covShortSec = min($monthlyShortSec[$mK] ?? 0, max(0, $gSec - ($monthlyBreakSec[$mK] ?? 0)));
                    $covShortCash = round(($covShortSec / 3600) * $cycleRate, 2);
                    $restoredBase = round(floatval($cycleItem['total_earned']) + $covShortCash, 2);

                    $cycleItem['overtime_hours'] = $otHrs;
                    $cycleItem['overtime_cash'] = $otCash;
                    $cycleItem['covered_short_cash'] = $covShortCash;
                    $cycleItem['base_earned_restored'] = $restoredBase;
                    $cycleItem['total_earned'] = $restoredBase;
                    $cycleItem['invoice_integer_amount'] = floor($restoredBase);
                    $cycleItem['fractional_rollover'] = round($restoredBase - floor($restoredBase), 2);
                    $cycleItem['combined_earned'] = round($restoredBase + $otCash, 2);
                }
                unset($cycleItem);
            }

            // Restore covered short time into summary base totals
            if ($totalCoveredShortCash > 0) {
                $summary['total_earned'] = round($summary['total_earned'] + $totalCoveredShortCash, 2);
                if (isset($summary['matured_earned'])) {
                    $summary['matured_earned'] = round($summary['matured_earned'] + $totalCoveredShortCash, 2);
                }
                if (isset($summary['available_withdrawable_total'])) {
                    $summary['available_withdrawable_total'] = round($summary['available_withdrawable_total'] + $totalCoveredShortCash, 2);
                    $summary['available_withdrawable'] = floor($summary['available_withdrawable_total']);
                    $summary['fractional_rollover'] = round($summary['available_withdrawable_total'] - $summary['available_withdrawable'], 2);
                }
            }
        } catch (Throwable $otEx) {
            error_log("Error calculating overtime bank in summary: " . $otEx->getMessage());
            $summary['overtime_bank'] = null;
        }

        // Finalize eligibility: Staff can initiate withdrawal if their base balance + available overtime reaches the salary requirement
        $baseTotalFunds = floatval($summary['available_withdrawable_total'] ?? $summary['available_withdrawable'] ?? 0.0);
        $potentialOtCash = floatval($summary['overtime_bank']['cash_value'] ?? 0.0);
        $totalPotentialWithdrawable = floor($baseTotalFunds + $potentialOtCash);
        $canWithdraw = ($minWithdrawalLimit > 0 && $totalPotentialWithdrawable >= $minWithdrawalLimit);
        $summary['can_withdraw'] = $canWithdraw;
        if (!$canWithdraw) {
            $summary['withdrawal_block_reason'] = ($totalPotentialWithdrawable <= 0)
                ? 'No matured withdrawable balance available yet.'
                : 'Minimum withdrawal requirement for your scheme is ৳ ' . number_format($minWithdrawalLimit) . '.';
        } else {
            $summary['withdrawal_block_reason'] = null;
        }

        // Security Deposit (জামানত) Integration (Option A living allowance split)
        try {
            require_once __DIR__ . '/../security_deposit/SecurityDepositHelper.php';
            $thisMonthEarned = floatval($summary['periods']['this_month']['earned'] ?? 0.0);
            $depositSummary = SecurityDepositHelper::getDepositSummaryForUser($pdo, $userId, $thisMonthEarned, date('Y-m'));
            $summary['security_deposit'] = $depositSummary;

            // If user has an active, unfulfilled security deposit:
            // Adjust available_withdrawable according to Option A living allowance threshold
            if (!empty($depositSummary['has_deposit']) && empty($depositSummary['is_fulfilled'])) {
                $livingAllowance = floatval($depositSummary['monthly_living_allowance'] ?: 5000.0);
                $curTakeHome = floatval($depositSummary['current_month_split']['take_home_amount'] ?? $livingAllowance);
                $allowedTakeHome = min($summary['available_withdrawable_total'], $curTakeHome);
                $summary['available_withdrawable_total'] = round($allowedTakeHome, 2);
                $summary['available_withdrawable'] = floor($allowedTakeHome);
                $summary['min_withdrawal_limit'] = min($summary['min_withdrawal_limit'], $livingAllowance);
                $summary['can_withdraw'] = ($summary['available_withdrawable'] > 0);
            }
        } catch (Throwable $sdEx) {
            error_log("Error attaching security deposit summary: " . $sdEx->getMessage());
        }

        return $summary;
    }

    /**
     * Record an approved work-time earning session
     */
    public static function recordWorkTimeEarning($pdo, $userId, $approvedMinutes, $sourceType = 'timer', $referenceId = null, $notes = null, $workDate = null, $sessionStart = null, $sessionEnd = null) {
        $approvedMinutes = max(1, intval($approvedMinutes));
        $scheme = self::getActiveScheme($pdo, $userId);

        if (!$scheme) {
            throw new Exception("No active pay scheme configured for user ID: {$userId}");
        }

        $schemeId = $scheme['id'];
        $workDate = $workDate ?: date('Y-m-d');
        $sessionStart = $sessionStart ?: date('Y-m-d H:i:s', strtotime("-{$approvedMinutes} minutes"));
        $sessionEnd = $sessionEnd ?: date('Y-m-d H:i:s');

        // Resolve active tier rate if staggered contract
        $tiers = self::getContractTiers($pdo, $schemeId);
        $tierInfo = self::getTierInfoForMonth($scheme, $workDate, $tiers);
        $hourlyRate = $tierInfo['hourly_rate'] ?: floatval($scheme['hourly_rate']);

        // Check if contract is expired
        if (!empty($scheme['contract_end_date']) && $workDate > $scheme['contract_end_date']) {
            throw new Exception("The pay scheme contract ended on {$scheme['contract_end_date']}. Please contact admin for renewal.");
        }

        // Exact earned amount
        $earnedAmount = round(($approvedMinutes / 60.0) * $hourlyRate, 2);

        // Check surplus status for Yearly Contract
        $isSurplus = 0;
        if ($scheme['scheme_type'] === 'YEARLY_CONTRACT') {
            $contractTarget = floatval($scheme['contract_amount']);
            // Get prior total earned
            $stmtPrior = $pdo->prepare("SELECT COALESCE(SUM(earned_amount), 0) FROM staff_work_earnings WHERE scheme_id = :scheme_id");
            $stmtPrior->execute([':scheme_id' => $schemeId]);
            $priorEarned = floatval($stmtPrior->fetchColumn());

            if ($priorEarned >= $contractTarget) {
                $isSurplus = 1;
            } elseif (($priorEarned + $earnedAmount) >= $contractTarget) {
                // Just completed the company target!
                $isSurplus = 1;
                // Send milestone notification to staff
                try {
                    NotificationHelper::sendToUser(
                        $pdo,
                        $userId,
                        null,
                        "🎉 Company Contract Target Completed!",
                        "Congratulations! You have successfully completed your ৳" . number_format($contractTarget) . " Company Target. All future work earnings are now 100% your withdrawable surplus!",
                        "success",
                        "staff"
                    );
                } catch (Exception $e) {
                    // Non-blocking
                }
            }
        }

        // Insert into staff_work_earnings
        $stmtInsert = $pdo->prepare("
            INSERT INTO staff_work_earnings (
                user_id, scheme_id, work_date, session_start, session_end, 
                approved_minutes, applied_rate, earned_amount, is_surplus, 
                source_type, reference_id, notes, created_at
            ) VALUES (
                :user_id, :scheme_id, :work_date, :session_start, :session_end, 
                :approved_minutes, :applied_rate, :earned_amount, :is_surplus, 
                :source_type, :reference_id, :notes, NOW()
            )
        ");

        $stmtInsert->execute([
            ':user_id' => $userId,
            ':scheme_id' => $schemeId,
            ':work_date' => $workDate,
            ':session_start' => $sessionStart,
            ':session_end' => $sessionEnd,
            ':approved_minutes' => $approvedMinutes,
            ':applied_rate' => $hourlyRate,
            ':earned_amount' => $earnedAmount,
            ':is_surplus' => $isSurplus,
            ':source_type' => $sourceType,
            ':reference_id' => $referenceId,
            ':notes' => $notes,
        ]);

        $earningId = $pdo->lastInsertId();

        return [
            'earning_id' => $earningId,
            'approved_minutes' => $approvedMinutes,
            'applied_rate' => $hourlyRate,
            'earned_amount' => $earnedAmount,
            'is_surplus' => $isSurplus,
            'wallet_summary' => self::getStaffWalletSummary($pdo, $userId)
        ];
    }

    /**
     * Check and send maturity notification to staff on 15th once per cycle
     */
    public static function checkAndSendMaturityNotification($pdo, $userId, $availableAmount, $fractionalRollover) {
        try {
            $scheme = self::getActiveScheme($pdo, $userId);
            if (!$scheme) {
                return;
            }

            // Strictly determine minimum withdrawal limit (monthly salary or 5k)
            $minLimit = ($scheme['scheme_type'] === 'YEARLY_CONTRACT') 
                ? 5000.0 
                : floatval($scheme['salary_amount'] ?: 5000.0);

            // If available amount does not meet or exceed salary limit, staff is NOT eligible to withdraw -> DO NOT send notification!
            if ($availableAmount < $minLimit || $minLimit <= 0) {
                return;
            }

            require_once __DIR__ . '/../notifications/notification_helper.php';

            $currentCycle = date('Y-m');
            $metaTag = 'payout_unlocked_' . $currentCycle;

            // Check if notification already sent for this cycle
            $stmt = $pdo->prepare("
                SELECT id FROM notifications 
                WHERE user_id = :user_id 
                  AND type = 'payroll_unlocked' 
                  AND (metadata LIKE :meta_tag OR title LIKE '%পে-রোল%')
                LIMIT 1
            ");
            $stmt->execute([
                ':user_id' => $userId,
                ':meta_tag' => '%' . $metaTag . '%'
            ]);

            if (!$stmt->fetch()) {
                $title = "🎉 পে-রোল সাইকেল আনলক: ৳" . number_format($availableAmount) . " তোলার জন্য প্রস্তুত!";
                $msg = "আপনার পে-রোল সাইকেল সফলভাবে আনলক হয়েছে। ৳" . number_format($availableAmount) . " তোলার জন্য প্রস্তুত রয়েছে।" . ($fractionalRollover > 0 ? " (অবশিষ্ট ৳" . number_format($fractionalRollover, 2) . " পরের মাসের সাথে রোলওভার হবে)" : "");
                
                NotificationHelper::sendToUser(
                    $pdo,
                    $userId,
                    null,
                    $title,
                    $msg,
                    'payroll_unlocked',
                    'all',
                    '/payroll',
                    'high',
                    ['cycle' => $currentCycle, 'tag' => $metaTag, 'amount' => $availableAmount, 'fraction' => $fractionalRollover]
                );
            }
        } catch (Exception $e) {
            error_log("Maturity Notification Error: " . $e->getMessage());
        }
    }

    /**
     * Request a withdrawal (supports base salary + optional overtime cashout)
     */
    public static function requestWithdrawal($pdo, $userId, $amount, $paymentMethod, $accountDetails, $overtimeHoursToCash = 0.0) {
        $amount = floor(floatval($amount)); // Integer cashout
        $overtimeHoursToCash = max(0.0, floatval($overtimeHoursToCash));

        if ($amount <= 0) {
            throw new Exception("Withdrawal amount must be a positive whole number (e.g. ৳ 5000).");
        }

        $summary = self::getStaffWalletSummary($pdo, $userId);
        if (!$summary['has_scheme']) {
            throw new Exception($summary['message']);
        }

        $minLimit = floatval($summary['min_withdrawal_limit'] ?? 5000);
        if ($amount < $minLimit) {
            throw new Exception("Minimum withdrawal amount for your pay scheme is ৳" . number_format($minLimit) . ".");
        }

        // Base withdrawable (using full fractional balance before cashout floor)
        $baseAvailable = floatval($summary['available_withdrawable_total'] ?? $summary['available_withdrawable'] ?? 0.0);
        $otCashAmount = 0.0;

        if ($overtimeHoursToCash > 0) {
            $otBank = $summary['overtime_bank'] ?? null;
            $availOtHours = floatval($otBank['available_hours'] ?? 0.0);
            if ($overtimeHoursToCash > $availOtHours) {
                throw new Exception("Requested overtime cashout (" . $overtimeHoursToCash . "h) exceeds your available Overtime Bank (" . $availOtHours . "h).");
            }
            $otHourlyRate = floatval($otBank['hourly_rate'] ?? 0.0);
            $otCashAmount = round($overtimeHoursToCash * $otHourlyRate, 2);
        }

        $totalMaxAvailable = floor($baseAvailable + $otCashAmount);

        if ($amount > $totalMaxAvailable) {
            throw new Exception("Requested amount (৳" . number_format($amount) . ") exceeds your total available withdrawable balance (৳" . number_format($totalMaxAvailable) . ").");
        }

        $scheme = $summary['scheme'];
        $withdrawalType = ($scheme['scheme_type'] === 'YEARLY_CONTRACT') ? 'CONTRACT_SURPLUS' : 'MONTHLY_SALARY';

        // Stamp covered billing cycles and invoices for permanent audit history
        $coveredMonthsList = [];
        $coveredInvoicesList = [];
        if (!empty($summary['monthly_cycle_ledger'])) {
            foreach ($summary['monthly_cycle_ledger'] as $cycle) {
                if (!empty($cycle['is_unlocked']) && $cycle['status'] !== 'paid') {
                    $coveredMonthsList[] = $cycle['month_label'] ?: $cycle['month_key'];
                    $coveredInvoicesList[] = $cycle['invoice_id'];
                }
            }
        }
        $coveredMonthsStr = !empty($coveredMonthsList) ? implode(', ', $coveredMonthsList) : date('F Y');
        $coveredInvoicesStr = !empty($coveredInvoicesList) ? implode(', ', $coveredInvoicesList) : null;

        $stmt = $pdo->prepare("
            INSERT INTO staff_withdrawals (
                user_id, scheme_id, amount, overtime_hours_cashed, covered_months, invoice_ids,
                withdrawal_type, status, payment_method, account_details, requested_at
            ) VALUES (
                :user_id, :scheme_id, :amount, :overtime_hours_cashed, :covered_months, :invoice_ids,
                :withdrawal_type, 'pending', :payment_method, :account_details, NOW()
            )
        ");

        $stmt->execute([
            ':user_id' => $userId,
            ':scheme_id' => $scheme['id'],
            ':amount' => $amount,
            ':overtime_hours_cashed' => $overtimeHoursToCash,
            ':covered_months' => $coveredMonthsStr,
            ':invoice_ids' => $coveredInvoicesStr,
            ':withdrawal_type' => $withdrawalType,
            ':payment_method' => $paymentMethod,
            ':account_details' => $accountDetails,
        ]);

        $withdrawalId = $pdo->lastInsertId();

        // Send notifications
        try {
            require_once __DIR__ . '/../notifications/notification_helper.php';
            
            // 1. Notify Admin
            NotificationHelper::sendToRole(
                $pdo,
                'admin',
                $userId,
                "💰 New Payout Request: ৳" . number_format($amount),
                "A staff member submitted a withdrawal request of ৳" . number_format($amount) . " via " . strtoupper($paymentMethod) . ".",
                'withdrawal_request',
                'admin',
                '/payroll'
            );

            // 2. Notify Staff
            NotificationHelper::sendToUser(
                $pdo,
                $userId,
                null,
                "⏳ Withdrawal Request Submitted: ৳" . number_format($amount),
                "Your payout request of ৳" . number_format($amount) . " via {$paymentMethod} is currently under admin review.",
                'withdrawal_pending',
                'staff',
                '/payroll'
            );
        } catch (Exception $e) {
            // Non-blocking
        }

        return [
            'withdrawal_id' => $withdrawalId,
            'amount' => $amount,
            'status' => 'pending',
            'requested_at' => date('Y-m-d H:i:s')
        ];
    }
}
?>